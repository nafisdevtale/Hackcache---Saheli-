import fs from "node:fs";
import path from "node:path";
import en from "../src/i18n/en.js";

const contentDir = "src/content";
const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".js"));

let allKeys = new Set();
for (const file of files) {
  const content = fs.readFileSync(path.join(contentDir, file), "utf8");
  // Find all key patterns like "word.word..." or 'word.word...'
  const matches = content.matchAll(/["']([a-z0-9_-]+(\.[a-zA-Z0-9_-]+)+)["']/g);
  for (const m of matches) {
    const k = m[1];
    // filter out css or http or mime
    if (
      !k.includes("/") &&
      !k.startsWith("http") &&
      !k.startsWith("image.") &&
      !k.startsWith("video.")
    ) {
      allKeys.add({ file, key: k });
    }
  }
}

const missing = [];
for (const item of allKeys) {
  if (!en[item.key]) {
    missing.push(item);
  }
}

console.log(`Checked ${allKeys.size} content keys. Missing in en.js: ${missing.length}`);
const missingByFile = {};
for (const m of missing) {
  missingByFile[m.file] = missingByFile[m.file] || [];
  missingByFile[m.file].push(m.key);
}

for (const [file, keys] of Object.entries(missingByFile)) {
  console.log(`\n=== ${file} (${keys.length} missing) ===`);
  keys.forEach((k) => console.log(" ", k));
}
