/**
 * Saheli 7.2 — Feedback & Bug Report Client Service
 *
 * Local-First Privacy Guarantees:
 * - Local draft persistence so users don't lose typed text.
 * - Strips all personal health records, cycle histories, and encryption secrets.
 * - Supports exporting reports as text/JSON for manual offline submission.
 * - Real status tracking with zero fabricated progress or fake success alerts.
 */

const DRAFT_STORAGE_KEY = "saheli_feedback_draft";
const HISTORY_STORAGE_KEY = "saheli_feedback_history";

export const ISSUE_CATEGORIES = [
  { id: "bug", labelKey: "feedback.cat.bug" },
  { id: "crash", labelKey: "feedback.cat.crash" },
  { id: "cycle_calculation", labelKey: "feedback.cat.cycleCalc" },
  { id: "translation", labelKey: "feedback.cat.translation" },
  { id: "ai_assistant", labelKey: "feedback.cat.ai" },
  { id: "reminders", labelKey: "feedback.cat.reminders" },
  { id: "audio", labelKey: "feedback.cat.audio" },
  { id: "privacy", labelKey: "feedback.cat.privacy" },
  { id: "accessibility", labelKey: "feedback.cat.a11y" },
  { id: "feature", labelKey: "feedback.cat.feature" },
  { id: "general", labelKey: "feedback.cat.general" },
];

export const SEVERITY_LEVELS = [
  { id: "low", labelKey: "feedback.sev.low" },
  { id: "medium", labelKey: "feedback.sev.medium" },
  { id: "high", labelKey: "feedback.sev.high" },
  { id: "critical", labelKey: "feedback.sev.critical" },
];

export function loadFeedbackDraft() {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return {
    category: "bug",
    title: "",
    description: "",
    stepsToReproduce: "",
    expectedBehaviour: "",
    actualBehaviour: "",
    severity: "medium",
    contact: "",
    consent: false,
    screenshotBase64: null,
  };
}

export function saveFeedbackDraft(draft) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    }
  } catch {}
}

export function clearFeedbackDraft() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  } catch {}
}

export function getSubmittedReports() {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    }
  } catch {}
  return [];
}

export function saveSubmittedReport(receipt) {
  try {
    if (typeof localStorage !== "undefined") {
      const current = getSubmittedReports();
      const updated = [receipt, ...current].slice(0, 20);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {}
}

/**
 * Privacy Sanitizer: Ensures no sensitive app data or health records are included
 */
export function sanitizeReportPayload(report) {
  return {
    category: report.category,
    title: String(report.title || "").trim(),
    description: String(report.description || "").trim(),
    stepsToReproduce: String(report.stepsToReproduce || "").trim(),
    expectedBehaviour: String(report.expectedBehaviour || "").trim(),
    actualBehaviour: String(report.actualBehaviour || "").trim(),
    severity: report.severity || "medium",
    contact: String(report.contact || "").trim(),
    appVersion: "7.2.0",
    browserInfo:
      typeof navigator !== "undefined"
        ? `${navigator.userAgent.substring(0, 150)}`
        : "Unknown Browser",
    screenshotBase64: report.screenshotBase64 || undefined,
    consent: report.consent === true,
  };
}

/**
 * Submit feedback report to server
 */
export async function submitFeedback(report) {
  if (!report.consent) {
    return { ok: false, error: "feedback.errConsentRequired" };
  }

  const payload = sanitizeReportPayload(report);

  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.ok) {
      const receipt = {
        id: data.reportId,
        title: payload.title,
        category: payload.category,
        createdAt: data.createdAt || new Date().toISOString(),
        status: "received",
      };
      saveSubmittedReport(receipt);
      clearFeedbackDraft();
      return { ok: true, reportId: data.reportId, receipt };
    }

    return {
      ok: false,
      error: data.error || "feedback.errSubmissionFailed",
      canExport: true,
    };
  } catch {
    return {
      ok: false,
      error: "feedback.errNetworkOffline",
      canExport: true,
    };
  }
}

/**
 * Check real status of previously submitted report
 */
export async function checkReportStatus(reportId) {
  try {
    const res = await fetch(`/api/feedback/status?id=${encodeURIComponent(reportId)}`);
    if (!res.ok) return { ok: false, error: "Report not found or server error" };
    const data = await res.json();
    return { ok: true, status: data.status, createdAt: data.createdAt };
  } catch {
    return { ok: false, error: "Unable to reach server" };
  }
}

/**
 * Export report as a clean text file for manual emailing or GitHub issue creation
 */
export function exportReportAsText(report) {
  const payload = sanitizeReportPayload(report);
  return `=== SAHELI BUG REPORT & FEEDBACK ===
Category: ${payload.category}
Severity: ${payload.severity}
Title: ${payload.title}
Date: ${new Date().toISOString()}
App Version: ${payload.appVersion}
Browser: ${payload.browserInfo}

--- DESCRIPTION ---
${payload.description}

--- STEPS TO REPRODUCE ---
${payload.stepsToReproduce || "N/A"}

--- EXPECTED BEHAVIOUR ---
${payload.expectedBehaviour || "N/A"}

--- ACTUAL BEHAVIOUR ---
${payload.actualBehaviour || "N/A"}

--- CONTACT DETAILS ---
${payload.contact || "Anonymous"}

--- PRIVACY CERTIFICATION ---
User has consented to transmission. Health records, cycle dates, and encryption secrets were strictly excluded.
`;
}

// Aliases for convenience & test integration
export const saveDraft = saveFeedbackDraft;
export const loadDraft = loadFeedbackDraft;
export const clearDraft = clearFeedbackDraft;
export const sanitizeFeedbackData = sanitizeReportPayload;
export const formatFeedbackAsText = exportReportAsText;
export const recordSubmittedReport = saveSubmittedReport;
