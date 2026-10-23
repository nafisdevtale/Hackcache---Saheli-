import { describe, it, expect, beforeEach } from "vitest";
import { screenSafety, handleAskRequest, checkRateLimit } from "../server/api/ai";

describe("Saheli AI Health Assistant & Deterministic Safety Engine", () => {
  // Case 1: Heavy bleeding red flag
  it("Case 1: detects acute heavy bleeding / soaking pads as emergency red flag", () => {
    const res = screenSafety("I am soaking through two or more pads an hour and feel dizzy");
    expect(res.isRedFlag).toBe(true);
    expect(res.type).toBe("urgent");
    expect(res.helplines?.some((h) => h.number === "112")).toBe(true);
    expect(res.helplines?.some((h) => h.number === "108")).toBe(true);
  });

  // Case 2: Sudden severe pelvic pain red flag
  it("Case 2: detects sudden severe pelvic pain as emergency red flag", () => {
    const res = screenSafety("I have sudden severe pelvic pain that came out of nowhere");
    expect(res.isRedFlag).toBe(true);
    expect(res.type).toBe("urgent");
    expect(res.helplines?.some((h) => h.number === "112")).toBe(true);
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
  });

  // Case 5: Crisis / self-harm / suicidal thoughts
  it("Case 5: routes self-harm or suicidal thoughts directly to Tele-MANAS 14416", () => {
    const res = screenSafety("I feel hopeless and want to end my life");
    expect(res.isRedFlag).toBe(true);
    expect(res.type).toBe("crisis");
    expect(res.helplines?.some((h) => h.number === "14416")).toBe(true);
    expect(res.helplines?.some((h) => h.number === "1800-599-0019")).toBe(true);
  });

  // Case 6: Hindi crisis keywords
  it("Case 6: detects Hindi crisis and self-harm keywords", () => {
    const res = screenSafety("मुझे आत्महत्या के विचार आ रहे हैं और बहुत अकेलापन है");
    expect(res.isRedFlag).toBe(true);
    expect(res.type).toBe("crisis");
    expect(res.helplines?.some((h) => h.number === "14416")).toBe(true);
  });

  // Case 7: Normal non-urgent cycle question is not flagged as red flag
  it("Case 7: allows normal cycle length question through to educational guidance", () => {
    const res = screenSafety("How many days is a normal menstrual cycle in adult women?");
    expect(res.isRedFlag).toBe(false);
  });

  // Case 8: Period cramps self-care inquiry
  it("Case 8: allows non-emergency cramps question through", () => {
    const res = screenSafety("What home remedies or warm compresses help with mild day 1 cramps?");
    expect(res.isRedFlag).toBe(false);
  });

  // Case 9: Request handler rejects request if consent is not granted
  it("Case 9: rejects request when consent is false", async () => {
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

  // Case 10: Request handler rejects empty question
  it("Case 10: rejects empty question with HTTP 400", async () => {
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

  // Case 11: Request handler rejects question over 500 characters
  it("Case 11: rejects question exceeding 500 characters", async () => {
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

  // Case 12: Deterministic safety handles red flag directly without needing AI key
  it("Case 12: returns deterministic emergency response without needing AI API key", async () => {
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
  });

  // Case 13: Missing AI API key returns graceful fallback
  it("Case 13: returns graceful fallback when AI API key is not configured", async () => {
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

  // Case 14: Rate limiting enforcement
  it("Case 14: enforces rate limits per client IP", () => {
    const testIp = "test-rate-limit-ip-" + Date.now();
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(testIp, 5, 10000)).toBe(true);
    }
    expect(checkRateLimit(testIp, 5, 10000)).toBe(false);
  });

  // Case 15: Safety screening includes medical disclaimer
  it("Case 15: attaches medical disclaimer to emergency answers", async () => {
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
    expect(body.disclaimer).toContain("Saheli is an educational health information companion");
  });
});
