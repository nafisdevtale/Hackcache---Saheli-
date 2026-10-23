import en from "./en.js";
import hi from "./hi.js";
import mr from "./mr.js";
import te from "./te.js";
import kn from "./kn.js";
import ta from "./ta.js";
import bn from "./bn.js";
import gu from "./gu.js";
import pa from "./pa.js";
import ml from "./ml.js";
import or from "./or.js";
import as from "./as.js";
import ur from "./ur.js";
import { LANGUAGES } from "./languages.js";

export { LANGUAGES };

export const DICTS = {
  en,
  hi,
  mr,
  te,
  kn,
  ta,
  bn,
  gu,
  pa,
  ml,
  or,
  as,
  ur,
};

export function translate(lang, key, vars) {
  let s = DICTS[lang]?.[key] ?? en[key] ?? key;
  if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}

export const pick = (lang, obj) => (obj ? (obj[lang] ?? obj.hi ?? obj.en) : "");
