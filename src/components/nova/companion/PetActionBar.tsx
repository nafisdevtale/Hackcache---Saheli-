/**
 * Saheli 10.3 — Living Companion Action Bar
 *
 * Provides a clean, tactile set of care actions:
 * - Feed: Drops treat into feeding bowl
 * - Play: Throws toy into play area
 * - Groom: Gentle brushing motion
 * - Rest/Wake: Guides pet to resting nook or wakes them gently
 * - Affection: Gives love and heart sparkles
 */

import React from "react";
import { Sparkles, Heart, Moon, Utensils, Award } from "lucide-react";
import { useApp } from "@/App.jsx";
import { getPetPersonality } from "@/lib/companion/petPersonality";

export interface PetActionBarProps {
  speciesId: string;
  onAction: (actionType: "feed" | "play" | "brush" | "rest" | "affection") => void;
  isSleeping?: boolean;
}

export const PetActionBar: React.FC<PetActionBarProps> = ({
  speciesId,
  onAction,
  isSleeping = false,
}) => {
  const { t } = useApp();
  const personality = getPetPersonality(speciesId);

  const handleActionClick = (actionType: "feed" | "play" | "brush" | "rest" | "affection") => {
    // Dispatch custom event to notify InteractiveHabitat
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("saheli:companion-care", { detail: { action: actionType } }),
      );
    }
    onAction(actionType);
  };

  return (
    <section aria-label="Care Actions" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-sm sm:text-base text-foreground tracking-tight">
          {t("companion.careActions")}
        </h3>
        <span className="text-xs text-muted-foreground font-medium">
          {t("pet.growthAssurance")}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* 1. Feed */}
        <button
          type="button"
          onClick={() => handleActionClick("feed")}
          className="nova-card-interactive p-4 flex flex-col items-center text-center group cursor-pointer select-none tactile-press"
        >
          <div className="rounded-2xl bg-pink-100 dark:bg-pink-950/40 p-2.5 text-pink-600 mb-1.5 group-hover:scale-110 transition-transform">
            <span className="text-xl">{personality.treatEmoji}</span>
          </div>
          <span className="font-bold text-xs text-foreground">{t("companion.actionFeed")}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
            {t(personality.favoriteTreatKey)}
          </span>
        </button>

        {/* 2. Play */}
        <button
          type="button"
          onClick={() => handleActionClick("play")}
          className="nova-card-interactive p-4 flex flex-col items-center text-center group cursor-pointer select-none tactile-press"
        >
          <div className="rounded-2xl bg-amber-100 dark:bg-amber-950/40 p-2.5 text-amber-600 mb-1.5 group-hover:scale-110 transition-transform">
            <span className="text-xl">{personality.toyEmoji}</span>
          </div>
          <span className="font-bold text-xs text-foreground">{t("companion.actionPlay")}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
            {t(personality.favoriteToyKey)}
          </span>
        </button>

        {/* 3. Brush / Groom */}
        <button
          type="button"
          onClick={() => handleActionClick("brush")}
          className="nova-card-interactive p-4 flex flex-col items-center text-center group cursor-pointer select-none tactile-press"
        >
          <div className="rounded-2xl bg-teal-100 dark:bg-teal-950/40 p-2.5 text-teal-600 mb-1.5 group-hover:scale-110 transition-transform">
            <span className="text-xl">🪮</span>
          </div>
          <span className="font-bold text-xs text-foreground">{t("companion.actionGroom")}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
            {t("pet.act.brushSub")}
          </span>
        </button>

        {/* 4. Rest / Wake */}
        <button
          type="button"
          onClick={() => handleActionClick("rest")}
          className="nova-card-interactive p-4 flex flex-col items-center text-center group cursor-pointer select-none tactile-press"
        >
          <div className="rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 p-2.5 text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform">
            <span className="text-xl">{isSleeping ? "☀️" : "💤"}</span>
          </div>
          <span className="font-bold text-xs text-foreground">{t("companion.actionRest")}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
            {t("pet.act.restSub")}
          </span>
        </button>

        {/* 5. Give Affection */}
        <button
          type="button"
          onClick={() => handleActionClick("affection")}
          className="col-span-2 sm:col-span-1 nova-card-interactive p-4 flex flex-col items-center text-center group cursor-pointer select-none tactile-press"
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
  );
};
