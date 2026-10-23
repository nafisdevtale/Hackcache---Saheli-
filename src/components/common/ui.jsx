import { useState } from "react";
import { ExternalLink, Volume2, Square } from "lucide-react";
import { useApp } from "@/App.jsx";
import { SOURCES } from "@/content/sources.js";

export const cx = (...a) => a.filter(Boolean).join(" ");

export function Btn({ variant = "primary", className, ...p }) {
  const v = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm active:scale-[0.98] tactile-press",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98] tactile-press",
    outline:
      "border border-border/80 bg-card text-foreground hover:bg-muted/60 active:scale-[0.98] tactile-press shadow-2xs",
    danger:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] tactile-press shadow-sm",
    ghost: "text-foreground hover:bg-muted/60 active:scale-[0.98] tactile-press",
  }[variant];

  return (
    <button
      type="button"
      className={cx(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
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
        "rounded-3xl border border-border/70 bg-card p-5 text-card-foreground shadow-soft transition-all",
        className,
      )}
      {...p}
    />
  );
}

export function PageTitle({ children, sub, tag }) {
  return (
    <header className="mb-4 space-y-1">
      {tag && (
        <span className="text-xs font-bold uppercase tracking-wider text-primary">{tag}</span>
      )}
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
        {children}
      </h1>
      {sub && <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{sub}</p>}
    </header>
  );
}

export function Toggle({ checked, onChange, label, desc, disabled }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 py-2">
      <span className="space-y-0.5">
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
        "inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3.5 py-2 text-left text-xs font-semibold transition-all cursor-pointer",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-xs"
          : "border-border/70 bg-card text-foreground hover:bg-muted/70 shadow-2xs",
        className,
      )}
    >
      {Icon && <Icon aria-hidden className="h-4 w-4 shrink-0" />}
      <span>{children}</span>
      {selected && (
        <span aria-hidden className="text-xs">
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
    <div className="mt-3 border-t border-border/50 pt-2 text-xs">
      <p className="font-bold text-foreground text-[11px] uppercase tracking-wider">
        {t("common.sources")}
      </p>
      <ul className="mt-1 space-y-1">
        {list.map((id) => (
          <li key={id}>
            <a
              className="inline-flex items-center gap-1.5 text-primary hover:underline underline-offset-2"
              href={SOURCES[id].url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{SOURCES[id].name}</span>
              <ExternalLink aria-hidden className="h-3 w-3 shrink-0" />
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
  u.lang = lang === "hi" ? "hi-IN" : "en-IN";
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
        className="min-h-10 text-xs py-1.5 px-3 rounded-xl"
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
    <div className="space-y-1">
      <label htmlFor={id} className="block font-bold text-xs text-foreground">
        {label}
      </label>
      {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
      {children}
    </div>
  );
}

export const inputCls =
  "min-h-12 w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-xs sm:text-sm text-foreground hover:border-primary/40 focus:border-primary transition-all";

export function Status({ msg, tone = "ok" }) {
  if (!msg) return null;
  return (
    <p
      role="status"
      className={cx(
        "rounded-2xl px-3.5 py-2.5 text-xs font-semibold leading-relaxed",
        tone === "err"
          ? "bg-destructive/10 text-destructive border border-destructive/20"
          : "bg-secondary text-secondary-foreground border border-secondary-strong/20",
      )}
    >
      {msg}
    </p>
  );
}
