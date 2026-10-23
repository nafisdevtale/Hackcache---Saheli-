import { describe, it, expect, beforeEach } from "vitest";
import webpush from "web-push";
import {
  handlePushRequest,
  resetPushSubscriptions,
  isVapidConfigured,
  DISCREET_PUSH_PAYLOAD,
} from "../server/api/push";

describe("Saheli Discreet Web Push & Scheduled Reminders", () => {
  beforeEach(() => {
    resetPushSubscriptions();
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_SUBJECT;
  });

  it("fails closed and reports unavailable when VAPID keys are unconfigured", async () => {
    expect(isVapidConfigured()).toBe(false);

    // Status endpoint returns available: false
    const statusRes = await handlePushRequest(new Request("http://localhost/api/push/status"));
    expect(statusRes.status).toBe(200);
    const statusData = await statusRes.json();
    expect(statusData.available).toBe(false);
    expect(statusData.message).toContain("unconfigured on this server");

    // Subscription attempt returns 503 Service Unavailable
    const subRes = await handlePushRequest(
      new Request("http://localhost/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: "https://fcm.googleapis.com/fcm/send/fake-token",
            keys: { p256dh: "key", auth: "auth" },
          },
        }),
      }),
    );
    expect(subRes.status).toBe(503);
    const subData = await subRes.json();
    expect(subData.available).toBe(false);
    expect(subData.error).toContain("VAPID keys");
  });

  it("strictly enforces discreet notification payloads (zero sensitive medical keywords)", () => {
    const payload = JSON.parse(DISCREET_PUSH_PAYLOAD);
    expect(payload.title).toBe("Saheli");
    expect(payload.body).toBe("A gentle reminder for you today.");

    // Verify absence of sensitive medical words
    const sensitiveWords = [
      "period",
      "bleeding",
      "blood",
      "cramp",
      "cramps",
      "ovulation",
      "pcos",
      "pregnancy",
      "pregnant",
      "fertile",
      "menstrual",
    ];

    const bodyLower = payload.body.toLowerCase();
    for (const word of sensitiveWords) {
      expect(bodyLower).not.toContain(word);
    }
  });

  it("validates subscription payload schemas when VAPID is configured", async () => {
    const keys = webpush.generateVAPIDKeys();
    process.env.VAPID_PUBLIC_KEY = keys.publicKey;
    process.env.VAPID_PRIVATE_KEY = keys.privateKey;
    process.env.VAPID_SUBJECT = "mailto:test@saheliapp.in";

    // Invalid endpoint URL
    const invalidRes = await handlePushRequest(
      new Request("http://localhost/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: "not-a-valid-url",
            keys: { p256dh: "key", auth: "auth" },
          },
        }),
      }),
    );
    expect(invalidRes.status).toBe(400);

    // Missing keys
    const missingKeysRes = await handlePushRequest(
      new Request("http://localhost/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: "https://fcm.googleapis.com/send/123",
          },
        }),
      }),
    );
    expect(missingKeysRes.status).toBe(400);

    // Valid subscription registers successfully
    const validRes = await handlePushRequest(
      new Request("http://localhost/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: "https://fcm.googleapis.com/send/valid-token",
            keys: { p256dh: "valid-p256dh-key", auth: "valid-auth-key" },
          },
          discreet: true,
          reminderTimes: ["08:00"],
        }),
      }),
    );
    expect(validRes.status).toBe(200);
    const validData = await validRes.json();
    expect(validData.ok).toBe(true);
  });

  it("supports unsubscription to remove push registrations cleanly", async () => {
    const keys = webpush.generateVAPIDKeys();
    process.env.VAPID_PUBLIC_KEY = keys.publicKey;
    process.env.VAPID_PRIVATE_KEY = keys.privateKey;
    process.env.VAPID_SUBJECT = "mailto:test@saheliapp.in";

    const endpoint = "https://fcm.googleapis.com/send/endpoint-to-remove";

    await handlePushRequest(
      new Request("http://localhost/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint,
            keys: { p256dh: "key", auth: "auth" },
          },
        }),
      }),
    );

    const unsubRes = await handlePushRequest(
      new Request("http://localhost/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      }),
    );
    expect(unsubRes.status).toBe(200);
    const unsubData = await unsubRes.json();
    expect(unsubData.ok).toBe(true);
    expect(unsubData.removed).toBe(1);
  });
});
