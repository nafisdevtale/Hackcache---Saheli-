import { useState, useRef, useEffect, useCallback } from "react";
import { validatePatternInput } from "@/lib/authLock.ts";

/**
 * Saheli 11.0 — Accessible 3x3 Touch Pattern Lock Component
 *
 * Implements:
 * - Pointer / touch event tracking across 3x3 grid (nodes 0 to 8)
 * - Visual connect lines and node activation rings
 * - Accessible alternative (keyboard arrow/number selection)
 * - Automatic reset on release / invalid attempt
 */
export function PatternLockCanvas({ onComplete, error = false, disabled = false, t }) {
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPointer, setCurrentPointer] = useState(null);
  const containerRef = useRef(null);

  // 3x3 grid node coordinates in SVG canvas (300 x 300)
  const nodeCoords = [
    { id: 0, x: 50, y: 50 },
    { id: 1, x: 150, y: 50 },
    { id: 2, x: 250, y: 50 },
    { id: 3, x: 50, y: 150 },
    { id: 4, x: 150, y: 150 },
    { id: 5, x: 250, y: 150 },
    { id: 6, x: 50, y: 250 },
    { id: 7, x: 150, y: 250 },
    { id: 8, x: 250, y: 250 },
  ];

  const getNodeAtPoint = useCallback((clientX, clientY) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 300;
    const y = ((clientY - rect.top) / rect.height) * 300;

    for (const node of nodeCoords) {
      const dist = Math.hypot(node.x - x, node.y - y);
      if (dist <= 30) return node.id;
    }
    return null;
  }, []);

  const handlePointerDown = (e) => {
    if (disabled) return;
    const nodeId = getNodeAtPoint(e.clientX, e.clientY);
    if (nodeId !== null) {
      setIsDrawing(true);
      setSelectedNodes([nodeId]);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDrawing || disabled) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX) => ((clientX - rect.left) / rect.width) * 300)(e.clientX);
    const y = ((clientY) => ((clientY - rect.top) / rect.height) * 300)(e.clientY);
    setCurrentPointer({ x, y });

    const nodeId = getNodeAtPoint(e.clientX, e.clientY);
    if (nodeId !== null && !selectedNodes.includes(nodeId)) {
      setSelectedNodes((prev) => [...prev, nodeId]);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setCurrentPointer(null);

    if (selectedNodes.length >= 4) {
      onComplete([...selectedNodes]);
    } else if (selectedNodes.length > 0) {
      // Too short
      setSelectedNodes([]);
    }
  };

  // Keyboard accessibility: Allow typing numbers 1-9 to build pattern
  const handleKeyDown = (e) => {
    if (disabled) return;
    const keyNum = parseInt(e.key, 10);
    if (keyNum >= 1 && keyNum <= 9) {
      const nodeId = keyNum - 1;
      if (!selectedNodes.includes(nodeId)) {
        const next = [...selectedNodes, nodeId];
        setSelectedNodes(next);
        if (next.length >= 4) {
          // If Enter pressed or user decides, they submit
        }
      }
    } else if (e.key === "Enter" && selectedNodes.length >= 4) {
      onComplete([...selectedNodes]);
    } else if (e.key === "Backspace" || e.key === "Escape") {
      setSelectedNodes([]);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center space-y-4 touch-none select-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label={t("lock.patternAria") || "3x3 Pattern Lock Canvas"}
    >
      <div
        ref={containerRef}
        className={`relative w-72 h-72 rounded-3xl border-2 transition-all p-2 ${
          error ? "border-destructive/60 bg-destructive/5" : "border-border/60 bg-card/80 shadow-md"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {/* Connecting lines between selected nodes */}
          {selectedNodes.map((nodeId, idx) => {
            if (idx === 0) return null;
            const prev = nodeCoords[selectedNodes[idx - 1]];
            const curr = nodeCoords[nodeId];
            return (
              <line
                key={`line-${idx}`}
                x1={prev.x}
                y1={prev.y}
                x2={curr.x}
                y2={curr.y}
                stroke="var(--color-primary)"
                strokeWidth="6"
                strokeLinecap="round"
                className="opacity-80"
              />
            );
          })}

          {/* Line to current pointer */}
          {isDrawing && currentPointer && selectedNodes.length > 0 && (
            <line
              x1={nodeCoords[selectedNodes[selectedNodes.length - 1]].x}
              y1={nodeCoords[selectedNodes[selectedNodes.length - 1]].y}
              x2={currentPointer.x}
              y2={currentPointer.y}
              stroke="var(--color-primary)"
              strokeWidth="4"
              strokeDasharray="4 4"
              strokeLinecap="round"
              className="opacity-60"
            />
          )}

          {/* 3x3 Nodes */}
          {nodeCoords.map((node) => {
            const isSelected = selectedNodes.includes(node.id);
            return (
              <g key={`node-${node.id}`}>
                {/* Outer ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="24"
                  className={`transition-all duration-150 ${
                    isSelected
                      ? "fill-primary/20 stroke-primary stroke-2"
                      : "fill-muted/20 stroke-muted-foreground/30 stroke-1 hover:stroke-primary/50"
                  }`}
                />
                {/* Center dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? "8" : "6"}
                  className={`transition-all duration-150 ${
                    isSelected ? "fill-primary" : "fill-muted-foreground/70"
                  }`}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSelectedNodes([])}
          disabled={selectedNodes.length === 0 || disabled}
          className="text-xs text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer disabled:opacity-40"
        >
          {t("common.reset") || "Clear Pattern"}
        </button>
        {selectedNodes.length >= 4 && (
          <button
            type="button"
            onClick={() => onComplete([...selectedNodes])}
            disabled={disabled}
            className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow hover:bg-primary/90 cursor-pointer"
          >
            {t("lock.unlock") || "Submit"}
          </button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground text-center">
        {t("lock.patternHint") || "Connect 4 or more dots. You can also use number keys 1-9."}
      </p>
    </div>
  );
}
