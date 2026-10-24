import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Search,
  Filter,
  Check,
  Heart,
  Droplet,
  RefreshCw,
  Shield,
  ShieldCheck,
  Flame,
  Activity,
  Droplets,
  Archive,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  SlidersHorizontal,
  Bookmark,
  Scale,
  AlertTriangle,
  RotateCcw,
  Info,
  Copy,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Lock,
  Layers,
  ArrowUpDown,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, Chip, inputCls, cx } from "@/components/common/ui.jsx";
import { SegmentedControl, AiBadge } from "@/components/bloom/index.js";
import { PRODUCT_CATEGORIES, VERIFIED_PRODUCTS } from "@/content/products.js";
import {
  loadFlashState,
  saveFlashState,
  toggleSaveProduct,
  isProductSaved,
  getFlashRecommendations,
  compareProducts,
  clearFlashData,
  recordRecommendationFeedback,
  exportSavedBagSummary,
} from "@/lib/flashRecommender.js";

const ICON_MAP = {
  Sparkles,
  Droplet,
  RefreshCw,
  Shield,
  Heart,
  Archive,
  Flame,
  Activity,
  Droplets,
  ShieldCheck,
};

export default function FlashEssentials() {
  const { t } = useApp();

  const [state, setState] = useState(() => loadFlashState());
  const [activeCategory, setActiveCategory] = useState("all");
  const [maxBudget, setMaxBudget] = useState(600);
  const [reusableFilter, setReusableFilter] = useState("any"); // "any" | "reusable" | "disposable"
  const [sensitiveSkin, setSensitiveSkin] = useState(false);
  const [sortBy, setSortBy] = useState("relevance"); // "relevance" | "price_low_high" | "price_high_low" | "freshness"
  const [activeTab, setActiveTab] = useState("discover"); // "discover" | "saved"
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRationaleId, setExpandedRationaleId] = useState(null);

  // Detail Modal State
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);

  // Comparison State (select up to 3 items)
  const [compareIds, setCompareIds] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const refreshState = () => {
    setState(loadFlashState());
  };

  const handleToggleSave = (productId) => {
    toggleSaveProduct(productId);
    refreshState();
  };

  const handleTogglePersonalisation = (enabled) => {
    const updated = {
      ...state,
      preferences: {
        ...state.preferences,
        personalisationEnabled: enabled,
      },
    };
    saveFlashState(updated);
    setState(updated);
  };

  const handleFeedback = (productId, helpful) => {
    recordRecommendationFeedback(productId, helpful);
    refreshState();
    showToast(t("flash.feedbackThankYou"));
  };

  const toggleCompare = (productId) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 3) {
        // Shift oldest item to keep maximum of 3
        return [...prev.slice(1), productId];
      }
      return [...prev, productId];
    });
  };

  const handleCopyBagSummary = async () => {
    const summary = exportSavedBagSummary(state.savedProductIds, VERIFIED_PRODUCTS);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(summary);
      }
      showToast(t("flash.bagCopiedToast"));
    } catch {
      showToast(t("flash.bagCopiedToast"));
    }
  };

  // Recommendations calculation
  const recommendations = useMemo(() => {
    const criteria = {
      category: activeCategory,
      maxBudget,
      preferReusable: reusableFilter === "any" ? null : reusableFilter === "reusable",
      sensitiveSkin,
      personalisationEnabled: state.preferences.personalisationEnabled,
      sortBy,
    };

    let results = getFlashRecommendations(criteria, VERIFIED_PRODUCTS, { sortBy });

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      results = results.filter(
        (r) =>
          r.product.name.toLowerCase().includes(q) ||
          r.product.brand.toLowerCase().includes(q) ||
          r.product.materials.some((m) => m.toLowerCase().includes(q)),
      );
    }
    return results;
  }, [
    activeCategory,
    maxBudget,
    reusableFilter,
    sensitiveSkin,
    state.preferences.personalisationEnabled,
    sortBy,
    searchQuery,
  ]);

  // Category product counts
  const categoryCounts = useMemo(() => {
    const counts = { all: VERIFIED_PRODUCTS.length };
    for (const cat of PRODUCT_CATEGORIES) {
      if (cat.id !== "all") {
        counts[cat.id] = VERIFIED_PRODUCTS.filter((p) => p.category === cat.id).length;
      }
    }
    return counts;
  }, []);

  const savedProducts = useMemo(() => {
    return VERIFIED_PRODUCTS.filter((p) => state.savedProductIds.includes(p.productId || p.id));
  }, [state.savedProductIds]);

  const totalSavedOutlay = useMemo(() => {
    return savedProducts.reduce((sum, p) => sum + (p.unitPrice || 0), 0);
  }, [savedProducts]);

  const comparedProducts = useMemo(() => {
    return compareIds
      .map((id) => VERIFIED_PRODUCTS.find((p) => p.productId === id || p.id === id))
      .filter(Boolean);
  }, [compareIds]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-foreground text-background px-4 py-2.5 shadow-lg text-xs font-bold animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-foreground">
              {t("flash.badge")}
            </span>
            <AiBadge agent="flash" />
          </div>

          {/* Personalisation / Anonymous Toggle */}
          <div className="flex items-center gap-1.5 rounded-2xl bg-muted/60 p-1 border border-border/60 text-xs">
            <button
              type="button"
              onClick={() => handleTogglePersonalisation(true)}
              className={cx(
                "rounded-xl px-3 py-1 font-bold transition-all flex items-center gap-1.5 active:scale-95",
                state.preferences.personalisationEnabled
                  ? "bg-card text-foreground shadow-2xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>{t("flash.modePersonalised")}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTogglePersonalisation(false)}
              className={cx(
                "rounded-xl px-3 py-1 font-bold transition-all flex items-center gap-1.5 active:scale-95",
                !state.preferences.personalisationEnabled
                  ? "bg-card text-foreground shadow-2xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{t("flash.modeAnonymous")}</span>
            </button>
          </div>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-2">
          {t("flash.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
          {t("flash.subtitle")}
        </p>

        {/* Status & Privacy Banner */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-muted/40 border border-border/60 p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{t("flash.modeNotice")}</span>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            {t("flash.statusVerifiedCache")}
          </span>
        </div>
      </div>

      {/* Navigation Tabs (Discover vs Saved Bag) */}
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("discover")}
            className={cx(
              "rounded-2xl px-4 py-2 text-xs font-bold transition-all",
              activeTab === "discover"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {t("flash.tabDiscover")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={cx(
              "rounded-2xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5",
              activeTab === "saved"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>{t("flash.tabSaved")}</span>
            {savedProducts.length > 0 && (
              <span className="rounded-full bg-primary-foreground/20 px-1.5 py-0.2 text-[10px]">
                {savedProducts.length}
              </span>
            )}
          </button>
        </div>

        {compareIds.length > 0 && (
          <button
            type="button"
            onClick={() => setIsCompareModalOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-secondary/80 px-3.5 py-1.5 text-xs font-bold text-secondary-strong hover:bg-secondary transition-all"
          >
            <Scale className="h-3.5 w-3.5" />
            <span>{t("flash.compareBtn", { n: compareIds.length })}</span>
          </button>
        )}
      </div>

      {activeTab === "discover" ? (
        <>
          {/* Controls: Search, Categories, Filters, Sorting */}
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("flash.searchPlaceholder")}
                className={cx(inputCls, "pl-10 text-xs sm:text-sm bg-background")}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category Filter Chips with Count Badges */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {PRODUCT_CATEGORIES.map((cat) => {
                const Icon = ICON_MAP[cat.iconName] || Sparkles;
                const active = activeCategory === cat.id;
                const count = categoryCounts[cat.id] || 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={cx(
                      "shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all border",
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{t(cat.labelKey)}</span>
                    <span
                      className={cx(
                        "rounded-full px-1.5 py-0.2 text-[10px]",
                        active
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Preference Filters & Sorting Row */}
            <div className="space-y-3 rounded-2xl bg-muted/40 border border-border/60 p-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                {/* Budget Slider & Quick Chips */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-bold text-foreground text-[11px]">
                    <span className="text-muted-foreground">{t("flash.filterBudget")}:</span>
                    <span className="text-primary font-extrabold">≤ ₹{maxBudget}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="1500"
                    step="25"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(Number(e.target.value))}
                    className="w-full accent-primary h-1.5 rounded-lg bg-muted cursor-pointer"
                  />
                  <div className="flex gap-1 pt-1">
                    {[100, 300, 600, 1500].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setMaxBudget(b)}
                        className={cx(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-bold border",
                          maxBudget === b
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-muted",
                        )}
                      >
                        ₹{b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type Filter */}
                <div className="space-y-1.5">
                  <span className="font-bold text-muted-foreground text-[11px] block">
                    {t("flash.filterType")}:
                  </span>
                  <select
                    value={reusableFilter}
                    onChange={(e) => setReusableFilter(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground"
                  >
                    <option value="any">{t("flash.typeAny")}</option>
                    <option value="reusable">{t("flash.typeReusable")}</option>
                    <option value="disposable">{t("flash.typeDisposable")}</option>
                  </select>
                </div>

                {/* Sorting Dropdown */}
                <div className="space-y-1.5">
                  <span className="font-bold text-muted-foreground text-[11px] block">
                    {t("flash.sortBy")}:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground"
                  >
                    <option value="relevance">{t("flash.sortRelevance")}</option>
                    <option value="price_low_high">{t("flash.sortPriceAsc")}</option>
                    <option value="price_high_low">{t("flash.sortPriceDesc")}</option>
                    <option value="freshness">{t("flash.sortFreshness")}</option>
                  </select>
                </div>

                {/* Sensitive Skin Toggle */}
                <div className="flex items-center pt-4 sm:pt-0">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sensitiveSkin}
                      onChange={(e) => setSensitiveSkin(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary"
                    />
                    <span className="font-bold text-foreground text-xs">
                      {t("flash.sensitiveSkinLabel")}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Results Count & Recommendations Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>{t("flash.resultsCount", { n: recommendations.length })}</span>
              <span className="font-semibold text-primary">{t("flash.verifiedPricingNotice")}</span>
            </div>

            {recommendations.length === 0 ? (
              <div className="rounded-3xl border border-border/80 bg-card p-8 text-center space-y-2">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto" />
                <h3 className="font-bold text-foreground text-sm">{t("flash.noResultsTitle")}</h3>
                <p className="text-xs text-muted-foreground">{t("flash.noResultsDesc")}</p>
                <Btn
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveCategory("all");
                    setMaxBudget(600);
                    setReusableFilter("any");
                    setSensitiveSkin(false);
                    setSearchQuery("");
                    setSortBy("relevance");
                  }}
                  className="mt-2"
                >
                  {t("flash.resetFilters")}
                </Btn>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map(({ product: p, score, reasons, tradeOffs }) => {
                  const saved = isProductSaved(p.productId || p.id);
                  const isCompared = compareIds.includes(p.productId || p.id);
                  const isRationaleExpanded = expandedRationaleId === (p.productId || p.id);

                  return (
                    <Card
                      key={p.productId || p.id}
                      className="group flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-5 shadow-soft transition-all hover:border-primary/40 space-y-4"
                    >
                      {/* Top Bar: Brand, Category, Save */}
                      <div>
                        <div className="flex items-start justify-between gap-2 pb-2 border-b border-border/40">
                          <div>
                            <span className="text-[11px] font-bold text-muted-foreground">
                              {p.brand}
                            </span>
                            <h3 className="font-display text-base font-bold text-foreground leading-snug">
                              {p.name}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleSave(p.productId || p.id)}
                            className={cx(
                              "rounded-full p-2 transition-all shrink-0",
                              saved
                                ? "bg-primary text-primary-foreground shadow-2xs"
                                : "text-muted-foreground hover:bg-muted",
                            )}
                            title={saved ? t("flash.removeFromBag") : t("flash.saveToBag")}
                          >
                            <Bookmark className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Price, Tags & ML Score */}
                        <div className="pt-3 flex flex-wrap items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-2">
                            <span className="font-display text-xl font-extrabold text-foreground">
                              ₹{(p.unitPrice || 0).toFixed(2)}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground">
                              ({p.pricePerUnit})
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {state.preferences.personalisationEnabled && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary border border-primary/20">
                                <Sparkles className="h-3 w-3" />
                                <span>{t("flash.mlScore", { score })}</span>
                              </span>
                            )}
                            <span
                              className={cx(
                                "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                                p.reusable
                                  ? "bg-secondary/30 text-secondary-strong"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {p.reusable ? t("flash.reusableTag") : t("flash.disposableTag")}
                            </span>
                          </div>
                        </div>

                        {/* Description & Materials */}
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(p.materials || []).slice(0, 3).map((mat, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground"
                            >
                              {mat}
                            </span>
                          ))}
                        </div>

                        {/* Safety Notice Box */}
                        <div className="mt-3 rounded-2xl bg-primary/5 border border-primary/15 p-2.5 text-[11px] text-foreground flex items-start gap-2">
                          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="leading-snug">{p.safetyInformation}</span>
                        </div>

                        {/* Accordion: Why FLASH Recommended This */}
                        <div className="mt-3 border-t border-border/40 pt-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRationaleId(
                                isRationaleExpanded ? null : p.productId || p.id,
                              )
                            }
                            className="flex w-full items-center justify-between text-xs font-bold text-primary hover:underline"
                          >
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5" />
                              {t("flash.whyRecommended")}
                            </span>
                            {isRationaleExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {isRationaleExpanded && (
                            <div className="mt-2 space-y-1.5 rounded-2xl bg-muted/40 p-3 text-[11px] text-muted-foreground">
                              <div className="font-bold text-foreground">
                                {t("flash.reasonsTitle")}:
                              </div>
                              <ul className="list-disc list-inside space-y-0.5">
                                {reasons.map((rKey, rIdx) => (
                                  <li key={rIdx}>{t(rKey)}</li>
                                ))}
                              </ul>
                              {tradeOffs.length > 0 && (
                                <div className="pt-1.5">
                                  <div className="font-bold text-amber-600 dark:text-amber-400">
                                    {t("flash.tradeoffsTitle")}:
                                  </div>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {tradeOffs.map((tKey, tIdx) => (
                                      <li key={tIdx}>{t(tKey)}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              <div className="pt-1 text-[10px] text-muted-foreground italic">
                                Price verified: {p.priceTimestamp || p.lastPriceCheck} · Merchant:{" "}
                                {p.merchant || p.retailer}
                              </div>

                              {/* Local-only private recommendation feedback */}
                              <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground font-semibold">
                                  {t("flash.feedbackHelpful")}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleFeedback(p.productId || p.id, true)}
                                    className="p-1 rounded-md text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                                    title="Yes"
                                  >
                                    <ThumbsUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleFeedback(p.productId || p.id, false)}
                                    className="p-1 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                                    title="No"
                                  >
                                    <ThumbsDown className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions: Compare, View Details, Official Link */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-muted-foreground hover:text-foreground">
                          <input
                            type="checkbox"
                            checked={isCompared}
                            onChange={() => toggleCompare(p.productId || p.id)}
                            className="h-3.5 w-3.5 rounded border-border text-primary"
                          />
                          <span>{t("flash.addToCompare")}</span>
                        </label>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedProductDetails(p)}
                            className="font-bold text-foreground hover:text-primary transition-colors text-[11px]"
                          >
                            {t("flash.viewDetails")}
                          </button>

                          {(p.officialProductUrl || p.url) && (
                            <a
                              href={p.officialProductUrl || p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-primary hover:underline text-[11px]"
                            >
                              <span>{t("flash.viewOfficialDetails")}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Saved Items Tab ("My Bag") */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{t("flash.savedBagSubtitle", { n: savedProducts.length })}</span>
            {savedProducts.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyBagSummary}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{t("flash.copyBagSummary")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearFlashData();
                    refreshState();
                  }}
                  className="text-xs font-bold text-destructive hover:underline"
                >
                  {t("flash.clearAllSaved")}
                </button>
              </div>
            )}
          </div>

          {savedProducts.length > 0 && (
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between text-xs">
              <div>
                <span className="text-muted-foreground block">{t("flash.totalOutlay")}:</span>
                <span className="font-display text-xl font-extrabold text-foreground">
                  ₹{totalSavedOutlay.toFixed(2)}
                </span>
              </div>
              <Btn size="sm" variant="outline" onClick={handleCopyBagSummary} className="gap-1.5">
                <Copy className="h-3.5 w-3.5" />
                <span>{t("flash.copyBagSummary")}</span>
              </Btn>
            </div>
          )}

          {savedProducts.length === 0 ? (
            <div className="rounded-3xl border border-border/80 bg-card p-10 text-center space-y-3">
              <Bookmark className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="font-bold text-foreground text-sm">{t("flash.noSavedTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("flash.noSavedDesc")}</p>
              <Btn
                variant="primary"
                size="sm"
                onClick={() => setActiveTab("discover")}
                className="mt-2"
              >
                {t("flash.browseCatalogue")}
              </Btn>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedProducts.map((p) => (
                <Card
                  key={p.productId || p.id}
                  className="flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground">{p.brand}</span>
                      <h3 className="font-bold text-foreground text-sm">{p.name}</h3>
                      <div className="text-base font-extrabold text-foreground mt-1">
                        ₹{(p.unitPrice || 0).toFixed(2)} ({p.pricePerUnit})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSave(p.productId || p.id)}
                      className="rounded-full p-2 text-primary hover:bg-muted"
                      title={t("flash.removeFromBag")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedProductDetails(p)}
                      className="font-bold text-primary hover:underline text-[11px]"
                    >
                      {t("flash.viewDetails")}
                    </button>

                    {(p.officialProductUrl || p.url) && (
                      <a
                        href={p.officialProductUrl || p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-muted-foreground hover:text-foreground text-[11px]"
                      >
                        <span>{t("flash.viewOfficialDetails")}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Comparison Action Bar */}
      {compareIds.length > 0 && !isCompareModalOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full bg-foreground text-background px-5 py-3 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <Scale className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold">
            {t("flash.compareMaxNotice", { n: compareIds.length })}
          </span>
          <button
            type="button"
            onClick={() => setIsCompareModalOpen(true)}
            className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {t("flash.compareTitle")}
          </button>
          <button
            type="button"
            onClick={() => setCompareIds([])}
            className="text-muted-foreground hover:text-background p-1"
            title={t("flash.clearCompare")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-border/50 pb-3">
              <div>
                <span className="text-xs font-bold text-muted-foreground">
                  {selectedProductDetails.brand}
                </span>
                <h3 className="font-bold text-foreground text-base mt-0.5">
                  {selectedProductDetails.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductDetails(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto space-y-4 text-xs">
              <div className="flex items-baseline justify-between rounded-2xl bg-muted/40 p-3">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    {t("flash.filterBudget")}
                  </span>
                  <span className="text-lg font-extrabold text-foreground">
                    ₹{selectedProductDetails.unitPrice.toFixed(2)}
                  </span>
                </div>
                <span className="text-muted-foreground font-semibold">
                  ({selectedProductDetails.pricePerUnit})
                </span>
              </div>

              {/* Materials */}
              <div className="space-y-1">
                <span className="font-bold text-foreground text-[11px] block">
                  {t("flash.materialsTitle")}
                </span>
                <p className="text-muted-foreground bg-muted/30 p-2.5 rounded-xl leading-relaxed">
                  {selectedProductDetails.material || selectedProductDetails.materials?.join(", ")}
                </p>
              </div>

              {/* Care & Hygiene */}
              <div className="space-y-1">
                <span className="font-bold text-foreground text-[11px] block">
                  {t("flash.careInstructionsTitle")}
                </span>
                <p className="text-muted-foreground bg-muted/30 p-2.5 rounded-xl leading-relaxed">
                  {selectedProductDetails.careInstructions}
                </p>
              </div>

              {/* Limitations & Contraindications */}
              <div className="space-y-1">
                <span className="font-bold text-amber-600 dark:text-amber-400 text-[11px] block">
                  {t("flash.contraindicationsTitle")}
                </span>
                <p className="text-muted-foreground bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl leading-relaxed">
                  {selectedProductDetails.contraindicationNotes ||
                    selectedProductDetails.limitations}
                </p>
              </div>

              {/* Quality Certifications */}
              <div className="space-y-1">
                <span className="font-bold text-foreground text-[11px] block">
                  {t("flash.certificationsTitle")}
                </span>
                <p className="text-muted-foreground bg-muted/30 p-2.5 rounded-xl leading-relaxed">
                  {selectedProductDetails.qualityEvidence ||
                    selectedProductDetails.certificationEvidence}
                </p>
              </div>

              {/* Merchant */}
              <div className="space-y-1">
                <span className="font-bold text-foreground text-[11px] block">
                  {t("flash.merchantTitle")}
                </span>
                <p className="text-muted-foreground bg-muted/30 p-2.5 rounded-xl">
                  {selectedProductDetails.merchant || selectedProductDetails.retailer} · Last
                  verified:{" "}
                  {selectedProductDetails.priceTimestamp || selectedProductDetails.lastPriceCheck}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              {selectedProductDetails.officialProductUrl || selectedProductDetails.url ? (
                <a
                  href={selectedProductDetails.officialProductUrl || selectedProductDetails.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-primary hover:underline text-xs"
                >
                  <span>{t("flash.viewOfficialDetails")}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <div />
              )}
              <Btn variant="primary" size="sm" onClick={() => setSelectedProductDetails(null)}>
                {t("common.close")}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal (Up to 3 items) */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-foreground text-sm">{t("flash.compareTitle")}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {comparedProducts.length < 2 ? (
              <div className="p-8 text-center space-y-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto" />
                <p>{t("flash.compareEmpty")}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto space-y-4">
                {/* Product Headers */}
                <div
                  className="grid gap-3 pb-3 border-b border-border/40"
                  style={{
                    gridTemplateColumns: `repeat(${comparedProducts.length}, minmax(0, 1fr))`,
                  }}
                >
                  {comparedProducts.map((p) => (
                    <div key={p.productId || p.id} className="relative rounded-2xl bg-muted/30 p-3">
                      <button
                        type="button"
                        onClick={() => toggleCompare(p.productId || p.id)}
                        className="absolute top-2 right-2 rounded-full p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title={t("flash.removeItem")}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[10px] font-bold text-muted-foreground">{p.brand}</span>
                      <h4 className="font-bold text-foreground text-xs leading-snug line-clamp-1">
                        {p.name}
                      </h4>
                      <div className="text-sm font-extrabold text-foreground mt-1">
                        ₹{p.unitPrice.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Attributes Rows */}
                {[
                  {
                    label: t("flash.compare.reusable"),
                    key: "reusable",
                    format: (p) => (p.reusable ? "Yes (Washable)" : "No (Disposable)"),
                  },
                  {
                    label: t("flash.compare.pricePerUnit"),
                    key: "pricePerUnit",
                    format: (p) => p.pricePerUnit,
                  },
                  {
                    label: t("flash.compare.quantity"),
                    key: "quantity",
                    format: (p) => `${p.packQuantity || p.quantity} units`,
                  },
                  {
                    label: t("flash.compare.materials"),
                    key: "materials",
                    format: (p) => p.materials?.join(", ") || p.material,
                  },
                  {
                    label: t("flash.compare.safety"),
                    key: "safety",
                    format: (p) => p.safetyInformation,
                  },
                  {
                    label: t("flash.compare.care"),
                    key: "care",
                    format: (p) => p.careInstructions,
                  },
                  {
                    label: t("flash.compare.limitations"),
                    key: "limitations",
                    format: (p) => p.contraindicationNotes || p.limitations,
                  },
                ].map((attr, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                      {attr.label}
                    </div>
                    <div
                      className="grid gap-3 rounded-xl bg-muted/40 p-2.5"
                      style={{
                        gridTemplateColumns: `repeat(${comparedProducts.length}, minmax(0, 1fr))`,
                      }}
                    >
                      {comparedProducts.map((p) => (
                        <div key={p.productId || p.id} className="text-foreground leading-relaxed">
                          {attr.format(p)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => {
                  setCompareIds([]);
                  setIsCompareModalOpen(false);
                }}
                className="text-xs font-bold text-destructive hover:underline"
              >
                {t("flash.clearCompare")}
              </button>
              <Btn variant="primary" size="sm" onClick={() => setIsCompareModalOpen(false)}>
                {t("common.close")}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
