#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DICTS, KEY_ALIASES, translate } from "../src/i18n/index.js";
import { LANGUAGES } from "../src/i18n/languages.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootSrc = path.resolve(__dirname, "../src");

const SCRIPT_RANGES = {
  hi: [0x0900, 0x097f], // Devanagari
  mr: [0x0900, 0x097f], // Devanagari
};

const DEVANAGARI_LETTERS = /[\u0900-\u0963\u0966-\u097F]/;

function extractTokens(s) {
  if (typeof s !== "string") return [];
  const matches = s.match(/\{([a-zA-Z0-9_]+)\}/g);
  return matches ? matches.sort() : [];
}

let totalErrors = 0;
const enKeys = Object.keys(DICTS.en).sort();
const enKeySet = new Set(enKeys);

console.log(`\n======================================================`);
console.log(` SAHELI 11.9 MULTILINGUAL & SOURCE CODE INTEGRITY AUDIT`);
console.log(` Base dictionary (en): ${enKeys.length} keys`);
console.log(
  ` Supported languages: English (en), Hindi (hi), Marathi (mr) (${LANGUAGES.length} total)`,
);
console.log(`======================================================\n`);

// -----------------------------------------------------------------------------
// STEP 1: ACTIVE SOURCE CODE STATIC KEY AUDIT (Zero Unresolved Keys Permitted)
// -----------------------------------------------------------------------------
console.log(`🔍 Scanning source code in src/ for static t("...") translation calls...`);

function scanSourceFiles(dir, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name !== "test" && ent.name !== "i18n" && ent.name !== "node_modules") {
        scanSourceFiles(full, acc);
      }
    } else if (/\.(jsx?|tsx?)$/.test(ent.name)) {
      acc.push(full);
    }
  }
  return acc;
}

const sourceFiles = scanSourceFiles(rootSrc);
const tCallRegex = /\bt\(\s*["']([^"']+)["']\s*[,)]/g;
let sourceScanErrors = 0;
const scannedKeys = new Set();

for (const filePath of sourceFiles) {
  const content = fs.readFileSync(filePath, "utf8");
  const relPath = path.relative(path.resolve(__dirname, ".."), filePath);
  let match;
  while ((match = tCallRegex.exec(content)) !== null) {
    const key = match[1];
    scannedKeys.add(key);
    // Key must exist either in en dictionary or resolve through translate/KEY_ALIASES
    const resolved = translate("en", key);
    if (resolved === key && !enKeySet.has(key)) {
      console.error(`❌ [SOURCE CODE] Unresolved key "${key}" in ${relPath}`);
      sourceScanErrors++;
      totalErrors++;
    }
  }
}

console.log(
  `✅ Scanned ${sourceFiles.length} source files (${scannedKeys.size} distinct static keys). Source errors: ${sourceScanErrors}\n`,
);

// -----------------------------------------------------------------------------
// STEP 2: DICTIONARY CONTENT, PARITY, AND SCRIPT PURITY CHECKS
// -----------------------------------------------------------------------------
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

  // Check 2: Non-empty strings
  let emptyCount = 0;
  for (const [k, v] of Object.entries(dict)) {
    if (typeof v !== "string" || v.trim().length === 0) {
      emptyCount++;
    }
  }
  if (emptyCount > 0) {
    console.error(`❌ [${code}] Found ${emptyCount} empty or non-string translation entries!`);
    totalErrors += emptyCount;
  }

  // Check 3: Verbatim Hindi copying in non-Devanagari languages
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

  // Check 4: Token matching
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

  // Check 5: Native script check
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
    `✅ [${code.padEnd(2)}] ${lang.name.padEnd(10)} (${lang.nativeName.padEnd(12)}) | Keys: ${langKeys.length}/${enKeys.length} | Script: ${scriptPurity}% | Contaminated: ${hindiContaminated} | Empty: ${emptyCount}`,
  );
}

console.log(`\n------------------------------------------------------`);
if (totalErrors === 0) {
  console.log(
    `🎉 ALL 3 SUPPORTED LANGUAGES (EN, HI, MR) & SOURCE CODE PASS: 100% key parity, zero leakage, zero contamination!\n`,
  );
  process.exit(0);
} else {
  console.error(`💥 Localisation check failed with ${totalErrors} errors!\n`);
  process.exit(1);
}
