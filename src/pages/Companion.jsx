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
  Volume2,
  VolumeX,
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

    // Trigger visual action feedback
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
  // UNADOPTED STATE: SELECTION & CUSTOMISATION FLOW
  // -------------------------------------------------------------
  if (!state.isAdopted) {
    const activePreviewSpecies = getPetSpeciesById(selectedSpeciesId);

    return (
      <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Heart className="h-3.5 w-3.5 fill-primary" />
            <span>{t("pet.badge")}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            {t("pet.adoptTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {t("pet.adoptSubtitle")}
          </p>
        </div>

        {/* Live Preview Card */}
        <div className="rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card to-muted/30 p-6 shadow-soft flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <PetArtwork
              speciesId={selectedSpeciesId}
              mood="happy"
              accessory={selectedAccessory}
              size={150}
            />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground">{t(activePreviewSpecies.nameKey)}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(activePreviewSpecies.descriptionKey)}
            </p>
          </div>
        </div>

        {/* Pet Selection Grid: Exactly 15 Pets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground">{t("pet.chooseSpecies")}</h3>
            <span className="text-xs font-bold text-primary">15 {t("pet.speciesAvailable")}</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
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
                    "rounded-2xl border p-3 flex flex-col items-center text-center transition-all cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-sm"
                      : "border-border/70 bg-card hover:bg-muted/50",
                  )}
                  aria-pressed={isSelected}
                >
                  <PetArtwork speciesId={species.id} size={56} />
                  <span className="font-bold text-xs text-foreground mt-1.5 line-clamp-1">
                    {t(species.nameKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Name & Details */}
        <div className="rounded-3xl border border-border/80 bg-card p-5 space-y-4 shadow-soft">
          <div>
            <label
              htmlFor="companion-name-input"
              className="block font-bold text-xs text-foreground mb-1"
            >
              {t("pet.nameLabel")}
            </label>
            <input
              id="companion-name-input"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              maxLength={30}
              placeholder={t("pet.namePlaceholder")}
              className={inputCls}
            />
            <span className="text-[11px] text-muted-foreground mt-1 block">
              {t("pet.nameHelp")}
            </span>
          </div>

          {/* Habitat Choice */}
          <div>
            <label className="block font-bold text-xs text-foreground mb-1.5">
              {t("pet.chooseHabitat")}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {HABITAT_THEMES.map((hab) => {
                const IconComp = HABITAT_ICONS[hab.iconName] || Sun;
                const isSelected = hab.id === selectedHabitat;
                return (
                  <button
                    key={hab.id}
                    type="button"
                    onClick={() => setSelectedHabitat(hab.id)}
                    className={cx(
                      "rounded-xl border p-2.5 flex items-center gap-2 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 font-bold"
                        : "border-border/60 bg-muted/30 hover:bg-muted",
                    )}
                  >
                    <IconComp className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs text-foreground line-clamp-1">{t(hab.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accessory Choice */}
          <div>
            <label className="block font-bold text-xs text-foreground mb-1.5">
              {t("pet.chooseAccessory")}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {ACCESSORIES.map((acc) => {
                const IconComp = ACCESSORY_ICONS[acc.iconName] || Ban;
                const isSelected = acc.id === selectedAccessory;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAccessory(acc.id)}
                    className={cx(
                      "rounded-xl border p-2 flex flex-col items-center text-center transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 font-bold"
                        : "border-border/60 bg-muted/30 hover:bg-muted",
                    )}
                  >
                    <IconComp className="h-4 w-4 text-primary mb-1" />
                    <span className="text-[11px] text-foreground line-clamp-1">
                      {t(acc.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Adopt Button */}
        <div className="pt-2 text-center">
          <Btn variant="primary" size="lg" onClick={handleAdopt} className="w-full sm:w-auto px-8">
            <Heart className="h-4 w-4 fill-white" />
            <span>{t("pet.confirmAdopt")}</span>
          </Btn>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ADOPTED ACTIVE PET EXPERIENCE
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Top Controls Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <span>Today</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-bold text-foreground">{t("pet.navTitle")}</span>
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
          className="rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <Edit3 className="h-3.5 w-3.5 text-primary" />
          <span>{t("pet.customiseBtn")}</span>
        </Btn>
      </div>

      {/* Main Companion Sanctuary Card */}
      <div
        className={cx(
          "relative overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-soft flex flex-col items-center justify-center text-center transition-all bg-gradient-to-b min-h-[340px]",
          currentHabitat.bgColor,
          currentHabitat.accentBorder,
        )}
      >
        {/* Stage & Mood Pill */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-card/80 backdrop-blur-sm border border-border/60 px-3 py-1 text-[11px] font-bold text-foreground">
            <Award className="h-3.5 w-3.5 text-primary" />
            <span>{t(currentGrowthStage.labelKey)}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-card/80 backdrop-blur-sm border border-border/60 px-3 py-1 text-[11px] font-bold text-foreground capitalize">
            <Smile className="h-3.5 w-3.5 text-amber-500" />
            <span>{t(`pet.mood.${state.currentMood}`)}</span>
          </span>
        </div>

        {/* Action Animation Pill / Toast */}
        {lastActionAnimation && (
          <div className="absolute top-4 right-4 z-10 animate-bounce rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-bold flex items-center gap-1 shadow-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t(`pet.actionToast.${lastActionAnimation}`)}</span>
          </div>
        )}

        {/* Speech Bubble with Friendly Quote */}
        <div className="mb-4 max-w-sm rounded-2xl bg-card/90 backdrop-blur-sm border border-border/70 p-3 shadow-soft text-xs text-foreground font-medium animate-fade-in">
          💬 {t(currentSpecies.idleQuoteKeys[0])}
        </div>

        {/* The Pet Character */}
        <div
          className={cx(
            "my-2 transition-transform duration-500",
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

        {/* Pet Name & Species */}
        <div className="mt-2">
          <h2 className="font-display text-2xl font-extrabold text-foreground">{state.name}</h2>
          <p className="text-xs text-muted-foreground font-medium">
            {t(currentSpecies.nameKey)} · {t(currentHabitat.labelKey)}
          </p>
        </div>
      </div>

      {/* Gentle Growth Tracker */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-foreground">{t("pet.growthLabel")}: </span>
            <span className="text-primary font-bold">{t(currentGrowthStage.labelKey)}</span>
          </div>
          <span className="text-muted-foreground font-medium">
            {state.interactionsCount} {t("pet.interactionsTotal")}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, (state.interactionsCount / 50) * 100)}%` }}
          />
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t("pet.growthAssurance")}
        </p>
      </div>

      {/* Interactive Care Activities Bar */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-foreground">{t("pet.careActivitiesTitle")}</h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* 1. Feed */}
          <button
            type="button"
            onClick={() => handleCareAction("feed")}
            className="rounded-2xl border border-border/80 bg-card p-3.5 flex flex-col items-center text-center hover:bg-muted/50 transition-all shadow-soft group"
          >
            <div className="rounded-full bg-pink-100 dark:bg-pink-950/40 p-2 text-pink-600 mb-1.5 group-hover:scale-110 transition-transform">
              <span className="text-lg">🍓</span>
            </div>
            <span className="font-bold text-xs text-foreground">{t("pet.act.feed")}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {t(currentSpecies.favoriteTreatKey)}
            </span>
          </button>

          {/* 2. Play */}
          <button
            type="button"
            onClick={() => handleCareAction("play")}
            className="rounded-2xl border border-border/80 bg-card p-3.5 flex flex-col items-center text-center hover:bg-muted/50 transition-all shadow-soft group"
          >
            <div className="rounded-full bg-amber-100 dark:bg-amber-950/40 p-2 text-amber-600 mb-1.5 group-hover:scale-110 transition-transform">
              <span className="text-lg">🎾</span>
            </div>
            <span className="font-bold text-xs text-foreground">{t("pet.act.play")}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {t(currentSpecies.favoriteToyKey)}
            </span>
          </button>

          {/* 3. Brush / Groom */}
          <button
            type="button"
            onClick={() => handleCareAction("brush")}
            className="rounded-2xl border border-border/80 bg-card p-3.5 flex flex-col items-center text-center hover:bg-muted/50 transition-all shadow-soft group"
          >
            <div className="rounded-full bg-teal-100 dark:bg-teal-950/40 p-2 text-teal-600 mb-1.5 group-hover:scale-110 transition-transform">
              <span className="text-lg">🪮</span>
            </div>
            <span className="font-bold text-xs text-foreground">{t("pet.act.brush")}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {t("pet.act.brushSub")}
            </span>
          </button>

          {/* 4. Rest */}
          <button
            type="button"
            onClick={() => handleCareAction("rest")}
            className="rounded-2xl border border-border/80 bg-card p-3.5 flex flex-col items-center text-center hover:bg-muted/50 transition-all shadow-soft group"
          >
            <div className="rounded-full bg-indigo-100 dark:bg-indigo-950/40 p-2 text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform">
              <span className="text-lg">💤</span>
            </div>
            <span className="font-bold text-xs text-foreground">{t("pet.act.rest")}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">{t("pet.act.restSub")}</span>
          </button>

          {/* 5. Give Affection */}
          <button
            type="button"
            onClick={() => handleCareAction("affection")}
            className="col-span-2 sm:col-span-1 rounded-2xl border border-border/80 bg-card p-3.5 flex flex-col items-center text-center hover:bg-muted/50 transition-all shadow-soft group"
          >
            <div className="rounded-full bg-rose-100 dark:bg-rose-950/40 p-2 text-rose-600 mb-1.5 group-hover:scale-110 transition-transform">
              <span className="text-lg">💖</span>
            </div>
            <span className="font-bold text-xs text-foreground">{t("pet.act.affection")}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {t("pet.act.affectionSub")}
            </span>
          </button>
        </div>
      </div>

      {/* Ethical & Privacy Guarantee Card */}
      <div className="rounded-3xl bg-muted/40 border border-border/60 p-4 text-xs text-muted-foreground flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-foreground">{t("pet.privacyTitle")}</span>
          <p className="leading-relaxed">{t("pet.privacyDesc")}</p>
        </div>
      </div>

      {/* -------------------------------------------------------------
          GROWTH CELEBRATION MODAL
      ------------------------------------------------------------- */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-xl text-center space-y-4 animate-scale-up">
            <div className="mx-auto rounded-full bg-primary/10 p-3 text-primary w-12 h-12 flex items-center justify-center">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-xl text-foreground">
                {t("pet.stageCelebrationTitle")}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {state.name} has grown into a{" "}
                <strong className="text-primary">{t(currentGrowthStage.labelKey)}</strong>!
              </p>
            </div>
            <PetArtwork
              speciesId={state.speciesId}
              mood="happy"
              accessory={state.accessory}
              size={120}
              className="mx-auto"
            />
            <Btn variant="primary" size="sm" onClick={handleDismissCelebration} className="w-full">
              {t("pet.celebrateDismiss")}
            </Btn>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          CUSTOMISATION & WARDROBE MODAL
      ------------------------------------------------------------- */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-bold text-foreground text-sm">{t("pet.customiseModalTitle")}</h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto space-y-4 pr-1 text-xs">
              {/* Rename */}
              <div>
                <label className="block font-bold text-foreground mb-1">{t("pet.nameLabel")}</label>
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
                  {t("pet.chooseHabitat")}
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
                          "rounded-xl border p-2 flex items-center gap-2 text-left",
                          isSelected
                            ? "border-primary bg-primary/10 font-bold"
                            : "border-border/60 bg-muted/30",
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
                  {t("pet.chooseAccessory")}
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
                          "rounded-xl border p-2 text-center",
                          isSelected
                            ? "border-primary bg-primary/10 font-bold"
                            : "border-border/60 bg-muted/30",
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
                  className="text-xs font-bold text-destructive hover:underline"
                >
                  {t("pet.resetBtn")}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-destructive/40 bg-card p-6 shadow-xl space-y-4 text-center">
            <h4 className="font-bold text-foreground text-sm">{t("pet.resetConfirmTitle")}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("pet.resetConfirmDesc")}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <Btn variant="ghost" size="sm" onClick={() => setShowResetConfirm(false)}>
                {t("common.cancel")}
              </Btn>
              <Btn variant="destructive" size="sm" onClick={handleReset}>
                {t("pet.confirmResetBtn")}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
