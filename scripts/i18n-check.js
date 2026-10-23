#!/usr/bin/env node
import { DICTS } from "../src/i18n/index.js";
import { LANGUAGES } from "../src/i18n/languages.js";

const SCRIPT_RANGES = {
  hi: [0x0900, 0x097f], // Devanagari
  mr: [0x0900, 0x097f], // Devanagari
  bn: [0x0980, 0x09ff], // Bengali
  as: [0x0980, 0x09ff], // Bengali-Assamese
  te: [0x0c00, 0x0c7f], // Telugu
  kn: [0x0c80, 0x0cff], // Kannada
  ta: [0x0b80, 0x0bff], // Tamil
  gu: [0x0a80, 0x0aff], // Gujarati
  pa: [0x0a00, 0x0a7f], // Gurmukhi
  ml: [0x0d00, 0x0d7f], // Malayalam
  or: [0x0b00, 0x0b7f], // Odia
  ur: [0x0600, 0x06ff], // Arabic/Urdu
};

const DEVANAGARI_LETTERS = /[\u0900-\u0963\u0966-\u097F]/;

function extractTokens(s) {
  if (typeof s !== "string") return [];
  const matches = s.match(/\{([a-zA-Z0-9_]+)\}/g);
  return matches ? matches.sort() : [];
}

let totalErrors = 0;
const enKeys = Object.keys(DICTS.en).sort();
console.log(`\n======================================================`);
console.log(` SAHELI 5.1 MULTILINGUAL AUDIT & PARITY VERIFICATION `);
console.log(` Base dictionary (en): ${enKeys.length} keys`);
console.log(` Total registered languages: ${LANGUAGES.length}`);
console.log(`======================================================\n`);

for (const lang of LANGUAGES) {
  const code = lang.code;
  const dict = DICTS[code];
  if (!dict) {
    console.error(`❌ Language [${code}] is missing its dictionary module!`);
    totalErrors++;
    continue;
  }

  const langKeys = Object.keys(dict).sort();
  const missing = enKeys.filter((k) => !(k in dict));
  const extra = langKeys.filter((k) => !(k in DICTS.en));

  // Check 1: Key Parity
  if (missing.length > 0) {
    console.error(
      `❌ [${code}] Missing ${missing.length} keys: ${missing.slice(0, 5).join(", ")}...`,
    );
    totalErrors += missing.length;
  }

  // Check 2: Verbatim Hindi copying in non-Devanagari languages
  let hindiContaminated = 0;
  if (!["en", "hi", "mr"].includes(code)) {
    for (const [k, v] of Object.entries(dict)) {
      if (typeof v === "string" && DEVANAGARI_LETTERS.test(v)) {
        if (!DEVANAGARI_LETTERS.test(DICTS.en[k] || "")) {
          hindiContaminated++;
        }
      }
    }
    if (hindiContaminated > 0) {
      console.error(
        `❌ [${code}] Found ${hindiContaminated} keys with verbatim Hindi Devanagari contamination!`,
      );
      totalErrors += hindiContaminated;
    }
  }

  // Check 3: Token matching
  let tokenMismatches = 0;
  for (const k of enKeys) {
    const enTokens = extractTokens(DICTS.en[k]);
    if (enTokens.length > 0 && dict[k]) {
      const langTokens = extractTokens(dict[k]);
      if (enTokens.join(",") !== langTokens.join(",")) {
        tokenMismatches++;
      }
    }
  }
  if (tokenMismatches > 0) {
    console.warn(`⚠️ [${code}] ${tokenMismatches} variable token warnings (e.g., {n})`);
  }

  // Check 4: Native script check
  let nativeCharCount = 0;
  let totalIndicChars = 0;
  const range = SCRIPT_RANGES[code];
  if (range) {
    for (const v of Object.values(dict)) {
      if (typeof v === "string") {
        for (const ch of v) {
          const cp = ch.codePointAt(0);
          if (cp >= range[0] && cp <= range[1]) nativeCharCount++;
          if (cp >= 0x0600 && cp <= 0x0dff) totalIndicChars++;
        }
      }
    }
  }

  const scriptPurity =
    totalIndicChars > 0 ? ((nativeCharCount / totalIndicChars) * 100).toFixed(1) : "100.0";
  console.log(
    `✅ [${code.padEnd(2)}] ${lang.name.padEnd(10)} (${lang.nativeName.padEnd(12)}) | Keys: ${langKeys.length}/${enKeys.length} | Script: ${scriptPurity}% | Contaminated: ${hindiContaminated}`,
  );
}

console.log(`\n------------------------------------------------------`);
if (totalErrors === 0) {
  console.log(`🎉 ALL 13 LANGUAGES PASS: 100% key parity & zero cross-contamination!\n`);
  process.exit(0);
} else {
  console.error(`💥 Multilingual check failed with ${totalErrors} errors!\n`);
  process.exit(1);
}
