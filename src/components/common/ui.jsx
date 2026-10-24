import { useState } from "react";
import { ExternalLink, Volume2, Square } from "lucide-react";
import { useApp } from "@/App.jsx";
import { SOURCES } from "@/content/sources.js";
import { loc } from "@/lib/localDate.js";

export const cx = (...a) => a.filter(Boolean).join(" ");

export function Btn({ variant = "primary", className, ...p }) {
  const v =
    {
      primary:
        "bg-primary text-primary-foreground hover:bg-primary/95 shadow-bloom-subtle border border-primary/20 active:scale-[0.98] tactile-press",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/85 active:scale-[0.98] border border-border/60 tactile-press",
      outline:
        "border border-border bg-card text-foreground hover:bg-muted/60 active:scale-[0.98] tactile-press shadow-2xs",
      danger:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] tactile-press shadow-bloom-subtle border border-destructive/20",
      ghost:
        "text-foreground hover:bg-muted/60 active:scale-[0.98] tactile-press border border-transparent",
    }[variant] || "";

  return (
    <button
      type="button"
      className={cx(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        v,
        className,
      )}
      {...p}
    />
  );
}

export function Card({ className, ...p }) {
  return (
    <section
      className={cx(
        "bloom-card p-5 sm:p-6 text-card-foreground shadow-bloom-card transition-all",
        className,
      )}
      {...p}
    />
  );
}

export function PageTitle({ children, sub, tag }) {
  return (
    <header className="mb-6 space-y-1.5">
      {tag && (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-primary/10 text-primary border border-primary/20">
          {tag}
        </span>
      )}
      <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-snug">
        {children}
      </h1>
      {sub && <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{sub}</p>}
    </header>
  );
}

export function Toggle({ checked, onChange, label, desc, disabled }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 py-2 select-none">
      <span className="space-y-0.5 text-start">
        <span className="block font-bold text-xs sm:text-sm text-foreground">{label}</span>
        {desc && (
          <span className="block text-xs text-muted-foreground leading-relaxed">{desc}</span>
        )}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="switch h-6 w-11 accent-primary rounded-full cursor-pointer shrink-0"
        checked={!!checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function Chip({ selected, onClick, children, icon: Icon, label, className }) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      onClick={onClick}
      aria-label={label}
      className={cx(
        "inline-flex min-h-[44px] items-center gap-2 rounded-2xl border px-3.5 py-2 text-start text-xs font-semibold transition-all cursor-pointer tactile-press select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary/40 bg-primary/15 text-primary shadow-xs font-bold ring-1 ring-primary/20"
          : "border-border/80 bg-card text-foreground hover:bg-muted/70 shadow-2xs",
        className,
      )}
    >
      {Icon && <Icon aria-hidden className="h-4 w-4 shrink-0" />}
      <span className="leading-normal">{children}</span>
      {selected && (
        <span aria-hidden className="text-xs font-bold ms-auto">
          ✓
        </span>
      )}
    </button>
  );
}

export function Sources({ ids }) {
  const { t } = useApp();
  const list = [...new Set(ids)].filter((i) => SOURCES[i]);
  if (!list.length) return null;
  return (
    <div className="mt-4 border-t border-border/50 pt-3 text-xs">
      <p className="font-bold text-foreground text-[11px] uppercase tracking-wider text-start">
        {t("common.sources")}
      </p>
      <ul className="mt-1.5 space-y-1.5 text-start">
        {list.map((id) => (
          <li key={id}>
            <a
              className="inline-flex items-center gap-1.5 text-primary hover:underline underline-offset-2"
              href={SOURCES[id].url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{SOURCES[id].name}</span>
              <ExternalLink aria-hidden className="h-3 w-3 shrink-0 rtl-mirror" />
              <span className="sr-only">{t("common.external")}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function speak(text, lang, done = () => {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = loc(lang);
  u.onend = done;
  u.onerror = done;
  window.speechSynthesis.speak(u);
  return true;
}

export function ListenButton({ text }) {
  const { t, lang } = useApp();
  const [msg, setMsg] = useState("");
  const [on, setOn] = useState(false);
  return (
    <div>
      <Btn
        variant="outline"
        className="min-h-10 text-xs py-1.5 px-3.5 rounded-xl gap-1.5"
        onClick={() => {
          if (on) {
            window.speechSynthesis?.cancel();
            setOn(false);
            return;
          }
          if (!speak(text, lang, () => setOn(false))) setMsg("common.ttsUnsupported");
          else setOn(true);
        }}
      >
        {on ? (
          <Square aria-hidden className="h-3.5 w-3.5" />
        ) : (
          <Volume2 aria-hidden className="h-3.5 w-3.5 text-primary" />
        )}{" "}
        <span>{on ? t("common.stop") : t("common.listen")}</span>
      </Btn>
      {msg && (
        <p role="status" className="mt-1 text-xs text-muted-foreground">
          {t(msg)}
        </p>
      )}
    </div>
  );
}

export function Field({ label, children, hint, id }) {
  return (
    <div className="space-y-1.5 text-start">
      {label && (
        <label htmlFor={id} className="block font-bold text-xs sm:text-sm text-foreground">
          {label}
        </label>
      )}
      {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
      {children}
    </div>
  );
}

export const inputCls =
  "min-h-12 w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-xs sm:text-sm text-foreground hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-start";

export function Status({ msg, tone = "ok" }) {
  if (!msg) return null;
  return (
    <p
      role="status"
      className={cx(
        "rounded-2xl px-4 py-3 text-xs font-semibold leading-relaxed border text-start",
        tone === "err"
          ? "bg-destructive/10 text-destructive border-destructive/25"
          : "bg-secondary text-secondary-foreground border-border/60",
      )}
    >
      {msg}
    </p>
  );
}
