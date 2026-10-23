/**
 * Saheli Discreet Web Push & Scheduled Reminders Server Handler
 *
 * Safety & Privacy Architecture:
 * 1. Push messages are ALWAYS discreet: no medical terms like "period", "bleeding", or "ovulation"
 *    ever appear on lock screens or notifications, safeguarding users in shared-phone households.
 * 2. Unsubscribe completely removes the push registration.
 */

interface PushSubscriptionRecord {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  discreet: boolean;
  reminderTimes?: string[];
  created_at: string;
}

let subscriptions: PushSubscriptionRecord[] = [];

export function resetPushSubscriptions() {
  subscriptions = [];
}

export async function handlePushRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

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
      subscription?: { endpoint: string; keys?: { p256dh: string; auth: string } };
      discreet?: boolean;
      reminderTimes?: string[];
    };
    if (!subscription || !subscription.endpoint) {
      return new Response(JSON.stringify({ ok: false, error: "Subscription endpoint required" }), {
        status: 400,
      });
    }

    // Upsert subscription
    subscriptions = subscriptions.filter((s) => s.endpoint !== subscription.endpoint);
    subscriptions.push({
      endpoint: subscription.endpoint,
      keys: subscription.keys || { p256dh: "", auth: "" },
      discreet: Boolean(discreet),
      reminderTimes,
      created_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Push notification subscription registered. Notifications will be discreet.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

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

    subscriptions = subscriptions.filter((s) => s.endpoint !== endpoint);

    return new Response(
      JSON.stringify({ ok: true, message: "Subscription removed successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  if (path === "/api/push/test" && method === "POST") {
    return new Response(
      JSON.stringify({
        ok: true,
        notification: {
          title: "Saheli",
          body: "A gentle reminder for you today.",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          data: { url: "/" },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: false, error: "Not found" }), { status: 404 });
}
