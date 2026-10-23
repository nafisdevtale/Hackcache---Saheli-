import { useState } from "react";
import {
  Phone,
  Sparkles,
  BookOpen,
  AlertTriangle,
  ShieldCheck,
  HeartHandshake,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, PageTitle, Sources, inputCls, Chip } from "@/components/common/ui.jsx";
import { FAQ, SUGGESTED, matchFaq } from "@/content/faq.js";
import { diffDays, todayStr } from "@/lib/localDate.js";

export default function Ask() {
  const { t, L, record } = useApp();
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
    if (!includeCycleContext || !record?.days) return undefined;
    const days = record.days;
    const sortedDates = Object.keys(days)
      .filter((d) => days[d]?.flow && days[d]?.flow !== "none")
      .sort();
    const lastDate = sortedDates[sortedDates.length - 1];
    const today = todayStr();
    const daysAgo = lastDate ? diffDays(lastDate, today) : undefined;

    return {
      lastPeriodDaysAgo: daysAgo,
    };
  };

  const askAi = async (e) => {
    if (e) e.preventDefault();
    if (!q.trim()) return;

    if (!aiConsent) {
      setAiError(t("ai.consentReq") || "Please review and accept the AI safety consent first.");
      return;
    }

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
          context: getCycleContext(),
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
    <div className="space-y-4">
      <PageTitle sub={t("ask.intro")}>{t("ask.title")}</PageTitle>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setActiveTab("faq")}
          className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "faq"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen aria-hidden className="h-4 w-4" />
          {t("ai.tabFaq") || "Verified FAQ (Offline)"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "ai"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles aria-hidden className="h-4 w-4 text-primary" />
          {t("ai.tabAi") || "AI Assistant"}
        </button>
      </div>

      {activeTab === "faq" ? (
        /* OFFLINE VERIFIED FAQ MODE */
        <div className="space-y-4">
          <p className="rounded-xl bg-muted p-3 text-sm">{t("ask.notAi")}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              askFaq(q);
            }}
            className="space-y-2"
          >
            <label htmlFor="q" className="font-semibold">
              {t("ask.label")}
            </label>
            <input
              id="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("ask.ph")}
              className={inputCls}
              maxLength={300}
            />
            <Btn type="submit" className="w-full">
              {t("ask.submit")}
            </Btn>
          </form>

          <div aria-live="polite">
            {res?.type === "urgent" && (
              <Card className="border-4 border-urgent bg-urgent-soft">
                <h2 className="font-bold text-urgent">{t("doc.urgentTitle")}</h2>
                <p>{t("doc.urgentNotApp")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href="tel:112"
                    className="inline-flex min-h-12 items-center rounded-xl bg-urgent px-4 font-semibold text-urgent-foreground"
                  >
                    {t("doc.call112")}
                  </a>
                  <a
                    href="tel:108"
                    className="inline-flex min-h-12 items-center rounded-xl bg-urgent px-4 font-semibold text-urgent-foreground"
                  >
                    {t("doc.call108")}
                  </a>
                </div>
                <Sources ids={["nhs_heavy", "nhs_preg_bleeding", "nhs_pain", "india_112"]} />
              </Card>
            )}

            {res?.type === "selfharm" && (
              <Card className="border-l-8 border-l-urgent">
                <p>{t("ask.selfharm")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href="tel:14416"
                    className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-4 font-semibold text-primary-foreground"
                  >
                    <Phone aria-hidden className="h-5 w-5" /> 14416
                  </a>
                  <a
                    href="tel:112"
                    className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-urgent px-4 font-semibold text-urgent-foreground"
                  >
                    <Phone aria-hidden className="h-5 w-5" /> 112
                  </a>
                </div>
                <Sources ids={["telemanas", "india_112"]} />
              </Card>
            )}

            {res?.type === "none" && (
              <Card>
                <p className="text-lg font-semibold">{t("ask.none")}</p>
              </Card>
            )}

            {res?.type === "match" && (
              <Card>
                <h2 className="text-lg font-bold">{L(res.item.q)}</h2>
                <p className="mt-1">{L(res.item.a)}</p>
                {res.item.concerning && (
                  <p className="mt-2 rounded-lg bg-secondary p-2 text-secondary-foreground">
                    {t("ask.seekHelp")}
                  </p>
                )}
                {res.hits.length > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("ask.matched", { k: res.hits.join(", ") })}
                  </p>
                )}
                <Sources ids={res.item.src} />
              </Card>
            )}
          </div>

          <section>
            <h2 className="mb-2 font-bold">{t("ask.suggested")}</h2>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map((id) => FAQ.find((f) => f.id === id)).map((f) => (
                <Chip key={f.id} onClick={() => showItem(f)}>
                  {L(f.q)}
                </Chip>
              ))}
            </div>
          </section>

          <details className="rounded-2xl border border-border bg-card p-4">
            <summary className="min-h-12 cursor-pointer font-bold">
              {t("ask.allFaq", { n: FAQ.length })}
            </summary>
            <ul className="mt-2 space-y-1">
              {FAQ.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    className="min-h-12 text-left underline"
                    onClick={() => showItem(f)}
                  >
                    {L(f.q)}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        </div>
      ) : (
        /* AI HEALTH ASSISTANT MODE */
        <div className="space-y-4">
          {!aiConsent ? (
            <Card className="border-2 border-primary/30 bg-primary-soft/20 p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-lg">
                <Sparkles className="h-5 w-5" />
                {t("ai.consentTitle") || "Saheli AI Health Assistant"}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("ai.consentDesc") ||
                  "Saheli AI provides supportive, culturally-sensitive menstrual health information powered by Google Gemini. It is an educational tool, NOT a doctor or medical diagnosis system. Emergency red flags and mental health crises are screened locally."}
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
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
            </Card>
          ) : (
            <form onSubmit={askAi} className="space-y-3">
              <div>
                <label htmlFor="ai-q" className="font-semibold block mb-1">
                  {t("ai.inputLabel") || "Ask Saheli Health Assistant"}
                </label>
                <textarea
                  id="ai-q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={
                    t("ai.inputPlaceholder") ||
                    "e.g., Is it normal to have cramps 3 days before bleeding starts?"
                  }
                  className={`${inputCls} min-h-24 py-2 resize-none`}
                  maxLength={500}
                />
              </div>

              {/* Optional cycle context toggle (Default OFF) */}
              <label className="flex items-center gap-2 cursor-pointer text-sm p-2 rounded-xl bg-muted/60">
                <input
                  type="checkbox"
                  checked={includeCycleContext}
                  onChange={(e) => setIncludeCycleContext(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary"
                />
                <span>
                  {t("ai.includeContext") ||
                    "Include my anonymized cycle summary (last period timing only)"}
                </span>
              </label>

              <Btn
                type="submit"
                className="w-full flex items-center justify-center gap-2"
                disabled={aiLoading || !q.trim()}
              >
                <Sparkles className="h-4 w-4" />
                {aiLoading
                  ? t("ai.thinking") || "Consulting medical sources..."
                  : t("ai.askBtn") || "Ask Assistant"}
              </Btn>
            </form>
          )}

          {aiError && (
            <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive font-semibold">
              {aiError}
            </div>
          )}

          {/* AI Response Display */}
          <div aria-live="polite">
            {aiRes && (
              <div className="space-y-3">
                {/* Crisis helpline card */}
                {aiRes.type === "crisis" && (
                  <Card className="border-4 border-urgent bg-urgent-soft space-y-3">
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
                          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-urgent px-4 font-semibold text-urgent-foreground shadow-sm"
                        >
                          <Phone className="h-4 w-4" /> {h.name}: {h.number}
                        </a>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Urgent medical red flag card */}
                {aiRes.type === "urgent" && (
                  <Card className="border-4 border-urgent bg-urgent-soft space-y-3">
                    <div className="flex items-center gap-2 text-urgent font-bold text-lg">
                      <AlertTriangle className="h-6 w-6" />
                      <span>{t("doc.urgentTitle")}</span>
                    </div>
                    <p className="font-medium text-urgent-foreground">{aiRes.answer}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href="tel:112"
                        className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-urgent px-4 font-semibold text-urgent-foreground shadow-sm"
                      >
                        <Phone className="h-4 w-4" /> {t("doc.call112")}
                      </a>
                      <a
                        href="tel:108"
                        className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-urgent px-4 font-semibold text-urgent-foreground shadow-sm"
                      >
                        <Phone className="h-4 w-4" /> {t("doc.call108")}
                      </a>
                    </div>
                  </Card>
                )}

                {/* Normal AI Answer */}
                {!aiRes.red_flag && !aiRes.fallback && (
                  <Card className="space-y-3 border-2 border-primary/20">
                    <div className="flex items-center justify-between text-xs text-muted-foreground pb-1 border-b border-border">
                      <span className="flex items-center gap-1 text-primary font-semibold">
                        <Sparkles className="h-3.5 w-3.5" /> Saheli Health Guidance
                      </span>
                      {includeCycleContext && (
                        <span className="bg-primary-soft/50 px-2 py-0.5 rounded text-primary">
                          Cycle summary included
                        </span>
                      )}
                    </div>
                    <div className="text-foreground leading-relaxed whitespace-pre-line">
                      {aiRes.answer}
                    </div>
                    <div className="pt-2 text-xs text-muted-foreground border-t border-border">
                      {aiRes.disclaimer}
                    </div>
                  </Card>
                )}

                {/* Graceful Fallback to Local Verified FAQ */}
                {aiRes.fallback && (
                  <Card className="space-y-3 border-2 border-warning/40">
                    <div className="flex items-center gap-2 text-warning-foreground font-semibold text-sm">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span>
                        {t("ai.fallbackNotice") ||
                          "AI service offline or unconfigured. Showing matched verified guide from Saheli offline medical library:"}
                      </span>
                    </div>
                    {aiRes.matched?.type === "match" ? (
                      <div className="pt-2 space-y-1">
                        <h3 className="font-bold text-base">{L(aiRes.matched.item.q)}</h3>
                        <p className="text-sm">{L(aiRes.matched.item.a)}</p>
                        <Sources ids={aiRes.matched.item.src} />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("ask.none")}</p>
                    )}
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
