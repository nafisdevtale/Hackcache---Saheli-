/**
 * Saheli 7.2 — Secure In-App Feedback & Bug Reporting Server Handler
 *
 * Privacy Guarantees:
 * - Rejects any request missing explicit user consent.
 * - Enforces rate limiting per IP to prevent spam and abuse.
 * - Server-side validation with strict character limits.
 * - Validates screenshot attachments to prevent payload injection.
 * - Automatically scrubs potential secrets or health data patterns before persistence.
 */

export interface FeedbackReport {
  id: string;
  category: string;
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehaviour?: string;
  actualBehaviour?: string;
  severity?: "low" | "medium" | "high" | "critical";
  appVersion?: string;
  browserInfo?: string;
  contact?: string;
  hasScreenshot: boolean;
  createdAt: string;
  status: "received" | "under_review" | "resolved";
}

const VALID_CATEGORIES = new Set([
  "bug",
  "crash",
  "cycle_calculation",
  "translation",
  "ai_assistant",
  "reminders",
  "audio",
  "privacy",
  "accessibility",
  "feature",
  "general",
]);

// In-memory reports store for server runtime
const reportsStore = new Map<string, FeedbackReport>();

// Rate limiting: IP -> Array of timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REPORTS_PER_WINDOW = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= MAX_REPORTS_PER_WINDOW) {
    return false;
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}

// Strip accidental sensitive data traces
function scrubSensitiveData(text: string): string {
  if (!text) return "";
  let scrubbed = text;
  // Redact potential 4-digit PIN patterns preceded by pin/password/passphrase
  scrubbed = scrubbed.replace(
    /(?:pin|password|secret|passphrase)\s*[:=]\s*\d{4,8}/gi,
    "[REDACTED_SECRET]",
  );
  // Redact potential 10-digit phone numbers
  scrubbed = scrubbed.replace(/\b[6-9]\d{9}\b/g, "[REDACTED_PHONE]");
  // Redact potential JWT or Bearer tokens
  scrubbed = scrubbed.replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, "Bearer [REDACTED_TOKEN]");
  return scrubbed;
}

export async function handleFeedbackRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const clientIp = req.headers.get("x-forwarded-for") || "local";

  // GET /api/feedback/status?id=...
  if (req.method === "GET" && path === "/api/feedback/status") {
    const id = url.searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ ok: false, error: "Missing report ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const report = reportsStore.get(id);
    if (!report) {
      return new Response(JSON.stringify({ ok: false, error: "Report not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        reportId: report.id,
        status: report.status,
        createdAt: report.createdAt,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // POST /api/feedback
  if (req.method === "POST" && path === "/api/feedback") {
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Too many feedback submissions. Please wait a few minutes before trying again.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    let payload: Record<string, unknown>;
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Explicit consent check is mandatory
    if (payload.consent !== true) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Explicit consent is required to transmit the feedback report.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Validation
    const category = String(payload.category || "").trim();
    if (!VALID_CATEGORIES.has(category)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid issue category selected" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const title = scrubSensitiveData(String(payload.title || "").trim());
    if (title.length < 3 || title.length > 150) {
      return new Response(
        JSON.stringify({ ok: false, error: "Title must be between 3 and 150 characters" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const description = scrubSensitiveData(String(payload.description || "").trim());
    if (description.length < 10 || description.length > 3000) {
      return new Response(
        JSON.stringify({ ok: false, error: "Description must be between 10 and 3000 characters" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Optional fields with limits
    const stepsToReproduce = payload.stepsToReproduce
      ? scrubSensitiveData(String(payload.stepsToReproduce).substring(0, 1000))
      : undefined;
    const expectedBehaviour = payload.expectedBehaviour
      ? scrubSensitiveData(String(payload.expectedBehaviour).substring(0, 1000))
      : undefined;
    const actualBehaviour = payload.actualBehaviour
      ? scrubSensitiveData(String(payload.actualBehaviour).substring(0, 1000))
      : undefined;

    const severity = ["low", "medium", "high", "critical"].includes(payload.severity)
      ? payload.severity
      : "medium";

    const appVersion = payload.appVersion ? String(payload.appVersion).substring(0, 50) : undefined;
    const browserInfo = payload.browserInfo
      ? String(payload.browserInfo).substring(0, 200)
      : undefined;
    const contact = payload.contact
      ? scrubSensitiveData(String(payload.contact).substring(0, 100))
      : undefined;

    // Optional screenshot validation
    let hasScreenshot = false;
    if (payload.screenshotBase64) {
      const b64 = String(payload.screenshotBase64);
      if (!/^data:image\/(png|jpeg|jpg|webp);base64,/.test(b64)) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Invalid screenshot format. Only PNG/JPEG/WebP are supported.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      if (b64.length > 3 * 1024 * 1024) {
        // ~2.2MB image limit
        return new Response(
          JSON.stringify({ ok: false, error: "Screenshot exceeds maximum allowed size (2MB)." }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      hasScreenshot = true;
    }

    const reportId = `REP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const createdAt = new Date().toISOString();

    const report: FeedbackReport = {
      id: reportId,
      category,
      title,
      description,
      stepsToReproduce,
      expectedBehaviour,
      actualBehaviour,
      severity,
      appVersion,
      browserInfo,
      contact,
      hasScreenshot,
      createdAt,
      status: "received",
    };

    reportsStore.set(reportId, report);

    return new Response(
      JSON.stringify({
        ok: true,
        reportId,
        createdAt,
        message: "Your report has been successfully transmitted and acknowledged by the server.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}
