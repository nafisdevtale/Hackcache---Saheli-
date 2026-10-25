// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  calculateAge,
  isValidDob,
  isLeapYear,
  getAgePolicy,
  deriveCapabilities,
  canAccessCommunitySpace,
  canUsePartnerConnect,
  canShareSensitiveHealthRecords,
  canAccessEducationalContent,
  canViewAdultRecommendations,
  canViewFertilityPredictions,
} from "../lib/agePolicy.ts";
import { emptyRecord } from "../lib/exportImport.js";
import { analyze, getAuthoritativeCycleState } from "../lib/cycle.js";
import { buildPartnerSnapshot } from "../lib/partner.ts";
import { filterSuitability } from "../lib/instinctRecommender.js";

describe("Saheli 11.3: Calendar-Based Age Policy, Role Selection & Safeguards", () => {
  describe("1. Leap Year & Calendar Age Calculation Engine", () => {
    it("correctly identifies leap years across centuries", () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2028)).toBe(true);
      expect(isLeapYear(2000)).toBe(true); // 400-year rule
      expect(isLeapYear(2026)).toBe(false);
      expect(isLeapYear(2027)).toBe(false);
      expect(isLeapYear(1900)).toBe(false); // 100-year rule
      expect(isLeapYear(2100)).toBe(false);
    });

    it("validates DOB strings and rejects future dates or malformed values", () => {
      const today = "2026-10-25";
      expect(isValidDob("2008-10-24", today)).toBe(true);
      expect(isValidDob("2000-01-01", today)).toBe(true);
      expect(isValidDob("2008-02-29", today)).toBe(true); // 2008 was a leap year

      // Rejections
      expect(isValidDob("2026-10-26", today)).toBe(false); // future date
      expect(isValidDob("2021-02-29", today)).toBe(false); // 2021 was not a leap year!
      expect(isValidDob("2005-04-31", today)).toBe(false); // April has 30 days
      expect(isValidDob("invalid", today)).toBe(false);
      expect(isValidDob("", today)).toBe(false);
      expect(isValidDob(null, today)).toBe(false);
    });

    it("calculates exact calendar age for standard birthdays", () => {
      const dob = "2008-10-25";
      // Exactly 18th birthday
      const at18 = calculateAge(dob, "2026-10-25");
      expect(at18.age).toBe(18);
      expect(at18.isUnder18).toBe(false);
      expect(at18.category).toBe("ADULT_18_PLUS");

      // The day before the 18th birthday (still 17!)
      const dayBefore18 = calculateAge(dob, "2026-10-24");
      expect(dayBefore18.age).toBe(17);
      expect(dayBefore18.isUnder18).toBe(true);
      expect(dayBefore18.category).toBe("UNDER_18");

      // Later in the 18th year
      const later = calculateAge(dob, "2026-12-01");
      expect(later.age).toBe(18);
      expect(later.isUnder18).toBe(false);
    });

    it("enforces documented leap-year birthday policy: Feb 29 birthday turns a year older on March 1 in non-leap years", () => {
      const feb29Dob = "2008-02-29"; // Born on Feb 29 (leap year 2008)

      // In non-leap year 2026:
      // On Feb 28, 2026: user has NOT yet completed their 18th year (Feb 28 is day 365, they need day 366)
      const feb28 = calculateAge(feb29Dob, "2026-02-28");
      expect(feb28.age).toBe(17);
      expect(feb28.isUnder18).toBe(true);
      expect(feb28.category).toBe("UNDER_18");

      // On March 1, 2026: user legally and clinically turns 18!
      const mar01 = calculateAge(feb29Dob, "2026-03-01");
      expect(mar01.age).toBe(18);
      expect(mar01.isUnder18).toBe(false);
      expect(mar01.category).toBe("ADULT_18_PLUS");

      // In leap year 2028 (born 2004-02-29, 2004 was leap):
      const leapBorn = "2004-02-29";
      const leapFeb28 = calculateAge(leapBorn, "2028-02-28");
      expect(leapFeb28.age).toBe(23);
      expect(leapFeb28.isUnder18).toBe(false);

      const leapFeb29 = calculateAge(leapBorn, "2028-02-29");
      expect(leapFeb29.age).toBe(24);
      expect(leapFeb29.isUnder18).toBe(false);
    });

    it("safe-by-default: unknown or invalid DOB states NEVER default to adult access", () => {
      const invalid = calculateAge("not-a-date", "2026-10-25");
      expect(invalid.valid).toBe(false);
      expect(invalid.isUnder18).toBe(true);
      expect(invalid.category).toBe("UNDER_18");

      const nullDob = calculateAge(null, "2026-10-25");
      expect(nullDob.valid).toBe(false);
      expect(nullDob.isUnder18).toBe(true);
      expect(nullDob.category).toBe("UNDER_18");
    });
  });

  describe("2. Age Policy & Capabilities Safeguards", () => {
    it("derives minor safeguards for UNDER_18 category", () => {
      const policy = getAgePolicy({ settings: { dob: "2012-05-15" } }, "2026-10-25");
      expect(policy.isUnder18).toBe(true);
      expect(policy.category).toBe("UNDER_18");
      expect(canAccessCommunitySpace(policy)).toBe(false);
      expect(canUsePartnerConnect(policy)).toBe(false);
      expect(canShareSensitiveHealthRecords(policy)).toBe(false);
      expect(canViewAdultRecommendations(policy)).toBe(false);
      expect(canViewFertilityPredictions(policy)).toBe(false);
      expect(canAccessEducationalContent(policy)).toBe(true); // Puberty & health education is always open
    });

    it("derives adult capabilities for ADULT_18_PLUS category", () => {
      const policy = getAgePolicy({ settings: { dob: "2000-01-01" } }, "2026-10-25");
      expect(policy.isUnder18).toBe(false);
      expect(policy.category).toBe("ADULT_18_PLUS");
      expect(canAccessCommunitySpace(policy)).toBe(true);
      expect(canUsePartnerConnect(policy)).toBe(true);
      expect(canShareSensitiveHealthRecords(policy)).toBe(true);
      expect(canViewAdultRecommendations(policy)).toBe(true);
      expect(canViewFertilityPredictions(policy)).toBe(true);
      expect(canAccessEducationalContent(policy)).toBe(true);
    });

    it("handles legacy un-migrated users with provisional safeguards without data loss", () => {
      // Legacy user without DOB
      const legacyRecord = emptyRecord();
      delete legacyRecord.settings.dob;
      legacyRecord.settings.ageGroup = "adult"; // Claimed adult in legacy radio

      const policy = getAgePolicy(legacyRecord, "2026-10-25");
      expect(policy.isProvisional).toBe(true);
      // Safe by default: provisional users are safeguarded as UNDER_18 on restricted features until DOB is supplied!
      expect(policy.capabilities.canAccessCommunitySpace).toBe(false);
      expect(policy.capabilities.canViewFertilityPredictions).toBe(false);
    });
  });

  describe("3. Clinical Safeguards & Fertility Suppression for Minors", () => {
    it("suppresses fertility predictions for minor users in authoritative cycle state", () => {
      const rec = emptyRecord();
      rec.settings.dob = "2011-03-20"; // 15 years old in 2026
      rec.settings.showFertility = true; // even if user checked toggle, clinical safeguard overrides

      const state = getAuthoritativeCycleState(rec, "2026-10-25");
      expect(state.analysis.fertility).toBeNull();
      expect(state.analysis.diagnosticInfo.activeAgeBand).toBe("under18");
    });

    it("enforces family_friendly suitability in INSTINCT recommender for minors", () => {
      const items = [
        {
          id: "1",
          title: "Puberty & Menstrual Care",
          ageSuitability: "family_friendly",
          ageRating: "U",
        },
        { id: "2", title: "Mature Discussion", ageSuitability: "adult_only", ageRating: "A" },
        { id: "3", title: "Teen Hygiene FAQ", ageSuitability: "family_friendly", ageRating: "PG" },
      ];

      const minorFiltered = filterSuitability(items, { isUnder18: true });
      expect(minorFiltered.map((i) => i.id)).toEqual(["1", "3"]);
      expect(minorFiltered.find((i) => i.id === "2")).toBeUndefined();
    });
  });

  describe("4. Partner Connect Privacy & Minor Protection", () => {
    it("never includes DOB or diary notes in partner snapshot payloads", () => {
      const rec = emptyRecord();
      rec.settings.dob = "1998-07-10";
      rec.settings.role = "owner";
      rec.days["2026-10-20"] = {
        period: true,
        flow: "medium",
        notes: "Extremely private diary reflection that should never leave my device",
      };

      const permissions = {
        calendar: true,
        periodDates: true,
        periodEstimates: true,
        cycleHistory: true,
        wellnessUpdates: true,
        cycleEducation: true,
      };

      const snapshot = buildPartnerSnapshot({
        record: rec,
        analysis: { stats: { median: 28 }, prediction: { expectedStart: "2026-11-18" } },
        ownerSerialId: "SAH-TEST-OWNER",
        permissions,
      });

      // DOB must NEVER appear in snapshot payload
      expect(JSON.stringify(snapshot)).not.toContain("1998-07-10");
      expect((snapshot as any).dob).toBeUndefined();
      expect((snapshot.data as any).dob).toBeUndefined();

      // Diary notes must NEVER appear in snapshot
      expect(JSON.stringify(snapshot)).not.toContain("Extremely private diary reflection");
      expect(snapshot.data.calendar["2026-10-20"].notes).toBeUndefined();
    });
  });

  describe("5. In-App 18th Birthday Upgrade & Consent Preservation", () => {
    it("identifies when a user has turned 18 and needs consent upgrade", () => {
      const rec = emptyRecord();
      rec.settings.dob = "2008-10-25"; // Turns 18 on 2026-10-25
      const asOf = "2026-10-25";

      const calc = calculateAge(rec.settings.dob, asOf);
      const isEligible =
        !calc.isUnder18 && !rec.settings.adultConsent && !rec.settings.adultTransitionPostponed;

      expect(isEligible).toBe(true);

      // Once postponed, user is not prompted repeatedly
      rec.settings.adultTransitionPostponed = true;
      const isEligibleAfterPostpone =
        !calc.isUnder18 && !rec.settings.adultConsent && !rec.settings.adultTransitionPostponed;
      expect(isEligibleAfterPostpone).toBe(false);

      // Once consented, adult experience is unlocked with versioned consent
      rec.settings.adultConsent = {
        version: 1,
        confirmedAt: new Date().toISOString(),
      };
      rec.settings.adultTransitionPostponed = false;
      const isEligibleAfterConsent =
        !calc.isUnder18 && !rec.settings.adultConsent && !rec.settings.adultTransitionPostponed;
      expect(isEligibleAfterConsent).toBe(false);
    });
  });
});
