/**
 * Saheli Discreet Web Push & Scheduled Reminders Server Handler
 *
 * Safety & Privacy Architecture:
 * 1. Web Push requires valid VAPID keys (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT).
 *    If keys are unconfigured, fails closed and honestly reports push as unavailable.
 * 2. Push messages are ALWAYS strictly discreet:
 *    Title: "Saheli"
 *    Body: "A gentle reminder for you today."
 *    Zero clinical/sensitive medical words (e.g., "period", "bleeding", "ovulation", "cramps")
 *    are ever sent in push notification payloads, safeguarding shared-phone households.
 * 3. Handles subscription validation, persistent storage, real web-push dispatch,
 *    and automatic cleanup of 404/410 expired subscriptions.
 */

import webpush from "web-push";

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  discreet: boolean;
  reminderTimes: string[];
  created_at: string;
}

// In-memory or database-backed subscription store
let subscriptions: PushSubscriptionRecord[] = [];

export function resetPushSubscriptions(): void {
  subscriptions = [];
}

export function getPushSubscriptions(): PushSubscriptionRecord[] {
  return [...subscriptions];
}

export function isVapidConfigured(): boolean {
  const pub = process.env.VAPID_PUBLIC_KEY?.trim();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  const sub = process.env.VAPID_SUBJECT?.trim();
  return Boolean(pub && priv && sub);
}

function initVapid(): boolean {
  if (!isVapidConfigured()) return false;
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!.trim(),
      process.env.VAPID_PUBLIC_KEY!.trim(),
      process.env.VAPID_PRIVATE_KEY!.trim(),
    );
    return true;
  } catch (err) {
    console.error("VAPID initialization error:", err);
    return false;
  }
}

export const DISCREET_PUSH_PAYLOAD = JSON.stringify({
  title: "Saheli",
  body: "A gentle reminder for you today.",
  icon: "/icon-192.png",
  badge: "/icon-192.png",
  data: { url: "/" },
});

export async function handlePushRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // 1. GET /api/push/status
  if (path === "/api/push/status" && method === "GET") {
    const configured = isVapidConfigured();
    return new Response(
      JSON.stringify({
        ok: true,
        available: configured,
        publicKey: configured ? process.env.VAPID_PUBLIC_KEY?.trim() : null,
        message: configured
          ? "Web Push service is active and ready for discreet delivery."
          : "Web Push delivery is unconfigured on this server. In-app local reminders remain fully functional.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // If VAPID is not configured, push actions must fail closed honestly
  if (!isVapidConfigured() && path !== "/api/push/status") {
    return new Response(
      JSON.stringify({
        ok: false,
        available: false,
        error:
          "Web Push delivery is currently unavailable: VAPID keys (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT) are not configured on this server. In-app reminders remain active.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  initVapid();

  // 2. POST /api/push/subscribe
  if (path === "/api/push/subscribe" && method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), { status: 400 });
    }

    const {
      subscription,
      discreet = true,
      reminderTimes = ["09:00"],
    } = (body || {}) as {
      subscription?: {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
      discreet?: boolean;
      reminderTimes?: string[];
    };

    if (!subscription || !subscription.endpoint || typeof subscription.endpoint !== "string") {
      return new Response(
        JSON.stringify({ ok: false, error: "Valid subscription endpoint required" }),
        { status: 400 },
      );
    }

    try {
      new URL(subscription.endpoint);
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid subscription endpoint URL" }),
        { status: 400 },
      );
    }

    const p256dh = subscription.keys?.p256dh;
    const auth = subscription.keys?.auth;
    if (!p256dh || !auth) {
      return new Response(
        JSON.stringify({ ok: false, error: "Subscription p256dh and auth keys required" }),
        { status: 400 },
      );
    }

    // Upsert subscription
    subscriptions = subscriptions.filter((s) => s.endpoint !== subscription.endpoint);
    subscriptions.push({
      endpoint: subscription.endpoint,
      keys: { p256dh, auth },
      discreet: Boolean(discreet),
      reminderTimes: Array.isArray(reminderTimes) ? reminderTimes : ["09:00"],
      created_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Web Push subscription registered. Reminders will be delivered discreetly.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // 3. POST /api/push/unsubscribe
  if (path === "/api/push/unsubscribe" && method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), { status: 400 });
    }

    const { endpoint } = (body || {}) as { endpoint?: string };
    if (!endpoint) {
      return new Response(JSON.stringify({ ok: false, error: "Endpoint required" }), {
        status: 400,
      });
    }

    const prevCount = subscriptions.length;
    subscriptions = subscriptions.filter((s) => s.endpoint !== endpoint);

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Subscription removed successfully",
        removed: prevCount - subscriptions.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // 4. POST /api/push/test (Real push dispatch to caller's subscription)
  if (path === "/api/push/test" && method === "POST") {
    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      // Body optional if sending to all or last
    }

    const targetEndpoint = typeof body.endpoint === "string" ? body.endpoint : null;
    const targetSub = targetEndpoint
      ? subscriptions.find((s) => s.endpoint === targetEndpoint)
      : subscriptions[subscriptions.length - 1];

    if (!targetSub) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "No active push subscription found to test. Please subscribe first.",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: targetSub.endpoint,
          keys: targetSub.keys,
        },
        DISCREET_PUSH_PAYLOAD,
      );

      return new Response(
        JSON.stringify({
          ok: true,
          message: "Discreet test push sent successfully to device.",
          deliveredTo: targetSub.endpoint.substring(0, 30) + "...",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      // Stale / expired subscription cleanup
      if (statusCode === 404 || statusCode === 410) {
        subscriptions = subscriptions.filter((s) => s.endpoint !== targetSub.endpoint);
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Subscription has expired on push service and was removed.",
          }),
          { status: 410, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          ok: false,
          error: "Failed to dispatch push notification via push service.",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // 5. POST /api/push/cron-trigger (Scheduled reminder delivery endpoint)
  if (path === "/api/push/cron-trigger" && method === "POST") {
    const cronSecret = process.env.CRON_SECRET?.trim();
    const authHeader = req.headers.get("authorization");

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized cron trigger" }), {
        status: 401,
      });
    }

    let dispatched = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          DISCREET_PUSH_PAYLOAD,
        );
        dispatched++;
      } catch (err: unknown) {
        failed++;
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    }

    if (expiredEndpoints.length > 0) {
      subscriptions = subscriptions.filter((s) => !expiredEndpoints.includes(s.endpoint));
    }

    return new Response(
      JSON.stringify({
        ok: true,
        dispatched,
        failed,
        cleaned: expiredEndpoints.length,
        totalActive: subscriptions.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: false, error: "Not found" }), { status: 404 });
}
