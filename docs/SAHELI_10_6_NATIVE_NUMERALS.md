# SAHELI 10.6 — NATIVE NUMERAL ENFORCEMENT SPECIFICATION

**Feature:** Native Numeral Formatting by Default across Indic Languages  
**Baseline:** Saheli 10.5  
**Version:** Saheli 10.6  
**Status:** ✅ Production Ready

---

## 1. Principles & Architectural Decision

In South Asian digital interfaces, displaying Western Arabic digits (`0-9`) inside regional script content creates visual and cultural discordance, often impeding legibility for rural or neo-literate users. In Saheli 10.6, we establish the following authoritative rule:

> **Default Rule:** All 12 non-English Indic languages render numbers using their native decimal numeral systems by default. English renders standard Western Latin digits (`0-9`).
>
> **User Agency:** Users who prefer or require Latin digits (e.g. for compatibility, educational familiarity, or personal preference) can toggle **"Standard Latin Digits (0-9)"** in Settings.

---

## 2. Numeral Systems Mapping Table

| Language Code | Language  | Script               | BCP 47 Extension | Native Zero Point | Sample (28) | Sample (1,000) |
| :-----------: | :-------- | :------------------- | :--------------: | :---------------: | :---------: | :------------: |
|     `en`      | English   | Latin                |      `latn`      |      U+0030       |    `28`     |    `1,000`     |
|     `hi`      | Hindi     | Devanagari           |      `deva`      |      U+0966       |    `२८`     |    `१,०००`     |
|     `mr`      | Marathi   | Devanagari           |      `deva`      |      U+0966       |    `२८`     |    `१,०००`     |
|     `bn`      | Bengali   | Bengali              |      `beng`      |      U+09E6       |    `২৮`     |    `১,০০০`     |
|     `as`      | Assamese  | Assamese/Bengali     |      `beng`      |      U+09E6       |    `২৮`     |    `১,০০০`     |
|     `gu`      | Gujarati  | Gujarati             |      `gujr`      |      U+0AE6       |    `૨૮`     |    `૧,૦૦૦`     |
|     `pa`      | Punjabi   | Gurmukhi             |      `guru`      |      U+0A66       |    `੨੮`     |    `੧,੦੦੦`     |
|     `kn`      | Kannada   | Kannada              |      `knda`      |      U+0CE6       |    `೨೮`     |    `೧,೦೦೦`     |
|     `ml`      | Malayalam | Malayalam            |      `mlym`      |      U+0D66       |    `൨൮`     |    `൧,൦൦൦`     |
|     `or`      | Odia      | Odia                 |      `orya`      |      U+0B66       |    `୨୮`     |    `୧,୦୦୦`     |
|     `ta`      | Tamil     | Tamil                |    `tamldec`     |      U+0BE6       |    `௨௮`     |    `௧,௦௦௦`     |
|     `te`      | Telugu    | Telugu               |      `telu`      |      U+0C66       |    `౨౮`     |    `౧,౦౦౦`     |
|     `ur`      | Urdu      | Eastern Arabic-Indic |    `arabext`     |      U+06F0       |    `۲۸`     |    `۱،۰۰۰`     |

---

## 3. Implementation in `src/lib/locale.js`

### 3.1. Authoritative Resolution Function

```js
export function shouldUseNativeNumerals(lang = "en", optionsOrPrefs = {}) {
  // English always defaults to Latin digits
  if (lang === "en") return false;

  // Explicit user override via Settings toggle
  if (optionsOrPrefs.latinNumerals === true || optionsOrPrefs.useLatinNumerals === true) {
    return false;
  }
  if (optionsOrPrefs.nativeNumerals === false || optionsOrPrefs.useNativeNumerals === false) {
    return false;
  }
  if (optionsOrPrefs.nativeNumerals === true || optionsOrPrefs.useNativeNumerals === true) {
    return true;
  }

  // Default: Native digits for all 12 Indic languages
  return true;
}
```

### 3.2. Dynamic BCP 47 Locale Tagging

```js
export function getLocaleTag(lang = "en", useNativeNumerals = undefined) {
  const baseTag = LOCALE_MAP[lang] || "en-IN";
  if (useNativeNumerals === false) {
    return `${baseTag}-u-nu-latn`;
  }
  if (useNativeNumerals === true) {
    const nu = NATIVE_NUMBERING_SYSTEMS[lang];
    return nu && nu !== "latn" ? `${baseTag}-u-nu-${nu}` : baseTag;
  }
  return baseTag;
}
```

### 3.3. Bidirectional Number Parsing

To guarantee that user forms (e.g., logging flow volume, temperature, pain levels) accept inputs typed in either native Indic digits or Western digits without NaN errors, `parseLocalizedNumber` normalizes native digits to ASCII:

```js
export function parseLocalizedNumber(str, lang = "en") {
  if (typeof str === "number") return str;
  if (!str) return NaN;

  const nu = NATIVE_NUMBERING_SYSTEMS[lang] || "latn";
  const zeroCode = NATIVE_DIGIT_ZERO_POINTS[nu];

  let ascii = "";
  for (const char of String(str)) {
    const code = char.charCodeAt(0);
    if (zeroCode && code >= zeroCode && code <= zeroCode + 9) {
      ascii += String(code - zeroCode);
    } else if (code >= 48 && code <= 57) {
      ascii += char;
    } else if (char === "." || char === "٫") {
      ascii += ".";
    } else if (char === "-" || char === "−") {
      ascii += "-";
    }
  }
  return ascii === "" ? NaN : Number(ascii);
}
```

---

## 4. User Preference & Settings UI Integration

In `src/pages/Settings.jsx`, when the active language is any non-English Indic language, an intuitive setting card is displayed under Regional Preferences:

```jsx
{
  prefs.lang !== "en" && (
    <div className="flex items-center justify-between py-2 border-b border-border/40">
      <div className="space-y-0.5 pr-4">
        <div className="text-sm font-medium text-foreground">
          {t("settings.latinNumerals") || "Standard Latin Digits (0-9)"}
        </div>
        <div className="text-xs text-muted-foreground">
          {t("settings.latinNumeralsDesc") ||
            "Display Western digits (0-9) instead of native script numerals."}
        </div>
      </div>
      <input
        type="checkbox"
        checked={prefs.latinNumerals || prefs.useLatinNumerals || false}
        onChange={(e) =>
          updatePrefs({
            latinNumerals: e.target.checked,
            useLatinNumerals: e.target.checked,
            nativeNumerals: !e.target.checked,
          })
        }
      />
    </div>
  );
}
```

---

## 5. Verification & Compliance

- **Vitest Unit Test Suite:** `src/test/saheli-10-6-complete-translation-numerals.test.tsx` validates all 12 Indic numbering systems and ensures that formatting converts correctly and bidirectional parsing recovers JavaScript `number` primitives.
- **RhythmRing and Cycle Tracker Rendering:** Verified in DOM tests to render `१४` / `२८` in Hindi, `১৪` / `২৮` in Bengali, and `14` / `28` when `latinNumerals: true`.
