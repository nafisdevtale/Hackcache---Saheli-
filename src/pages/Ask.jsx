import { useState } from "react";
import {
  Phone,
  Sparkles,
  BookOpen,
  AlertTriangle,
  ShieldCheck,
  HeartHandshake,
  Search,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  X,
  Stethoscope,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, PageTitle, Sources, inputCls, Chip } from "@/components/common/ui.jsx";
import { SegmentedControl, AiBadge } from "@/components/bloom/index.js";
import { FAQ, SUGGESTED, matchFaq } from "@/content/faq.js";
import { diffDays, todayStr } from "@/lib/localDate.js";
import { AskAssistantArt } from "@/components/brand/SaheliArt.jsx";

export default function Ask() {
  const { t, L, record, prefs } = useApp();
  const [activeTab, setActiveTab] = useState("faq"); // 'faq' | 'ai'
  const [q, setQ] = useState("");
  const [res, setRes] = useState(null);

  // AI Assistant State
  const [aiConsent, setAiConsent] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("saheli_ai_consent") === "true";
    }
    return false;
  });
  const [includeCycleContext, setIncludeCycleContext] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRes, setAiRes] = useState(null);
  const [aiError, setAiError] = useState(null);

  const askFaq = (text) => setRes(matchFaq(text));
  const showItem = (item) => setRes({ type: "match", item, hits: [] });

  const handleConsentAccept = () => {
    setAiConsent(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("saheli_ai_consent", "true");
    }
  };

  const getCycleContext = () => {
    if (!record?.days) return undefined;
    const days = record.days;
    const sortedDates = Object.keys(days)
      .filter((d) => days[d]?.period || (days[d]?.flow && days[d]?.flow !== "none"))
      .sort();
    const lastDate = sortedDates[sortedDates.length - 1];
    const today = todayStr();
    const daysAgo = lastDate ? diffDays(lastDate, today) : undefined;

    return {
      lastPeriodDaysAgo: daysAgo,
    };
  };

  const onAiSubmit = (e) => {
    if (e) e.preventDefault();
    if (!q.trim()) return;

    if (!aiConsent) {
      setAiError(t("ai.consentReq") || "Please review and accept the AI safety consent first.");
      return;
    }

    if (includeCycleContext) {
      setPreviewOpen(true);
    } else {
      executeAskAi(false);
    }
  };

  const executeAskAi = async (withContext) => {
    setPreviewOpen(false);
    setAiLoading(true);
    setAiError(null);
    setAiRes(null);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          consent: true,
          context: withContext ? getCycleContext() : undefined,
          lang: prefs?.lang || "en",
        }),
      });

      const data = await response.json();

      if (!response.ok && !data.fallback) {
        setAiError(data.error || "Unable to reach AI Assistant.");
      } else if (data.fallback) {
        // Graceful fallback to verified offline library
        setAiRes({
          fallback: true,
          error: data.error,
          matched: matchFaq(q),
        });
      } else {
        setAiRes(data);
      }
    } catch {
      // Local fallback on network error
      setAiRes({
        fallback: true,
        error: "Network unavailable. Showing verified offline answer.",
        matched: matchFaq(q),
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {activeTab === "ai" ? t("eeve.title", "Eeve") : t("ask.title")}
            </span>
            {activeTab === "ai" && <AiBadge agent="eeve" />}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {activeTab === "ai" ? t("eeve.title", "Eeve") : t("ask.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeTab === "ai" ? t("eeve.subtitle", "Your Health AI Companion") : t("ask.intro")}
          </p>
        </div>

        {/* Tab Switcher using SegmentedControl */}
        <SegmentedControl
          value={activeTab}
          onChange={setActiveTab}
          options={[
            {
              value: "faq",
              label: t("ai.tabFaq") || "Verified Medical FAQ",
              icon: BookOpen,
            },
            {
              value: "ai",
              label: t("ai.tabAi") || "Eeve (Health AI)",
              icon: Sparkles,
            },
          ]}
        />
      </div>

      {activeTab === "faq" ? (
        /* OFFLINE VERIFIED FAQ MODE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Search & Questions List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bloom-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary-strong">
                <ShieldCheck className="h-4 w-4" />
                <span>Verified Offline Medical Knowledge</span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  askFaq(q);
                }}
                className="space-y-3"
              >
                <div className="relative">
                  <input
                    id="q"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t("ask.ph")}
                    className={`${inputCls} pl-10 pr-10`}
                    maxLength={300}
                  />
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  {q && (
                    <button
                      type="button"
                      onClick={() => setQ("")}
                      className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Btn type="submit" className="w-full">
                  {t("ask.submit")}
                </Btn>
              </form>

              <p className="text-xs text-muted-foreground leading-relaxed">{t("ask.notAi")}</p>
            </div>

            {/* Suggested Common Topics */}
            <div className="bloom-card p-5 space-y-3">
              <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                {t("ask.suggested")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED.map((id) => FAQ.find((f) => f.id === id))
                  .filter(Boolean)
                  .map((f) => (
                    <Chip key={f.id} onClick={() => showItem(f)}>
                      {L(f.q)}
                    </Chip>
                  ))}
              </div>
            </div>

            {/* Full FAQ Library Drawer / Details */}
            <details className="bloom-card p-4">
              <summary className="min-h-11 cursor-pointer font-bold text-sm text-foreground flex items-center justify-between">
                <span>{t("ask.allFaq", { n: FAQ.length })}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {t("ask.browseAnswers", { n: FAQ.length })}
                </span>
              </summary>
              <ul className="mt-3 divide-y divide-border/50 max-h-96 overflow-y-auto pr-1 text-xs">
                {FAQ.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      className="w-full py-2.5 text-left text-foreground hover:text-primary transition-colors flex items-center justify-between group"
                      onClick={() => showItem(f)}
                    >
                      <span className="font-medium pr-2">{L(f.q)}</span>
                      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          </div>

          {/* Right Column: Matched Answer Display or Editorial Guidance */}
          <div className="lg:col-span-7 space-y-4">
            <div aria-live="polite">
              {res?.type === "urgent" && (
                <div className="rounded-3xl border-2 border-urgent/60 bg-urgent-soft/40 p-6 shadow-soft space-y-4">
                  <div className="flex items-center gap-2 text-urgent font-bold text-lg">
                    <AlertTriangle className="h-6 w-6" />
                    <h2>{t("doc.urgentTitle")}</h2>
                  </div>
                  <p className="text-foreground leading-relaxed">{t("doc.urgentNotApp")}</p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <a
                      href="tel:112"
                      className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-urgent px-5 font-bold text-urgent-foreground shadow-sm hover:opacity-95"
                    >
                      <Phone className="h-4 w-4" /> {t("doc.call112")}
                    </a>
                    <a
                      href="tel:108"
                      className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-urgent px-5 font-bold text-urgent-foreground shadow-sm hover:opacity-95"
                    >
                      <Phone className="h-4 w-4" /> {t("doc.call108")}
                    </a>
                  </div>
                  <Sources ids={["nhs_heavy", "nhs_preg_bleeding", "nhs_pain", "india_112"]} />
                </div>
              )}

              {res?.type === "selfharm" && (
                <div className="rounded-3xl border-2 border-urgent/60 bg-urgent-soft/40 p-6 shadow-soft space-y-4">
                  <div className="flex items-center gap-2 text-urgent font-bold text-lg">
                    <HeartHandshake className="h-6 w-6" />
                    <h2>You Are Not Alone</h2>
                  </div>
                  <p className="text-foreground leading-relaxed">{t("ask.selfharm")}</p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <a
                      href="tel:14416"
                      className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-primary px-5 font-bold text-primary-foreground shadow-sm hover:opacity-95"
                    >
                      <Phone className="h-4 w-4" /> Tele-MANAS: 14416
                    </a>
                    <a
                      href="tel:112"
                      className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-urgent px-5 font-bold text-urgent-foreground shadow-sm hover:opacity-95"
                    >
                      <Phone className="h-4 w-4" /> 112
                    </a>
                  </div>
                  <Sources ids={["telemanas", "india_112"]} />
                </div>
              )}

              {res?.type === "none" && (
                <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft space-y-3 text-center">
                  <HelpCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-base font-bold text-foreground">{t("ask.none")}</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Try searching with simpler terms like "cramps", "heavy bleeding", "cycle
                    length", or browse the suggested questions on the left.
                  </p>
                </div>
              )}

              {res?.type === "match" && (
                <div className="rounded-3xl border border-primary/20 bg-card p-6 shadow-soft space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Verified Clinical Answer
                    </span>
                    {res.hits.length > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        {t("ask.matched", { k: res.hits.join(", ") })}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold font-display text-foreground leading-snug">
                    {L(res.item.q)}
                  </h2>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                    {L(res.item.a)}
                  </p>
                  {res.item.concerning && (
                    <div className="rounded-2xl border border-secondary-strong/30 bg-secondary/20 p-3 text-xs text-secondary-strong font-semibold">
                      {t("ask.seekHelp")}
                    </div>
                  )}
                  <div className="pt-2 border-t border-border/50">
                    <Sources ids={res.item.src} />
                  </div>
                </div>
              )}

              {/* Default Featured Question if nothing searched yet */}
              {!res && (
                <div className="rounded-3xl border border-border/70 bg-hero p-6 shadow-soft space-y-4">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Stethoscope className="h-5 w-5" />
                    <span>{t("ask.howToUseFaq")}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Search above or pick any question from the categories. All answers in this
                    section are curated by healthcare professionals and available completely offline
                    without needing an internet connection.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-1">
                      <p className="font-bold text-xs text-foreground">100% Offline & Private</p>
                      <p className="text-[11px] text-muted-foreground">
                        No search queries or reading logs are transmitted outside your phone.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-1">
                      <p className="font-bold text-xs text-foreground">Peer-Reviewed Guidance</p>
                      <p className="text-[11px] text-muted-foreground">
                        Sourced from NHS, WHO, FOGSI, and Ministry of Health (MoHFW) standards.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* AI HEALTH ASSISTANT MODE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Context, Consent & AI Question Box */}
          <div className="lg:col-span-6 space-y-4">
            {!aiConsent ? (
              <div className="bloom-card p-6 space-y-4 border-2 border-primary/30">
                <div className="flex items-center gap-2 text-primary font-bold text-lg">
                  <Sparkles className="h-6 w-6" />
                  <h2>
                    {t("eeve.title", "Eeve")} — {t("eeve.subtitle", "Your Health AI Companion")}
                  </h2>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("ai.consentDesc") ||
                    "Eeve provides supportive, culturally-sensitive menstrual health information powered by Google Gemini. It is an educational tool, NOT a doctor or medical diagnosis system. Emergency red flags and mental health crises are screened locally."}
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-secondary-strong shrink-0 mt-0.5" />
                    <span>
                      {t("ai.privacyNotice") ||
                        "Zero personal identifiers or account credentials are sent to AI servers."}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <span>
                      {t("ai.emergencyNotice") ||
                        "In case of severe acute pain, heavy hemorrhaging, or thoughts of self-harm, deterministic emergency helplines are provided instantly."}
                    </span>
                  </div>
                </div>
                <Btn onClick={handleConsentAccept} className="w-full mt-2">
                  {t("ai.acceptConsent") || "I Understand and Accept"}
                </Btn>
              </div>
            ) : (
              <form onSubmit={onAiSubmit} className="bloom-card p-5 sm:p-6 space-y-4">
                <div>
                  <label htmlFor="ai-q" className="font-bold text-sm block mb-1 text-foreground">
                    {t("ai.inputLabel") || "Ask Eeve (Health Companion)"}
                  </label>
                  <textarea
                    id="ai-q"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={
                      t("ai.inputPlaceholder") ||
                      "e.g., Is it normal to have cramps 3 days before bleeding starts?"
                    }
                    className={`${inputCls} min-h-28 py-3 resize-none`}
                    maxLength={500}
                  />
                </div>

                {/* Optional cycle context toggle (Default OFF) */}
                <label className="flex items-center gap-3 cursor-pointer text-xs p-3 rounded-2xl bg-muted/60 border border-border/50">
                  <input
                    type="checkbox"
                    checked={includeCycleContext}
                    onChange={(e) => setIncludeCycleContext(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-foreground">
                    {t("ai.includeContext") ||
                      "Include my anonymized cycle summary (last period timing only)"}
                  </span>
                </label>

                <Btn
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 min-h-12"
                  disabled={aiLoading || !q.trim()}
                >
                  <Sparkles className="h-4 w-4" />
                  {aiLoading
                    ? t("ai.thinking") || "Consulting medical sources..."
                    : t("ai.askBtn") || "Ask Eeve"}
                </Btn>
              </form>
            )}

            {/* Data Transmission Preview Modal */}
            {previewOpen && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="preview-title"
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
              >
                <div className="w-full max-w-md rounded-3xl bg-card border border-border/80 p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <ShieldCheck className="h-5 w-5" />
                      <h2 id="preview-title">{t("ai.previewTitle")}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(false)}
                      className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("ai.previewDesc")}
                  </p>

                  <div className="rounded-2xl bg-muted/50 p-3.5 border border-border/60 space-y-2 text-xs">
                    <p className="font-bold text-foreground">{t("ai.previewCycleStats")}:</p>
                    <pre className="text-[11px] font-mono bg-background/80 p-2.5 rounded-xl border border-border/40 overflow-x-auto text-foreground">
                      {JSON.stringify(getCycleContext(), null, 2)}
                    </pre>
                    <p className="text-[10px] text-muted-foreground italic">
                      Zero personal identifiers, device tokens, or diary notes are shared.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Btn
                      type="button"
                      onClick={() => executeAskAi(true)}
                      className="w-full min-h-11 font-bold text-xs"
                    >
                      {t("ai.previewConfirm")}
                    </Btn>
                    <Btn
                      type="button"
                      variant="outline"
                      onClick={() => executeAskAi(false)}
                      className="w-full min-h-11 font-bold text-xs"
                    >
                      {t("ai.previewSendWithout")}
                    </Btn>
                    <Btn
                      type="button"
                      variant="ghost"
                      onClick={() => setPreviewOpen(false)}
                      className="w-full text-xs"
                    >
                      {t("common.cancel")}
                    </Btn>
                  </div>
                </div>
              </div>
            )}

            {aiError && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive font-semibold">
                {aiError}
              </div>
            )}
          </div>

          {/* Right Column: AI Response Display or Guidance */}
          <div className="lg:col-span-6 space-y-4">
            <div aria-live="polite">
              {aiRes ? (
                <div className="space-y-4">
                  {/* Crisis helpline card */}
                  {aiRes.type === "crisis" && (
                    <div className="rounded-3xl border-2 border-urgent/60 bg-urgent-soft/40 p-6 shadow-soft space-y-3">
                      <div className="flex items-center gap-2 text-urgent font-bold text-lg">
                        <HeartHandshake className="h-6 w-6" />
                        <span>{t("ai.crisisTitle") || "You Are Not Alone"}</span>
                      </div>
                      <p className="font-medium text-urgent-foreground">{aiRes.answer}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {aiRes.helplines?.map((h) => (
                          <a
                            key={h.number}
                            href={`tel:${h.number.replace(/-/g, "")}`}
                            className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-urgent px-4 font-bold text-urgent-foreground shadow-sm"
                          >
                            <Phone className="h-4 w-4" /> {h.name}: {h.number}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Urgent medical red flag card */}
                  {aiRes.type === "urgent" && (
                    <div className="rounded-3xl border-2 border-urgent/60 bg-urgent-soft/40 p-6 shadow-soft space-y-3">
                      <div className="flex items-center gap-2 text-urgent font-bold text-lg">
                        <AlertTriangle className="h-6 w-6" />
                        <span>{t("doc.urgentTitle")}</span>
                      </div>
                      <p className="font-medium text-urgent-foreground">{aiRes.answer}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <a
                          href="tel:112"
                          className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-urgent px-4 font-bold text-urgent-foreground shadow-sm"
                        >
                          <Phone className="h-4 w-4" /> {t("doc.call112")}
                        </a>
                        <a
                          href="tel:108"
                          className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-urgent px-4 font-bold text-urgent-foreground shadow-sm"
                        >
                          <Phone className="h-4 w-4" /> {t("doc.call108")}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Normal AI Answer */}
                  {!aiRes.red_flag && !aiRes.fallback && (
                    <div className="rounded-3xl border border-primary/20 bg-card p-6 shadow-soft space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/60">
                        <span className="flex items-center gap-1.5 text-primary font-bold">
                          <Sparkles className="h-4 w-4" /> Saheli Health Guidance
                        </span>
                        {includeCycleContext && (
                          <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                            Cycle summary included
                          </span>
                        )}
                      </div>
                      <div className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                        {aiRes.answer}
                      </div>
                      <div className="pt-2 text-xs text-muted-foreground border-t border-border/50">
                        {aiRes.disclaimer}
                      </div>
                    </div>
                  )}

                  {/* Graceful Fallback to Local Verified FAQ */}
                  {aiRes.fallback && (
                    <div className="rounded-3xl border border-warning/40 bg-card p-6 shadow-soft space-y-3">
                      <div className="flex items-center gap-2 text-warning-foreground font-semibold text-sm">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <span>
                          {t("ai.fallbackNotice") ||
                            "AI service offline or unconfigured. Showing matched verified guide from Saheli offline medical library:"}
                        </span>
                      </div>
                      {aiRes.matched?.type === "match" ? (
                        <div className="pt-2 space-y-2">
                          <h3 className="font-bold text-base text-foreground">
                            {L(aiRes.matched.item.q)}
                          </h3>
                          <p className="text-sm text-foreground/90">{L(aiRes.matched.item.a)}</p>
                          <Sources ids={aiRes.matched.item.src} />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{t("ask.none")}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl border border-border/70 bg-hero p-6 shadow-soft space-y-4 text-center sm:text-left flex flex-col sm:flex-row items-center gap-4">
                  <AskAssistantArt className="w-16 h-16 shrink-0" />
                  <div className="space-y-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-primary font-bold text-sm">
                      <Sparkles className="h-4 w-4" />
                      <span>Personalized Health Q&A</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Type any menstrual or adolescent health question. Saheli explains symptoms,
                      timing, and reassurance backed by verified medical references.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
