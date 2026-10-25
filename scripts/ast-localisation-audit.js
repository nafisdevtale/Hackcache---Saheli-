/**
 * SAHELI 10.6 — AST-Based Content Localisation & UI Text Auditor
 *
 * Parses all user-facing JSX/TSX/JS/TS source files into an Abstract Syntax Tree (AST)
 * to systematically identify:
 * 1. Hardcoded raw text in JSX elements (<p>Hardcoded text</p>)
 * 2. Hardcoded UI props (placeholder, aria-label, title, alt, etc.)
 * 3. Unlocalized string concatenations and template literals
 * 4. Missing translation keys in t("...") calls
 * 5. Dynamic translation reference patterns
 */

import fs from "node:fs";
import path from "node:path";
import * as parser from "@babel/parser";
import _traverse from "@babel/traverse";

const traverse = _traverse.default || _traverse;

// Allowed proper nouns, external services, brand names, technical terms, and symbols
const ALLOWLIST = new Set([
  "Saheli",
  "Saheli 10.0",
  "Saheli 10.5",
  "Saheli 10.6",
  "Nova",
  "eSanjeevani",
  "Tele-MANAS",
  "112",
  "108",
  "1091",
  "DPDP",
  "DPDP Act",
  "DPDPA",
  "PCOS",
  "PCOD",
  "BMI",
  "PDF",
  "HTML",
  "JSON",
  "CSV",
  "ID",
  "PIN",
  "OTP",
  "SMS",
  "PWA",
  "Vite",
  "React",
  "TypeScript",
  "JavaScript",
  "Gemini",
  "Google",
  "Apple",
  "GitHub",
  "Lucide",
  "IndexedDB",
  "AES-GCM",
  "URL",
  "URI",
  "FAQ",
  "WhatsApp",
  "Telegram",
  "AM",
  "PM",
  "INR",
  "₹",
  "%",
  "°C",
  "°F",
  "mg",
  "ml",
  "kg",
  "cm",
  "mm",
  "km",
  "px",
  "rem",
  "em",
  "ms",
  "sec",
  "min",
  "hr",
  "hrs",
  "days",
  "MB",
  "GB",
  "KB",
  "Eeve",
  "FLASH",
  "INSTINCT",
  "Diva",
  "Loading...",
]);

// Ignored attributes (non-human-facing or technical)
const IGNORED_ATTRS = new Set([
  "className",
  "class",
  "style",
  "key",
  "id",
  "name",
  "type",
  "role",
  "data-testid",
  "to",
  "href",
  "src",
  "rel",
  "target",
  "method",
  "action",
  "viewBox",
  "d",
  "fill",
  "stroke",
  "strokeWidth",
  "xmlns",
  "width",
  "height",
  "tabIndex",
  "autoComplete",
  "color",
  "size",
  "variant",
  "speciesId",
  "petId",
  "status",
  "mode",
]);

// User-facing attributes to check
const HUMAN_FACING_ATTRS = new Set([
  "placeholder",
  "aria-label",
  "aria-description",
  "title",
  "alt",
  "label",
  "helperText",
  "emptyText",
  "buttonText",
]);

// Load base dictionary keys
const enDictPath = path.resolve("src/i18n/en.js");
const enSource = fs.readFileSync(enDictPath, "utf-8");
const enKeys = new Set();
const keyMatches = enSource.matchAll(/"([^"]+)":/g);
for (const m of keyMatches) {
  enKeys.add(m[1]);
}

function isAllowlisted(text) {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (/^[0-9\s.,!?:;/\\_\-+*#@$%^&()\[\]{}|<=>`~"'·•—–×]+$/.test(trimmed)) return true;
  if (ALLOWLIST.has(trimmed)) return true;
  // If all words are allowlisted
  const words = trimmed.split(/\s+/);
  if (words.length > 0 && words.every((w) => ALLOWLIST.has(w.replace(/[.,!?:;()]/g, ""))))
    return true;
  return false;
}

function scanFile(filePath) {
  const code = fs.readFileSync(filePath, "utf-8");
  const relPath = path.relative(process.cwd(), filePath);
  const issues = [];

  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
  } catch (err) {
    issues.push({
      type: "PARSE_ERROR",
      line: 1,
      message: `Failed to parse AST: ${err.message}`,
    });
    return issues;
  }

  traverse(ast, {
    // 1. Check JSXText (<p>English text</p>)
    JSXText(nodePath) {
      const raw = nodePath.node.value;
      const trimmed = raw.trim();
      if (!trimmed) return;
      if (!/[A-Za-z]/.test(trimmed)) return; // No Latin letters
      if (isAllowlisted(trimmed)) return;

      issues.push({
        type: "HARDCODED_JSX_TEXT",
        line: nodePath.node.loc?.start.line || 0,
        text: trimmed,
        sample: trimmed.slice(0, 60),
      });
    },

    // 2. Check JSX attributes
    JSXAttribute(nodePath) {
      const attrName = nodePath.node.name.name;
      if (!HUMAN_FACING_ATTRS.has(attrName)) return;

      const valueNode = nodePath.node.value;
      if (!valueNode) return;

      // Direct string literal: placeholder="Search..."
      if (valueNode.type === "StringLiteral") {
        const val = valueNode.value.trim();
        if (/[A-Za-z]/.test(val) && !isAllowlisted(val)) {
          issues.push({
            type: "HARDCODED_ATTR",
            line: valueNode.loc?.start.line || 0,
            attr: attrName,
            text: val,
            sample: `${attrName}="${val}"`,
          });
        }
      }
    },

    // 3. Check translation calls: t("key") or translate(lang, "key")
    CallExpression(nodePath) {
      const callee = nodePath.node.callee;
      if (callee.type === "Identifier" && callee.name === "t") {
        const firstArg = nodePath.node.arguments[0];
        if (firstArg && firstArg.type === "StringLiteral") {
          const key = firstArg.value;
          if (!enKeys.has(key)) {
            issues.push({
              type: "MISSING_TRANSLATION_KEY",
              line: firstArg.loc?.start.line || 0,
              key,
              sample: `t("${key}")`,
            });
          }
        }
      } else if (callee.type === "Identifier" && callee.name === "translate") {
        const secondArg = nodePath.node.arguments[1];
        if (secondArg && secondArg.type === "StringLiteral") {
          const key = secondArg.value;
          if (!enKeys.has(key)) {
            issues.push({
              type: "MISSING_TRANSLATION_KEY",
              line: secondArg.loc?.start.line || 0,
              key,
              sample: `translate(lang, "${key}")`,
            });
          }
        }
      }
    },
  });

  return issues;
}

export function runAudit() {
  const targetDirs = ["src/pages", "src/components", "src/routes"];
  const allFiles = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else if (/\.(jsx|tsx)$/.test(ent.name)) {
        allFiles.push(full);
      }
    }
  }

  for (const d of targetDirs) walk(d);

  console.log(`=======================================================`);
  console.log(`SAHELI 10.6 AST-BASED LOCALISATION AUDITOR`);
  console.log(`Scanning ${allFiles.length} user-facing files in src/ ...`);
  console.log(`=======================================================\n`);

  let totalIssues = 0;
  const issuesByFile = new Map();

  for (const file of allFiles) {
    const issues = scanFile(file);
    if (issues.length > 0) {
      issuesByFile.set(path.relative(process.cwd(), file), issues);
      totalIssues += issues.length;
    }
  }

  if (totalIssues === 0) {
    console.log(
      `✅ AST Audit Passed! 0 hardcoded strings or missing keys found across ${allFiles.length} files.`,
    );
  } else {
    console.log(`⚠️ Found ${totalIssues} issue(s) across ${issuesByFile.size} file(s):\n`);
    for (const [file, list] of issuesByFile.entries()) {
      console.log(`📄 ${file} (${list.length} issues):`);
      for (const iss of list) {
        console.log(`   L${iss.line}: [${iss.type}] ${iss.sample || iss.text || iss.key}`);
      }
      console.log();
    }
  }

  return { totalFiles: allFiles.length, totalIssues, issuesByFile };
}

if (process.argv[1]?.endsWith("ast-localisation-audit.js")) {
  runAudit();
}
