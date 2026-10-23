import { useState, useMemo } from "react";
import { Search, BookOpen, Sparkles, Filter, X } from "lucide-react";
import { useApp } from "@/App.jsx";
import {
  Card,
  PageTitle,
  Sources,
  ListenButton,
  Chip,
  inputCls,
  cx,
} from "@/components/common/ui.jsx";
import { LESSONS } from "@/content/lessons.js";

function Illustration({ kind }) {
  const c = "fill-none stroke-primary";
  return (
    <svg viewBox="0 0 120 60" aria-hidden className="h-16 w-32 shrink-0">
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

const CATEGORY_MAP = {
  cycle: "biology",
  normal: "guidance",
  pcos: "conditions",
  late: "biology",
  cramps: "symptoms",
  products: "hygiene",
  first: "firstPeriod",
  thyroid: "conditions",
  postpartum: "lifeStages",
  menopause: "lifeStages",
  doctor_prep: "guidance",
  cycle_records: "guidance",
};

export default function Learn() {
  const { t, L } = useApp();
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");

  const categories = [
    { id: "all", label: t("learn.catAll") },
    { id: "biology", label: t("learn.catBiology") },
    { id: "symptoms", label: t("learn.catSymptoms") },
    { id: "conditions", label: t("learn.catConditions") },
    { id: "hygiene", label: t("learn.catHygiene") },
    { id: "lifeStages", label: t("learn.catLifeStages") },
    { id: "guidance", label: t("learn.catGuidance") },
  ];

  const filtered = useMemo(() => {
    return LESSONS.filter((lesson) => {
      const cat = CATEGORY_MAP[lesson.id] || "guidance";
      if (selectedCat !== "all" && cat !== selectedCat) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const title = (L(lesson.title) || "").toLowerCase();
      const body = lesson.paras
        .map((p) => L(p) || "")
        .join(" ")
        .toLowerCase();
      return title.includes(q) || body.includes(q);
    });
  }, [selectedCat, search, L]);

  return (
    <div className="space-y-4">
      <PageTitle sub={t("learn.intro")}>{t("learn.title")}</PageTitle>

      {/* Search Input */}
      <div className="relative">
        <Search
          aria-hidden
          className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("learn.searchPlaceholder")}
          className={cx(inputCls, "pl-10 pr-9 min-h-[44px]")}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((c) => (
          <Chip
            key={c.id}
            selected={selectedCat === c.id}
            onClick={() => setSelectedCat(c.id)}
            className="whitespace-nowrap shrink-0 min-h-[38px] text-xs font-semibold"
          >
            {c.label}
          </Chip>
        ))}
      </div>

      {/* Lessons List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-8">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {t("common.noEntries") || "No matching articles found."}
          </p>
        </Card>
      ) : (
        filtered.map((l) => {
          const textToRead = [L(l.title), ...l.paras.map((p) => L(p))].join(". ");
          const wordCount = textToRead.split(/\s+/).length;
          const readTime = Math.max(1, Math.ceil(wordCount / 140));

          return (
            <Card
              key={l.id}
              id={l.id}
              className="scroll-mt-20 p-0 shadow-sm transition-all hover:border-primary/40"
            >
              <details className="group">
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 p-4 text-base font-bold text-foreground">
                  <div className="flex items-center gap-3">
                    <Illustration kind={l.illustration} />
                    <div>
                      <span>{L(l.title)}</span>
                      <p className="text-xs font-normal text-muted-foreground mt-0.5">
                        {t("learn.readTime", { m: readTime })}
                      </p>
                    </div>
                  </div>
                </summary>
                <div className="space-y-3 border-t border-border/50 px-4 py-4 text-sm leading-relaxed">
                  <div className="flex justify-end">
                    <ListenButton text={textToRead} />
                  </div>
                  {l.paras.map((p, i) => (
                    <p key={i} className="text-foreground/90">
                      {L(p)}
                    </p>
                  ))}
                  <div className="border-t border-border/40 pt-2">
                    <Sources ids={l.paras.map((p) => p.src)} />
                  </div>
                </div>
              </details>
            </Card>
          );
        })
      )}

      <p className="text-xs text-muted-foreground text-center">{t("common.disclaimer")}</p>
    </div>
  );
}
