import fs from "node:fs";
import path from "node:path";
import en from "../src/i18n/en.js";

// Load all dictionaries
const DICT_FILES = {
  en: "src/i18n/en.js",
  hi: "src/i18n/hi.js",
  mr: "src/i18n/mr.js",
  bn: "src/i18n/bn.js",
  as: "src/i18n/as.js",
  gu: "src/i18n/gu.js",
  kn: "src/i18n/kn.js",
  ml: "src/i18n/ml.js",
  or: "src/i18n/or.js",
  pa: "src/i18n/pa.js",
  ta: "src/i18n/ta.js",
  te: "src/i18n/te.js",
  ur: "src/i18n/ur.js",
};

// We will construct the dictionary objects and save them
console.log("Ready to build multi-language dictionaries.");
