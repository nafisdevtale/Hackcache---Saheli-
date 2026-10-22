# Saheli Cycle Companion

Saheli is a free, private, local-first menstrual health companion Progressive Web App (PWA) built with mobile-first design, bilingual support (English & Hindi), client-side AES-GCM encryption, and reliable offline access.

## Progressive Web App (PWA) & Offline Capabilities

- **Installable PWA**: Configured with a W3C web app manifest (`/manifest.webmanifest`), standalone display mode, portrait orientation, theme colors (`#a34438`), and complete standard/maskable app icon sets (192px, 512px, SVG vector, and Apple Touch Icon).
- **Offline-First Application Shell**: A dedicated Service Worker (`/sw.js`) precaches the application shell, icons, manifest, and stylesheets. Once loaded, all core screens (Today, Log, Calendar, Insights, Doctor Guidance, Visit Summary, Learn, Ask, Reminders, Pregnancy, and Settings) remain completely functional without internet access.
- **Strict Privacy Guarantees**:
  - Personal health logs, symptoms, cycle calculations, and encryption keys live strictly in client-side **IndexedDB / WebCrypto** and are **never transmitted to any server or cached in the Service Worker Cache API**.
  - Service worker caching is restricted to same-origin GET requests for the application shell and static assets (`/assets/*`).
  - Sensitive export queries, credentials, and non-GET requests bypass the cache completely.
  - Complete data deletion (`Settings > Delete everything`) purges all IndexedDB data, localStorage/sessionStorage keys, and explicitly purges the Service Worker Cache API (`caches.delete`).
- **Discreet & Accessible Installation**:
  - Standard mode prompts: "Install app" / "ऐप इंस्टॉल करें".
  - Discreet mode prompts: "Install Diary" / "डायरी इंस्टॉल करें".
  - Graceful fallbacks for browsers without programmatic install prompts (including iOS Safari Add-to-Home-Screen instructions).
- **Safe Update Handling**:
  - Service worker updates trigger a polite, non-intrusive notification ("A new version is ready") with explicit user approval to refresh, preventing mid-session disruption or unsaved data loss.
  - Obsolete cache versions are purged automatically upon activation.

## Personalised Cycle Insights & Health Guidance (Saheli 2.1)

- **Local Cycle-History Analysis**: Computes recorded cycle lengths, median duration, personal range, and spread across available cycles. Features cycle-by-cycle comparisons against personal medians.
- **Cautious Predictions & Uncertainty Representation**: Enforces a strict 3-cycle minimum history before generating estimates; represents future predictions as date intervals/windows; widens windows dynamically for irregular cycles; and explicitly states that estimates are not for contraception.
- **Bleeding Patterns**: Tracks recorded period durations, flow intensity distributions (spotting, light, medium, heavy), and flags heavy bleeding signs (pad changes every 1–2 hours, clots larger than ₹10 coin, periods > 7 days).
- **Symptom Patterns & Well-being Trends**: Identifies symptoms recurring across cycles, timing associations (premenstrual, during period, other days), and pain/mood/sleep trends without treating unlogged days as confirmed symptom-free.
- **Supportive Health Guidance**: Provides contextual links to medical guidance (`/doctor`), relevant lessons (`/learn`), doctor visit summaries (`/visit`), and national helplines (112, 108, Tele-MANAS 14416).
- **Accessibility & Bilingual Localization**: Fully screen-reader accessible with semantic data tables, SVG chart summaries, high-contrast support, and 100% matched English and Hindi coverage.

---

# SAHELI — HACKCACHE STAGE 1: COMPLETE BUILD PROMPT

Build a complete, functional web application for the HackCache hackathon. This is an implementation task, not a request for a plan, wireframe, or static mockup. Build the actual application, with working navigation, local data persistence, calculations, health guidance, bilingual content, privacy controls, and responsive design.

Follow every requirement below. Do not silently omit features, replace functional logic with mock data, or claim something works unless you have implemented and tested it.

## 1. PROJECT IDENTITY

**App name:** Saheli

**Track:** Social Impact

**Target user:** Ananya, a 17-year-old Class 12 student in Lucknow, India. Her periods are irregular, she prefers Hindi, shares a phone with her family, and feels shy about asking someone for menstrual health guidance.

**Primary product focus:** Helping users understand irregular periods and know when to seek medical attention.

**Core product promise:**

Saheli is a free, private, accessible menstrual health companion that helps users track their cycles, understand their health history, learn from reliable medical sources, and recognise when professional guidance may be appropriate.

It must not diagnose medical conditions, promise accurate predictions, or compromise sensitive health information.

## 2. PROBLEM TO SOLVE

Many women and girls struggle to distinguish ordinary menstrual variations from symptoms that may require medical evaluation. They may find PCOS/PCOD confusing, lack reliable health education, be unable to afford tracking apps, or be uncomfortable sharing intimate health information.

Build a calm, mobile-first application that addresses these problems through:

- Private menstrual and symptom tracking.
- Transparent cycle estimates and historical insights.
- Understandable guidance on when to see a doctor.
- Reliable, source-linked menstrual health education.
- English and Hindi language support.
- Accessibility for users with limited technical confidence.
- Meaningful privacy protections for shared devices.

The app must work without creating an account or sending personal cycle information to a backend.

## 3. MANDATORY SAFETY RULES

These requirements must be implemented, not merely displayed as disclaimers.

- Never diagnose PCOS, PCOD, anaemia, pregnancy complications, or another medical condition.
- Never present a cycle prediction as certain.
- Never tell a user that a warning sign is harmless without adequate basis.
- Never recommend medication dosages or unsupported treatments.
- Every displayed prediction must be labelled as an estimate and shown as a range of dates.
- Every displayed ovulation estimate and fertile-window estimate must include: "This is an estimate. It can't be used to prevent pregnancy."
- Do not display ovulation or fertile-window estimates when the cycle is classified as irregular under the configured rule.
- Use established health guidance from WHO, NHS, ACOG, FOGSI, and India's Ministry of Health and Family Welfare.
- Every material medical fact must have a named, verifiable source and URL in the local content files. Do not invent references, statistics, or medical claims.
- If a logged symptom warrants medical attention, explain what was noticed, which dates or entries support it, why it matters, and what action the user can take.
- Use calm, neutral language and visual styling for health guidance. Reserve a clearly distinguishable urgent treatment for genuine emergency messages.
- Include an appropriate statement that the application provides educational information and is not a substitute for professional medical evaluation.

### Urgent guidance

When the applicable rules identify an urgent situation, show "Get medical help now" and appropriate instructions to seek urgent care.

Examples include:

- Sudden, severe lower abdominal pain.
- Very heavy bleeding accompanied by dizziness or fainting.
- Bleeding or severe pain when pregnancy is possible.

Include India's emergency numbers 112 and 108 as specified in the supplied brief. Do not imply that contacting the application or reading its information is sufficient in an emergency.

### Mental health guidance

If the user records a "very low" mood for at least three consecutive days or asks about self-harm, show an appropriate supportive message and Tele-MANAS, India's mental health helpline: 14416.

Do not use shaming language, minimise distress, or treat the application as a replacement for mental health care.

## 4. MANDATORY PRIVACY ARCHITECTURE

The core application must be local-first.

- No account, sign-up, login service, backend database, or server-side storage of personal cycle records.
- Store cycle dates, period logs, symptoms, mood entries, medicines, sleep records, notes, and derived personal insights in IndexedDB.
- Use localStorage only for non-sensitive interface preferences, such as selected language and text size.
- Do not send personal health records to external services.
- No analytics, advertising trackers, telemetry, third-party tracking scripts, remotely loaded fonts, images, or external scripts.
- Bundle all required application assets locally.
- Official medical references may be opened as external links only after an explicit user action.
- Do not log health records or personal notes to the browser console.
- Use synthetic demonstration data only. Keep demo data separate from a user's actual records.
- The application must continue to work with previously loaded resources when offline where its implementation supports it. Do not promise complete offline functionality until it has been tested.

Serving the initial application from a hosting provider is acceptable. The critical privacy requirement is that the app must not automatically transmit personal health information or load third-party tracking resources.

### Optional four-digit PIN lock

Implement a functional PIN lock using the Web Crypto API.

- Use AES-GCM to encrypt sensitive records before they are written to persistent storage when PIN protection is enabled.
- Derive the encryption key from the PIN using PBKDF2 and a random salt.
- Use an appropriate documented work factor and a cryptographically secure random, unique IV for every AES-GCM encryption operation.
- Never store the PIN itself.
- Never store the derived encryption key persistently.
- Keep decrypted sensitive data in memory only while the app is unlocked.
- On reload, require the PIN before decrypting protected records.
- Support enabling, disabling, and changing the PIN without losing existing records.
- Explain clearly that forgetting the PIN means the protected data cannot be recovered.
- Offer an export before enabling PIN protection.
- Handle incorrect PINs, corrupted ciphertext, failed writes, and interrupted updates without silently deleting data.
- Test that protected records are unreadable ciphertext in the browser's storage panel.
- Do not claim that a four-digit PIN makes the app invulnerable to every attack.

### Discreet mode

When enabled:

- Display the app name "Diary".
- Use a neutral, non-menstrual icon.
- Ensure notifications say "Time to check in", never "period".
- Do not expose menstrual dates, symptoms, pregnancy information, or other sensitive details on notification banners.
- Apply discreet mode consistently throughout navigation, settings, reminders, and relevant screen titles.

### Export, import, and deletion

- Provide JSON and CSV exports.
- Exports must contain the appropriate user data and maintain valid dates and record relationships.
- Warn users before exporting readable health information.
- Allow previously exported JSON data to be imported back.
- Validate the import format and content before changing existing records.
- Avoid silently duplicating records or overwriting the user's data.
- Provide "Delete everything" with one explicit confirmation.
- Deletion must clear all application-owned records, preferences, encrypted records, and relevant local application storage.
- Verify deletion by checking storage and reopening the application.

Do not claim that exported CSV files are encrypted. Explain that the user is responsible for protecting exported files.

## 5. TECHNOLOGY STACK

Use this stack for the initial implementation:

- React.
- Vite.
- Tailwind CSS.
- Plain JavaScript only. Do not use TypeScript.
- React Router for navigation.
- React hooks and Context where needed.
- IndexedDB for persistent personal records.
- localStorage only for non-sensitive UI preferences.
- Web Crypto API for encryption.
- Lightweight SVG charts and locally bundled icons.
- Native JavaScript date calculations implemented in a reusable module.
- Lightweight automated tests for critical cycle-calculation and safety-rule logic, using an existing lightweight test setup where possible.

Do not add Supabase, MongoDB, Firebase, a backend API, an external AI service, authentication, analytics, or unnecessary dependencies to this core build.

GitHub should manage source-code version history. Hosting should serve the frontend without receiving personal health records.

Keep the code modular, readable, and suitable for debugging during a 48-hour hackathon.

## 6. REQUIRED PROJECT STRUCTURE

Maintain this structure, adapting only when necessary to the existing project:

src/

- components/
  - layout/
  - common/
  - calendar/
  - insights/
- pages/
  - Today.jsx
  - LogDay.jsx
  - Calendar.jsx
  - Insights.jsx
  - DoctorGuidance.jsx
  - Learn.jsx
  - Ask.jsx
  - Settings.jsx
- data/
  - symptoms.js
  - redflags.js
  - demo.js
- content/
  - faq.js
  - lessons.js
  - conditions.js
  - firstPeriod.js
  - pregnancyWeeks.js
  - sources.js
- i18n/
  - en.js
  - hi.js
- lib/
  - cycle.js
  - storage.js
  - encryption.js
  - exportImport.js
  - safetyRules.js
  - localDate.js
- config.js
- App.jsx
- main.jsx

All interface strings must be localised through src/i18n/en.js and src/i18n/hi.js. Educational content and FAQs must also have complete English and Hindi versions, not just translated navigation labels.

Put the numerical thresholds used by cycle and medical rules into src/config.js. Keep rules and symptom definitions in data modules rather than embedding them throughout React components.

## 7. FIRST-LAUNCH EXPERIENCE

On the first opening of the app, offer two clear options:

1. "Try with demo data"
2. "Start fresh"

The demo profile must contain eight months of synthetic period and symptom history, including one long cycle, painful periods, and mood changes.

The demo must trigger at least two appropriate Doctor Guidance cards so the functionality can be demonstrated.

Provide a clear way to reset demo data and start fresh without accidentally mixing demonstration records with genuine user records.

Do not pre-populate personal records for users who select "Start fresh".

## 8. CYCLE CALCULATION ENGINE

Implement all cycle calculations in src/lib/cycle.js. The interface must consume the results of this module instead of calculating predictions independently.

### Date representation

- Store calendar dates as plain local date strings in YYYY-MM-DD format.
- Do not parse a YYYY-MM-DD string with a conversion that treats it as UTC and shifts the visible date.
- Use explicit local-calendar date arithmetic for cycle calculations.
- Test month boundaries, leap years, daylight-saving transitions where applicable, and timezone-related display behaviour.

### Cycle length and history

- Cycle length is the number of calendar days between the first day of one period and the first day of the next.
- Use the last six complete cycles when available.
- Never treat an unfinished current cycle as a complete cycle.
- With fewer than three complete logged cycles, do not generate a prediction. Show: "Log 3 periods and I'll start estimating".
- Maintain consistent definitions for complete cycles, period duration, and missing logs.

### Next-period estimate

- Calculate the median cycle length from the last six complete cycles, or from the available complete cycles when fewer than six exist.
- Calculate spread consistently as the maximum cycle length minus the minimum cycle length in the included history.
- Define the prediction half-width as the greater of two days or the calculated spread.
- Show the resulting date range and label it "estimate".
- Document the algorithm and keep it deterministic and testable.
- Treat these calculation details as an implementation definition, not a medical guarantee.

### Irregular-cycle handling

- Keep the irregularity threshold in src/config.js.
- Apply the age-dependent rule described in the supplied brief, including its stated FIGO threshold guidance.
- When recent cycles vary beyond the configured threshold, label the history as irregular.
- Widen the displayed estimate range in accordance with the documented calculation method.
- Provide a calm one-line explanation that variation can occur in the first years after periods begin and at other times.
- Link to "When to see a doctor".
- Do not suppress relevant medical warnings merely because a cycle is labelled irregular.

### Ovulation and fertile-window estimates

- When the cycle meets the criteria for providing an estimate, calculate ovulation approximately fourteen days before the next expected period.
- Estimate the fertile window as the five preceding days plus that estimated day.
- Present dates as ranges where appropriate and always display the disclaimer: "This is an estimate. It can't be used to prevent pregnancy."
- Do not show ovulation or fertile-window estimates when the cycle is irregular under the configured rule.
- Explain why the estimate is unavailable.
- Respect the age-group and pregnancy-mode settings that control whether fertility-related features are displayed.

### Missing period logs

If the gap since the previous period is much longer than the user's established pattern, ask whether a period entry may have been forgotten before interpreting the gap as a long cycle.

Do not silently assume that a missed log means a health event or a medical condition.

## 9. REQUIRED APPLICATION SCREENS

### SCREEN 1 — TODAY

Display:

- Current cycle day where it can be calculated reliably.
- One plain-language sentence about the current phase.
- Next-period estimate as a date range where sufficient history exists.
- A prominent "Log today" action.
- One personal insight derived from the saved records.

With insufficient history, explain that more periods need to be logged.

Do not present sample values as genuine predictions.

### SCREEN 2 — LOG A DAY

Allow the user to record:

- Period on/off.
- Flow: spotting, light, medium, heavy.
- If heavy flow is selected, ask whether a pad needs changing every one to two hours and whether clots are larger than a ₹10 coin.
- Pain from zero to ten.
- Whether pain stopped the user from doing normal activities.
- Symptoms selected from icon buttons, including cramps, headache, acne, bloating, tiredness, mood changes, trouble sleeping, and other configured symptoms.
- Mood.
- Energy.
- Sleep hours.
- Medicines taken.
- One optional private text note.

Every selection must have an understandable text label in addition to any icon.

Users must be able to choose which symptoms they track in Settings.

Save actual records locally, allow editing previous dates, validate the input, and confirm that saved records persist after reload.

### SCREEN 3 — CALENDAR

Create a month-view calendar containing:

- Logged period days.
- Predicted period date ranges.
- Recorded symptoms.
- Navigation between months.
- A way to tap a day to view or edit its records.

Logged and predicted days must look different in both shape or pattern and colour. Never use colour alone to communicate the difference.

### SCREEN 4 — INSIGHTS

Display:

- Cycle history.
- Cycle-length and period-length bar charts.
- Average and range of recorded cycle lengths.
- A clear description of how regular the cycle history appears.
- Symptom patterns across cycles.

Examples of acceptable, evidence-based patterns:

- "Cramps were logged on days 1–2 of your last 4 periods."
- "Energy was usually lower in the 5 days before your period in the recorded history."

Show a pattern only after it appears across at least three cycles, and state the number of cycles supporting it.

Never infer a medical diagnosis from recorded symptoms.

Use synthetic demo history to show the feature. Do not display hard-coded insight sentences as though they were calculated from the current user's records.

### SCREEN 5 — WHEN TO SEE A DOCTOR

Implement the rules in src/data/redflags.js and evaluate them against actual saved records.

The specified checks include:

- Periods lasting more than seven days.
- Needing to change a pad every one to two hours.
- Clots larger than a ₹10 coin.
- For adults, cycle lengths shorter than 21 or longer than 35 days for three consecutive cycles.
- For users under 18, cycle lengths shorter than 21 or longer than 45 days for three consecutive cycles.
- No period for 90 days when pregnancy is not applicable.
- Bleeding between periods or after sex.
- Pain that stops daily life or is not helped by painkillers.
- Heavy periods accompanied by tiredness, breathlessness, or dizziness, which may warrant assessment for anaemia.

Also provide information about important signs that cannot be established from the app's logs:

- No period by age 15.
- Periods changing suddenly after years of being regular.
- Any bleeding after menopause.

Every alert must contain:

- What was noticed.
- The recorded dates or observations supporting it.
- Why it matters in plain language.
- What the user can do next.
- Appropriate options such as a government health centre, the government's eSanjeevani tele-consultation service, or a gynaecologist.
- Reliable source references.

Keep numerical medical rules in src/config.js and src/data/redflags.js. Make them maintainable and testable.

Verify medical thresholds against the referenced authoritative guidance. Where age, history, or missing data changes how a rule should be interpreted, do not silently apply an adult-only threshold.

Implement "Prepare for my visit" as a print-ready one-page summary containing cycle history, period duration, symptoms, pain, medicines, and questions to ask the doctor.

The summary must be legible when printed and must not expose demo records in place of real records.

### SCREEN 6 — LEARN

Provide short, readable lessons with simple local illustrations and a "Listen" button using browser-native text-to-speech where supported.

Include:

- Menstrual cycle and its phases.
- What is common and what may require medical attention.
- PCOS/PCOD: what it is, how the terms are used in India according to the source material, common signs, the need for medical evaluation, and possible treatment approaches explained generally.
- Why a period might be late, including stress, weight changes, illness, travel, pregnancy, PCOS, and thyroid problems.
- Cramps and general evidence-based measures that may help.
- Pads, cups, and cloth: safe use and hygiene.
- A "My first period" guide for younger users.

Every health fact must have a reliable source attached to it in the local content files. Do not invent sources or unsupported medical claims.

Include an understandable source link or source attribution at the end of each lesson.

### SCREEN 7 — ASK

Create a local FAQ experience based on at least 30 questions and answers in src/content/faq.js.

- Support English and Hindi.
- Match the user's question to locally stored FAQs using a transparent keyword-matching method.
- Show suggested questions.
- Show a safe, plain-language answer where a relevant FAQ exists.
- Answers about concerning symptoms must end with appropriate information on when to seek medical attention.
- When there is no suitable answer, respond: "I don't know that one. A doctor can help."
- Never diagnose or prescribe.
- Never send questions, cycle history, or private notes to an external AI service.

This is a local, rule-based FAQ implementation. Do not present it as a real AI chatbot.

### SCREEN 8 — REMINDERS

Provide optional reminders for:

- Next period estimate.
- Daily check-in.
- Medicines at times entered by the user.
- A custom reminder.

All reminders must be off by default.

- Ask notification permission only after the user enables notifications.
- Use the Notification API where supported.
- Provide an in-app banner fallback.
- Handle denied permissions and unsupported browsers gracefully.
- Do not promise notifications will work when the application is closed unless that behaviour has actually been implemented and tested in the target browser.
- Respect discreet mode in every reminder.

### SCREEN 9 — PREGNANCY MODE

This mode must be off by default and available only after the user indicates a positive pregnancy test or confirmation from a doctor.

When enabled:

- Estimate gestational week using the first day of the last menstrual period.
- Estimate the due date as 280 days after that date, clearly labelled as an estimate.
- Display short weekly information from locally stored sourced content.
- Provide relevant check-up reminders.
- Clearly explain urgent warning signs, including bleeding, severe abdominal pain, severe headache or blurred vision, swelling of the face or hands, fever, fluid leaking, and reduced baby movement after 28 weeks.
- Pause period predictions while pregnancy mode is active.
- Keep the pregnancy experience separate from ordinary period tracking.
- If pregnancy mode is turned off, ask neutrally whether the user wants to return to period tracking. Do not assume why they are turning it off.
- Respect the age group and explicit settings governing pregnancy and fertility-related features.

All pregnancy guidance must be medically sourced and must not be used as a diagnostic tool.

### SCREEN 10 — SETTINGS

Implement:

- Language selection: English or Hindi.
- Three text-size settings.
- High contrast.
- Read aloud.
- Age group: under 18 or 18 and over.
- Configurable tracked symptoms.
- PIN lock.
- Discreet mode.
- JSON/CSV export.
- JSON import.
- Delete everything.

Age group settings should affect only the relevant guidance, thresholds, and feature visibility. For users under 18, hide fertility and pregnancy features until explicitly enabled in accordance with the specification.

Ensure every setting changes the actual behaviour of the application.

## 10. BILINGUAL SUPPORT

- Keep interface strings in src/i18n/en.js and src/i18n/hi.js.
- Translate all screens, buttons, labels, form validation, notifications, warnings, health cards, and error states.
- Translate all FAQ answers and educational content into Hindi.
- Language switching must update the currently displayed screen without losing records or form data.
- Use everyday Hindi that a Class 8 student could understand.
- Medical terminology must include a simple explanation the first time it appears.
- Do not mix untranslated English text into the Hindi interface unnecessarily.
- Store language-independent data and use the selected language only for display.

## 11. DESIGN AND ACCESSIBILITY

Build a polished, trustworthy mobile-first application.

- Design first for a 360px-wide screen.
- Use a warm, calm, supportive visual style.
- Avoid shaming language, alarmist presentation, and unnecessarily clinical layouts.
- Make the principal action easy to find on each screen.
- Body text must be at least 16px.
- Buttons and major touch targets must be at least 48px tall.
- Use adequate contrast consistent with WCAG AA.
- Provide visible keyboard focus.
- Add accessible labels to form fields and icon buttons.
- Use semantic headings and landmarks.
- Do not depend on colour alone to communicate health status or calendar differences.
- Check all screens at the largest text size and with longer Hindi text.
- Respect reduced-motion preferences.
- Use lightweight locally bundled icons and illustrations.
- Avoid large images, heavy dependencies, unnecessary animations, and decorative features that impair usability.

The result should look polished enough for a competitive social-impact hackathon while remaining realistic, safe, fast, and understandable.

## 12. IMPLEMENTATION ORDER

Build the full application in the existing project. Use the following sequence internally:

1. Set up the application structure, routes, shared components, design system, and English/Hindi text resources.
2. Implement local date utilities, IndexedDB storage, and the cycle-calculation engine.
3. Build Today, Log a Day, Calendar, and Insights using actual stored data.
4. Implement Doctor Guidance using configurable rules and sourced information.
5. Implement Learn and Ask using local bilingual content.
6. Implement Settings, PIN encryption, discreet mode, export/import, and deletion.
7. Implement reminders and pregnancy mode with appropriate safety checks.
8. Run the final regression, accessibility, and privacy checks.

This order does not permit omitting later screens. Build a complete first version of all ten screens before treating Stage 1 as finished.

Do not add Stage 2 add-ons, an external AI assistant, community functionality, MongoDB, Supabase, or other new backend services during this build.

## 13. REQUIRED TESTS BEFORE DECLARING THE BUILD COMPLETE

Execute the relevant tests and report actual results.

### Application integrity

- Every screen opens and navigates correctly.
- No critical console errors.
- No broken imports or build errors.
- No decorative buttons presented as functional.
- Form validation and editing work.
- Saved entries survive a page reload.

### Cycle calculations

- Fewer than three complete cycles produce no prediction.
- Three or more complete cycles produce a calculated estimate range.
- The last six complete cycles are used where available.
- A long cycle is handled consistently.
- A missing period is not silently interpreted as a medical event.
- Irregular cycles receive the correct label and widened estimate.
- Fertility estimates are hidden when required.
- The fertile-window and ovulation disclaimer appears whenever either estimate is shown.
- Date calculations work across month boundaries and leap years without shifting logged dates.

### Doctor Guidance

- The demo data triggers at least two appropriate guidance cards.
- Each card identifies the underlying observations and dates.
- Adult and under-18 cycle thresholds are applied correctly.
- Urgent rules are not presented as ordinary informational notices.
- The print-ready doctor-visit summary works.

### Privacy and storage

- No personal cycle data is sent to a backend or external service.
- After the application has loaded, the Network panel shows no unexpected third-party requests or tracking resources.
- Encrypted records are unreadable in the storage panel when PIN protection is enabled.
- Incorrect PIN attempts do not silently erase data.
- Enabling, disabling, and changing the PIN preserve the intended records.
- Export and re-import reproduce the same records.
- Deletion clears application-owned records and preferences.
- Demo data is never accidentally merged with real user records.

### Language and accessibility

- Every screen switches between English and Hindi.
- Longer Hindi content does not break the layout.
- All screens work at 360px width.
- Text remains usable at the largest setting.
- Keyboard navigation and visible focus work.
- Icons and form controls have accessible names.
- Logged and predicted calendar days remain distinguishable without colour.

### Reminders and pregnancy mode

- Reminders remain off by default.
- Denied notification permission produces a graceful fallback.
- Discreet mode does not reveal sensitive information in reminder text.
- Pregnancy mode pauses ordinary period predictions.
- Switching between modes does not corrupt historical records.

## 14. FINAL DELIVERABLE

Build the actual working prototype now.

When you finish, provide a concise implementation report containing:

1. The screens and features implemented.
2. The files and major modules created.
3. Which automated and manual tests you actually ran.
4. Any tests that failed or could not be executed.
5. Any requirements that remain incomplete.
6. Any security, medical-content, or browser-compatibility limitations that remain unverified.
7. Instructions for running, previewing, and publishing the project.

Never claim that the application is fully tested, privacy-secure, medically verified, or complete unless those claims are supported by actual checks.

Prioritise correctness, user safety, privacy, accessibility, and a fully working core experience over feature count.

**Start building the application now. Do not respond with only a plan.**

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5e5b3321-bd97-4a79-8cb3-c35a9dbde4c7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
