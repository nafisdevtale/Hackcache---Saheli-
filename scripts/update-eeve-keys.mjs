#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const i18nDir = path.resolve(__dirname, "../src/i18n");

const EEVE_UPDATES = {
  "ai.tabAi": {
    en: "Eeve (Health AI)",
    hi: "ईव (स्वास्थ्य एआई)",
    mr: "ईव्ह (आरोग्य एआय)",
    te: "ఈవ్ (ఆరోగ్య AI)",
    kn: "ಈವ್ (ಆರೋಗ್ಯ AI)",
    ta: "ஈவ் (சுகாதார AI)",
    bn: "ইভ (স্বাস্থ্য এআই)",
    gu: "ઇવ (સ્વાસ્થ્ય AI)",
    pa: "ਈਵ (ਸਿਹਤ AI)",
    ml: "ഈവ് (ആരോഗ്യ AI)",
    or: "ଇଭ୍ (ସ୍ୱାସ୍ଥ୍ୟ AI)",
    as: "ইভ (স্বাস্থ্য AI)",
    ur: "ایو (صحت AI)",
  },
  "ai.inputLabel": {
    en: "Ask Eeve (Health Companion)",
    hi: "ईव (स्वास्थ्य साथी) से पूछें",
    mr: "ईव्ह (आरोग्य मैत्रीण) ला विचारा",
    te: "ఈవ్ (ఆరోగ్య సహచరి) ను అడగండి",
    kn: "ಈವ್ (ಆರೋಗ್ಯ ಒಡನಾಡಿ) ಅನ್ನು ಕೇಳಿ",
    ta: "ஈவ் (சுகாதார தோழி) இடம் கேளுங்கள்",
    bn: "ইভ (স্বাস্থ্য সঙ্গী)-কে জিজ্ঞাসা করুন",
    gu: "ઇવ (સ્વાસ્થ્ય સાથી) ને પૂછો",
    pa: "ਈਵ (ਸਿਹਤ ਸਾਥੀ) ਨੂੰ ਪੁੱਛੋ",
    ml: "ഈവിനോട് (ആരോഗ്യ കൂട്ടുകാരി) ചോദിക്കുക",
    or: "ଇଭ୍ (ସ୍ୱାସ୍ଥ୍ୟ ସାଥୀ) ଙ୍କୁ ପଚାରନ୍ତୁ",
    as: "ইভ (স্বাস্থ্য সংগী)ক সোধক",
    ur: "ایو (صحت ساتھی) سے پوچھیں",
  },
  "ai.askBtn": {
    en: "Ask Eeve",
    hi: "ईव से पूछें",
    mr: "ईव्हला विचारा",
    te: "ఈవ్‌ను అడగండి",
    kn: "ಈವ್ ಅನ್ನು ಕೇಳಿ",
    ta: "ஈவிடம் கேளுங்கள்",
    bn: "ইভকে জিজ্ঞাসা করুন",
    gu: "ઇવને પૂછો",
    pa: "ਈਵ ਨੂੰ ਪੁੱਛੋ",
    ml: "ഈവിനോട് ചോദിക്കുക",
    or: "ଇଭ୍‌ଙ୍କୁ ପଚାରନ୍ତୁ",
    as: "ইভক সোধক",
    ur: "ایو سے پوچھیں",
  },
  "ai.consentTitle": {
    en: "Eeve — Health AI Companion",
    hi: "ईव — स्वास्थ्य एआई साथी",
    mr: "ईव्ह — आरोग्य एआय मैत्रीण",
    te: "ఈవ్ — ఆరోగ్య AI సహచరి",
    kn: "ಈವ್ — ಆರೋಗ್ಯ AI ಒಡನಾಡಿ",
    ta: "ஈவ் — சுகாதார AI தோழி",
    bn: "ইভ — স্বাস্থ্য এআই সঙ্গী",
    gu: "ઇવ — સ્વાસ્થ્ય AI સાથી",
    pa: "ਈਵ — ਸਿਹਤ AI ਸਾਥੀ",
    ml: "ഈവ് — ആരോഗ്യ AI കൂട്ടുകാരി",
    or: "ଇଭ୍ — ସ୍ୱାସ୍ଥ୍ୟ AI ସାଥୀ",
    as: "ইভ — স্বাস্থ্য AI সংগী",
    ur: "ایو — صحت AI ساتھی",
  },
  "ai.title": {
    en: "Eeve — Health AI Companion",
    hi: "ईव — स्वास्थ्य एआई साथी",
    mr: "ईव्ह — आरोग्य एआय मैत्रीण",
    te: "ఈవ్ — ఆరోగ్య AI సహచరి",
    kn: "ಈವ್ — ಆರೋಗ್ಯ AI ಒಡನಾಡಿ",
    ta: "ஈவ் — சுகாதார AI தோழி",
    bn: "ইভ — স্বাস্থ্য এআই সঙ্গী",
    gu: "ઇવ — સ્વાસ્થ્ય AI સાથી",
    pa: "ਈਵ — ਸਿਹਤ AI ਸਾਥੀ",
    ml: "ഈവ് — ആരോഗ്യ AI കൂട്ടുകാരി",
    or: "ଇଭ୍ — ସ୍ୱାସ୍ଥ୍ୟ AI ସାଥୀ",
    as: "ইভ — স্বাস্থ্য AI সংগী",
    ur: "ایو — صحت AI ساتھی",
  },
};

const languages = ["en", "hi", "mr", "te", "kn", "ta", "bn", "gu", "pa", "ml", "or", "as", "ur"];

for (const lang of languages) {
  const filePath = path.join(i18nDir, `${lang}.js`);
  let content = fs.readFileSync(filePath, "utf-8");

  for (const [key, transObj] of Object.entries(EEVE_UPDATES)) {
    const val = transObj[lang] || transObj["en"];
    const escapedVal = val.replace(/"/g, '\\"');

    // Replace existing key line
    const regex = new RegExp(`("${key}":\\s*")[^"]*("?.*)`, "g");
    if (regex.test(content)) {
      content = content.replace(regex, `$1${escapedVal}$2`);
    } else {
      // If multiline or different format, search and replace
      const broadRegex = new RegExp(`"${key}":\\s*(\`[^\`]*\`|"[^"]*")`, "g");
      content = content.replace(broadRegex, `"${key}": "${escapedVal}"`);
    }
  }

  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`Updated [${lang}] with Eeve AI persona translations.`);
}
