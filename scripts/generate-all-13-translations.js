import fs from "node:fs";
import path from "node:path";

// Define the complete translation dictionary for English and Hindi as base models
import enDict from "../src/i18n/en.js";
import hiDict from "../src/i18n/hi.js";
import mrDict from "../src/i18n/mr.js";
import bnDict from "../src/i18n/bn.js";
import asDict from "../src/i18n/as.js";
import guDict from "../src/i18n/gu.js";
import knDict from "../src/i18n/kn.js";
import mlDict from "../src/i18n/ml.js";
import orDict from "../src/i18n/or.js";
import paDict from "../src/i18n/pa.js";
import taDict from "../src/i18n/ta.js";
import teDict from "../src/i18n/te.js";
import urDict from "../src/i18n/ur.js";

const DICTS = {
  en: enDict,
  hi: hiDict,
  mr: mrDict,
  bn: bnDict,
  as: asDict,
  gu: guDict,
  kn: knDict,
  ml: mlDict,
  or: orDict,
  pa: paDict,
  ta: taDict,
  te: teDict,
  ur: urDict,
};

// Check current key count in en
console.log("Current keys in en:", Object.keys(enDict).length);
