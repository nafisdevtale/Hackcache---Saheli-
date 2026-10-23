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
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, Chip, inputCls, cx } from "@/components/common/ui.jsx";
import { PRODUCT_CATEGORIES, VERIFIED_PRODUCTS } from "@/content/products.js";
import {
  loadFlashState,
  saveFlashState,
  toggleSaveProduct,
  isProductSaved,
  getFlashRecommendations,
  compareProducts,
  clearFlashData,
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
  const [activeTab, setActiveTab] = useState("discover"); // "discover" | "saved"
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRationaleId, setExpandedRationaleId] = useState(null);

  // Comparison state (select up to 2 items)
  const [compareIds, setCompareIds] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Refresh saved IDs state
  const refreshState = () => {
    setState(loadFlashState());
  };

  const handleToggleSave = (productId) => {
    toggleSaveProduct(productId);
    refreshState();
  };

  const toggleCompare = (productId) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 2) {
        return [prev[1], productId];
      }
      return [...prev, productId];
    });
  };

  // Generate recommendations
  const recommendations = useMemo(() => {
    const criteria = {
      category: activeCategory,
      maxBudget,
      preferReusable: reusableFilter === "any" ? null : reusableFilter === "reusable",
      sensitiveSkin,
      personalisationEnabled: state.preferences.personalisationEnabled,
    };
    let results = getFlashRecommendations(criteria, VERIFIED_PRODUCTS);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
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
    searchQuery,
  ]);

  const savedProducts = useMemo(() => {
    return VERIFIED_PRODUCTS.filter((p) => state.savedProductIds.includes(p.productId));
  }, [state.savedProductIds]);

  const comparedPair = useMemo(() => {
    if (compareIds.length === 2) {
      const prodA = VERIFIED_PRODUCTS.find((p) => p.productId === compareIds[0]);
      const prodB = VERIFIED_PRODUCTS.find((p) => p.productId === compareIds[1]);
      return compareProducts(prodA, prodB);
    }
    return null;
  }, [compareIds]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-border/60 pb-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>{t("flash.badge")}</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
          {t("flash.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
          {t("flash.subtitle")}
        </p>

        {/* Ethical Non-Commercial Charter */}
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-muted/60 border border-border/60 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-foreground">{t("flash.charterHeading")}: </span>
            <span>{t("flash.charterNotice")}</span>
          </div>
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
            disabled={compareIds.length < 2}
            className="flex items-center gap-1.5 rounded-2xl bg-secondary/80 px-3.5 py-1.5 text-xs font-bold text-secondary-strong disabled:opacity-50"
          >
            <Scale className="h-3.5 w-3.5" />
            <span>{t("flash.compareBtn", { n: compareIds.length })}</span>
          </button>
        )}
      </div>

      {activeTab === "discover" ? (
        <>
          {/* Controls: Search & Category Chips */}
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

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {PRODUCT_CATEGORIES.map((cat) => {
                const Icon = ICON_MAP[cat.iconName] || Sparkles;
                const active = activeCategory === cat.id;
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
                  </button>
                );
              })}
            </div>

            {/* Preference Filters Row */}
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/40 border border-border/60 p-3 text-xs">
              {/* Budget Filter */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-muted-foreground">{t("flash.filterBudget")}:</span>
                <select
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                  className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground"
                >
                  <option value={100}>≤ ₹100</option>
                  <option value={300}>≤ ₹300</option>
                  <option value={600}>≤ ₹600</option>
                  <option value={1500}>≤ ₹1500</option>
                </select>
              </div>

              {/* Reusable Filter */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-muted-foreground">{t("flash.filterType")}:</span>
                <select
                  value={reusableFilter}
                  onChange={(e) => setReusableFilter(e.target.value)}
                  className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground"
                >
                  <option value="any">{t("flash.typeAny")}</option>
                  <option value="reusable">{t("flash.typeReusable")}</option>
                  <option value="disposable">{t("flash.typeDisposable")}</option>
                </select>
              </div>

              {/* Sensitive Skin Toggle */}
              <label className="flex items-center gap-2 cursor-pointer ml-auto">
                <input
                  type="checkbox"
                  checked={sensitiveSkin}
                  onChange={(e) => setSensitiveSkin(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border text-primary"
                />
                <span className="font-bold text-foreground">{t("flash.sensitiveSkinLabel")}</span>
              </label>
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
                  }}
                  className="mt-2"
                >
                  {t("flash.resetFilters")}
                </Btn>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map(({ product: p, score, reasons, tradeOffs }) => {
                  const saved = isProductSaved(p.productId);
                  const isCompared = compareIds.includes(p.productId);
                  const isRationaleExpanded = expandedRationaleId === p.productId;

                  return (
                    <Card
                      key={p.productId}
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
                            onClick={() => handleToggleSave(p.productId)}
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

                        {/* Price & Unit Details */}
                        <div className="pt-3 flex flex-wrap items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-2">
                            <span className="font-display text-xl font-extrabold text-foreground">
                              ₹{p.unitPrice.toFixed(2)}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground">
                              ({p.pricePerUnit})
                            </span>
                          </div>
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

                        {/* Description & Materials */}
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.materials.slice(0, 3).map((mat, idx) => (
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
                              setExpandedRationaleId(isRationaleExpanded ? null : p.productId)
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
                                Price verified: {p.priceTimestamp} · Merchant: {p.merchant}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions: Compare & Link */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-muted-foreground hover:text-foreground">
                          <input
                            type="checkbox"
                            checked={isCompared}
                            onChange={() => toggleCompare(p.productId)}
                            className="h-3.5 w-3.5 rounded border-border text-primary"
                          />
                          <span>{t("flash.addToCompare")}</span>
                        </label>

                        {p.officialProductUrl && (
                          <a
                            href={p.officialProductUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-primary hover:underline text-[11px]"
                          >
                            <span>{t("flash.viewOfficialDetails")}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
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
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("flash.savedBagSubtitle", { n: savedProducts.length })}</span>
            {savedProducts.length > 0 && (
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
            )}
          </div>

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
                  key={p.productId}
                  className="flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground">{p.brand}</span>
                      <h3 className="font-bold text-foreground text-sm">{p.name}</h3>
                      <div className="text-base font-extrabold text-foreground mt-1">
                        ₹{p.unitPrice.toFixed(2)} ({p.pricePerUnit})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSave(p.productId)}
                      className="rounded-full p-2 text-primary hover:bg-muted"
                      title={t("flash.removeFromBag")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {p.merchant}
                    </span>
                    {p.officialProductUrl && (
                      <a
                        href={p.officialProductUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-primary hover:underline text-[11px]"
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

      {/* Side-by-Side Comparison Modal */}
      {isCompareModalOpen && comparedPair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
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

            <div className="flex-1 overflow-auto space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-2 border-b border-border/40">
                <div>
                  <h4 className="font-bold text-foreground text-sm">{comparedPair.prodA.name}</h4>
                  <div className="text-base font-extrabold text-foreground mt-0.5">
                    ₹{comparedPair.prodA.unitPrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">{comparedPair.prodB.name}</h4>
                  <div className="text-base font-extrabold text-foreground mt-0.5">
                    ₹{comparedPair.prodB.unitPrice.toFixed(2)}
                  </div>
                </div>
              </div>

              {comparedPair.attributes.map((attr, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                    {t(attr.labelKey)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 rounded-xl bg-muted/40 p-2.5">
                    <div className="text-foreground">{attr.valA}</div>
                    <div className="text-foreground">{attr.valB}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-border/50">
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
