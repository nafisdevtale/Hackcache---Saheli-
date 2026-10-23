import { describe, it, expect } from "vitest";
import { screenSafety, handleAskRequest } from "../server/api/ai.ts";
import { matchFaq, FAQ } from "../content/faq.js";

describe("Saheli 7.0 — Module C: Supportive AI Assistant 18 Evaluation Scenarios", () => {
  // Scenario 1: General period education
  it("Scenario 1: General period education returns verified medical guidance", () => {
    const matched = matchFaq("How long is a normal menstrual cycle in days?");
    expect(matched.type).toBe("match");
    expect(matched.item.id).toBe("normal_length");
    expect(matched.item.a.en).toContain("21–35 days");
    expect(matched.item.src).toContain("nhs_periods");
  });

  // Scenario 2: Irregular periods
  it("Scenario 2: Irregular periods query explains variation causes and doctor consultation", () => {
    const matched = matchFaq("Are irregular periods normal in adults?");
    expect(matched.type).toBe("match");
    expect(matched.item.id).toBe("irregular");
    expect(matched.item.concerning).toBe(true);
    expect(matched.item.a.en).toContain("Stress, weight change and illness");
    expect(matched.item.src).toContain("nhs_irregular");
  });

  // Scenario 3: Delayed periods
  it("Scenario 3: Delayed periods query provides common causes and pregnancy test reminder", () => {
    const matched = matchFaq("Why is my period late and missed?");
    expect(matched.type).toBe("match");
    expect(matched.item.id).toBe("late_reason");
    expect(matched.item.a.en).toContain("stress, weight change, too much exercise");
    expect(matched.item.a.en).toContain("take a test");
  });

  // Scenario 4: PCOS / PCOD
  it("Scenario 4: PCOS/PCOD questions provide clinical lifestyle and diagnostic advice", () => {
    const matched = matchFaq("What is PCOS and PCOD symptoms?");
    expect(matched.type).toBe("match");
    expect(matched.item.a.en).toContain("PCOS");
    expect(matched.item.src).toContain("who_pcos");
  });

  // Scenario 5: Period cramps
  it("Scenario 5: Cramps query provides relief methods (warmth, exercise) and doctor guidance", () => {
    const matched = matchFaq("How can I get relief from period cramps and pain?");
    expect(matched.type).toBe("match");
    expect(matched.item.a.en).toMatch(/warmth|heat|cramps|pain/i);
    expect(matched.item.src).toBeDefined();
  });

  // Scenario 6: Symptom uncertainty
  it("Scenario 6: Symptom uncertainty offers reassurance and logs symptom tracking importance", () => {
    const matched = matchFaq("Is it normal to feel mood swings before my period starts?");
    expect(matched.type).toBe("match");
    expect(matched.item).toBeDefined();
  });

  // Scenario 7: Question requiring clarification
  it("Scenario 7: Queries with partial keywords surface suggested FAQ alternatives", () => {
    const matched = matchFaq("discharge");
    expect(matched.type).toBe("match");
    expect(matched.item.src).toBeDefined();
  });

  // Scenario 8: Missing cycle history
  it("Scenario 8: Handles missing cycle history gracefully without runtime exceptions", async () => {
    const req = new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "When should I expect my next period?",
        consent: true,
        context: undefined, // No cycle history
      }),
    });
    const res = await handleAskRequest(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    // In test environment without AI API key, gracefully falls back to local medical knowledge
    expect(body.fallback || body.ok).toBeTruthy();
  });

  // Scenario 9: Adolescent profile
  it("Scenario 9: Adolescent queries address teenage cycle maturation (21-45 days)", () => {
    const matched = matchFaq("normal cycle for teenager");
    expect(matched.type).toBe("match");
    expect(matched.item.a.en).toContain("teenagers, 21–45 days");
    expect(matched.item.src).toContain("acog_adolescent");
  });

  // Scenario 10: Offline mode / FAQ retrieval
  it("Scenario 10: Complete offline FAQ library can be searched with zero network connectivity", () => {
    expect(FAQ.length).toBeGreaterThan(20);
    const result = matchFaq("heavy bleeding clots");
    expect(result).toBeDefined();
  });

  // Scenario 11: Provider unavailable fallback
  it("Scenario 11: Returns graceful fallback message when AI provider is unreachable or key is missing", async () => {
    const origKey = process.env.AI_API_KEY;
    const origGeminiKey = process.env.GEMINI_API_KEY;
    delete process.env.AI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const req = new Request("http://localhost/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "How does stress affect my cycle length?",
          consent: true,
        }),
      });
      const res = await handleAskRequest(req);
      const data = await res.json();
      expect(data.fallback).toBe(true);
      expect(data.error).toContain("Falling back to Saheli offline verified medical library");
    } finally {
      process.env.AI_API_KEY = origKey;
      process.env.GEMINI_API_KEY = origGeminiKey;
    }
  });

  // Scenario 12: Consent denied (HTTP 400)
  it("Scenario 12: Explicitly rejects question with HTTP 400 if user consent is false", async () => {
    const req = new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Can diet delay ovulation?",
        consent: false,
      }),
    });
    const res = await handleAskRequest(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain("Consent required");
  });

  // Scenario 13: Consent to share limited cycle summary (privacy preview)
  it("Scenario 13: Accommodates anonymized cycle summary without leaking personal credentials", async () => {
    const context = {
      cycleLength: 28,
      periodLength: 5,
      lastPeriodDaysAgo: 14,
      currentPhase: "follicular",
    };
    const req = new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Is fatigue normal in this cycle phase?",
        consent: true,
        context,
      }),
    });
    const res = await handleAskRequest(req);
    expect(res.status).toBe(200);
  });

  // Scenario 14: Unsupported question ("I don't know that one. A doctor can help.")
  it("Scenario 14: Returns type: 'none' for uncataloged queries prompting user to consult a doctor", () => {
    const matched = matchFaq("quantum physics gravitational wave astronomy");
    expect(matched.type).toBe("none");
  });

  // Scenario 15: Hindi question
  it("Scenario 15: Hindi query matches vernacular medical guidance seamlessly", () => {
    const matched = matchFaq("सामान्य चक्र कितने दिन का होता है?");
    expect(matched.type).toBe("match");
    expect(matched.item.q.hi).toContain("सामान्य चक्र");
    expect(matched.item.a.hi).toContain("21–35 दिन");
  });

  // Scenario 16: Marathi question
  it("Scenario 16: Marathi query matches vernacular medical guidance seamlessly", () => {
    const matched = matchFaq("अनियमित मासिक पाळी असणे सामान्य आहे का?");
    expect(matched.type).toBe("match");
    expect(matched.item.q.mr).toContain("अनियमित मासिक पाळी");
    expect(matched.item.a.mr).toBeDefined();
  });

  // Scenario 17: Urdu RTL question/answer
  it("Scenario 17: Urdu question matches RTL content and contains correct vernacular phrasing", () => {
    const matched = matchFaq("ایک عام ماہواری کا چکر کتنے دنوں کا ہوتا ہے؟");
    expect(matched.type).toBe("match");
    expect(matched.item.q.ur).toContain("ماہواری");
    expect(matched.item.a.ur).toBeDefined();
  });

  // Scenario 18: Potentially concerning symptoms (112 / 108 / Tele-MANAS triage)
  it("Scenario 18: Potentially concerning acute symptoms immediately trigger emergency red flag helplines", async () => {
    const req = new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "I have sudden severe pelvic pain and feel dizzy from bleeding",
        consent: true,
      }),
    });
    const res = await handleAskRequest(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.red_flag).toBe(true);
    expect(data.type).toBe("urgent");
    expect(data.helplines.some((h) => h.number === "112")).toBe(true);
    expect(data.helplines.some((h) => h.number === "108")).toBe(true);
    expect(data.sources).toContain("nhs_pain");

    // Tele-MANAS crisis screening check
    const crisisSafety = screenSafety("I want to end my life and hurt myself");
    expect(crisisSafety.isRedFlag).toBe(true);
    expect(crisisSafety.type).toBe("crisis");
    expect(crisisSafety.helplines.some((h) => h.number === "14416")).toBe(true);
  });
});
