import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  MessageSquareWarning,
  Send,
  Save,
  Download,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  Image as ImageIcon,
  Clock,
  ChevronRight,
  RefreshCw,
  X,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, Chip, inputCls, cx } from "@/components/common/ui.jsx";
import {
  ISSUE_CATEGORIES,
  SEVERITY_LEVELS,
  loadFeedbackDraft,
  saveFeedbackDraft,
  clearFeedbackDraft,
  submitFeedback,
  getSubmittedReports,
  checkReportStatus,
  exportReportAsText,
} from "@/lib/feedbackClient.js";

export default function Feedback() {
  const { t } = useApp();

  const [formData, setFormData] = useState(() => loadFeedbackDraft());
  const [submissionState, setSubmissionState] = useState("draft"); // "draft" | "sending" | "submitted" | "failed"
  const [submittedReportId, setSubmittedReportId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [reportsList, setReportsList] = useState(() => getSubmittedReports());
  const [checkingStatusId, setCheckingStatusId] = useState(null);
  const [statusMap, setStatusMap] = useState({});

  // Screenshot redaction review modal
  const [previewScreenshot, setPreviewScreenshot] = useState(null);
  const [isRedactorOpen, setIsRedactorOpen] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-save draft on changes
  useEffect(() => {
    if (submissionState === "draft") {
      saveFeedbackDraft(formData);
    }
  }, [formData, submissionState]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(t("feedback.errImageFormat"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert(t("feedback.errImageSize"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result;
      if (typeof dataUrl === "string") {
        setPreviewScreenshot(dataUrl);
        setIsRedactorOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const confirmScreenshot = () => {
    if (canvasRef.current) {
      const redactedDataUrl = canvasRef.current.toDataURL("image/png");
      handleChange("screenshotBase64", redactedDataUrl);
    } else {
      handleChange("screenshotBase64", previewScreenshot);
    }
    setIsRedactorOpen(false);
  };

  const removeScreenshot = () => {
    handleChange("screenshotBase64", null);
    setPreviewScreenshot(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.consent) {
      setErrorMessage(t("feedback.errConsentRequired"));
      return;
    }
    if (!formData.title || formData.title.trim().length < 3) {
      setErrorMessage(t("feedback.errTitleShort"));
      return;
    }
    if (!formData.description || formData.description.trim().length < 10) {
      setErrorMessage(t("feedback.errDescShort"));
      return;
    }

    setSubmissionState("sending");
    setErrorMessage("");

    const res = await submitFeedback(formData);

    if (res.ok) {
      setSubmissionState("submitted");
      setSubmittedReportId(res.reportId);
      setReportsList(getSubmittedReports());
    } else {
      setSubmissionState("failed");
      setErrorMessage(t(res.error) || res.error || t("feedback.errSubmissionFailed"));
    }
  };

  const handleExportText = () => {
    const text = exportReportAsText(formData);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saheli-feedback-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCheckStatus = async (reportId) => {
    setCheckingStatusId(reportId);
    const res = await checkReportStatus(reportId);
    setStatusMap((prev) => ({
      ...prev,
      [reportId]: res.ok ? res.status : "offline",
    }));
    setCheckingStatusId(null);
  };

  // Draw image on canvas for privacy review
  useEffect(() => {
    if (isRedactorOpen && previewScreenshot && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
      };
      img.src = previewScreenshot;
    }
  }, [isRedactorOpen, previewScreenshot]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-border/60 pb-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <MessageSquareWarning className="h-4 w-4" />
          <span>{t("feedback.badge")}</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
          {t("feedback.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
          {t("feedback.subtitle")}
        </p>

        {/* Privacy notice banner */}
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-primary/10 border border-primary/20 p-3.5 text-xs text-foreground">
          <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">{t("feedback.privacyHeading")}: </span>
            <span className="text-muted-foreground">{t("feedback.privacyNotice")}</span>
          </div>
        </div>
      </div>

      {/* Main Submission Card */}
      {submissionState === "submitted" ? (
        <Card className="p-8 text-center space-y-4 border-2 border-primary/40 bg-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{t("feedback.successTitle")}</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {t("feedback.successDesc")}
          </p>
          <div className="inline-flex items-center gap-2 rounded-xl bg-muted px-3 py-1.5 font-mono text-xs font-bold text-foreground">
            <span>Report ID:</span>
            <span>{submittedReportId}</span>
          </div>
          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <Btn
              onClick={() => {
                setFormData(loadFeedbackDraft());
                setSubmissionState("draft");
              }}
              variant="outline"
              size="sm"
            >
              {t("feedback.newReport")}
            </Btn>
            <Link to="/settings" className="inline-flex items-center">
              <Btn variant="primary" size="sm">
                {t("feedback.backSettings")}
              </Btn>
            </Link>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-5 bg-card border border-border/70 shadow-soft rounded-3xl">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {t("feedback.fieldCategory")} *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className={cx(inputCls, "bg-background text-sm font-medium")}
              >
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {t(cat.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Radio Group */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {t("feedback.fieldSeverity")}
              </label>
              <div className="flex flex-wrap gap-2">
                {SEVERITY_LEVELS.map((sev) => {
                  const active = formData.severity === sev.id;
                  return (
                    <button
                      key={sev.id}
                      type="button"
                      onClick={() => handleChange("severity", sev.id)}
                      className={cx(
                        "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all border",
                        active
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-muted/60 text-muted-foreground border-border/60 hover:text-foreground",
                      )}
                    >
                      {t(sev.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("feedback.fieldTitle")} *
              </label>
              <input
                type="text"
                required
                maxLength={150}
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder={t("feedback.placeholderTitle")}
                className={cx(inputCls, "bg-background text-sm")}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("feedback.fieldDesc")} *
              </label>
              <textarea
                required
                rows={4}
                maxLength={3000}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder={t("feedback.placeholderDesc")}
                className={cx(inputCls, "bg-background text-sm leading-relaxed")}
              />
            </div>

            {/* Steps to Reproduce */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("feedback.fieldSteps")}
              </label>
              <textarea
                rows={3}
                maxLength={1000}
                value={formData.stepsToReproduce}
                onChange={(e) => handleChange("stepsToReproduce", e.target.value)}
                placeholder={t("feedback.placeholderSteps")}
                className={cx(inputCls, "bg-background text-sm")}
              />
            </div>

            {/* Expected vs Actual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("feedback.fieldExpected")}
                </label>
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={formData.expectedBehaviour}
                  onChange={(e) => handleChange("expectedBehaviour", e.target.value)}
                  placeholder={t("feedback.placeholderExpected")}
                  className={cx(inputCls, "bg-background text-sm")}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("feedback.fieldActual")}
                </label>
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={formData.actualBehaviour}
                  onChange={(e) => handleChange("actualBehaviour", e.target.value)}
                  placeholder={t("feedback.placeholderActual")}
                  className={cx(inputCls, "bg-background text-sm")}
                />
              </div>
            </div>

            {/* Contact Details (Optional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("feedback.fieldContact")} ({t("common.optional")})
              </label>
              <input
                type="text"
                maxLength={100}
                value={formData.contact}
                onChange={(e) => handleChange("contact", e.target.value)}
                placeholder={t("feedback.placeholderContact")}
                className={cx(inputCls, "bg-background text-sm")}
              />
            </div>

            {/* Screenshot Attachment & Privacy Review */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {t("feedback.fieldScreenshot")} ({t("common.optional")})
              </label>
              {formData.screenshotBase64 ? (
                <div className="flex items-center gap-4 rounded-2xl border border-border/80 bg-muted/40 p-3">
                  <img
                    src={formData.screenshotBase64}
                    alt="Screenshot attachment preview"
                    className="h-16 w-16 rounded-xl object-cover border border-border"
                  />
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-foreground">{t("feedback.screenshotAttached")}</p>
                    <p className="text-muted-foreground">{t("feedback.screenshotReviewed")}</p>
                  </div>
                  <Btn
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeScreenshot}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Btn>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    id="screenshot-file-input"
                  />
                  <label
                    htmlFor="screenshot-file-input"
                    className="inline-flex items-center gap-2 cursor-pointer rounded-2xl border border-border bg-muted/50 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-all"
                  >
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <span>{t("feedback.attachScreenshot")}</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">PNG/JPEG up to 2MB</span>
                </div>
              )}
            </div>

            {/* Error banner if submission failed */}
            {submissionState === "failed" && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{errorMessage}</span>
                </div>
                <p className="text-muted-foreground">{t("feedback.offlineFallbackNotice")}</p>
                <div className="pt-1 flex gap-2">
                  <Btn type="button" variant="outline" size="sm" onClick={handleExportText}>
                    <Download className="h-3.5 w-3.5 me-1" />
                    {t("feedback.exportReport")}
                  </Btn>
                </div>
              </div>
            )}

            {/* Consent Checkbox */}
            <div className="pt-2 border-t border-border/40">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.consent}
                  onChange={(e) => handleChange("consent", e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-xs text-foreground leading-relaxed">
                  {t("feedback.consentLabel")}
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <Btn
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    saveFeedbackDraft(formData);
                    alert(t("feedback.draftSavedAlert"));
                  }}
                >
                  <Save className="h-4 w-4 me-1.5" />
                  {t("feedback.saveDraft")}
                </Btn>
                <Btn type="button" variant="ghost" size="sm" onClick={handleExportText}>
                  <Download className="h-4 w-4 me-1.5" />
                  {t("feedback.exportReport")}
                </Btn>
              </div>

              <Btn
                type="submit"
                variant="primary"
                size="md"
                disabled={submissionState === "sending" || !formData.consent}
                className="min-w-32"
              >
                {submissionState === "sending" ? (
                  <>
                    <RefreshCw className="h-4 w-4 me-2 animate-spin" />
                    {t("feedback.sending")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 me-2" />
                    {t("feedback.submitReport")}
                  </>
                )}
              </Btn>
            </div>
          </Card>
        </form>
      )}

      {/* Screenshot Privacy Review Modal */}
      {isRedactorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-foreground text-sm">
                  {t("feedback.reviewScreenshotTitle")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRedactorOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">{t("feedback.reviewScreenshotDesc")}</p>

            <div className="flex-1 overflow-auto rounded-2xl border border-border bg-muted/40 p-2 flex items-center justify-center min-h-[220px]">
              <canvas ref={canvasRef} className="max-w-full max-h-[50vh] rounded-lg shadow-xs" />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Btn variant="outline" size="sm" onClick={() => setIsRedactorOpen(false)}>
                {t("common.cancel")}
              </Btn>
              <Btn variant="primary" size="sm" onClick={confirmScreenshot}>
                {t("feedback.confirmScreenshot")}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Previously Submitted Reports Section */}
      {reportsList.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-border/60">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("feedback.pastReports")}
          </h2>
          <div className="space-y-2">
            {reportsList.map((rep) => {
              const currentStatus = statusMap[rep.id] || rep.status;
              return (
                <div
                  key={rep.id}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-3.5 text-xs shadow-2xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{rep.title}</span>
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {rep.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(rep.createdAt).toLocaleDateString()} ·{" "}
                      {t(`feedback.cat.${rep.category}`)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={cx(
                        "rounded-full px-2.5 py-0.5 font-bold text-[10px] capitalize",
                        currentStatus === "received"
                          ? "bg-primary/10 text-primary"
                          : currentStatus === "resolved"
                            ? "bg-green-500/15 text-green-600"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {currentStatus}
                    </span>
                    <button
                      type="button"
                      disabled={checkingStatusId === rep.id}
                      onClick={() => handleCheckStatus(rep.id)}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                      title={t("feedback.refreshStatus")}
                    >
                      <RefreshCw
                        className={cx("h-3.5 w-3.5", checkingStatusId === rep.id && "animate-spin")}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
