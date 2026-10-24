import React, { useEffect, useRef, useState } from "react";
import { X, Sparkles, Trophy, RotateCcw } from "lucide-react";
import { PetMiniGameController, MiniGameType } from "@/lib/companion/petMiniGames";

interface MiniGameOverlayProps {
  controller: PetMiniGameController;
  activeGame: MiniGameType;
  onExitGame: () => void;
  t: (key: string, fallback?: string) => string;
}

export const MiniGameOverlay: React.FC<MiniGameOverlayProps> = ({
  controller,
  activeGame,
  onExitGame,
  t,
}) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastPointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    controller.setListener({
      onScoreUpdate: (s, strk) => {
        setScore(s);
        setStreak(strk);
      },
      onPetReaction: () => {
        setRenderTrigger((prev) => prev + 1);
      },
      onGazeTarget: () => {
        // Gaze is dispatched to the companion stage controller
      },
    });

    // 60fps render tick for ball & toy positions
    let frameId: number;
    const tick = () => {
      setRenderTrigger((prev) => (prev + 1) % 100000);
      frameId = requestAnimationFrame(tick);
    };
    if (activeGame === "catch_ball" || activeGame === "follow_toy") {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [controller, activeGame]);

  if (activeGame === "none") return null;

  // Handle pointer events for Catch the Ball
  const handleBallPointerDown = (e: React.PointerEvent) => {
    if (activeGame !== "catch_ball") return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;
    lastPointerPos.current = { x: e.clientX, y: e.clientY };
    controller.holdBall(normX, normY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;

    if (activeGame === "catch_ball" && isDraggingRef.current) {
      const deltaX = (e.clientX - lastPointerPos.current.x) * 0.1;
      const deltaY = (e.clientY - lastPointerPos.current.y) * 0.1;
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      controller.moveHeldBall(normX, normY, deltaX, deltaY);
    } else if (activeGame === "follow_toy") {
      controller.moveToy(normX, normY);
    }
  };

  const handlePointerUp = () => {
    if (activeGame === "catch_ball" && isDraggingRef.current) {
      isDraggingRef.current = false;
      controller.releaseBall();
    }
  };

  // Stage tap fallback for tossing ball
  const handleStageClick = (e: React.MouseEvent) => {
    if (activeGame === "catch_ball" && !controller.ball.isHeld) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const targetPercentX = ((e.clientX - rect.left) / rect.width) * 100;
      const targetPercentY = ((e.clientY - rect.top) / rect.height) * 100;
      controller.throwBallTo(targetPercentX, targetPercentY);
    }
  };

  const gameTitle =
    activeGame === "catch_ball"
      ? t("companion.gameCatchBall", "Catch the Ball")
      : activeGame === "follow_toy"
        ? t("companion.gameFollowToy", "Follow the Toy")
        : t("companion.gameFindTreat", "Find the Treat");

  // Cup layout percentages for Find the Treat
  const cupPositions = [22, 50, 78];

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-30 pointer-events-auto select-none overflow-hidden touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleStageClick}
      data-testid="mini-game-overlay"
    >
      {/* Top HUD: Game Title, Score Badge, Exit */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-40">
        <div className="flex items-center gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-rose-100 dark:border-zinc-800">
          <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
            {gameTitle}
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Score Counter */}
          <div className="flex items-center gap-1.5 bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-sm">
            <Trophy className="w-3.5 h-3.5" />
            <span>
              {t("companion.gameScore", "Score")}: {score}
            </span>
            {streak > 1 && (
              <span className="ml-1 bg-white/25 px-1.5 py-0.5 rounded-full text-[10px]">
                {streak}x
              </span>
            )}
          </div>

          {/* Close Game Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExitGame();
            }}
            className="p-1.5 bg-white/90 dark:bg-zinc-800/90 hover:bg-rose-50 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-700 transition-colors"
            aria-label={t("companion.gameExit", "Exit Game")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* GAME 1: CATCH THE BALL */}
      {activeGame === "catch_ball" && (
        <>
          {/* Shadow beneath ball */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900/15 blur-[2px] transition-all pointer-events-none"
            style={{
              left: `${controller.ball.x}%`,
              top: "84%",
              width: `${Math.max(12, 34 - controller.ball.y * 0.25)}px`,
              height: `${Math.max(4, 10 - controller.ball.y * 0.08)}px`,
            }}
          />

          {/* Bouncing Ball */}
          <div
            onPointerDown={handleBallPointerDown}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full cursor-grab active:cursor-grabbing shadow-md border-2 border-white/80 transition-transform active:scale-110 flex items-center justify-center pointer-events-auto"
            style={{
              left: `${controller.ball.x}%`,
              top: `${controller.ball.y}%`,
              background: "radial-gradient(circle at 35% 35%, #fb7185, #e11d48, #9f1239)",
            }}
            role="button"
            tabIndex={0}
            aria-label={t("companion.gameBallAria", "Play ball: drag and throw")}
          >
            {/* Sparkle star on ball */}
            <div className="w-2 h-2 rounded-full bg-white/70 absolute top-1.5 left-2" />
          </div>

          {/* Floating Helper Tip */}
          <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none">
            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-sm px-3 py-1 rounded-full shadow-xs border border-zinc-200/60 dark:border-zinc-800">
              {t("companion.gameBallTip", "Drag and fling the ball or tap anywhere to toss!")}
            </span>
          </div>
        </>
      )}

      {/* GAME 2: FOLLOW THE TOY */}
      {activeGame === "follow_toy" && (
        <>
          {/* Sparkle wand / feather toy */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform"
            style={{
              left: `${controller.toy.x}%`,
              top: `${controller.toy.y}%`,
              transform: `translate(-50%, -50%) scale(${controller.toy.isPounced ? "1.3" : "1"}) rotate(${renderTrigger % 2 === 0 ? "8deg" : "-8deg"})`,
            }}
          >
            <div className="relative flex items-center justify-center">
              {/* Wand stem */}
              <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-rose-400 rotate-45 rounded-full shadow-xs" />
              {/* Feather tassel */}
              <div className="absolute -top-3 -right-2 flex gap-1">
                <div className="w-4 h-7 bg-rose-400 rounded-full rotate-25 shadow-xs" />
                <div className="w-3.5 h-6 bg-amber-300 rounded-full -rotate-15 shadow-xs" />
                <div className="w-3 h-5 bg-teal-400 rounded-full rotate-45 shadow-xs" />
              </div>
              {/* Sparkle ring */}
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-300/40 animate-ping" />
            </div>
          </div>

          {/* Helper Tip */}
          <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none">
            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-sm px-3 py-1 rounded-full shadow-xs border border-zinc-200/60 dark:border-zinc-800">
              {t(
                "companion.gameToyTip",
                "Move your finger across the stage — watch your pet pounce!",
              )}
            </span>
          </div>
        </>
      )}

      {/* GAME 3: FIND THE TREAT */}
      {activeGame === "find_treat" && (
        <div className="absolute inset-0 flex flex-col justify-end pb-8">
          {/* Shell Cups & Treats Container */}
          <div className="relative w-full h-36">
            {controller.cups.map((cup) => {
              const posX = cupPositions[cup.positionIndex] ?? 50;
              const isChosen = controller.selectedCupId === cup.id;

              return (
                <div
                  key={cup.id}
                  className="absolute -translate-x-1/2 bottom-0 flex flex-col items-center transition-all duration-300"
                  style={{
                    left: `${posX}%`,
                  }}
                >
                  {/* Treat beneath the cup */}
                  {cup.hasTreat && (
                    <div
                      className="absolute bottom-2 flex flex-col items-center transition-opacity duration-300"
                      style={{
                        opacity: cup.isLifted ? 1 : 0,
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-md border-2 border-amber-200 animate-bounce">
                        <span className="text-base">⭐</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-300 mt-1">
                        {t("companion.gameTreatLabel", "Treat!")}
                      </span>
                    </div>
                  )}

                  {/* Cup graphic button */}
                  <button
                    type="button"
                    disabled={controller.treatState !== "pick"}
                    onClick={(e) => {
                      e.stopPropagation();
                      controller.chooseCup(cup.id);
                    }}
                    className={`relative z-10 w-16 h-18 rounded-t-2xl shadow-lg border-2 transition-all duration-400 flex flex-col items-center justify-center ${
                      controller.treatState === "pick"
                        ? "cursor-pointer hover:-translate-y-1 hover:shadow-xl active:scale-95"
                        : "cursor-default"
                    } ${
                      isChosen && cup.hasTreat
                        ? "bg-emerald-500 border-emerald-300 text-white"
                        : isChosen && !cup.hasTreat
                          ? "bg-rose-500 border-rose-300 text-white"
                          : "bg-gradient-to-b from-indigo-500 to-indigo-700 border-indigo-300 text-indigo-100"
                    }`}
                    style={{
                      transform: cup.isLifted ? "translateY(-48px)" : "translateY(0)",
                    }}
                    aria-label={`${t("companion.gameCupLabel", "Bowl")} ${cup.id + 1}`}
                  >
                    <div className="w-10 h-1.5 rounded-full bg-white/30 mb-2" />
                    <span className="text-xs font-black tracking-wider">#{cup.id + 1}</span>
                    <div className="w-12 h-1 rounded-full bg-black/20 mt-2" />
                  </button>

                  {/* Shadow under cup */}
                  <div className="w-14 h-3 rounded-full bg-zinc-900/20 blur-[1px] mt-1" />
                </div>
              );
            })}
          </div>

          {/* Status Message / Action */}
          <div className="mt-4 flex flex-col items-center gap-2">
            {controller.treatState === "intro" && (
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-white/90 dark:bg-zinc-900/90 px-3 py-1 rounded-full shadow-xs">
                {t("companion.gameTreatWatch", "Watch where the treat goes!")}
              </span>
            )}
            {controller.treatState === "shuffling" && (
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-white/90 dark:bg-zinc-900/90 px-3 py-1 rounded-full shadow-xs animate-pulse">
                {t("companion.gameTreatShuffling", "Shuffling bowls...")}
              </span>
            )}
            {controller.treatState === "pick" && (
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-white/95 dark:bg-zinc-900/95 px-4 py-1.5 rounded-full shadow-md animate-bounce">
                {t("companion.gameTreatPick", "Tap the bowl with the treat!")}
              </span>
            )}
            {controller.treatState === "revealed" && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full shadow-xs bg-white/90 dark:bg-zinc-900/90">
                  {controller.cups.find((c) => c.id === controller.selectedCupId)?.hasTreat
                    ? `🎉 ${t("companion.gameTreatWon", "You found it! Your pet loved it!")}`
                    : `✨ ${t("companion.gameTreatTryAgain", "Nice try! Here it was!")}`}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    controller.startTreatRound();
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded-full shadow-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t("companion.gamePlayAgain", "Play Again")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
