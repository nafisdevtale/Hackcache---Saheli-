import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Heart,
  Sparkles,
  RotateCcw,
  Sun,
  Home,
  Sunset,
  Moon,
  Flower2,
  Wind,
  Star,
  Eye,
  Ban,
  Check,
  ChevronRight,
  Smile,
  ShieldCheck,
  X,
  Edit3,
  Award,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, Chip, inputCls, cx } from "@/components/common/ui.jsx";
import {
  PET_SPECIES,
  HABITAT_THEMES,
  ACCESSORIES,
  GROWTH_STAGES,
  MOODS,
  getPetSpeciesById,
} from "@/content/pets.js";
import {
  loadCompanionState,
  saveCompanionState,
  adoptPet,
  updatePetDetails,
  performCareActivity,
  dismissGrowthCelebration,
  resetCompanion,
} from "@/lib/companionStorage.js";
import { PetArtwork } from "@/components/companion/PetArtwork.jsx";

const HABITAT_ICONS = {
  Sun,
  Home,
  Sunset,
  Moon,
};

const ACCESSORY_ICONS = {
  Ban,
  Flower2,
  Wind,
  Sparkles,
  Star,
  Eye,
};

export default function Companion() {
  const { t } = useApp();

  const [state, setState] = useState(() => loadCompanionState());
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(() => state.speciesId || "cat");
  const [customName, setCustomName] = useState(() => state.name || "Mimi");
  const [selectedHabitat, setSelectedHabitat] = useState(() => state.habitat || "meadow");
  const [selectedAccessory, setSelectedAccessory] = useState(() => state.accessory || "none");

  // Interaction feedback states
  const [lastActionAnimation, setLastActionAnimation] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const currentSpecies = useMemo(() => getPetSpeciesById(state.speciesId), [state.speciesId]);
  const currentHabitat = useMemo(
    () => HABITAT_THEMES.find((h) => h.id === state.habitat) || HABITAT_THEMES[0],
    [state.habitat],
  );
  const currentGrowthStage = useMemo(
    () => GROWTH_STAGES.find((s) => s.stage === state.growthStage) || GROWTH_STAGES[0],
    [state.growthStage],
  );

  const handleAdopt = () => {
    const newState = adoptPet(selectedSpeciesId, customName, selectedHabitat, selectedAccessory);
    setState(newState);
  };

  const handleCareAction = (activityType) => {
    const { state: newState, stageUp } = performCareActivity(activityType);
    setState({ ...newState });

    setLastActionAnimation(activityType);
    setTimeout(() => setLastActionAnimation(null), 1400);

    if (stageUp && newState.growthStage > (newState.hasCelebratedStage || 1)) {
      setShowCelebration(true);
    }
  };

  const handleSaveCustomisation = () => {
    const updated = updatePetDetails({
      name: customName,
      habitat: selectedHabitat,
      accessory: selectedAccessory,
      speciesId: selectedSpeciesId,
    });
    setState({ ...updated });
    setShowSettingsModal(false);
  };

  const handleReset = () => {
    const resetState = resetCompanion();
    setState(resetState);
    setSelectedSpeciesId("cat");
    setCustomName("Mimi");
    setSelectedHabitat("meadow");
    setSelectedAccessory("none");
    setShowResetConfirm(false);
    setShowSettingsModal(false);
  };

  const handleDismissCelebration = () => {
    const updated = dismissGrowthCelebration();
    setState({ ...updated });
    setShowCelebration(false);
  };

  // -------------------------------------------------------------
  // UNADOPTED STATE: MODERN SANCTUARY INTRODUCTION FLOW
  // -------------------------------------------------------------
  if (!state.isAdopted) {
    const activePreviewSpecies = getPetSpeciesById(selectedSpeciesId);

    return (
      <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-period/15 px-3 py-1 text-xs font-bold text-period border border-period/25">
            <Heart className="h-3.5 w-3.5 fill-period" />
            <span>{t("companion.badge")}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
            {t("companion.adoptionTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t("companion.adoptionSubtitle")}
          </p>
        </div>

        {/* 2-Column Responsive Layout: Preview on Left, Selection on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Sticky Preview & Identity) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
            <div
              role="region"
              aria-label={`${t(activePreviewSpecies.nameKey)} preview`}
              className="rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card to-muted/30 p-6 sm:p-8 shadow-bloom-card flex flex-col items-center text-center space-y-4"
            >
              <div className="relative p-2">
                <PetArtwork
                  speciesId={selectedSpeciesId}
                  mood="happy"
                  accessory={selectedAccessory}
                  size={160}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <h2 className="font-display text-xl font-bold text-foreground">
                    {t(activePreviewSpecies.nameKey)}
                  </h2>
                  <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold">
                    {activePreviewSpecies.defaultName}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t(activePreviewSpecies.descriptionKey)}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (Species Picker & Customization) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Species Grid: 15 Pets */}
            <div className="bloom-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="font-display font-bold text-sm text-foreground">
                  {t("companion.chooseSpecies")}
                </h3>
                <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-bold">
                  {t("companion.speciesAvailable", { n: PET_SPECIES.length })}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {PET_SPECIES.map((species) => {
                  const isSelected = species.id === selectedSpeciesId;
                  return (
                    <button
                      key={species.id}
                      type="button"
                      onClick={() => {
                        setSelectedSpeciesId(species.id);
                        setCustomName(species.defaultName);
                      }}
                      className={cx(
                        "relative rounded-2xl border p-2.5 flex flex-col items-center justify-between text-center transition-all cursor-pointer min-h-[104px] min-w-0 select-none tactile-press",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        isSelected
                          ? "border-primary bg-primary/15 ring-2 ring-primary/30 shadow-xs"
                          : "border-border/70 bg-card hover:bg-muted/50",
                      )}
                      aria-pressed={isSelected}
                      aria-label={`${t(species.nameKey)} - ${t(species.descriptionKey)}`}
                    >
                      {isSelected && (
                        <span className="absolute top-1.5 end-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs text-[10px]">
                          ✓
                        </span>
                      )}
                      <div className="my-auto">
                        <PetArtwork speciesId={species.id} size={50} />
                      </div>
                      <span className="font-bold text-[11px] text-foreground mt-1 line-clamp-1 w-full break-words">
                        {t(species.nameKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Name Form */}
            <div className="bloom-card p-5 sm:p-6 space-y-4">
              <div>
                <label
                  htmlFor="companion-name-input"
                  className="block font-bold text-xs sm:text-sm text-foreground mb-1.5"
                >
                  {t("companion.namePrompt")}
                </label>
                <input
                  id="companion-name-input"
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  maxLength={30}
                  placeholder={t("companion.namePlaceholder")}
                  className={inputCls}
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  {t("companion.nameHelp")}
                </span>
              </div>
            </div>

            {/* Single Adopt Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAdopt}
                className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-period px-6 font-bold text-sm text-primary-foreground shadow-bloom-subtle hover:opacity-95 active:scale-98 transition-all cursor-pointer"
              >
                <Heart className="h-4 w-4 fill-white" />
                <span>{t("companion.adoptAction")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ADOPTED ACTIVE PET EXPERIENCE
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Top Header & Customization Trigger */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <span>{t("nav.today")}</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground rtl-mirror" />
          <span className="text-xs font-extrabold text-foreground">{t("companion.title")}</span>
        </div>

        <Btn
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedSpeciesId(state.speciesId);
            setCustomName(state.name);
            setSelectedHabitat(state.habitat);
            setSelectedAccessory(state.accessory);
            setShowSettingsModal(true);
          }}
          className="rounded-2xl text-xs font-bold flex items-center gap-1.5"
        >
          <Edit3 className="h-3.5 w-3.5 text-primary" />
          <span>{t("companion.customise")}</span>
        </Btn>
      </div>

      {/* Main Companion Sanctuary Stage */}
      <section
        aria-label={`${state.name} Sanctuary`}
        className={cx(
          "relative overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-bloom-card flex flex-col items-center justify-center text-center transition-all bg-gradient-to-b min-h-[360px]",
          currentHabitat.bgColor,
          currentHabitat.accentBorder,
        )}
      >
        {/* Top Status Bar: Growth Stage & Mood Chips */}
        <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border/70 px-3 py-1 text-xs font-bold text-foreground shadow-2xs">
              <Award className="h-3.5 w-3.5 text-primary" />
              <span>{t(currentGrowthStage.labelKey)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border/70 px-3 py-1 text-xs font-bold text-foreground capitalize shadow-2xs">
              <Smile className="h-3.5 w-3.5 text-amber-500" />
              <span>{t(`pet.mood.${state.currentMood}`)}</span>
            </span>
          </div>

          {lastActionAnimation && (
            <div className="animate-bounce rounded-full bg-primary text-primary-foreground px-3.5 py-1 text-xs font-bold flex items-center gap-1.5 shadow-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t(`pet.actionToast.${lastActionAnimation}`)}</span>
            </div>
          )}
        </div>

        {/* Speech Bubble with Friendly Quote */}
        <div className="mb-4 max-w-sm rounded-2xl bg-card/90 backdrop-blur-md border border-border/70 p-3.5 shadow-bloom-card text-xs text-foreground font-semibold leading-relaxed animate-fade-in">
          💬 "{t(currentSpecies.idleQuoteKeys[0])}"
        </div>

        {/* The Pet Character with Responsive Scale */}
        <div
          className={cx(
            "my-3 transition-transform duration-500",
            state.currentMood === "playful" && "hover:rotate-6",
          )}
          style={{ transform: `scale(${currentGrowthStage.scale})` }}
        >
          <PetArtwork
            speciesId={state.speciesId}
            mood={state.currentMood}
            accessory={state.accessory}
            size={180}
          />
        </div>

        {/* Pet Name & Habitat Species */}
        <div className="mt-2 space-y-0.5">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {state.name}
          </h2>
          <p className="text-xs font-semibold text-muted-foreground">
            {t(currentSpecies.nameKey)} · {t(currentHabitat.labelKey)}
          </p>
        </div>
      </section>

      {/* Gentle Growth Journey Card */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-bloom-card space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <div>
            <span className="font-bold text-foreground">{t("companion.stage")}: </span>
            <span className="text-primary font-extrabold">{t(currentGrowthStage.labelKey)}</span>
          </div>
          <span className="text-muted-foreground font-semibold text-xs">
            {state.interactionsCount} {t("pet.interactionsTotal")}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full bg-muted/80 rounded-full overflow-hidden p-0.5 border border-border/60">
          <div
            className="h-full bg-gradient-to-r from-primary to-period transition-all duration-500 rounded-full"
            style={{
              width: `${Math.min(100, Math.max(8, (state.interactionsCount / 50) * 100))}%`,
            }}
          />
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t("pet.growthAssurance")}
        </p>
      </div>

      {/* Interactive Care Activities Bar */}
      <section aria-label="Care Actions" className="space-y-3">
        <h3 className="font-display font-bold text-sm text-foreground">
          {t("companion.careActions")}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* 1. Feed */}
          <button
            type="button"
            onClick={() => handleCareAction("feed")}
            className="rounded-3xl border border-border/80 bg-card p-4 flex flex-col items-center text-center hover:bg-muted/50 hover:border-primary/40 transition-all shadow-bloom-card group min-h-[48px] cursor-pointer select-none tactile-press"
          >
            <div className="rounded-2xl bg-pink-100 dark:bg-pink-950/40 p-2.5 text-pink-600 mb-1.5 group-hover:scale-110 transition-transform">
              <span className="text-xl">🍓</span>
            </div>
            <span className="font-bold text-xs text-foreground">{t("companion.actionFeed")}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
              {t(currentSpecies.favoriteTreatKey)}
            </span>
          </button>

          {/* 2. Play */}
          <button
            type="button"
            onClick={() => handleCareAction("play")}
            className="rounded-3xl border border-border/80 bg-card p-4 flex flex-col items-center text-center hover:bg-muted/50 hover:border-primary/40 transition-all shadow-bloom-card group min-h-[48px] cursor-pointer select-none tactile-press"
          >
            <div className="rounded-2xl bg-amber-100 dark:bg-amber-950/40 p-2.5 text-amber-600 mb-1.5 group-hover:scale-110 transition-transform">
              <span className="text-xl">🎾</span>
            </div>
            <span className="font-bold text-xs text-foreground">{t("companion.actionPlay")}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
              {t(currentSpecies.favoriteToyKey)}
            </span>
          </button>

          {/* 3. Brush / Groom */}
          <button
            type="button"
            onClick={() => handleCareAction("brush")}
            className="rounded-3xl border border-border/80 bg-card p-4 flex flex-col items-center text-center hover:bg-muted/50 hover:border-primary/40 transition-all shadow-bloom-card group min-h-[48px] cursor-pointer select-none tactile-press"
          >
            <div className="rounded-2xl bg-teal-100 dark:bg-teal-950/40 p-2.5 text-teal-600 mb-1.5 group-hover:scale-110 transition-transform">
              <span className="text-xl">🪮</span>
            </div>
            <span className="font-bold text-xs text-foreground">{t("companion.actionGroom")}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
              {t("pet.act.brushSub")}
            </span>
          </button>

          {/* 4. Rest */}
          <button
            type="button"
            onClick={() => handleCareAction("rest")}
            className="rounded-3xl border border-border/80 bg-card p-4 flex flex-col items-center text-center hover:bg-muted/50 hover:border-primary/40 transition-all shadow-bloom-card group min-h-[48px] cursor-pointer select-none tactile-press"
          >
            <div className="rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 p-2.5 text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform">
              <span className="text-xl">💤</span>
            </div>
            <span className="font-bold text-xs text-foreground">{t("companion.actionRest")}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
              {t("pet.act.restSub")}
            </span>
          </button>

          {/* 5. Give Affection */}
          <button
            type="button"
            onClick={() => handleCareAction("affection")}
            className="col-span-2 sm:col-span-1 rounded-3xl border border-border/80 bg-card p-4 flex flex-col items-center text-center hover:bg-muted/50 hover:border-primary/40 transition-all shadow-bloom-card group min-h-[48px] cursor-pointer select-none tactile-press"
          >
            <div className="rounded-2xl bg-rose-100 dark:bg-rose-950/40 p-2.5 text-rose-600 mb-1.5 group-hover:scale-110 transition-transform">
              <span className="text-xl">💖</span>
            </div>
            <span className="font-bold text-xs text-foreground">
              {t("companion.actionAffection")}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
              {t("pet.act.affectionSub")}
            </span>
          </button>
        </div>
      </section>

      {/* Ethical & Privacy Guarantee Card */}
      <div className="rounded-3xl bg-muted/40 border border-border/60 p-4 text-xs text-muted-foreground flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-foreground">{t("companion.privacyBadge")}</span>
          <p className="leading-relaxed text-[11px]">{t("companion.subtitle")}</p>
        </div>
      </div>

      {/* -------------------------------------------------------------
          GROWTH CELEBRATION MODAL
      ------------------------------------------------------------- */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="mx-auto rounded-2xl bg-primary/10 p-3 text-primary w-14 h-14 flex items-center justify-center">
              <Award className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-xl text-foreground">
                {t("companion.celebrationTitle")}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {t("companion.celebrationDesc")}
              </p>
            </div>
            <div className="py-2">
              <PetArtwork
                speciesId={state.speciesId}
                mood="happy"
                accessory={state.accessory}
                size={130}
                className="mx-auto"
              />
            </div>
            <Btn variant="primary" size="md" onClick={handleDismissCelebration} className="w-full">
              {t("companion.celebrationContinue")}
            </Btn>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          CUSTOMISATION & WARDROBE MODAL
      ------------------------------------------------------------- */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-display font-bold text-foreground text-sm sm:text-base">
                {t("companion.customise")}
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto space-y-4 pr-1 text-xs">
              {/* Rename */}
              <div>
                <label className="block font-bold text-foreground mb-1.5">
                  {t("companion.namePrompt")}
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  maxLength={30}
                  className={inputCls}
                />
              </div>

              {/* Habitat */}
              <div>
                <label className="block font-bold text-foreground mb-1.5">
                  {t("companion.habitatPrompt")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {HABITAT_THEMES.map((hab) => {
                    const isSelected = hab.id === selectedHabitat;
                    return (
                      <button
                        key={hab.id}
                        type="button"
                        onClick={() => setSelectedHabitat(hab.id)}
                        className={cx(
                          "rounded-2xl border p-2.5 flex items-center gap-2 text-left transition-all cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/10 font-bold ring-1 ring-primary/20 shadow-xs"
                            : "border-border/60 bg-muted/40 hover:bg-muted",
                        )}
                      >
                        <span className="text-xs text-foreground">{t(hab.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accessories */}
              <div>
                <label className="block font-bold text-foreground mb-1.5">
                  {t("companion.accessoryPrompt")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ACCESSORIES.map((acc) => {
                    const isSelected = acc.id === selectedAccessory;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setSelectedAccessory(acc.id)}
                        className={cx(
                          "rounded-2xl border p-2 text-center transition-all cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/10 font-bold ring-1 ring-primary/20 shadow-xs"
                            : "border-border/60 bg-muted/40 hover:bg-muted",
                        )}
                      >
                        <span className="text-[11px] text-foreground">{t(acc.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Danger Zone: Reset Companion */}
              <div className="pt-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="text-xs font-bold text-destructive hover:underline cursor-pointer"
                >
                  {t("companion.reset")}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Btn variant="ghost" size="sm" onClick={() => setShowSettingsModal(false)}>
                {t("common.cancel")}
              </Btn>
              <Btn variant="primary" size="sm" onClick={handleSaveCustomisation}>
                {t("common.save")}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-destructive/40 bg-card p-6 shadow-2xl space-y-4 text-center">
            <h4 className="font-bold text-foreground text-sm">{t("companion.resetConfirm")}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("companion.resetConfirmDesc")}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <Btn variant="ghost" size="sm" onClick={() => setShowResetConfirm(false)}>
                {t("common.cancel")}
              </Btn>
              <Btn variant="danger" size="sm" onClick={handleReset}>
                {t("companion.resetYes")}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
