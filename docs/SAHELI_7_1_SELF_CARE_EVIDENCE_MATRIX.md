# Saheli 7.1 — Self Care Evidence & Governance Matrix

## Governance & Safety Philosophy

Saheli distinguishes clearly between **clinical treatment** and **supportive wellbeing/comfort practices**. Self-care suggestions never claim to cure pathological conditions (such as endometriosis, fibroids, or severe secondary dysmenorrhea) and never substitute for formal medical evaluation. Every routine is assigned an explicit evidence level and cited from accredited global guidelines (NHS, WHO, ACOG, FOGSI, UNICEF).

---

## Evidence Classification Hierarchy

| Level                                           | Definition                                                                                                                                                | Visual Indicator                                       | Application in Saheli                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **Evidence-Informed** (`evidence_informed`)     | Supported by clinical trials, systematic reviews, or medical authority guidelines (ACOG, NHS, WHO) demonstrating measurable comfort or symptom reduction. | Green Badge (`bg-primary/10 text-primary`)             | Heat therapy, NHS 4-4 breathing, gentle restorative movement, hydration.     |
| **Wellbeing Practice** (`wellbeing_practice`)   | Established non-pharmacological holistic practices with recognized psychological or physiological relaxation benefits.                                    | Violet Badge (`bg-secondary/20 text-secondary-strong`) | Progressive muscle release, 5-4-3-2-1 grounding, pelvic unwinding stretches. |
| **Personal Preference** (`personal_preference`) | Subjective comfort choices based on personal sensory relaxation, individual preference, or calming environmental cues.                                    | Amber Badge (`bg-accent/40 text-accent-foreground`)    | Soundscapes, ambient mixing, warm herbal infusions.                          |

---

## Structured Care Programmes Matrix

| ID                          | Title Key                       | Category   | Duration | Evidence Level     | Verified Sources                                     | Stop Conditions & Clinical Precautions                                                       |
| --------------------------- | ------------------------------- | ---------- | -------- | ------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `routine_gentle_warmth`     | `selfcare.prog.warmth.title`    | Comfort    | 10 min   | Evidence-Informed  | NHS Dysmenorrhea, ACOG Dysmenorrhea                  | Do not apply heat exceeding comfortable warmth. Stop if skin burns or pain worsens.          |
| `routine_period_hygiene`    | `selfcare.prog.hygiene.title`   | Hygiene    | 5 min    | Evidence-Informed  | UNICEF Menstrual Hygiene, WHO Self-Care Guidelines   | Change pads every 4-6 hours. Never use harsh scented washes inside the vagina.               |
| `routine_hydration_nurture` | `selfcare.prog.hydration.title` | Comfort    | 5 min    | Evidence-Informed  | WHO Physical Activity & Health, FOGSI Adolescent FAQ | Avoid boiling liquids. Prefer non-caffeinated soothing teas (chamomile, ginger).             |
| `routine_rest_recharge`     | `selfcare.prog.rest.title`      | Comfort    | 15 min   | Evidence-Informed  | WHO Self-Care Guidelines                             | If profound exhaustion is accompanied by pallor, breathlessness, or dizziness, see a doctor. |
| `exercise_gentle_stretch`   | `selfcare.prog.stretch.title`   | Movement   | 10 min   | Evidence-Informed  | WHO Physical Activity Guidelines                     | Stop immediately if experiencing sharp, stabbing abdominal pain or dizziness.                |
| `exercise_pelvic_unwind`    | `selfcare.prog.pelvic.title`    | Movement   | 8 min    | Wellbeing Practice | ACOG Dysmenorrhea FAQ                                | Never strain or force your range of motion. Keep belly relaxed.                              |
| `relax_calm_breathing`      | `selfcare.prog.breathe.title`   | Relaxation | 5 min    | Evidence-Informed  | NHS Calm Breathing 4-4, WHO Psychological Self-Help  | If you feel hyperventilated or lightheaded, return to natural unforced breathing.            |
| `relax_bedtime_winddown`    | `selfcare.prog.sleep.title`     | Relaxation | 12 min   | Wellbeing Practice | NHS Sleep & Relaxation Guidelines                    | Keep room well ventilated. Do not force sleep if restless.                                   |
| `relax_grounding_54321`     | `selfcare.prog.grounding.title` | Relaxation | 7 min    | Wellbeing Practice | WHO Psychological Self-Help                          | Focus only on safe, neutral sensory stimuli around you.                                      |

---

## Procedural Soundscapes Matrix

| Sound ID          | Sound Name     | Category | Synthesis Method                            | Evidence Level      | Purpose                                         |
| ----------------- | -------------- | -------- | ------------------------------------------- | ------------------- | ----------------------------------------------- |
| `rain`            | Rain Ambiance  | Ambient  | Filtered pink noise + LFO resonant stage    | Personal Preference | White noise masking, soothing sleep environment |
| `waves`           | Ocean Waves    | Ambient  | Dual bandpass pink noise + 0.12 Hz swell    | Personal Preference | Slow breathing entrainment, sensory grounding   |
| `forest`          | Forest Breeze  | Ambient  | Resonant white noise through dual stages    | Personal Preference | Acoustic stress relief, nature presence         |
| `stream`          | Flowing Stream | Ambient  | High-pass pink noise with ripple modulation | Personal Preference | Mental focus, tinnitus masking                  |
| `wind`            | Gentle Wind    | Ambient  | Low-frequency swept noise filter            | Personal Preference | Deep sleep, cozy reassurance                    |
| `night`           | Calm Night     | Ambient  | High-frequency acoustic bursts              | Personal Preference | Evening wind-down, nocturnal calm               |
| `birds`           | Chirping Birds | Ambient  | Musical frequency-swept sine chirps         | Personal Preference | Morning energy, gentle waking                   |
| `instrumental`    | Warm Drone     | Music    | Harmonic detuned multi-oscillator synth     | Personal Preference | Emotional warmth, introspective calm            |
| `whitenoise`      | White Noise    | Masking  | Uniform Gaussian randomized noise           | Personal Preference | Complete acoustic isolation, sleep aid          |
| `breathing_audio` | Breath Pacer   | Pacing   | 4-second sine tone swell / decay            | Evidence-Informed   | Acoustic rhythm for NHS 4-4 breath cycle        |

---

## Institutional Source Verification Details

1. **NHS Inform / NHS UK**
   - URL: `https://www.nhsinform.scot/healthy-living/mental-wellbeing/stress/breathing-and-relaxation-exercises-for-stress/`
   - Clinical Citation: Evidence-based 4-4 breathing technique for autonomic parasympathetic modulation.
2. **World Health Organization (WHO)**
   - URL: `https://www.who.int/news-room/fact-sheets/detail/self-care-health-interventions`
   - Clinical Citation: WHO Guideline on Self-Care Interventions for Health and Wellbeing.
3. **American College of Obstetricians and Gynecologists (ACOG)**
   - URL: `https://www.acog.org/womens-health/faqs/dysmenorrhea-painful-periods`
   - Clinical Citation: Clinical management of primary dysmenorrhea; role of superficial heat therapy and light aerobic movement.
4. **Federation of Obstetric and Gynaecological Societies of India (FOGSI)**
   - URL: `https://www.fogsi.org`
   - Clinical Citation: Adolescent menstrual hygiene, nutrition, and non-pharmacological comfort guidelines.
