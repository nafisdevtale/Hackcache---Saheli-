/**
 * Saheli 8.0 — DIVA Central Multi-Agent Coordinator Interface
 *
 * "One conversation. Three specialists."
 *
 * Coordinates:
 * - Eeve (Health AI Companion)
 * - FLASH (Personal Essentials Advisor)
 * - INSTINCT (Personal Entertainment Advisor)
 */

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Sparkles,
  Stethoscope,
  ShoppingBag,
  Film,
  Send,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Info,
  CheckCircle2,
  X,
  Play,
  Star,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, cx, inputCls } from "@/components/common/ui.jsx";
import { SegmentedControl, AiBadge } from "@/components/bloom/index.js";
import { AGENT_REGISTRY } from "@/lib/divaRegistry.js";
import { executeDivaRequest } from "@/lib/divaOrchestrator.js";

const SUGGESTED_PROMPTS = [
  {
    label: "Why is my period late and what can I do?",
    agentHint: "eeve",
  },
  {
    label: "Recommend an affordable reusable menstrual cup",
    agentHint: "flash",
  },
  {
    label: "Suggest a heartwarming K-drama to unwind",
    agentHint: "instinct",
  },
  {
    label: "Explain period cramps and suggest an affordable heating pad",
    agentHint: "multi_agent",
  },
  {
    label: "I have cramps. Recommend something relaxing to watch",
    agentHint: "multi_agent",
  },
];

export default function Diva() {
  const { t, prefs } = useApp();

  // Session state (Diva memory is strictly short-lived for current session)
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("auto"); // "auto" | "eeve" | "flash" | "instinct"
  const [isLoading, setIsLoading] = useState(false);
  const [activePrivacyModal, setActivePrivacyModal] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (overrideText = null, overrideAgent = null) => {
    const textToSend = (overrideText || inputValue).trim();
    if (!textToSend || isLoading) return;

    const agentToUse = overrideAgent || selectedAgent;
    const userMsg = {
      id: `msg_${Date.now()}_u`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!overrideText) setInputValue("");
    setIsLoading(true);

    try {
      const response = await executeDivaRequest({
        query: textToSend,
        history: newHistory.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
          agentId: m.agentId,
        })),
        manualAgent: agentToUse,
        locale: prefs?.lang || "en",
      });

      const assistantMsg = {
        id: `msg_${Date.now()}_a`,
        role: "assistant",
        response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_err`,
          role: "assistant",
          error: "Diva encountered a temporary communication glitch. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Diva Header */}
      <div className="bloom-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                  {t("diva.title", "Diva — Your Saheli AI Coordinator")}
                </h1>
                <AiBadge agent="diva" />
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                {t("diva.tagline", "One conversation. Three specialists.")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePrivacyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/60 hover:bg-muted text-xs font-semibold text-muted-foreground transition-all shadow-2xs active:scale-95"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Privacy Firewall</span>
            </button>

            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/60 hover:bg-muted text-xs font-semibold text-muted-foreground transition-all shadow-2xs active:scale-95"
                title="Clear current conversation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Specialist Legend */}
        <div className="pt-3 border-t border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10">
            <Stethoscope className="h-4 w-4 text-primary shrink-0" />
            <span className="font-bold text-foreground">Eeve</span>
            <span className="text-[11px] text-muted-foreground">· Health & Guidance</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
            <ShoppingBag className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="font-bold text-foreground">FLASH</span>
            <span className="text-[11px] text-muted-foreground">· Verified Essentials</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/5 border border-rose-500/10">
            <Film className="h-4 w-4 text-rose-500 shrink-0" />
            <span className="font-bold text-foreground">INSTINCT</span>
            <span className="text-[11px] text-muted-foreground">· Movies & Music</span>
          </div>
        </div>
      </div>

      {/* Specialist Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs font-bold text-muted-foreground shrink-0">Routing:</span>
        {[
          { id: "auto", label: t("diva.mode.auto", "Auto (Diva routes)"), icon: Sparkles },
          { id: "eeve", label: "Eeve (Health)", icon: Stethoscope },
          { id: "flash", label: "FLASH (Essentials)", icon: ShoppingBag },
          { id: "instinct", label: "INSTINCT (Entertainment)", icon: Film },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = selectedAgent === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedAgent(item.id)}
              className={cx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95",
                isSelected
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <Icon className="h-3 w-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conversation Window */}
      <div className="space-y-4 min-h-[350px]">
        {messages.length === 0 ? (
          <div className="p-8 rounded-3xl border border-dashed border-border/80 bg-card/60 text-center space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {t("diva.emptyTitle", "How can Diva coordinate for you today?")}
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                {t(
                  "diva.emptyDesc",
                  "Diva coordinates your health questions (Eeve), menstrual products (FLASH), and relaxation (INSTINCT) under one unified conversation.",
                )}
              </p>
            </div>

            {/* Suggested Prompts */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-xl mx-auto">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt.label)}
                  className="px-3 py-1.5 rounded-full bg-background border border-border/70 hover:border-primary text-xs text-muted-foreground hover:text-foreground transition-all shadow-2xs text-left"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="space-y-3">
              {msg.role === "user" ? (
                /* User Message */
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-4 py-3 text-xs font-medium leading-relaxed rounded-br-none shadow-sm">
                    {msg.content}
                  </div>
                </div>
              ) : (
                /* Assistant / Diva Response */
                <div className="space-y-3">
                  {msg.error ? (
                    <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{msg.error}</span>
                    </div>
                  ) : msg.response?.status === "clarification" ? (
                    /* Clarification View */
                    <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <Bot className="h-4 w-4 text-primary" />
                        <span>Diva needs a quick clarification:</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {msg.response.clarificationPrompt}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.response.options?.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => handleSend(`I want advice from ${opt.id}`, opt.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary hover:text-primary-foreground text-xs font-bold transition-all text-primary"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Specialist Responses */
                    <div className="space-y-4">
                      {msg.response?.agentsInvoked?.map((agentId) => {
                        const result = msg.response.specialistResults[agentId];
                        const agentMeta = AGENT_REGISTRY[agentId];
                        if (!result) return null;

                        return (
                          <div
                            key={agentId}
                            className="p-5 rounded-3xl bg-card border border-border/80 shadow-xs space-y-3 animate-in fade-in"
                          >
                            {/* Specialist Header Badge */}
                            <div className="flex items-center justify-between pb-2 border-b border-border/40">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cx(
                                    "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border",
                                    agentMeta?.accentColor || "bg-muted text-muted-foreground",
                                  )}
                                >
                                  {agentMeta?.displayName} · {agentMeta?.roleName}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {result.status === "success"
                                  ? "✓ Verified response"
                                  : "Offline fallback"}
                              </span>
                            </div>

                            {/* Text Explanation */}
                            <p className="text-xs text-foreground leading-relaxed">{result.text}</p>

                            {/* Specialist Result Cards */}
                            {result.cards && result.cards.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                                {result.cards.map((card, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-1.5 flex flex-col justify-between"
                                  >
                                    {card.type === "product_card" ? (
                                      <>
                                        <div>
                                          <div className="flex items-center justify-between">
                                            <span className="font-bold text-foreground truncate">
                                              {card.name}
                                            </span>
                                            <span className="font-extrabold text-primary">
                                              ₹{card.price}
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-muted-foreground">
                                            {card.brand} • {card.category}
                                          </p>
                                          <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                                            {String(card.unitCost).includes("/")
                                              ? card.unitCost
                                              : `${String(card.unitCost).startsWith("₹") ? "" : "₹"}${card.unitCost} / ${card.unit || "unit"}`}
                                          </p>
                                        </div>
                                        <div className="flex flex-wrap gap-1 pt-1">
                                          {(card.tags || []).slice(0, 2).map((tg) => (
                                            <span
                                              key={tg}
                                              className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground"
                                            >
                                              {tg}
                                            </span>
                                          ))}
                                        </div>
                                      </>
                                    ) : card.type === "media_card" ? (
                                      <>
                                        <div className="flex gap-2.5">
                                          {card.posterUrl && (
                                            <img
                                              src={card.posterUrl}
                                              alt={card.title}
                                              className="h-14 w-10 object-cover rounded-lg shrink-0"
                                            />
                                          )}
                                          <div className="min-w-0 flex-1">
                                            <p className="font-bold text-foreground truncate">
                                              {card.title}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground truncate">
                                              {card.releaseYear || "Verified"} • {card.mediaType}
                                            </p>
                                            {card.rating && (
                                              <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-1">
                                                <Star className="h-2.5 w-2.5 fill-amber-500" />
                                                <span>{card.rating}/10</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 pt-1">
                                          {(card.streamingServices || []).slice(0, 2).map((srv) => (
                                            <span
                                              key={srv}
                                              className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground uppercase font-bold"
                                            >
                                              {srv}
                                            </span>
                                          ))}
                                        </div>
                                      </>
                                    ) : card.type === "emergency_helplines" ? (
                                      <div className="space-y-1">
                                        <p className="font-bold text-destructive">
                                          Emergency Helplines:
                                        </p>
                                        {card.helplines?.map((hl, hIdx) => (
                                          <p key={hIdx} className="text-[11px]">
                                            {hl.name}: <strong>{hl.number}</strong>
                                          </p>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Specialist Sources */}
                            {result.sources && result.sources.length > 0 && (
                              <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1.5 flex-wrap">
                                <strong>Sources:</strong>
                                {result.sources.map((s, sIdx) => (
                                  <span key={sIdx} className="underline">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-card border border-border/70 text-xs text-muted-foreground">
            <Bot className="h-4 w-4 animate-spin text-primary" />
            <span>Diva is coordinating specialists...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="sticky bottom-4 z-20 flex items-center gap-2 bg-card p-2 rounded-2xl border border-border/80 shadow-lg backdrop-blur-xl"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t(
            "diva.placeholder",
            "Ask about your cycle, finding essentials, or movies/music...",
          )}
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 text-xs bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
        />

        <Btn type="submit" size="sm" disabled={isLoading || !inputValue.trim()} className="gap-1.5">
          <Send className="h-3.5 w-3.5" />
          <span>Ask</span>
        </Btn>
      </form>

      {/* Privacy Firewall Modal */}
      {activePrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-card rounded-3xl border border-border p-6 space-y-4 shadow-2xl">
            <button
              onClick={() => setActivePrivacyModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-primary font-bold text-base">
              <ShieldCheck className="h-5 w-5" />
              <h3>Diva Privacy Firewall Guarantees</h3>
            </div>

            <div className="text-xs space-y-2 text-muted-foreground leading-relaxed">
              <p>
                <strong>1. No Unified Surveillance Profile:</strong> Diva coordinates requests in
                memory during the active session. It never writes a merged tracking history across
                health, shopping, and entertainment.
              </p>
              <p>
                <strong>2. Health Isolation:</strong> FLASH (Essentials) and INSTINCT
                (Entertainment) can never read your period dates, symptoms, or health logs.
              </p>
              <p>
                <strong>3. Discrete Specialist Memories:</strong> Eeve, FLASH, and INSTINCT maintain
                strictly separate private storage buckets on your device.
              </p>
            </div>

            <Btn size="sm" onClick={() => setActivePrivacyModal(false)} className="w-full">
              Understood
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
