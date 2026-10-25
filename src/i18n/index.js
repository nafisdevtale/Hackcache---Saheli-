import en from "./en.js";
import hi from "./hi.js";
import mr from "./mr.js";
import { LANGUAGES } from "./languages.js";

import {
  LOCALE_MAP,
  SCRIPT_MAP,
  NATIVE_NUMBERING_SYSTEMS,
  getLocaleTag,
  isRTL,
  getLanguageMetadata,
  formatNumber,
  formatInteger,
  formatPercent,
  formatCurrency,
  formatUnit,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatList,
  parseLocalizedNumber,
} from "../lib/locale.js";

export {
  LOCALE_MAP,
  SCRIPT_MAP,
  NATIVE_NUMBERING_SYSTEMS,
  getLocaleTag,
  isRTL,
  getLanguageMetadata,
  formatNumber,
  formatInteger,
  formatPercent,
  formatCurrency,
  formatUnit,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatList,
  parseLocalizedNumber,
};

export const DICTS = {
  en,
  hi,
  mr,
};

export const KEY_ALIASES = {
  // Diva aliases
  "diva.explorehub": "diva.exploreHub",
  "diva.openchat": "diva.openChat",
  // Text sizes
  "text.normal": "text.md",
  "text.large": "text.lg",
  "text.extraLarge": "text.lg",
  // Discover category aliases
  "discover.cat.menstrual_awareness": "discover.cat.awareness",
  "discover.cat.supplies_unavailable": "discover.cat.unavailable",
  "discover.cat.self_care": "discover.cat.selfCare",
  // Companion action toasts
  "companion.actionToast.feed": "pet.actionToast.feed",
  "companion.actionToast.play": "pet.actionToast.play",
  "companion.actionToast.brush": "pet.actionToast.brush",
  "companion.actionToast.rest": "pet.actionToast.rest",
  "companion.actionToast.affection": "pet.actionToast.affection",
  // Companion / Pet aliases
  "pet.badge": "companion.badge",
  "pet.adoptTitle": "companion.adoptionTitle",
  "pet.adoptSubtitle": "companion.adoptionSubtitle",
  "pet.chooseSpecies": "companion.chooseSpecies",
  "pet.speciesAvailable": "companion.speciesAvailable",
  "pet.nameLabel": "companion.namePrompt",
  "pet.namePlaceholder": "companion.namePlaceholder",
  "pet.nameHelp": "companion.nameHelp",
  "pet.chooseHabitat": "companion.habitatPrompt",
  "pet.chooseAccessory": "companion.accessoryPrompt",
  "pet.confirmAdopt": "companion.adoptAction",
  "pet.navTitle": "companion.title",
  "pet.customiseBtn": "companion.customise",
  "pet.customiseModalTitle": "companion.customise",
  "pet.growthLabel": "companion.stage",
  "pet.careActivitiesTitle": "companion.careActions",
  "pet.act.feed": "companion.actionFeed",
  "pet.act.play": "companion.actionPlay",
  "pet.act.brush": "companion.actionGroom",
  "pet.act.rest": "companion.actionRest",
  "pet.act.affection": "companion.actionAffection",
  "pet.privacyTitle": "companion.privacyBadge",
  "pet.privacyDesc": "companion.subtitle",
  "pet.stageCelebrationTitle": "companion.celebrationTitle",
  "pet.celebrateDismiss": "companion.celebrationContinue",
  "pet.resetBtn": "companion.reset",
  "pet.resetConfirmTitle": "companion.resetConfirm",
  "pet.resetConfirmDesc": "companion.resetConfirmDesc",
  "pet.confirmResetBtn": "companion.resetYes",
  "pet.habitat.meadow": "companion.habitat.meadow",
  "pet.habitat.cozyRoom": "companion.habitat.cozy_room",
  "pet.habitat.sunsetPorch": "companion.habitat.garden",
  "pet.habitat.starlitGarden": "companion.habitat.forest",
  "pet.acc.none": "companion.accessory.none",
  "pet.acc.flowerCrown": "companion.accessory.flower",
  "pet.acc.cozyScarf": "companion.accessory.scarf",
  "pet.acc.ribbonBow": "companion.accessory.bow",
  "pet.acc.starCharm": "companion.accessory.bell",
  "pet.acc.tinyGlasses": "companion.accessory.leaf",
  "pet.stage.new": "companion.stageNew",
  "pet.stage.growing": "companion.stageGrowing",
  "pet.stage.established": "companion.stageEstablished",
  "pet.stage.mature": "companion.stageMature",
  "pet.mood.happy": "companion.mood.happy",
  "pet.mood.playful": "companion.mood.playful",
  "pet.mood.calm": "companion.mood.calm",
  "pet.mood.curious": "companion.mood.loving",
  "pet.mood.sleepy": "companion.mood.sleepy",
  // Guidance
  "mood.callTeleManas": "mood.call",
  "mood.supportBody": "mood.supportText",
  // Shell
  "common.discreetDesc": "onb.discreetDesc",
  // Insights & Cycle
  "insights.days": "common.days",
};

export function translate(lang, key, vars) {
  let s = DICTS[lang]?.[key] ?? en[key];
  if (s === undefined && typeof key === "string") {
    const alias = KEY_ALIASES[key];
    if (alias) {
      s = DICTS[lang]?.[alias] ?? en[alias];
    } else if (key.startsWith("pet.species.") && !key.endsWith("Desc")) {
      const companionKey = "companion." + key.slice(4);
      s = DICTS[lang]?.[companionKey] ?? en[companionKey];
    } else if (key.startsWith("companion.species.") && key.endsWith("Desc")) {
      const petKey = "pet." + key.slice(10);
      s = DICTS[lang]?.[petKey] ?? en[petKey];
    }
  }
  if (s === undefined) {
    if (
      (typeof import.meta !== "undefined" && import.meta.env?.DEV) ||
      (typeof process !== "undefined" && process.env?.NODE_ENV === "development")
    ) {
      console.warn(`[i18n] Missing translation for key "${key}" in language "${lang}".`);
    }
    s = key;
  }
  if (vars && typeof s === "string") {
    for (const k of Object.keys(vars)) {
      const rawVal = vars[k];
      const valStr = rawVal !== undefined && rawVal !== null ? String(rawVal) : "";
      s = s.split(`{${k}}`).join(valStr);
    }
  }
  return s;
}

export const pick = (lang, obj) => (obj ? (obj[lang] ?? obj.hi ?? obj.en) : "");
