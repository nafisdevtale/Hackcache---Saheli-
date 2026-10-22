import { useApp } from "@/App.jsx";
import { Card, PageTitle, Sources, ListenButton } from "@/components/common/ui.jsx";
import { LESSONS } from "@/content/lessons.js";

function Illustration({ kind }) {
  const c = "fill-none stroke-primary";
  return (
    <svg viewBox="0 0 120 60" aria-hidden className="h-16 w-32">
      {kind === "cycle" && (
        <>
          <circle cx="60" cy="30" r="22" className={c} strokeWidth="6" strokeDasharray="20 8" />
          <circle cx="60" cy="8" r="5" className="fill-period" />
        </>
      )}
      {kind === "check" && (
        <>
          <rect x="35" y="8" width="50" height="44" rx="8" className={c} strokeWidth="4" />
          <path d="M47 30l8 8 16-16" className={c} strokeWidth="5" />
        </>
      )}
      {kind === "ovary" && (
        <>
          <circle cx="35" cy="34" r="12" className={c} strokeWidth="4" />
          <circle cx="85" cy="34" r="12" className={c} strokeWidth="4" />
          <path d="M47 30 Q60 6 73 30" className={c} strokeWidth="4" />
        </>
      )}
      {kind === "clock" && (
        <>
          <circle cx="60" cy="30" r="22" className={c} strokeWidth="4" />
          <path d="M60 16v14l10 6" className={c} strokeWidth="4" />
        </>
      )}
      {kind === "heat" && (
        <>
          <rect
            x="40"
            y="14"
            width="40"
            height="36"
            rx="10"
            className="fill-accent stroke-primary"
            strokeWidth="4"
          />
          <path d="M52 8q4 4 0 8M68 8q4 4 0 8" className={c} strokeWidth="3" />
        </>
      )}
      {kind === "pad" && (
        <rect
          x="30"
          y="18"
          width="60"
          height="24"
          rx="12"
          className="fill-secondary stroke-primary"
          strokeWidth="4"
        />
      )}
      {kind === "drop" && (
        <path
          d="M60 6 C74 26 80 34 80 40 a20 20 0 0 1-40 0 c0-6 6-14 20-34z"
          className="fill-period"
        />
      )}
    </svg>
  );
}

export default function Learn() {
  const { t, L } = useApp();
  return (
    <div className="space-y-3">
      <PageTitle sub={t("learn.intro")}>{t("learn.title")}</PageTitle>
      {LESSONS.map((l) => (
        <Card key={l.id} className="p-0">
          <details>
            <summary className="flex min-h-14 cursor-pointer items-center gap-3 p-4 text-lg font-bold">
              <Illustration kind={l.illustration} /> <span>{L(l.title)}</span>
            </summary>
            <div className="space-y-3 px-4 pb-4">
              <ListenButton text={[L(l.title), ...l.paras.map((p) => L(p))].join(". ")} />
              {l.paras.map((p, i) => (
                <p key={i}>{L(p)}</p>
              ))}
              <Sources ids={l.paras.map((p) => p.src)} />
            </div>
          </details>
        </Card>
      ))}
      <p className="text-sm text-muted-foreground">{t("common.disclaimer")}</p>
    </div>
  );
}
