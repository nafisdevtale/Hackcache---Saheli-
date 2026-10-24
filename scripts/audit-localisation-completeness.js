import fs from "node:fs";
import path from "node:path";

const PAGES_DIR = path.resolve("src/pages");
const COMPONENTS_DIR = path.resolve("src/components");
const LIB_DIR = path.resolve("src/lib");

function findFiles(dir, ext = [".jsx", ".tsx", ".js", ".ts"]) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(findFiles(fullPath, ext));
    } else if (ext.some((e) => file.endsWith(e))) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = [...findFiles(PAGES_DIR), ...findFiles(COMPONENTS_DIR), ...findFiles(LIB_DIR)];

const IGNORE_PATTERNS = [
  /^[A-Z0-9_-]+$/, // CONSTANTS
  /^\d+(\.\d+)?(px|rem|em|%|ms|s|deg|vh|vw)?$/, // CSS values
  /^(GET|POST|PUT|DELETE|OPTIONS)$/, // HTTP methods
  /^(text|button|submit|reset|checkbox|radio|range|color|date|time)$/, // input types
  /^(sm|md|lg|xl|2xl|xs|primary|secondary|outline|ghost|period|elevated)$/, // variants
  /^(auto|eeve|flash|instinct|diva|all)$/, // agent IDs
  /^(flex|grid|block|hidden|absolute|relative)$/, // tailwind
  /^https?:\/\//, // URLs
  /^[a-z]+:[a-z]+/, // icons or uris
  /^[0-9]+$/,
];

const fileMap = {};

for (const file of files) {
  if (file.includes(".test.") || file.includes("fixtures")) continue;
  const content = fs.readFileSync(file, "utf8");
  const relPath = path.relative(process.cwd(), file);
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    // Check JSX text: >Text<
    const jsxTextMatches = line.matchAll(/>\s*([A-Za-z][A-Za-z0-9 ,.'’!?—–:()\/]{2,})\s*</g);
    for (const match of jsxTextMatches) {
      const text = match[1].trim();
      if (
        !IGNORE_PATTERNS.some((p) => p.test(text)) &&
        !text.includes("{") &&
        !text.includes("}")
      ) {
        if (
          !text.startsWith("M") &&
          !text.startsWith("var(--") &&
          text !== "true" &&
          text !== "false"
        ) {
          fileMap[relPath] = fileMap[relPath] || [];
          fileMap[relPath].push({ line: idx + 1, type: "text", text });
        }
      }
    }

    // Check placeholder="English Text"
    const placeholderMatches = line.matchAll(
      /placeholder=["']([A-Za-z][A-Za-z0-9 ,.'’!?—–:()\/]{2,})["']/g,
    );
    for (const match of placeholderMatches) {
      fileMap[relPath] = fileMap[relPath] || [];
      fileMap[relPath].push({ line: idx + 1, type: "placeholder", text: match[1] });
    }

    // Check aria-label="English Text"
    const ariaMatches = line.matchAll(
      /aria-label=["']([A-Za-z][A-Za-z0-9 ,.'’!?—–:()\/]{2,})["']/g,
    );
    for (const match of ariaMatches) {
      fileMap[relPath] = fileMap[relPath] || [];
      fileMap[relPath].push({ line: idx + 1, type: "aria-label", text: match[1] });
    }
  });
}

for (const [f, items] of Object.entries(fileMap)) {
  console.log(`\n=== ${f} (${items.length} issues) ===`);
  items.forEach((it) => console.log(`  L${it.line} [${it.type}]: "${it.text}"`));
}
