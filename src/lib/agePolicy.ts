/**
 * Saheli Age Policy & Safeguards Engine
 *
 * Enforces calendar-based age determination, legal safeguarding,
 * leap-year birthday resolution, and age-adaptive capabilities.
 *
 * Privacy Rule:
 * The raw date of birth is stored ONLY inside the user's encrypted personal record
 * (or vault). It is NEVER transmitted in unencrypted state, never included in logs,
 * URLs, analytics, AI context payloads, or Partner Connect sync payloads.
 * Only derived capabilities and age categories are evaluated in memory.
 */

import { todayStr, isValidDate } from "./localDate.js";

export type AgeCategory = "UNDER_18" | "ADULT_18_PLUS";
export type UserRole = "owner" | "partner";

export interface AgeCapabilities {
  canAccessCommunitySpace: boolean;
  canUsePartnerConnect: boolean;
  canShareSensitiveHealthRecords: boolean;
  canAccessEducationalContent: boolean;
  canViewAdultRecommendations: boolean;
  canViewFertilityPredictions: boolean;
}

export interface AgeCalculationResult {
  age: number;
  isUnder18: boolean;
  category: AgeCategory;
  valid: boolean;
}

export interface AgePolicy {
  age: number | null;
  category: AgeCategory;
  isUnder18: boolean;
  isProvisional: boolean;
  capabilities: AgeCapabilities;
}

/**
 * Checks if a given year is a leap year in the Gregorian calendar.
 */
export function isLeapYear(year: number): boolean {
  if (year % 4 !== 0) return false;
  if (year % 100 !== 0) return true;
  return year % 400 === 0;
}

/**
 * Validates a Date of Birth string (YYYY-MM-DD).
 * Must be a valid date, not in the future relative to asOfDate.
 */
export function isValidDob(dobStr: string | null | undefined, asOfDateStr = todayStr()): boolean {
  if (!dobStr || typeof dobStr !== "string") return false;
  const parts = dobStr.trim().split("-");
  if (parts.length !== 3) return false;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;

  const daysInMonth = [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (d > daysInMonth[m - 1]) return false;

  const normalizedDob = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  if (normalizedDob > asOfDateStr) return false;

  return true;
}

/**
 * Calculates calendar-based age (years) from DOB to asOfDate.
 *
 * Leap Year Birthday Policy:
 * Individuals born on February 29 turn a year older on:
 * - February 29 in leap years.
 * - March 1 in non-leap years (international standard: day 366 of life year).
 *
 * Under no circumstances does an invalid or missing DOB default to adult.
 */
export function calculateAge(
  dobStr: string | null | undefined,
  asOfDateStr = todayStr(),
): AgeCalculationResult {
  if (!isValidDob(dobStr, asOfDateStr)) {
    return {
      age: 0,
      isUnder18: true,
      category: "UNDER_18",
      valid: false,
    };
  }

  const [birthYear, birthMonth, birthDay] = (dobStr as string).split("-").map(Number);
  const [currYear, currMonth, currDay] = asOfDateStr.split("-").map(Number);

  let age = currYear - birthYear;

  const isBornFeb29 = birthMonth === 2 && birthDay === 29;

  let hasHadBirthdayThisYear = false;

  if (isBornFeb29) {
    if (isLeapYear(currYear)) {
      // Leap year: birthday is Feb 29
      hasHadBirthdayThisYear = currMonth > 2 || (currMonth === 2 && currDay >= 29);
    } else {
      // Non-leap year: birthday is recognized on March 1
      hasHadBirthdayThisYear = currMonth > 3 || (currMonth === 3 && currDay >= 1);
    }
  } else {
    // Normal date
    hasHadBirthdayThisYear =
      currMonth > birthMonth || (currMonth === birthMonth && currDay >= birthDay);
  }

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  // Defensively clamp to >= 0
  if (age < 0) age = 0;

  const isUnder18 = age < 18;
  const category: AgeCategory = isUnder18 ? "UNDER_18" : "ADULT_18_PLUS";

  return {
    age,
    isUnder18,
    category,
    valid: true,
  };
}

/**
 * Derives capabilities based on age category and optional provisional status.
 */
export function deriveCapabilities(category: AgeCategory): AgeCapabilities {
  const isAdult = category === "ADULT_18_PLUS";

  return {
    // Minors cannot participate in unrestricted adult community spaces
    canAccessCommunitySpace: isAdult,
    // Partner Connect: adults have unrestricted connect; minors have restricted/disabled sharing
    canUsePartnerConnect: isAdult,
    // Sensitive health, fertile predictions and diary sharing are blocked for minors
    canShareSensitiveHealthRecords: isAdult,
    // High-quality puberty, menstrual and hygiene education is available to everyone
    canAccessEducationalContent: true,
    // Age-appropriate recommendations: adults see adult content; minors restricted to family-friendly
    canViewAdultRecommendations: isAdult,
    // Medical safeguard: NEVER show ovulation or fertile window estimates for minors
    canViewFertilityPredictions: isAdult,
  };
}

/**
 * Evaluates the full age policy for a user based on their record settings.
 * If DOB is absent but legacy ageGroup === "adult" exists, marks as provisional
 * but enforces UNDER_18 safeguards on restricted features until DOB is supplied.
 */
export function getAgePolicy(settingsOrRecord: any, asOfDateStr = todayStr()): AgePolicy {
  const settings = settingsOrRecord?.settings || settingsOrRecord || {};
  const dob = settings?.dob || settings?.dateOfBirth;

  if (dob && isValidDob(dob, asOfDateStr)) {
    const calc = calculateAge(dob, asOfDateStr);
    return {
      age: calc.age,
      category: calc.category,
      isUnder18: calc.isUnder18,
      isProvisional: false,
      capabilities: deriveCapabilities(calc.category),
    };
  }

  // Check if legacy birthYear exists
  if (settings.birthYear && /^\d{4}$/.test(String(settings.birthYear))) {
    const birthYear = Number(settings.birthYear);
    const currYear = Number(asOfDateStr.split("-")[0]);
    const approxAge = currYear - birthYear;
    const isUnder18 = approxAge < 18;
    const category: AgeCategory = isUnder18 ? "UNDER_18" : "ADULT_18_PLUS";

    return {
      age: approxAge,
      category,
      isUnder18,
      isProvisional: true,
      capabilities: deriveCapabilities(category),
    };
  }

  // Legacy user without DOB: check legacy ageGroup
  const legacyAgeGroup = settings?.ageGroup;
  if (legacyAgeGroup === "under18") {
    return {
      age: null,
      category: "UNDER_18",
      isUnder18: true,
      isProvisional: true,
      capabilities: deriveCapabilities("UNDER_18"),
    };
  }

  // Unknown or legacy adult without DOB:
  // SAFE BY DEFAULT: Treat as provisional, enforce under-18 safety on restricted features!
  return {
    age: null,
    category: "UNDER_18",
    isUnder18: true,
    isProvisional: true,
    capabilities: deriveCapabilities("UNDER_18"),
  };
}

// Capability query helpers
export function canAccessCommunitySpace(policy: AgePolicy): boolean {
  return policy.capabilities.canAccessCommunitySpace;
}

export function canUsePartnerConnect(policy: AgePolicy): boolean {
  return policy.capabilities.canUsePartnerConnect;
}

export function canShareSensitiveHealthRecords(policy: AgePolicy): boolean {
  return policy.capabilities.canShareSensitiveHealthRecords;
}

export function canAccessEducationalContent(policy: AgePolicy): boolean {
  return policy.capabilities.canAccessEducationalContent;
}

export function canViewAdultRecommendations(policy: AgePolicy): boolean {
  return policy.capabilities.canViewAdultRecommendations;
}

export function canViewFertilityPredictions(policy: AgePolicy): boolean {
  return policy.capabilities.canViewFertilityPredictions;
}
