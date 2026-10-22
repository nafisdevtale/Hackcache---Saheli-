import en from "./en.js";
import hi from "./hi.js";

export const DICTS = { en, hi };

export function translate(lang, key, vars) {
  let s = DICTS[lang]?.[key] ?? en[key] ?? key;
  if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}

export const pick = (lang, obj) => (obj ? obj[lang] ?? obj.en : "");
