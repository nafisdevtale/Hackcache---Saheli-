import fs from "node:fs";
import path from "node:path";

function findFiles(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) results = results.concat(findFiles(fp));
    else if (/\.(jsx?|tsx?)$/.test(f)) results.push(fp);
  }
  return results;
}

const files = findFiles("src");
const dynamicCalls = new Set();

for (const file of files) {
  if (file.includes(".test.") || file.includes("fixtures")) continue;
  const content = fs.readFileSync(file, "utf8");
  const matches = content.matchAll(/\bt\(\s*([^"'\`\s\),][^\),]*)/g);
  for (const m of matches) {
    const expr = m[1].trim();
    if (!expr.startsWith("{") && !expr.startsWith("key")) {
      dynamicCalls.add(`${path.relative(process.cwd(), file)}: t(${expr})`);
    }
  }
  const templateMatches = content.matchAll(/\bt\(\s*`([^`]+)`/g);
  for (const m of templateMatches) {
    dynamicCalls.add(`${path.relative(process.cwd(), file)}: t(\`${m[1]}\`)`);
  }
}

console.log(`Found ${dynamicCalls.size} dynamic t() calls:`);
for (const c of Array.from(dynamicCalls).sort()) {
  console.log(" ", c);
}
