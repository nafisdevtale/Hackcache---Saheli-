import fs from "node:fs";
import en from "../src/i18n/en.js";

const petsContent = fs.readFileSync("src/content/pets.js", "utf8");
const quotes = [...petsContent.matchAll(/pet\.quote\.[a-z0-9]+/g)].map((m) => m[0]);
const treats = [...petsContent.matchAll(/pet\.treat\.[a-zA-Z0-9]+/g)].map((m) => m[0]);
const toys = [...petsContent.matchAll(/pet\.toy\.[a-zA-Z0-9]+/g)].map((m) => m[0]);

console.log("Quotes count:", quotes.length, "Missing in en:", quotes.filter((q) => !en[q]).length);
console.log("Treats count:", treats.length, "Missing in en:", treats.filter((t) => !en[t]).length);
console.log("Toys count:", toys.length, "Missing in en:", toys.filter((t) => !en[t]).length);

console.log("\nUnique Treats:", [...new Set(treats)]);
console.log("\nUnique Toys:", [...new Set(toys)]);
console.log("\nSample Quotes:", [...new Set(quotes)].slice(0, 10));
