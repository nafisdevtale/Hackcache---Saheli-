import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  BookOpen,
  Clock,
  Search,
  Bookmark,
  X,
  ShieldCheck,
  Heart,
  Sun,
  ShoppingBag,
  AlertCircle,
  ArrowRight,
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
  NovaDialog,
} from "@/components/nova";
import { DISCOVER_CATEGORIES, DISCOVER_ARTICLES } from "@/content/discoverArticles.js";

const BOOKMARKS_STORAGE_KEY = "saheli_discover_bookmarks";

function loadBookmarks() {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return [];
}

function saveBookmarks(list) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(list));
    }
  } catch {}
}

const ICON_MAP = {
  Sparkles,
  BookOpen,
  AlertCircle,
  ShoppingBag,
  Heart,
  Sun,
};

export default function Discover() {
  const { t } = useApp();

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarks, setBookmarks] = useState(() => loadBookmarks());
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [activeArticle, setActiveArticle] = useState(null);

  const toggleBookmark = (id) => {
    setBookmarks((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      saveBookmarks(updated);
      return updated;
    });
  };

  const filteredArticles = useMemo(() => {
    return DISCOVER_ARTICLES.filter((art) => {
      if (showBookmarksOnly && !bookmarks.includes(art.id)) return false;
      if (activeCategory !== "all" && art.category !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = t(art.titleKey).toLowerCase();
        const summary = t(art.summaryKey).toLowerCase();
        return title.includes(q) || summary.includes(q);
      }
      return true;
    });
  }, [activeCategory, searchQuery, bookmarks, showBookmarksOnly, t]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in">
      {/* Nova Page Header */}
      <NovaPageHeader
        tag={t("discover.badge")}
        title={t("discover.title")}
        subtitle={t("discover.subtitle")}
      />

      {/* Search & Category Filter Chips */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("discover.searchPlaceholder")}
            className={cx(inputCls, "pl-10 text-xs sm:text-sm bg-background")}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter categories & Bookmarks Toggle */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-2">
            {DISCOVER_CATEGORIES.map((cat) => {
              const Icon = ICON_MAP[cat.iconName] || BookOpen;
              const active = !showBookmarksOnly && activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setShowBookmarksOnly(false);
                    setActiveCategory(cat.id);
                  }}
                  className={cx(
                    "shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all border cursor-pointer",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-card border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{t(cat.labelKey)}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowBookmarksOnly((prev) => !prev)}
            className={cx(
              "shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all border ml-auto cursor-pointer",
              showBookmarksOnly
                ? "bg-secondary text-secondary-strong border-secondary-strong/40 shadow-xs"
                : "bg-card border-border/70 text-muted-foreground hover:bg-muted",
            )}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>{t("discover.savedBookmarks")}</span>
            {bookmarks.length > 0 && (
              <span className="rounded-full bg-foreground/10 px-1.5 py-0.2 text-[10px]">
                {bookmarks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Articles Grid (Pinterest-inspired card layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
        {filteredArticles.map((art) => {
          const isSaved = bookmarks.includes(art.id);
          return (
            <NovaCard
              key={art.id}
              variant="interactive"
              onClick={() => setActiveArticle(art)}
              className={cx("group cursor-pointer p-5 flex flex-col justify-between", art.gradient)}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <NovaBadge variant="neutral" size="sm">
                    {t(`discover.cat.${art.category}`)}
                  </NovaBadge>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(art.id);
                    }}
                    className={cx(
                      "rounded-full p-1.5 transition-colors cursor-pointer",
                      isSaved
                        ? "text-primary bg-primary/15"
                        : "text-muted-foreground hover:bg-background/80",
                    )}
                    title={isSaved ? t("discover.removeBookmark") : t("discover.saveBookmark")}
                  >
                    <Bookmark className="h-4 w-4" />
                  </button>
                </div>

                <NovaHeading
                  level={3}
                  className="text-base sm:text-lg group-hover:text-primary transition-colors"
                >
                  {t(art.titleKey)}
                </NovaHeading>

                <NovaText variant="secondary" size="xs" className="line-clamp-3">
                  {t(art.summaryKey)}
                </NovaText>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t("discover.readTime", { n: art.readTimeMinutes })}
                </span>
                <span className="inline-flex items-center gap-1 text-primary font-bold group-hover:translate-x-1 transition-transform">
                  <span>{t("discover.readNow")}</span>
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </NovaCard>
          );
        })}
      </div>

      {filteredArticles.length === 0 && (
        <NovaCard variant="elevated" className="p-10 text-center space-y-2">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
          <NovaHeading level={3} className="text-sm">
            {t("discover.noArticlesTitle")}
          </NovaHeading>
          <NovaText variant="muted" size="xs">
            {t("discover.noArticlesDesc")}
          </NovaText>
        </NovaCard>
      )}

      {/* Article Reader Modal */}
      {activeArticle && (
        <NovaDialog
          isOpen={Boolean(activeArticle)}
          onClose={() => setActiveArticle(null)}
          title={t(activeArticle.titleKey)}
          subtitle={
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
              <NovaBadge variant="primary" size="sm">
                {t(`discover.cat.${activeArticle.category}`)}
              </NovaBadge>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {t("discover.readTime", { n: activeArticle.readTimeMinutes })}
              </span>
              <span>·</span>
              <span>{activeArticle.lastVerified}</span>
            </div>
          }
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => toggleBookmark(activeArticle.id)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Bookmark className="h-4 w-4" />
                <span>
                  {bookmarks.includes(activeArticle.id)
                    ? t("discover.bookmarked")
                    : t("discover.saveBookmark")}
                </span>
              </button>

              <NovaButton variant="primary" size="sm" onClick={() => setActiveArticle(null)}>
                {t("common.close")}
              </NovaButton>
            </div>
          }
        >
          {/* Medical Review Badge */}
          <div className="rounded-2xl bg-muted/60 border border-border/60 p-3 text-xs text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span>{activeArticle.medicalReviewStatus}</span>
          </div>

          {/* Content Body */}
          <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1 text-xs sm:text-sm text-foreground leading-relaxed">
            {activeArticle.sections.map((sec, idx) => (
              <div key={idx} className="space-y-1.5">
                <NovaHeading level={4} className="text-sm font-bold">
                  {t(sec.headingKey)}
                </NovaHeading>
                <NovaText
                  variant="secondary"
                  size="xs"
                  className="whitespace-pre-line leading-relaxed"
                >
                  {t(sec.textKey)}
                </NovaText>
              </div>
            ))}

            {/* Cross-module Connections */}
            <div className="pt-4 border-t border-border/50 flex flex-wrap gap-3">
              {activeArticle.relatedFlashCategory && (
                <Link
                  to="/flash"
                  onClick={() => setActiveArticle(null)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary/10 border border-primary/20 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>{t("discover.exploreRelatedFlash")}</span>
                </Link>
              )}

              {activeArticle.relatedSelfCareRoutine && (
                <Link
                  to="/selfcare"
                  onClick={() => setActiveArticle(null)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-secondary/30 border border-secondary/40 px-3.5 py-2 text-xs font-bold text-secondary-strong hover:bg-secondary/40 transition-colors"
                >
                  <Heart className="h-3.5 w-3.5" />
                  <span>{t("discover.practiceInSelfCare")}</span>
                </Link>
              )}
            </div>

            {/* Verified Sources */}
            {activeArticle.sourceIds?.length > 0 && (
              <div className="pt-3 border-t border-border/40">
                <Sources ids={activeArticle.sourceIds} />
              </div>
            )}
          </div>
        </NovaDialog>
      )}
    </div>
  );
}
