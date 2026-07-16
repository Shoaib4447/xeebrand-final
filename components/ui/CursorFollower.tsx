/**
 * XEEBRAND CursorFollower — `components/ui/CursorFollower.tsx`
 *
 * Custom cursor system — Tier A, desktop (fine pointer) only.
 * Per 3D Interaction Framework §3 and Luxury UI System §2.7.
 *
 * States (per spec):
 *
 * 1. Default — 8px filled dot, fades in on mount
 *    Trigger:  mount
 *    Duration: 200ms (--duration-fast) fade-in
 *    UX:       Signals "designed cursor," primes expectation before first hover.
 *
 * 2. Hover-interactive — scales to ring (2.5× size), inverts fill
 *    Trigger:  pointerenter on [data-cursor="interactive"]
 *    Duration: 200ms (--duration-fast), --ease-entrance
 *    UX:       Communicates "this is clickable" over Canvas elements where
 *              a normal arrow cursor can't convey interactivity.
 *
 * 3. Drag/scrub — swaps to ↔ glyph
 *    Trigger:  pointerenter on [data-cursor="drag"]
 *    Duration: 150ms
 *    UX:       Tells user HOW to interact (drag horizontally) before they try.
 *
 * Disabled on:
 *   - Coarse pointer devices (touch)
 *   - Tier B/C (no custom cursor cost for zero benefit on mobile)
 *
 * Implementation: position: fixed, pointer-events: none, z-index: 9999.
 * Moves via CSS transform (GPU composited, not layout-triggering).
 * Lerps at 0.15/frame for a trailing feel — not 1:1 (that reads as broken).
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useTier, useReducedMotion } from "@/lib/store";

type CursorMode = "default" | "interactive" | "drag";

export function CursorFollower() {
  const tier          = useTier();
  const reducedMotion = useReducedMotion();
  const dotRef        = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<CursorMode>("default");
  const [visible, setVisible] = useState(false);

  const target  = useRef({ x: -100, y: -100 });
  const current = useRef({ x: -100, y: -100 });
  const rafRef  = useRef<number | null>(null);

  // Only mount on fine-pointer Tier A desktop, not reduced-motion
  const isActive = tier === "A" && !reducedMotion;

  useEffect(() => {
    if (!isActive) return;

    const onMove = (e: PointerEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    };

    const onEnterInteractive = (e: Event) => {
      const el = e.target;
      // e.target can be a TextNode or SVG which has no .closest()
      if (!(el instanceof Element)) return;
      const cursorType = el.closest("[data-cursor]")?.getAttribute("data-cursor");
      if (cursorType === "interactive") setMode("interactive");
      else if (cursorType === "drag")    setMode("drag");
    };

    const onLeaveInteractive = () => setMode("default");

    const tick = () => {
      const LERP = 0.15;
      current.current.x += (target.current.x - current.current.x) * LERP;
      current.current.y += (target.current.y - current.current.y) * LERP;

      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate(${current.current.x}px, ${current.current.y}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerenter", onEnterInteractive, true);
    document.addEventListener("pointerleave", onLeaveInteractive, true);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerenter", onEnterInteractive, true);
      document.removeEventListener("pointerleave", onLeaveInteractive, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, visible]);

  if (!isActive) return null;

  const isInteractive = mode === "interactive";
  const isDrag        = mode === "drag";

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-9999 -translate-x-1/2 -translate-y-1/2"
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity 200ms ease`,
        willChange: "transform",
      }}
    >
      {isDrag ? (
        /* Drag indicator — horizontal arrows glyph */
        <div
          className="flex items-center justify-center"
          style={{
            width:  36,
            height: 36,
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(4px)",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            fontSize: 14,
            transition: "all 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          ↔
        </div>
      ) : (
        /* Default dot / interactive ring */
        <div
          style={{
            width:        isInteractive ? 20 : 8,
            height:       isInteractive ? 20 : 8,
            borderRadius: "50%",
            background:   isInteractive ? "transparent" : "var(--xee-magenta)",
            border:       isInteractive ? "1.5px solid var(--xee-magenta)" : "none",
            transform:    `scale(${isInteractive ? 2.5 : 1})`,
            transformOrigin: "center",
            transition:   "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
            mixBlendMode:  isInteractive ? "normal" : "normal",
          }}
        />
      )}
    </div>
  );
}
