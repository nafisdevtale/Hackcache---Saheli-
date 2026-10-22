import { useState } from "react";
import { ExternalLink, Volume2, Square } from "lucide-react";
import { useApp } from "@/App.jsx";
import { SOURCES } from "@/content/sources.js";

export const cx = (...a) => a.filter(Boolean).join(" ");

export function Btn({ variant = "primary", className, ...p }) {
  const v = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border-2 border-border bg-card text-foreground hover:bg-muted",
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    ghost: "text-foreground hover:bg-muted",
  }[variant];
  return (
    <button
      type="button"
      className={cx(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold transition-colors disabled:opacity-50",
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
        "rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-soft",
        className,
      )}
      {...p}
    />
  );
}

export function PageTitle({ children, sub }) {
  return (
    <header className="mb-4">
      <h1 className="font-display text-3xl font-bold leading-tight text-foreground">{children}</h1>
      {sub && <p className="mt-1 text-muted-foreground">{sub}</p>}
    </header>
  );
}

export function Toggle({ checked, onChange, label, desc, disabled }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 py-2">
      <span>
        <span className="block font-medium">{label}</span>
        {desc && <span className="block text-sm text-muted-foreground">{desc}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="switch"
        checked={!!checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function Chip({ selected, onClick, children, icon: Icon, label }) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      onClick={onClick}
      aria-label={label}
      className={cx(
        "inline-flex min-h-12 items-center gap-2 rounded-full border-2 px-3 py-2 text-left font-medium",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      {Icon && <Icon aria-hidden className="h-5 w-5 shrink-0" />}
      <span>{children}</span>
      {selected && <span aria-hidden>✓</span>}
    </button>
  );
}

export function Sources({ ids }) {
  const { t } = useApp();
  const list = [...new Set(ids)].filter((i) => SOURCES[i]);
  if (!list.length) return null;
  return (
    <div className="mt-3 border-t border-border pt-2 text-sm">
      <p className="font-semibold">{t("common.sources")}</p>
      <ul className="mt-1 space-y-1">
        {list.map((id) => (
          <li key={id}>
            <a
              className="inline-flex items-center gap-1 underline underline-offset-2"
              href={SOURCES[id].url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {SOURCES[id].name} <ExternalLink aria-hidden className="h-3.5 w-3.5" />
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
          <Square aria-hidden className="h-4 w-4" />
        ) : (
          <Volume2 aria-hidden className="h-5 w-5" />
        )}{" "}
        {on ? t("common.stop") : t("common.listen")}
      </Btn>
      {msg && (
        <p role="status" className="mt-1 text-sm text-muted-foreground">
          {t(msg)}
        </p>
      )}
    </div>
  );
}

export function Field({ label, children, hint, id }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-semibold">
        {label}
      </label>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

export const inputCls =
  "min-h-12 w-full rounded-xl border-2 border-input bg-card px-3 py-2 text-foreground";

export function Status({ msg, tone = "ok" }) {
  if (!msg) return null;
  return (
    <p
      role="status"
      className={cx(
        "rounded-xl px-3 py-2 font-medium",
        tone === "err"
          ? "bg-destructive/10 text-destructive"
          : "bg-secondary text-secondary-foreground",
      )}
    >
      {msg}
    </p>
  );
}
