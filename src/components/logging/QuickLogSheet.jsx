import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  X,
  Droplet,
  Check,
  AlertTriangle,
  ArrowUpRight,
  Smile,
  Frown,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { cx } from "@/components/common/ui.jsx";
import { blankDay, validateDay } from "@/lib/exportImport.js";
import { FLOWS, MOODS } from "@/data/symptoms.js";
import { isValidDate } from "@/lib/localDate.js";

const COMMON_SYMPTOMS = [
  "cramps",
  "headache",
  "bloating",
  "tiredness",
  "back_pain",
  "acne",
  "breast_tenderness",
  "nausea",
];

export function QuickLogSheet({ isOpen, onClose, targetDate }) {
  const { t, fmt, record, today, saveDay } = useApp();
  const date = isValidDate(targetDate) && targetDate <= today ? targetDate : today;

  const [form, setForm] = useState(() => ({
    ...blankDay(date),
    ...(record?.days?.[date] || {}),
  }));
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Sync state whenever opened or date changes
  useEffect(() => {
    if (isOpen) {
      setForm({
        ...blankDay(date),
        ...(record?.days?.[date] || {}),
      });
      setSavedSuccess(false);
      setError(null);
    }
  }, [isOpen, date, record]);

  if (!isOpen) return null;

  const quickList =
    record?.settings?.quickLogFavorites?.length > 0
      ? record.settings.quickLogFavorites
      : COMMON_SYMPTOMS;
  const customList = (record?.settings?.customSymptoms || []).filter((c) => !c.retired);

  const toggleSymptom = (sym) => {
    setForm((prev) => {
      const current = prev.symptoms || [];
      const isSelected = current.includes(sym);
      const updated = isSelected ? current.filter((s) => s !== sym) : [...current, sym];
      const newIntensities = { ...(prev.symptomIntensities || {}) };
      if (isSelected) {
        delete newIntensities[sym];
      } else {
        newIntensities[sym] = "moderate";
      }
      return { ...prev, symptoms: updated, symptomIntensities: newIntensities };
    });
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);

    const entry = {
      ...form,
      date,
      flow: form.period ? form.flow || "medium" : null,
      padHourly: form.period && form.flow === "heavy" ? form.padHourly : null,
      bigClots: form.period && form.flow === "heavy" ? form.bigClots : null,
      symptomIntensities: form.symptomIntensities || {},
    };

    const errs = validateDay(entry);
    if (date > today) errs.push("err.future");
    if (errs.length > 0) {
      setError(errs[0]);
      setSaving(false);
      return;
    }

    try {
      await saveDay(entry);
      setSavedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 450);
    } catch {
      setError("log.saveFailed");
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-log-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-border bg-card shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 bg-muted/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <h2 id="quick-log-title" className="font-display text-lg font-bold text-foreground">
                {t("today.loggedToday")}
              </h2>
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              {fmt(date, { weekday: "long", day: "numeric", month: "short" })}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Link
              to="/log"
              search={{ date }}
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
              title={t("log.title")}
            >
              <span>{t("common.more")}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("common.close")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{t(error)}</span>
            </div>
          )}

          {/* 1. Period & Flow Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("log.period")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, period: false, flow: null }))}
                className={cx(
                  "flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 font-semibold text-sm transition-all",
                  !form.period
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border/70 bg-card hover:bg-muted/50 text-muted-foreground",
                )}
              >
                <span>{t("common.no")}</span>
              </button>

              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, period: true, flow: f.flow || "medium" }))}
                className={cx(
                  "flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 font-semibold text-sm transition-all",
                  form.period
                    ? "border-period bg-period/15 text-period shadow-sm font-bold"
                    : "border-border/70 bg-card hover:bg-muted/50 text-muted-foreground",
                )}
              >
                <Droplet className="h-4 w-4 fill-current" />
                <span>{t("common.yes")} (🩸)</span>
              </button>
            </div>

            {/* Flow Intensity Badges if Bleeding */}
            {form.period && (
              <div className="mt-3 space-y-2 rounded-2xl border border-period/30 bg-period/5 p-3.5 animate-fade-in">
                <span className="text-xs font-bold text-period">{t("log.flow")}</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {FLOWS.map((flowKey) => {
                    const isSelected = form.flow === flowKey;
                    return (
                      <button
                        key={flowKey}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, flow: flowKey }))}
                        className={cx(
                          "flex flex-col items-center justify-center rounded-xl py-2 px-1 text-xs font-semibold transition-all",
                          isSelected
                            ? "bg-period text-period-foreground shadow-sm"
                            : "bg-card border border-border/60 hover:bg-period/10 text-foreground",
                        )}
                      >
                        <span className="text-sm">
                          {flowKey === "spotting"
                            ? "💧"
                            : flowKey === "light"
                              ? "🩸"
                              : flowKey === "medium"
                                ? "🩸🩸"
                                : "🩸🩸🩸"}
                        </span>
                        <span className="mt-0.5 text-[11px] leading-tight capitalize">
                          {t(`flow.${flowKey}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Safety Red-flag Prompts for Heavy Flow */}
                {form.flow === "heavy" && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-period/20 text-xs">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!form.padHourly}
                        onChange={(e) => setForm((f) => ({ ...f, padHourly: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 rounded border-border text-period focus:ring-period"
                      />
                      <span className="text-foreground leading-snug">{t("log.padHourly")}</span>
                    </label>

                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!form.bigClots}
                        onChange={(e) => setForm((f) => ({ ...f, bigClots: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 rounded border-border text-period focus:ring-period"
                      />
                      <span className="text-foreground leading-snug">{t("log.bigClots")}</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Pain Intensity Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="quick-pain-slider"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                {t("log.pain")}
              </label>
              <span
                className={cx(
                  "rounded-full px-2.5 py-0.5 text-xs font-bold",
                  form.pain === 0
                    ? "bg-muted text-muted-foreground"
                    : form.pain <= 3
                      ? "bg-primary/20 text-primary"
                      : form.pain <= 6
                        ? "bg-secondary-strong/20 text-secondary-strong"
                        : "bg-destructive/20 text-destructive",
                )}
              >
                {form.pain}/10
              </span>
            </div>
            <input
              id="quick-pain-slider"
              type="range"
              min="0"
              max="10"
              value={form.pain || 0}
              onChange={(e) => setForm((f) => ({ ...f, pain: Number(e.target.value) }))}
              className="h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              <span>0 (None)</span>
              <span>3 (Mild)</span>
              <span>6 (Moderate)</span>
              <span>10 (Severe)</span>
            </div>
          </div>

          {/* 3. Mood Selection Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("log.mood")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((moodKey) => {
                const isSelected = form.mood === moodKey;
                return (
                  <button
                    key={moodKey}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, mood: isSelected ? null : moodKey }))}
                    className={cx(
                      "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                      isSelected
                        ? "bg-secondary text-secondary-foreground ring-2 ring-secondary shadow-sm"
                        : "bg-muted/70 hover:bg-muted text-foreground",
                    )}
                  >
                    <span>{t(`mood.${moodKey}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Common & Favorite Symptoms */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("log.symptoms")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[...quickList, ...customList.map((c) => c.id)].map((symKey) => {
                const isSelected = (form.symptoms || []).includes(symKey);
                const customObj = customList.find((c) => c.id === symKey);
                const label = customObj ? customObj.label : t(`sym.${symKey}`);
                return (
                  <button
                    key={symKey}
                    type="button"
                    onClick={() => toggleSymptom(symKey)}
                    className={cx(
                      "inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-medium transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "bg-card border border-border hover:bg-muted text-foreground",
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Intensity Selector for Active Symptoms in QuickLog */}
            {form.symptoms?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {form.symptoms.map((symId) => {
                  const int = form.symptomIntensities?.[symId] || "moderate";
                  const custom = customList.find((c) => c.id === symId);
                  const label = custom ? custom.label : t(`sym.${symId}`);
                  return (
                    <div
                      key={symId}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-2 py-1 text-[11px]"
                    >
                      <span className="font-semibold text-primary">{label}:</span>
                      {["mild", "moderate", "severe"].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              symptomIntensities: {
                                ...(f.symptomIntensities || {}),
                                [symId]: level,
                              },
                            }))
                          }
                          className={cx(
                            "px-1.5 py-0.5 rounded-md font-bold text-[10px] transition-all",
                            int === level
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {t(`sym.intensity${level.charAt(0).toUpperCase() + level.slice(1)}`)}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border/70 p-4 bg-muted/20 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[46px] rounded-2xl border-2 border-border font-semibold text-sm hover:bg-muted text-foreground transition-all"
          >
            {t("common.cancel")}
          </button>

          <button
            type="button"
            disabled={saving || savedSuccess}
            onClick={handleSave}
            className={cx(
              "flex-[2] min-h-[46px] flex items-center justify-center gap-2 rounded-2xl font-bold text-sm shadow-md transition-all",
              savedSuccess
                ? "bg-accent text-accent-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-98",
            )}
          >
            {savedSuccess ? (
              <>
                <Check className="h-4 w-4" />
                <span>{t("log.saved")}</span>
              </>
            ) : saving ? (
              <span>{t("set.working")}</span>
            ) : (
              <span>{t("log.save")}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
