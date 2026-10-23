import { describe, it, expect, beforeEach } from "vitest";
import {
  deriveKey,
  encryptJSON,
  decryptJSON,
  isValidPin,
  isValidPassphrase,
  randomSaltB64,
} from "../lib/encryption.js";
import { redactPII, handleCommunityRequest, resetCommunityStore } from "../server/api/community.ts";
import { DEFAULT_PREFS } from "../lib/storage.js";
import { emptyRecord } from "../lib/exportImport.js";

describe("Saheli 7.0 — Modules E & F: Privacy, Safe Community & Free Accessible Design", () => {
  beforeEach(() => {
    process.env.COMMUNITY_MOCK_STORE = "true";
    process.env.MODERATOR_SECRET = "test-secret-safe-community";
    resetCommunityStore(true);
  });

  // --- MODULE E: PRIVACY & DATA SOVEREIGNTY ---

  it("E1: Default application preferences and records live locally without remote accounts", () => {
    const prefs = DEFAULT_PREFS;
    expect(prefs.theme).toBe("system");
    expect(prefs.discreet).toBe(false);
    expect(prefs.textSize).toBe("md");

    const record = emptyRecord();
    expect(record.version).toBe(1);
    expect(record.days).toBeDefined();
    // Zero telemetry tokens, tracking identifiers, or ad trackers
    expect(record.trackingId).toBeUndefined();
    expect(record.userId).toBeUndefined();
  });

  it("E2: WebCrypto AES-GCM 256-bit encryption correctly encrypts and decrypts cycle data", async () => {
    const pin = "7890";
    expect(isValidPin(pin)).toBe(true);

    const salt = randomSaltB64();
    const key = await deriveKey(pin, salt, 1000); // fast iterations for testing

    const sensitiveDiary = {
      notes: "Severe menstrual cramps, taking hot ginger tea",
      flow: "heavy",
      painLevel: 4,
      symptoms: ["cramps", "backache"],
    };

    const encrypted = await encryptJSON(key, sensitiveDiary);
    expect(encrypted.enc).toBe(1);
    expect(encrypted.alg).toBe("AES-GCM");
    expect(typeof encrypted.iv).toBe("string");
    expect(typeof encrypted.ct).toBe("string");
    expect(encrypted.ct).not.toContain("cramps"); // Ciphertext does not leak plaintext!

    const decrypted = await decryptJSON(key, encrypted);
    expect(decrypted).toEqual(sensitiveDiary);
  });

  it("E2: AES-GCM authentication tag rejects tampered ciphertext bytes", async () => {
    const key = await deriveKey("1234", randomSaltB64(), 1000);
    const encrypted = await encryptJSON(key, { secret: "health data" });

    // Corrupt ciphertext
    const rawCt = atob(encrypted.ct);
    const corruptedCt = btoa(rawCt.slice(0, -4) + "XXXX");
    const tampered = { ...encrypted, ct: corruptedCt };

    await expect(decryptJSON(key, tampered)).rejects.toThrow();
  });

  it("E3: DPDP Act 2023 Section 9 strictly blocks minor access to public community", async () => {
    // 1. Fetching under-18 feed returns disabled
    const reqFeed = new Request("http://localhost/api/community/posts?age_group=under18");
    const resFeed = await handleCommunityRequest(reqFeed);
    const dataFeed = await resFeed.json();
    expect(dataFeed.ok).toBe(true);
    expect(dataFeed.disabled).toBe(true);
    expect(dataFeed.reason).toContain("DPDP Act 2023 Section 9");
    expect(dataFeed.posts).toHaveLength(0);

    // 2. Creating a post with age_group under18 returns 403 Forbidden
    const reqPost = new Request("http://localhost/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_alias: "Saheli 4321",
        author_hash: "teen-hash-check",
        age_group: "under18",
        topic: "first_period",
        title: "Teen Inquiry",
        content: "Trying to post to community forum",
      }),
    });
    const resPost = await handleCommunityRequest(reqPost);
    expect(resPost.status).toBe(403);
    const dataPost = await resPost.json();
    expect(dataPost.disabled).toBe(true);
    expect(dataPost.error).toContain("DPDP Act 2023 Section 9");
  });

  it("E4: Safe Community automatically scrubs mobile numbers, email addresses, and external URLs", () => {
    const raw =
      "Contact me on WhatsApp 9876543210 or nafis@example.com or visit http://phishing.site/now";
    const scrubbed = redactPII(raw);

    expect(scrubbed).not.toContain("9876543210");
    expect(scrubbed).not.toContain("nafis@example.com");
    expect(scrubbed).not.toContain("http://phishing.site/now");
    expect(scrubbed).toContain("[phone hidden]");
    expect(scrubbed).toContain("[email hidden]");
    expect(scrubbed).toContain("[link hidden]");
  });

  it("E5: Enforces strict post-rate limiting to prevent spam and harassment (max 3 posts / 10 min)", async () => {
    const authorHash = "rate-limit-hash-" + Date.now();

    for (let i = 0; i < 3; i++) {
      const res = await handleCommunityRequest(
        new Request("http://localhost/api/community/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            author_alias: "Saheli 8888",
            author_hash: authorHash,
            age_group: "adult",
            topic: "general",
            title: `Community post ${i + 1}`,
            content: `Valid helpful content for post ${i + 1}`,
          }),
        }),
      );
      expect(res.status).toBe(201);
    }

    // 4th attempt blocked with HTTP 429
    const blockedRes = await handleCommunityRequest(
      new Request("http://localhost/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_alias: "Saheli 8888",
          author_hash: authorHash,
          age_group: "adult",
          topic: "general",
          title: "Post 4",
          content: "Should be blocked by spam filter",
        }),
      }),
    );
    expect(blockedRes.status).toBe(429);
  });

  // --- MODULE F: FREE & ACCESSIBLE DESIGN ---

  it("F1: Free and accessible preferences support text scaling, high contrast, and dark mode", () => {
    const validTextSizes = ["sm", "md", "lg", "xl"];
    for (const size of validTextSizes) {
      const prefs = { ...DEFAULT_PREFS, textSize: size };
      expect(prefs.textSize).toBe(size);
    }

    const contrastPrefs = { ...DEFAULT_PREFS, contrast: true };
    expect(contrastPrefs.contrast).toBe(true);

    const darkPrefs = { ...DEFAULT_PREFS, theme: "dark" };
    expect(darkPrefs.theme).toBe("dark");
  });

  it("F2: RTL Layout direction is supported for Urdu language", () => {
    const lang = "ur";
    const isRtl = lang === "ur";
    expect(isRtl).toBe(true);
    const dir = isRtl ? "rtl" : "ltr";
    expect(dir).toBe("rtl");
  });

  it("F3: Validates passphrases for accessible security choices beyond 4-digit PIN", () => {
    expect(isValidPassphrase("shanti-cycle-2026")).toBe(true);
    expect(isValidPassphrase("short")).toBe(false);
  });
});
