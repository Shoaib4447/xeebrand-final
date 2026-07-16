/**
 * XEEBRAND DOF Controller — `lib/three/useDOFController.ts`
 *
 * Depth-of-field focus-rack system for Scene 3 (Capabilities lateral pass).
 *
 * Per cinematic spec §3: "DOF sharpens on the active panel, blurs the others —
 * directing attention without an arrow or spotlight. Invisible UX."
 *
 * Scroll range: 0.20 → 0.42 (Scene 3 only — zero cost outside this range).
 *
 * bokehScale curve (spec § Task 3):
 *   0.20 → 0.22:  ramp 0 → 4         (enter DOF as Scene 3 begins)
 *   0.22 → 0.40:  hold 4 with V-dips  (focus racks between panels)
 *     at each panel boundary (0.26, 0.32, 0.38): dip 4 → 0 → 4 over ±DIP_HALF
 *   0.40 → 0.42:  ramp 4 → 0         (dissolve out as Scene 3 ends)
 *   all other:    0                   (no DOF, no GPU cost)
 *
 * The LERP_RATE (0.1/frame) produces ~10-frame transitions ≈ 167ms at 60fps.
 *
 * Architecture:
 *   - DOFPass creates the DepthOfFieldEffect ref, passes it here.
 *   - useDOFController registers a P2 useAnimationTick callback that:
 *       1. Reads raw scroll progress from a passive event listener (no re-renders)
 *       2. Computes target bokehScale
 *       3. Lerps bokehScaleRef toward target
 *       4. Writes result to effectRef.current.bokehScale (imperative update)
 *   - Returns bokehScaleRef for external consumers (SceneTransition Task 6).
 *
 * Tier A only — DOFPass is never rendered on Tier B/C (SceneCanvas gates this).
 * prefers-reduced-motion — target held at 0; DOF stays off.
 */

import { useEffect, useRef } from "react";
import type { DepthOfFieldEffect } from "postprocessing";
import { useAnimationTick } from "@/components/three/AnimatedObject";
import { useReducedMotion } from "@/lib/store";

// ─── Scene 3 DOF curve constants ─────────────────────────────────────────────

/** Scene 3 scroll progress range — per cinematic spec §2 */
const S3_START = 0.20;
const S3_END   = 0.42;

/** First/last 2% of Scene 3 — fade in/out ramp */
const RAMP_WIDTH = 0.02;

/** Panel transition points: where the camera crosses between capability panels */
const PANEL_TRANSITIONS = [0.26, 0.32, 0.38] as const;

/** Half-width of transition dip zone (±0.018 = ~8% of scene width per dip) */
const DIP_HALF = 0.018;

/** Maximum blur intensity (0 = sharp, 4 = strongly blurred background) */
const MAX_BOKEH = 4;

/** Per-frame lerp rate: 0.1 ≈ 10 frames at 60fps ≈ 167ms transition */
const LERP_RATE = 0.1;

// ─── Target computation ──────────────────────────────────────────────────────

/**
 * Pure function — computes instantaneous bokehScale target for a given scroll
 * progress. The lerp in the tick callback handles all temporal smoothing.
 */
function computeTarget(scrollProgress: number): number {
  // Zero cost outside Scene 3
  if (scrollProgress < S3_START || scrollProgress > S3_END) return 0;

  // Fade-in ramp (entering Scene 3)
  if (scrollProgress < S3_START + RAMP_WIDTH) {
    return ((scrollProgress - S3_START) / RAMP_WIDTH) * MAX_BOKEH;
  }

  // Fade-out ramp (exiting Scene 3)
  if (scrollProgress > S3_END - RAMP_WIDTH) {
    return ((S3_END - scrollProgress) / RAMP_WIDTH) * MAX_BOKEH;
  }

  // Panel transition dips — focus rack between capability panels
  // V-shape: value is 0 at the exact transition, 4 at DIP_HALF distance either side
  for (const t of PANEL_TRANSITIONS) {
    const distance = Math.abs(scrollProgress - t);
    if (distance < DIP_HALF) {
      // Normalize to [0, 1]: 1 at edges, 0 at center
      return (distance / DIP_HALF) * MAX_BOKEH;
    }
  }

  return MAX_BOKEH; // fully active between transitions
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Drives the DepthOfField effect imperatively via a P2 animation tick.
 *
 * Must be called inside a component within `<Canvas>` + `<AnimationProvider>`.
 *
 * @param effectRef  Ref to the DepthOfFieldEffect instance (owned by DOFPass).
 *                   The hook writes to effectRef.current.bokehScale each frame.
 * @returns          bokehScaleRef — current lerped value, read by SceneTransition.
 */
export function useDOFController(
  effectRef: React.RefObject<DepthOfFieldEffect | null>,
): React.MutableRefObject<number> {
  const reducedMotion    = useReducedMotion();
  const scrollProgressRef = useRef(0);
  const bokehScaleRef    = useRef(0);

  // ── Passive scroll tracking — no re-renders, no Zustand overhead ──────────
  // Scroll progress is read in the RAF tick, not in React render.
  // Writing to a ref in an event handler is not a render-phase operation —
  // react-hooks/refs only bans reads/writes during the render pass.
  useEffect(() => {
    const onScroll = () => {
      const { scrollHeight, clientHeight } = document.documentElement;
      const total = scrollHeight - clientHeight;
      scrollProgressRef.current = total > 0 ? window.scrollY / total : 0;
    };
    onScroll(); // seed initial value before first scroll event
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── P2 tick: compute → lerp → write to effect ─────────────────────────────
  //
  // Priority 2 runs LAST — after spring math (P0) and transform writes (P1).
  // Post-processing uniform writes must come after all scene state is settled.
  //
  // eslint-disable react-hooks/immutability -- DepthOfFieldEffect is an
  // imperative postprocessing.js object. Mutating .bokehScale inside useFrame
  // is the prescribed R3F+postprocessing pattern (no re-render involved).
  useAnimationTick(() => {
    // Reduced motion: lock at 0, nothing to compute
    if (reducedMotion) {
      if (bokehScaleRef.current !== 0) {
        bokehScaleRef.current = 0;
        if (effectRef.current) effectRef.current.bokehScale = 0;
      }
      return;
    }

    const target = computeTarget(scrollProgressRef.current);

    // Lerp toward target — exponential approach, frame-rate independent
    bokehScaleRef.current += (target - bokehScaleRef.current) * LERP_RATE;

    // Clamp to prevent floating-point overshoot artifacts
    if (Math.abs(bokehScaleRef.current - target) < 0.001) {
      bokehScaleRef.current = target;
    }

    // Write to effect — guard against unmounted phase (first few frames)
    if (effectRef.current) {
      effectRef.current.bokehScale = bokehScaleRef.current;
    }
  }, 2);
  // eslint-enable react-hooks/immutability

  return bokehScaleRef;
}
