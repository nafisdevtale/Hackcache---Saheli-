import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Heart,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Clock,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Stethoscope,
  Trash2,
  Bookmark,
  Activity,
  CloudRain,
  Waves,
  Trees,
  Droplets,
  Wind,
  Moon,
  Bird,
  Music,
  Sun,
  Coffee,
  Info,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, Chip, Sources, inputCls, cx } from "@/components/common/ui.jsx";
import {
  SELF_CARE_CATEGORIES,
  SELF_CARE_PROGRAMMES,
  SOUNDSCAPES,
  QUICK_SHORTCUTS,
  EVIDENCE_LEVELS,
  getPersonalizedSelfCare,
} from "@/content/selfCare.js";
import { soundscapeEngine } from "@/lib/soundscapes.js";
import {
  loadSelfCareData,
  toggleFavoriteActivity,
  isFavoriteActivity,
  recordCompletedActivity,
  updateWellbeingNote,
  clearSelfCareHistory,
} from "@/lib/selfCareStorage.js";

// Helper icon mapping
const ICON_MAP = {
  CloudRain,
  Waves,
  Trees,
  Droplets,
  Wind,
  Moon,
  Bird,
  Music,
  Volume2,
  Sparkles,
  Heart,
  Activity,
  Coffee,
  ShieldCheck,
  Sun,
};

export default function SelfCare() {
  const { t, L, record, today, safety, prefs } = useApp();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeModalProg, setActiveModalProg] = useState(null);
  const [activeBreathingModal, setActiveBreathingModal] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [stepTimer, setStepTimer] = useState(0);
  const [isStepTimerRunning, setIsStepTimerRunning] = useState(false);
  const [routineFinished, setRoutineFinished] = useState(false);

  // Self Care Local State
  const [userData, setUserData] = useState(() => loadSelfCareData());
  const [noteInput, setNoteInput] = useState(() => loadSelfCareData().notes || "");
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  // Audio Engine Reactive State
  const [audioState, setAudioState] = useState(() => soundscapeEngine.getState());
  const [selectedTimerMins, setSelectedTimerMins] = useState(0);

  useEffect(() => {
    const unsubscribe = soundscapeEngine.subscribe((state) => {
      setAudioState(state);
    });
    return () => unsubscribe();
  }, []);

  const refreshUserData = () => {
    setUserData(loadSelfCareData());
  };

  const handleToggleFav = (id) => {
    toggleFavoriteActivity(id);
    refreshUserData();
  };

  // Step timer tick
  useEffect(() => {
    let interval = null;
    if (isStepTimerRunning && stepTimer > 0) {
      interval = setInterval(() => {
        setStepTimer((prev) => {
          if (prev <= 1) {
            setIsStepTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStepTimerRunning, stepTimer]);

  const openProgramme = (prog) => {
    if (prog.id === "relax_calm_breathing") {
      setActiveBreathingModal(true);
      return;
    }
    setActiveModalProg(prog);
    setActiveStepIndex(0);
    setRoutineFinished(false);
    const firstStepDuration = (prog.steps[0]?.duration || 2) * 60;
    setStepTimer(firstStepDuration);
    setIsStepTimerRunning(true);
  };

  const nextStep = () => {
    if (!activeModalProg) return;
    if (activeStepIndex < activeModalProg.steps.length - 1) {
      const nextIdx = activeStepIndex + 1;
      setActiveStepIndex(nextIdx);
      const nextDur = (activeModalProg.steps[nextIdx]?.duration || 2) * 60;
      setStepTimer(nextDur);
      setIsStepTimerRunning(true);
    } else {
      finishProgramme();
    }
  };

  const prevStep = () => {
    if (activeStepIndex > 0) {
      const prevIdx = activeStepIndex - 1;
      setActiveStepIndex(prevIdx);
      const prevDur = (activeModalProg.steps[prevIdx]?.duration || 2) * 60;
      setStepTimer(prevDur);
      setIsStepTimerRunning(true);
    }
  };

  const finishProgramme = () => {
    if (!activeModalProg) return;
    recordCompletedActivity(activeModalProg.id, activeModalProg.suggestedDuration);
    setRoutineFinished(true);
    setIsStepTimerRunning(false);
    refreshUserData();
  };

  const closeProgrammeModal = () => {
    setActiveModalProg(null);
    setIsStepTimerRunning(false);
    setRoutineFinished(false);
  };

  // Personalized Recommendation
  const recommendation = getPersonalizedSelfCare({ record, today, safety });

  // Filter programmes
  const filteredProgrammes = SELF_CARE_PROGRAMMES.filter((p) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "comfort") return p.category === "comfort";
    if (activeCategory === "movement") return p.category === "movement";
    if (activeCategory === "breathing") return p.category === "breathing";
    if (activeCategory === "hygiene") return p.category === "hygiene";
    return false;
  });

  const favoritesList = SELF_CARE_PROGRAMMES.filter((p) => userData.favorites.includes(p.id));
  const favoriteSounds = SOUNDSCAPES.filter((s) => userData.favorites.includes(s.id));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Header & Intro */}
      <div className="border-b border-border/60 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <Sparkles className="h-4 w-4" />
          <span>{prefs.discreet ? t("app.discreetName") : t("nav.selfCare")}</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
          {t("selfcare.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
          {t("selfcare.subtitle")}
        </p>

        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-muted/60 p-3 text-xs text-muted-foreground border border-border/40">
          <ShieldCheck className="h-4 w-4 text-secondary-strong shrink-0" />
          <span>{t("selfcare.bannerNotice")}</span>
        </div>
      </div>

      {/* 2. Today's Personalised Self-Care Suggestion */}
      <section aria-labelledby="today-selfcare-heading">
        <h2 id="today-selfcare-heading" className="sr-only">
          {t("selfcare.today.title")}
        </h2>

        {recommendation.isSafetyAlert ? (
          <div className="rounded-3xl border-2 border-urgent/60 bg-urgent-soft/40 p-6 shadow-soft space-y-3">
            <div className="flex items-center gap-2 text-urgent font-bold text-base">
              <AlertTriangle className="h-5 w-5" />
              <h3>{t(recommendation.titleKey)}</h3>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{t(recommendation.descKey)}</p>
            <div className="pt-2">
              <Link
                to="/doctor"
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-urgent px-4 font-bold text-xs text-urgent-foreground shadow-sm hover:opacity-95"
              >
                <Stethoscope className="h-4 w-4" />
                {t("nav.doctor")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="bloom-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-4 w-4" />
                {t("selfcare.today.title")}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {t("selfcare.evidence.informed")}
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-lg sm:text-xl text-foreground">
                {t(recommendation.titleKey)}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t(recommendation.descKey)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {recommendation.targetProgrammeId && (
                <Btn
                  onClick={() => {
                    const target = SELF_CARE_PROGRAMMES.find(
                      (p) => p.id === recommendation.targetProgrammeId,
                    );
                    if (target) openProgramme(target);
                  }}
                  className="text-xs font-bold min-h-11 px-5 flex items-center gap-2 shadow-sm"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  {t("selfcare.today.viewDetails")}
                </Btn>
              )}
              <span className="text-[11px] text-muted-foreground italic">
                Optional comfort practice • Free & non-mandatory
              </span>
            </div>
          </div>
        )}
      </section>

      {/* 3. Quick Self Care Shortcuts (Horizontally scrollable / grid) */}
      <section aria-labelledby="quick-selfcare-heading" className="space-y-3">
        <h2
          id="quick-selfcare-heading"
          className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1"
        >
          {t("selfcare.quick.title")}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {QUICK_SHORTCUTS.map((item) => {
            const Icon = ICON_MAP[item.iconName] || Sparkles;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  const prog = SELF_CARE_PROGRAMMES.find((p) => p.id === item.targetProgrammeId);
                  if (prog) openProgramme(prog);
                }}
                className="group flex flex-col items-center text-center justify-center p-3.5 rounded-2xl border border-border/70 bg-card hover:border-primary/50 hover:bg-muted/40 transition-all shadow-2xs active:scale-98 min-h-[95px]"
              >
                <div
                  className={cx(
                    "w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br mb-2 transition-transform group-hover:scale-105",
                    item.color,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground leading-tight line-clamp-2">
                  {t(item.titleKey)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Category Filter Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {SELF_CARE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={cx(
              "px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 min-h-10",
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {t(cat.labelKey)}
          </button>
        ))}
      </div>

      {/* 5. Main Category Views */}
      {activeCategory !== "soundscapes" && activeCategory !== "mycare" && (
        <section aria-labelledby="programmes-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2
              id="programmes-heading"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1"
            >
              {t("selfcare.prog.title")} ({filteredProgrammes.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProgrammes.map((prog) => {
              const isFav = userData.favorites.includes(prog.id);
              const evidence =
                EVIDENCE_LEVELS[prog.evidenceLevel] || EVIDENCE_LEVELS.wellbeing_practice;
              return (
                <div
                  key={prog.id}
                  className="bloom-card bloom-card-interactive p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header tags: Category & Favorite */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                        {t(`selfcare.cat.${prog.category}`)} • {prog.suggestedDuration}m
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleFav(prog.id)}
                        aria-label={
                          isFav ? t("selfcare.prog.unfavorite") : t("selfcare.prog.favorite")
                        }
                        className={cx(
                          "p-2 rounded-full transition-colors cursor-pointer",
                          isFav
                            ? "text-period bg-period/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted",
                        )}
                      >
                        <Heart className={cx("h-4 w-4", isFav && "fill-current")} />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-display font-bold text-base text-foreground leading-snug">
                        {t(prog.titleKey)}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {t(prog.descKey)}
                      </p>
                    </div>

                    {/* Evidence Level Badge */}
                    <div className="pt-1">
                      <span
                        className={cx(
                          "inline-block text-[10px] font-semibold px-2 py-0.5 rounded-lg border",
                          evidence.badgeColor,
                        )}
                      >
                        {t(evidence.labelKey)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {prog.steps.length} {t("selfcare.prog.next").toLowerCase()}
                    </span>
                    <Btn
                      size="sm"
                      onClick={() => openProgramme(prog)}
                      className="text-xs font-bold min-h-10 px-4 flex items-center gap-1.5"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      {t("selfcare.prog.start")}
                    </Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Soundscapes Studio View */}
      {(activeCategory === "soundscapes" || activeCategory === "all") && (
        <section aria-labelledby="soundscapes-heading" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
            <div>
              <h2
                id="soundscapes-heading"
                className="font-display font-bold text-lg text-foreground flex items-center gap-2"
              >
                <Volume2 className="h-5 w-5 text-primary" />
                {t("selfcare.sound.title")}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("selfcare.sound.desc")}</p>
            </div>

            {/* Global Stop button if audio playing */}
            {audioState.isPlaying && (
              <button
                type="button"
                onClick={() => soundscapeEngine.stopAll()}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-destructive/10 text-destructive border border-destructive/30 px-3.5 py-1.5 text-xs font-bold hover:bg-destructive/20 transition-all cursor-pointer"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                {t("selfcare.sound.stopAll")}
              </button>
            )}
          </div>

          {/* Soundscapes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SOUNDSCAPES.map((sound) => {
              const Icon = ICON_MAP[sound.iconName] || Volume2;
              const isPlaying = audioState.activeSounds.includes(sound.id);
              const isFav = userData.favorites.includes(sound.id);
              const soundVol = audioState.soundVolumes[sound.id] ?? 0.7;

              return (
                <div
                  key={sound.id}
                  className={cx(
                    "flex flex-col justify-between p-4 rounded-3xl border transition-all shadow-2xs space-y-3",
                    isPlaying
                      ? "border-primary/60 bg-primary/5 shadow-soft"
                      : "border-border/70 bg-card hover:border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => soundscapeEngine.toggle(sound.id)}
                        aria-label={isPlaying ? t("selfcare.prog.pause") : t("selfcare.prog.start")}
                        className={cx(
                          "w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs",
                          isPlaying
                            ? "bg-primary text-primary-foreground scale-105"
                            : "bg-muted text-foreground hover:bg-primary/20 hover:text-primary",
                        )}
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5 fill-current" />
                        ) : (
                          <Play className="h-5 w-5 fill-current ms-0.5" />
                        )}
                      </button>

                      <div className="space-y-0.5">
                        <h3 className="font-bold text-sm text-foreground leading-tight">
                          {t(sound.titleKey)}
                        </h3>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {t(sound.descKey)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFav(sound.id)}
                      aria-label="Toggle favourite sound"
                      className={cx(
                        "p-1.5 rounded-full transition-colors cursor-pointer",
                        isFav
                          ? "text-period bg-period/10"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Heart className={cx("h-3.5 w-3.5", isFav && "fill-current")} />
                    </button>
                  </div>

                  {/* Volume Slider if Playing */}
                  {isPlaying && (
                    <div className="pt-2 border-t border-border/40 flex items-center gap-2 animate-fade-in text-xs text-muted-foreground">
                      <Volume2 className="h-3.5 w-3.5 shrink-0" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={soundVol}
                        onChange={(e) =>
                          soundscapeEngine.setSoundVolume(sound.id, parseFloat(e.target.value))
                        }
                        className="w-full h-1.5 rounded-lg bg-muted accent-primary cursor-pointer"
                        aria-label={`${t(sound.titleKey)} ${t("selfcare.sound.volume")}`}
                      />
                      <span className="text-[10px] font-mono shrink-0 w-7 text-right">
                        {Math.round(soundVol * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sleep Timer Bar */}
          <div className="rounded-3xl border border-border/60 bg-muted/30 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span>{t("selfcare.sound.timer")}:</span>
              {audioState.timerRemaining > 0 && (
                <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                  {Math.floor(audioState.timerRemaining / 60)}:
                  {String(audioState.timerRemaining % 60).padStart(2, "0")}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {[5, 10, 15, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setSelectedTimerMins(mins);
                    soundscapeEngine.setTimer(mins);
                  }}
                  className={cx(
                    "px-3 py-1 rounded-xl font-bold transition-all text-xs",
                    selectedTimerMins === mins && audioState.timerRemaining > 0
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-card text-foreground border border-border/60 hover:bg-muted",
                  )}
                >
                  {mins}m
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setSelectedTimerMins(0);
                  soundscapeEngine.clearTimer();
                }}
                className="px-3 py-1 rounded-xl font-bold text-xs bg-card text-muted-foreground border border-border/60 hover:text-foreground"
              >
                {t("selfcare.sound.noTimer")}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 7. My Self Care (Favorites, History & Notes) View */}
      {(activeCategory === "mycare" || activeCategory === "all") && (
        <section
          aria-labelledby="mycare-heading"
          className="space-y-6 pt-4 border-t border-border/60"
        >
          <div className="flex items-center justify-between">
            <h2
              id="mycare-heading"
              className="font-display font-bold text-xl text-foreground flex items-center gap-2"
            >
              <Heart className="h-5 w-5 text-period" />
              {t("selfcare.mycare.title")}
            </h2>
            <span className="text-xs text-muted-foreground">
              {t("selfcare.mycare.noPressureNotice")}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Saved Favourites & Recent */}
            <div className="lg:col-span-7 space-y-6">
              {/* Favorites */}
              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Bookmark className="h-3.5 w-3.5 text-primary" />
                  {t("selfcare.mycare.favorites")} ({favoritesList.length + favoriteSounds.length})
                </h3>

                {favoritesList.length === 0 && favoriteSounds.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 leading-relaxed">
                    {t("selfcare.mycare.noFavorites")}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {favoritesList.map((prog) => (
                      <div
                        key={prog.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/50 text-xs"
                      >
                        <span className="font-bold text-foreground truncate pr-2">
                          {t(prog.titleKey)}
                        </span>
                        <Btn
                          size="sm"
                          onClick={() => openProgramme(prog)}
                          className="text-[11px] font-bold px-2.5 py-1 min-h-8"
                        >
                          {t("selfcare.prog.start")}
                        </Btn>
                      </div>
                    ))}
                    {favoriteSounds.map((snd) => (
                      <div
                        key={snd.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/50 text-xs"
                      >
                        <span className="font-bold text-foreground truncate pr-2">
                          {t(snd.titleKey)}
                        </span>
                        <Btn
                          size="sm"
                          variant="secondary"
                          onClick={() => soundscapeEngine.toggle(snd.id)}
                          className="text-[11px] font-bold px-2.5 py-1 min-h-8"
                        >
                          <Volume2 className="h-3 w-3 me-1" />
                          {t("selfcare.sound.title")}
                        </Btn>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recently Completed Activity History */}
              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    {t("selfcare.mycare.recent")}
                  </h3>
                  {userData.history.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(t("selfcare.mycare.clearConfirm"))) {
                          clearSelfCareHistory();
                          refreshUserData();
                        }
                      }}
                      className="text-[11px] font-semibold text-destructive hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      {t("selfcare.mycare.clearHistory")}
                    </button>
                  )}
                </div>

                {userData.history.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 leading-relaxed">
                    {t("selfcare.mycare.noRecent")}
                  </p>
                ) : (
                  <ul className="divide-y divide-border/50 max-h-60 overflow-y-auto pr-1 text-xs">
                    {userData.history.map((h, i) => {
                      const prog = SELF_CARE_PROGRAMMES.find((p) => p.id === h.id);
                      return (
                        <li key={i} className="py-2.5 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="font-bold text-foreground block">
                              {prog ? t(prog.titleKey) : h.id}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(h.completedAt).toLocaleDateString()} • {h.durationMinutes}m
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-secondary-strong bg-secondary/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {t("selfcare.prog.completed")}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Right: Personal Wellbeing Notes */}
            <div className="lg:col-span-5 rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-4">
              <div>
                <h3 className="font-display font-bold text-base text-foreground">
                  {t("selfcare.mycare.notes")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Private comfort observations stored strictly on this device.
                </p>
              </div>

              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={t("selfcare.mycare.notesPh")}
                className={cx(inputCls, "min-h-32 text-xs resize-none")}
                maxLength={500}
              />

              <div className="flex items-center justify-between pt-1">
                <Btn
                  size="sm"
                  onClick={() => {
                    updateWellbeingNote(noteInput);
                    setNoteSavedFeedback(true);
                    setTimeout(() => setNoteSavedFeedback(false), 3000);
                  }}
                  className="text-xs font-bold min-h-10 px-4"
                >
                  {t("selfcare.mycare.saveNotes")}
                </Btn>
                {noteSavedFeedback && (
                  <span className="text-[11px] font-semibold text-secondary-strong flex items-center gap-1 animate-fade-in">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t("selfcare.mycare.notesSaved")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: STEP-BY-STEP PROGRAMME PLAYER                                    */}
      {/* ========================================================================= */}
      {activeModalProg && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="player-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
        >
          <div className="w-full max-w-lg rounded-3xl bg-card border border-border/80 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {t(`selfcare.cat.${activeModalProg.category}`)} •{" "}
                  {activeModalProg.suggestedDuration}m
                </span>
                <h2 id="player-title" className="font-display font-bold text-lg text-foreground">
                  {t(activeModalProg.titleKey)}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeProgrammeModal}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step Content */}
            {!routineFinished ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-bold">
                    {t("selfcare.prog.stepCounter", {
                      current: activeStepIndex + 1,
                      total: activeModalProg.steps.length,
                    })}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-lg">
                    <Clock className="h-3 w-3" />
                    <span>
                      {Math.floor(stepTimer / 60)}:{String(stepTimer % 60).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                {/* Step Box */}
                <div className="rounded-2xl bg-muted/40 p-4 border border-border/60 space-y-2">
                  <h3 className="font-bold text-sm text-foreground">
                    {t(activeModalProg.steps[activeStepIndex]?.titleKey)}
                  </h3>
                  <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
                    {t(activeModalProg.steps[activeStepIndex]?.textKey)}
                  </p>
                </div>

                {/* Precautions & Stop Conditions */}
                <div className="rounded-2xl bg-secondary/10 p-3 border border-secondary-strong/20 space-y-1 text-xs">
                  <p className="font-bold text-secondary-strong">
                    {t("selfcare.prog.stopCondition")}:
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {t(activeModalProg.stopConditionsKey)}
                  </p>
                </div>

                {/* Navigation controls */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <Btn
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    disabled={activeStepIndex === 0}
                    className="text-xs font-bold min-h-10 px-4"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 me-1 rtl-mirror" />
                    {t("selfcare.prog.prev")}
                  </Btn>

                  <Btn
                    size="sm"
                    onClick={nextStep}
                    className="text-xs font-bold min-h-10 px-5 flex-1 flex items-center justify-center gap-1"
                  >
                    {activeStepIndex === activeModalProg.steps.length - 1
                      ? t("selfcare.prog.finish")
                      : t("selfcare.prog.next")}
                    <ChevronRight className="h-3.5 w-3.5 ms-1 rtl-mirror" />
                  </Btn>
                </div>
              </div>
            ) : (
              /* Completed celebration card */
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-secondary/20 text-secondary-strong mx-auto flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground">
                  {t("selfcare.prog.completed")}!
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Saved to your personal wellness diary. Remember to rest, hydrate, and take time
                  for yourself.
                </p>
                <div className="pt-2">
                  <Btn onClick={closeProgrammeModal} className="text-xs font-bold min-h-10 px-6">
                    Close Routine
                  </Btn>
                </div>
              </div>
            )}

            {/* Sources & Disclaimers */}
            <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground space-y-2">
              <p className="italic">{t("selfcare.prog.disclaimer")}</p>
              <Sources ids={activeModalProg.sourceIds} />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: INTERACTIVE CALM BREATHING GUIDE                                 */}
      {/* ========================================================================= */}
      {activeBreathingModal && (
        <BreathingGuideModal onClose={() => setActiveBreathingModal(false)} />
      )}
    </div>
  );
}

// NHS-supported 4-4 diaphragmatic breathing guide modal
function BreathingGuideModal({ onClose }) {
  const { t } = useApp();
  const [phase, setPhase] = useState("inhale"); // 'inhale' | 'exhale'
  const [seconds, setSeconds] = useState(4);
  const [audioChimeOn, setAudioChimeOn] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setPhase((curr) => (curr === "inhale" ? "exhale" : "inhale"));
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleChime = () => {
    if (!audioChimeOn) {
      soundscapeEngine.play("breathing_audio");
      setAudioChimeOn(true);
    } else {
      soundscapeEngine.stop("breathing_audio");
      setAudioChimeOn(false);
    }
  };

  const handleClose = () => {
    if (audioChimeOn) {
      soundscapeEngine.stop("breathing_audio");
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="breathing-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
    >
      <div className="w-full max-w-md rounded-3xl bg-card border border-border/80 p-6 shadow-2xl space-y-6 text-center">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Sparkles className="h-4 w-4" />
            <h2 id="breathing-title">{t("selfcare.prog.breathing.title")}</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Breathing Orb Visualization */}
        {!reducedMotion ? (
          <div className="py-6 flex flex-col items-center justify-center">
            <div
              className={cx(
                "w-36 h-36 rounded-full flex items-center justify-center transition-all duration-1000 shadow-xl",
                phase === "inhale"
                  ? "scale-125 bg-gradient-to-tr from-primary/30 to-secondary/40 border-2 border-primary"
                  : "scale-90 bg-gradient-to-tr from-muted to-muted/60 border border-border/60",
              )}
            >
              <span className="font-mono font-extrabold text-2xl text-foreground">{seconds}s</span>
            </div>
            <p className="mt-4 font-display font-bold text-base text-foreground animate-fade-in">
              {phase === "inhale" ? t("selfcare.breathing.inhale") : t("selfcare.breathing.exhale")}
            </p>
          </div>
        ) : (
          <div className="py-8 space-y-2">
            <p className="font-display font-bold text-xl text-primary">
              {phase === "inhale" ? t("selfcare.breathing.inhale") : t("selfcare.breathing.exhale")}
            </p>
            <p className="font-mono text-3xl font-extrabold text-foreground">{seconds}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed px-2">
          {t("selfcare.breathing.paceInfo")}
        </p>

        {/* Options */}
        <div className="pt-2 flex items-center justify-center gap-4 text-xs">
          <button
            type="button"
            onClick={toggleChime}
            className={cx(
              "px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all cursor-pointer",
              audioChimeOn
                ? "bg-primary/10 border-primary text-primary"
                : "border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {audioChimeOn ? (
              <Volume2 className="h-3.5 w-3.5" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" />
            )}
            Sound Chime
          </button>

          <button
            type="button"
            onClick={() => setReducedMotion((v) => !v)}
            className="text-muted-foreground hover:underline"
          >
            {t("selfcare.breathing.reducedMotion")}
          </button>
        </div>

        <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground space-y-1">
          <p className="italic">{t("selfcare.prog.breathing.precautions")}</p>
          <Sources ids={["nhs_breathing", "who_psychological_selfhelp"]} />
        </div>
      </div>
    </div>
  );
}
