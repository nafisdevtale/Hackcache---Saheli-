import { useState, useMemo } from "react";
import { Search, BookOpen, Sparkles, Filter, X, ArrowRight } from "lucide-react";
import { useApp } from "@/App.jsx";
import { Sources, ListenButton, inputCls, cx } from "@/components/common/ui.jsx";
import {
  NovaHeading,
  NovaText,
  NovaButton,
  NovaCard,
  NovaBadge,
  NovaPageHeader,
  NovaChip,
} from "@/components/nova";
import { LESSONS } from "@/content/lessons.js";
import { EducationTopicArt } from "@/components/brand/SaheliArt.jsx";
import { pick } from "@/i18n/index.js";

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
  const { t, L: appL, prefs } = useApp();
  const L = appL || ((o) => pick(prefs?.lang || "en", o));
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

  // Featured article (First lesson: Cycle biology)
  const featured = LESSONS[0];

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto animate-fade-in">
      <NovaPageHeader tag={t("learn.title")} title={t("learn.title")} subtitle={t("learn.intro")} />

      {/* Featured Editorial Hero Banner */}
      {!search && selectedCat === "all" && featured && (
        <NovaCard variant="elevated" className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-4 w-4" />
            <span>{t("learn.featuredGuide")}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <NovaHeading level={2} className="text-xl sm:text-2xl">
                {L(featured.title)}
              </NovaHeading>
              <NovaText variant="secondary" size="xs" className="line-clamp-2 leading-relaxed">
                {L(featured.paras[0])}
              </NovaText>
            </div>
            <div className="shrink-0 flex items-center justify-center p-3 rounded-2xl bg-card border border-border/70 shadow-xs">
              <EducationTopicArt category="biology" className="h-16 w-16" />
            </div>
          </div>
          <a
            href={`#${featured.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            <span>{t("learn.readFullArticle")}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </NovaCard>
      )}

      {/* Search Bar & Filters */}
      <div className="space-y-3">
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
            className={cx(inputCls, "pl-10 pr-9 min-h-[46px] rounded-2xl")}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <NovaChip
              key={c.id}
              selected={selectedCat === c.id}
              onClick={() => setSelectedCat(c.id)}
            >
              {c.label}
            </NovaChip>
          ))}
        </div>
      </div>

      {/* Responsive Lessons Grid: 2 columns on desktop */}
      {filtered.length === 0 ? (
        <NovaCard variant="elevated" className="p-8 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <NovaText variant="muted" size="sm" className="mt-2">
            {t("common.noEntries") || "No matching articles found."}
          </NovaText>
        </NovaCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {filtered.map((l) => {
            const cat = CATEGORY_MAP[l.id] || "guidance";
            const textToRead = [L(l.title), ...l.paras.map((p) => L(p))].join(". ");
            const wordCount = textToRead.split(/\s+/).length;
            const readTime = Math.max(1, Math.ceil(wordCount / 140));

            return (
              <div
                key={l.id}
                id={l.id}
                className="scroll-mt-20 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xs transition-all hover:border-primary/40 hover:shadow-soft"
              >
                <details className="group">
                  <summary className="flex min-h-[68px] cursor-pointer items-center justify-between gap-3 p-4 text-sm sm:text-base font-bold text-foreground">
                    <div className="flex items-center gap-3.5">
                      <EducationTopicArt category={cat} className="h-12 w-12 shrink-0" />
                      <div>
                        <span className="group-hover:text-primary transition-colors">
                          {L(l.title)}
                        </span>
                        <p className="text-xs font-normal text-muted-foreground mt-0.5">
                          {t("learn.readTime", { m: readTime })}
                        </p>
                      </div>
                    </div>
                  </summary>
                  <div className="space-y-3 border-t border-border/50 px-5 py-5 text-xs sm:text-sm leading-relaxed bg-muted/20">
                    <div className="flex justify-end">
                      <ListenButton text={textToRead} />
                    </div>
                    {l.paras.map((p, i) => (
                      <p key={i} className="text-foreground/90 leading-relaxed">
                        {L(p)}
                      </p>
                    ))}
                    <div className="border-t border-border/40 pt-2">
                      <Sources ids={l.paras.map((p) => p.src)} />
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pt-2">{t("common.disclaimer")}</p>
    </div>
  );
}
