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
import { Sources, inputCls, cx } from "@/components/common/ui.jsx";
import {
  NovaHeading,
  NovaText,
  NovaButton,
  NovaCard,
  NovaBadge,
  NovaPageHeader,
  NovaSegmented,
  NovaChip,
  NovaAgentBadge,
  NovaDialog,
} from "@/components/nova";
import { FAQ, SUGGESTED, matchFaq } from "@/content/faq.js";
import { diffDays, todayStr } from "@/lib/localDate.js";
import { pick } from "@/i18n/index.js";

export default function Ask() {
  const { t, L: appL, record, prefs } = useApp();
  const L = appL || ((o) => pick(prefs?.lang || "en", o));
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
    <div className="space-y-6 pb-12 animate-fade-in max-w-5xl mx-auto">
      {/* Header & Mode Switcher */}
      <NovaPageHeader
        tag={activeTab === "ai" ? t("eeve.title", "Eeve") : t("ask.title")}
        title={activeTab === "ai" ? t("eeve.title", "Eeve") : t("ask.title")}
        subtitle={
          activeTab === "ai" ? t("eeve.subtitle", "Your Health AI Companion") : t("ask.intro")
        }
        action={
          <div className="flex items-center gap-3">
            {activeTab === "ai" && <NovaAgentBadge agent="eeve" />}
            <NovaSegmented
              value={activeTab}
              onChange={setActiveTab}
              options={[
                {
                  value: "faq",
                  label: t("ai.tabFaq") || "Verified Medical FAQ",
                },
                {
                  value: "ai",
                  label: t("ai.tabAi") || "Eeve (Health AI)",
                },
              ]}
            />
          </div>
        }
      />

      {activeTab === "faq" ? (
        /* OFFLINE VERIFIED FAQ MODE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Search & Questions List */}
          <div className="lg:col-span-5 space-y-4">
            <NovaCard variant="elevated" className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary-strong">
                <ShieldCheck className="h-4 w-4" />
                <span>
                  {t("ask.verifiedOfflineKnowledge") || "Verified Offline Medical Knowledge"}
                </span>
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
                      className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <NovaButton type="submit" variant="primary" className="w-full justify-center">
                  {t("ask.submit")}
                </NovaButton>
              </form>

              <NovaText variant="muted" size="xs">
                {t("ask.notAi")}
              </NovaText>
            </NovaCard>

            {/* Suggested Common Topics */}
            <NovaCard variant="elevated" className="p-5 space-y-3">
              <NovaHeading
                level={4}
                className="text-xs uppercase tracking-wider text-muted-foreground"
              >
                {t("ask.suggested")}
              </NovaHeading>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED.map((id) => FAQ.find((f) => f.id === id))
                  .filter(Boolean)
                  .map((f) => (
                    <NovaChip key={f.id} onClick={() => showItem(f)}>
                      {L(f.q)}
                    </NovaChip>
                  ))}
              </div>
            </NovaCard>

            {/* Full FAQ Library Drawer / Details */}
            <details className="nova-card-elevated p-4">
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
                      className="w-full py-2.5 text-left text-foreground hover:text-primary transition-colors flex items-center justify-between group cursor-pointer"
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

          {/* Right Column: Matched Answer Display or Guidance */}
          <div className="lg:col-span-7 space-y-4">
            <div aria-live="polite">
              {res?.type === "urgent" && (
                <div className="rounded-3xl border-2 border-urgent/60 bg-urgent-soft/40 p-6 shadow-soft space-y-4">
                  <div className="flex items-center gap-2 text-urgent font-bold text-lg">
                    <AlertTriangle className="h-6 w-6" />
                    <NovaHeading level={2} className="text-urgent">
                      {t("doc.urgentTitle")}
                    </NovaHeading>
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
                    <NovaHeading level={2} className="text-urgent">
                      You Are Not Alone
                    </NovaHeading>
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
                <NovaCard variant="elevated" className="p-6 space-y-3 text-center">
                  <HelpCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                  <NovaHeading level={3} className="text-base">
                    {t("ask.none")}
                  </NovaHeading>
                  <NovaText variant="muted" size="xs" className="max-w-md mx-auto">
                    Try searching with simpler terms like "cramps", "heavy bleeding", "cycle
                    length", or browse the suggested questions on the left.
                  </NovaText>
                </NovaCard>
              )}

              {res?.type === "match" && (
                <NovaCard variant="elevated" className="p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <NovaBadge variant="primary" size="sm">
                      Verified Clinical Answer
                    </NovaBadge>
                    {res.hits.length > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        {t("ask.matched", { k: res.hits.join(", ") })}
                      </span>
                    )}
                  </div>
                  <NovaHeading level={2} className="text-xl leading-snug">
                    {L(res.item.q)}
                  </NovaHeading>
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
                </NovaCard>
              )}

              {/* Default Featured Question if nothing searched yet */}
              {!res && (
                <NovaCard variant="elevated" className="p-6 space-y-4 bg-hero">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Stethoscope className="h-5 w-5" />
                    <span>{t("ask.howToUseFaq")}</span>
                  </div>
                  <NovaText variant="muted" size="sm" className="leading-relaxed">
                    Search above or pick any question from the categories. All answers in this
                    section are curated by healthcare professionals and available completely offline
                    without needing an internet connection.
                  </NovaText>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <NovaCard variant="subtle" className="p-4 space-y-1">
                      <p className="font-bold text-xs text-foreground">100% Offline & Private</p>
                      <NovaText variant="muted" size="xs">
                        No search queries or reading logs are transmitted outside your phone.
                      </NovaText>
                    </NovaCard>
                    <NovaCard variant="subtle" className="p-4 space-y-1">
                      <p className="font-bold text-xs text-foreground">Peer-Reviewed Guidance</p>
                      <NovaText variant="muted" size="xs">
                        Sourced from NHS, WHO, FOGSI, and Ministry of Health (MoHFW) standards.
                      </NovaText>
                    </NovaCard>
                  </div>
                </NovaCard>
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
              <NovaCard variant="elevated" className="p-6 space-y-4 border-2 border-primary/30">
                <div className="flex items-center gap-2 text-primary font-bold text-lg">
                  <Sparkles className="h-6 w-6" />
                  <NovaHeading level={2} className="text-lg">
                    {t("eeve.title", "Eeve")} — {t("eeve.subtitle", "Your Health AI Companion")}
                  </NovaHeading>
                </div>
                <NovaText variant="muted" size="sm" className="leading-relaxed">
                  {t("ai.consentDesc") ||
                    "Eeve provides supportive, culturally-sensitive menstrual health information powered by Google Gemini. It is an educational tool, NOT a doctor or medical diagnosis system. Emergency red flags and mental health crises are screened locally."}
                </NovaText>
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
                <NovaButton
                  variant="primary"
                  onClick={handleConsentAccept}
                  className="w-full justify-center mt-2"
                >
                  {t("ai.acceptConsent") || "I Understand and Accept"}
                </NovaButton>
              </NovaCard>
            ) : (
              <form onSubmit={onAiSubmit} className="nova-card-elevated p-5 sm:p-6 space-y-4">
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
                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  />
                  <span className="text-foreground">
                    {t("ai.includeContext") ||
                      "Include my anonymized cycle summary (last period timing only)"}
                  </span>
                </label>

                <NovaButton
                  type="submit"
                  variant="primary"
                  className="w-full justify-center min-h-12"
                  disabled={aiLoading || !q.trim()}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  {aiLoading
                    ? t("ai.thinking") || "Consulting medical sources..."
                    : t("ai.askBtn") || "Ask Eeve"}
                </NovaButton>
              </form>
            )}

            {/* Data Transmission Preview Modal */}
            <NovaDialog
              open={previewOpen}
              onClose={() => setPreviewOpen(false)}
              title={t("ai.previewTitle")}
              description={t("ai.previewDesc")}
              footer={
                <div className="flex flex-col gap-2 w-full">
                  <NovaButton
                    type="button"
                    variant="primary"
                    onClick={() => executeAskAi(true)}
                    className="w-full justify-center min-h-11"
                  >
                    {t("ai.previewConfirm")}
                  </NovaButton>
                  <NovaButton
                    type="button"
                    variant="outline"
                    onClick={() => executeAskAi(false)}
                    className="w-full justify-center min-h-11"
                  >
                    {t("ai.previewSendWithout")}
                  </NovaButton>
                  <NovaButton
                    type="button"
                    variant="ghost"
                    onClick={() => setPreviewOpen(false)}
                    className="w-full justify-center"
                  >
                    {t("common.cancel")}
                  </NovaButton>
                </div>
              }
            >
              <div className="rounded-2xl bg-muted/50 p-3.5 border border-border/60 space-y-2 text-xs">
                <p className="font-bold text-foreground">{t("ai.previewCycleStats")}:</p>
                <pre className="text-[11px] font-mono bg-background/80 p-2.5 rounded-xl border border-border/40 overflow-x-auto text-foreground">
                  {JSON.stringify(getCycleContext(), null, 2)}
                </pre>
                <p className="text-[10px] text-muted-foreground italic">
                  Zero personal identifiers, device tokens, or diary notes are shared.
                </p>
              </div>
            </NovaDialog>

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

                  {/* Fallback to offline notice */}
                  {aiRes.fallback && (
                    <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-xs text-foreground space-y-1">
                      <p className="font-bold text-warning flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4" />
                        Verified Offline Fallback Active
                      </p>
                      <p className="text-muted-foreground">
                        {aiRes.error ||
                          "Showing response from peer-reviewed offline clinical library."}
                      </p>
                    </div>
                  )}

                  {/* Normal AI Answer or Matched fallback answer */}
                  <NovaCard variant="elevated" className="p-6 space-y-4 border-primary/20">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <NovaBadge variant="primary" size="sm">
                        {aiRes.fallback ? "Clinical Library Match" : "Eeve AI Guidance"}
                      </NovaBadge>
                      <span className="text-[10px] text-muted-foreground">
                        Educational Guidance
                      </span>
                    </div>

                    <div className="text-sm leading-relaxed text-foreground space-y-3 whitespace-pre-line">
                      {aiRes.fallback && aiRes.matched?.item
                        ? L(aiRes.matched.item.a)
                        : aiRes.answer}
                    </div>

                    {/* Safety notice & Sources */}
                    <div className="pt-3 border-t border-border/50 text-xs text-muted-foreground space-y-2">
                      <p className="italic">
                        {aiRes.fallback
                          ? "Sourced from peer-reviewed medical guidance."
                          : "AI responses should not replace professional medical diagnosis."}
                      </p>
                      {aiRes.sources && <Sources ids={aiRes.sources} />}
                      {aiRes.fallback && aiRes.matched?.item?.src && (
                        <Sources ids={aiRes.matched.item.src} />
                      )}
                    </div>
                  </NovaCard>
                </div>
              ) : (
                /* Empty state / Welcome prompt */
                <NovaCard variant="elevated" className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <NovaHeading level={3} className="text-base">
                    How can Eeve support you today?
                  </NovaHeading>
                  <NovaText variant="muted" size="xs" className="max-w-md mx-auto leading-relaxed">
                    Ask questions about cycle length, premenstrual symptoms, hygiene practices, or
                    contraception. Eeve provides empathetic, medically-grounded explanations.
                  </NovaText>
                </NovaCard>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
