import { describe, it, expect } from "vitest";
import { screenSafety, handleAskRequest, checkRateLimit } from "../server/api/ai";

describe("Saheli AI Health Assistant & Deterministic Safety Engine", () => {
  // Case 1: Heavy bleeding red flag
  it("Case 1: detects acute heavy bleeding / soaking pads as emergency red flag", () => {
    const res = screenSafety("I am soaking through two or more pads an hour and feel dizzy");
    expect(res.isRedFlag).toBe(true);
    expect(res.type).toBe("urgent");
    expect(res.helplines?.some((h) => h.number === "112")).toBe(true);
    expect(res.helplines?.some((h) => h.number === "108")).toBe(true);
    expect(res.sources).toContain("nhs_heavy");
  });

  // Case 2: Sudden severe pelvic pain red flag
  it("Case 2: detects sudden severe pelvic pain as emergency red flag", () => {
    const res = screenSafety("I have sudden severe pelvic pain that came out of nowhere");
    expect(res.isRedFlag).toBe(true);
    expect(res.type).toBe("urgent");
    expect(res.helplines?.some((h) => h.number === "112")).toBe(true);
    expect(res.sources).toContain("nhs_pain");
  });

  // Case 3: High fever with foul discharge red flag
  it("Case 3: detects high fever and foul-smelling discharge as emergency red flag", () => {
    const res = screenSafety("I have a high fever and foul smelling discharge since yesterday");
    expect(res.isRedFlag).toBe(true);
    expect(res.type).toBe("urgent");
  });

  // Case 4: Pregnancy bleeding / ectopic risk
  it("Case 4: detects pregnancy bleeding or severe pain as emergency red flag", () => {
    const res = screenSafety("I have a positive pregnancy test and heavy bleeding with sharp pain");
    expect(res.isRedFlag).toBe(true);
    expect(res.type).toBe("urgent");
    expect(res.sources).toContain("nhs_preg_bleeding");
  });

  // Case 5: Crisis / self-harm / suicidal thoughts in English
  it("Case 5: routes self-harm or suicidal thoughts directly to Tele-MANAS 14416", () => {
    const res = screenSafety("I feel hopeless and want to end my life");
    expect(res.isRedFlag).toBe(true);
    expect(res.type).toBe("crisis");
    expect(res.helplines?.some((h) => h.number === "14416")).toBe(true);
    expect(res.helplines?.some((h) => h.number === "1800-599-0019")).toBe(true);
    expect(res.sources).toContain("telemanas");
  });

  // Case 6: Hindi crisis keywords
  it("Case 6: detects Hindi crisis and self-harm keywords", () => {
    const res = screenSafety("मुझे आत्महत्या के विचार आ रहे हैं और बहुत अकेलापन है");
    expect(res.isRedFlag).toBe(true);
    expect(res.type).toBe("crisis");
    expect(res.helplines?.some((h) => h.number === "14416")).toBe(true);
  });

  // Case 7: Marathi, Tamil, Telugu, Bengali, Urdu crisis screening
  it("Case 7: detects crisis and red flags across multiple Indian languages", () => {
    // Marathi crisis
    expect(screenSafety("मला स्वतःला इजा करायची आहे").type).toBe("crisis");
    // Tamil crisis
    expect(screenSafety("எனக்கு தற்கொலை எண்ணங்கள் வருகின்றன").type).toBe("crisis");
    // Telugu crisis
    expect(screenSafety("నేను ఆత్మహత్య చేసుకోవాలనుకుంటున్నాను").type).toBe("crisis");
    // Urdu crisis
    expect(screenSafety("مجھے خودکشی کے خیالات آ رہے ہیں").type).toBe("crisis");
    // Bengali red flag
    expect(screenSafety("অতিরিক্ত রক্তক্ষরণ হচ্ছে এবং জ্ঞান হারিয়ে ফেলেছি").isRedFlag).toBe(true);
    // Tamil red flag
    expect(screenSafety("அதிக இரத்தப்போக்கு மற்றும் மயக்கம்").isRedFlag).toBe(true);
  });

  // Case 8: Medication prescription request safety guardrail
  it("Case 8: detects medication requests and refuses unprescribed pharmaceutical dosing", () => {
    const res = screenSafety("Which antibiotic or medicine should I take to stop my period?");
    expect(res.isRedFlag).toBe(false);
    expect(res.type).toBe("medication");
    expect(res.message).toContain("Saheli is an educational companion and does NOT prescribe");
    expect(res.sources).toContain("acog_visit");

    // Hindi medication request
    const hiRes = screenSafety("मुझे पीरियड लाने की दवा बताओ कौन सी गोली खानी चाहिए");
    expect(hiRes.type).toBe("medication");
  });

  // Case 9: Misleading contraception calendar method inquiry
  it("Case 9: detects contraception inquiries and warns against using calendar for family planning", () => {
    const res = screenSafety("What are the safe days to avoid pregnancy without condom?");
    expect(res.isRedFlag).toBe(false);
    expect(res.type).toBe("contraception");
    expect(res.message).toContain("must NEVER be used as a method of contraception");
    expect(res.sources).toContain("who_contraception");
  });

  // Case 10: Normal non-urgent cycle question is not flagged as red flag
  it("Case 10: allows normal cycle length question through to educational guidance", () => {
    const res = screenSafety("How many days is a normal menstrual cycle in adult women?");
    expect(res.isRedFlag).toBe(false);
    expect(res.type).toBeUndefined();
  });

  // Case 11: Request handler rejects request if consent is not granted
  it("Case 11: rejects request when consent is false", async () => {
    const req = new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Is 28 days normal?", consent: false }),
    });
    const res = await handleAskRequest(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain("Consent required");
  });

  // Case 12: Request handler rejects empty question
  it("Case 12: rejects empty question with HTTP 400", async () => {
    const req = new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "   ", consent: true }),
    });
    const res = await handleAskRequest(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  // Case 13: Request handler rejects question over 500 characters
  it("Case 13: rejects question exceeding 500 characters", async () => {
    const req = new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "a".repeat(501), consent: true }),
    });
    const res = await handleAskRequest(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain("maximum 500 characters");
  });

  // Case 14: Deterministic safety handles red flag directly without needing AI key
  it("Case 14: returns deterministic emergency response without needing AI API key", async () => {
    const req = new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "sudden severe pelvic pain",
        consent: true,
      }),
    });
    const res = await handleAskRequest(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.red_flag).toBe(true);
    expect(body.source).toBe("deterministic_safety");
    expect(body.helplines).toBeDefined();
    expect(body.sources).toBeDefined();
  });

  // Case 15: Missing AI API key returns graceful fallback
  it("Case 15: returns graceful fallback when AI API key is not configured", async () => {
    const origKey = process.env.AI_API_KEY;
    const origGeminiKey = process.env.GEMINI_API_KEY;
    delete process.env.AI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const req = new Request("http://localhost/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "How long is a normal cycle?",
          consent: true,
        }),
      });
      const res = await handleAskRequest(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.fallback).toBe(true);
      expect(body.error).toContain("AI provider is not configured");
    } finally {
      process.env.AI_API_KEY = origKey;
      process.env.GEMINI_API_KEY = origGeminiKey;
    }
  });

  // Case 16: Rate limiting enforcement
  it("Case 16: enforces rate limits per client IP", () => {
    const testIp = "test-rate-limit-ip-" + Date.now();
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(testIp, 5, 10000)).toBe(true);
    }
    expect(checkRateLimit(testIp, 5, 10000)).toBe(false);
  });

  // Case 17: Disclaimer notes that automated screening is a supportive filter
  it("Case 17: disclaimer notes that automated keyword screening is a safety filter", async () => {
    const req = new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "fever with bad smelling discharge",
        consent: true,
      }),
    });
    const res = await handleAskRequest(req);
    const body = await res.json();
    expect(body.disclaimer).toContain("Automated keyword screening is an assistive safety filter");
  });
});
