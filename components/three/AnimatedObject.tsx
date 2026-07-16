/**
 * XEEBRAND AnimatedObject — `components/three/AnimatedObject.tsx`
 *
 * Single-ticker animation system. ONE useFrame per Canvas drives everything.
 *
 * Why this exists (interaction spec §9, rule 1):
 *   Per-component useFrame calls are all batched by R3F into one RAF already,
 *   but they execute in mount-order with no guaranteed sequencing. This system
 *   adds three guarantees the site needs:
 *
 *   1. Priority ordering — spring math (P0) always settles BEFORE mesh transform
 *      writes (P1) read it. Without this, a 1-frame lag exists between a spring
 *      target changing and the mesh reflecting it.
 *
 *   2. Tier B 30fps cap — one central check, not duplicated in every component.
 *      Delta is ACCUMULATED, not discarded, so lerp math stays physically correct
 *      at 30fps (each fired frame gets ~33ms delta instead of ~16ms).
 *
 *   3. Page Visibility pause — ticker stops when document.hidden. Without this,
 *      GPU is consumed for a tab the user cannot see.
 *
 * Priority dispatch order (per frame):
 *   P0 — spring math: lerp computations, target resolution, velocity integration
 *   P1 — transform writes: mesh.position.set, group.scale.setScalar, rotation.*
 *   P2 — post-processing: bokehScale uniform writes (Task 3, DOF system)
 *
 * Reduced-motion contract:
 *   P0 always runs (entrance opacity fades need spring values even under reduced-motion).
 *   useReducedMotionTick() registers a P1 callback that is a no-op when
 *   prefers-reduced-motion is active — components use this for visual transforms only.
 *
 * Usage:
 *   // In SceneCanvas.tsx, inside <Canvas>:
 *   <AnimationProvider>
 *     <XMark />        // registers via useAnimationTick at P0 + P1
 *     <ParticleField / > // registers at P1
 *   </AnimationProvider>
 *
 *   // In any Canvas child:
 *   useAnimationTick((state, delta) => {
 *     myRef.current.rotation.y += delta * 0.5;
 *   }, 1);
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { useFrame } from "@react-three/fiber";
import type { RootState } from "@react-three/fiber";
import { useTier, useReducedMotion } from "@/lib/store";
import { springs as defaultSprings } from "@/lib/tokens";

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * 0 = spring/lerp math   (runs first — settle values before writes)
 * 1 = transform writes   (mesh.position.set, group.scale.setScalar, etc.)
 * 2 = post-processing    (uniform writes, bokehScale, etc.)
 */
export type TickPriority = 0 | 1 | 2;

/** Callback signature — mirrors R3F's useFrame callback. */
export type TickCallback = (
  state:  RootState,
  delta:  number,
  /** XRFrame when in WebXR session, undefined otherwise */
  frame?: XRFrame
) => void;

export interface SpringConfig {
  tension:  number;
  friction: number;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AnimationContextValue {
  /**
   * Register a per-frame callback at the given priority level.
   * Returns an `unsubscribe` function — call it in useEffect cleanup.
   *
   * The callback reference is kept fresh automatically; you do NOT need
   * to re-call subscribe when the callback function identity changes.
   */
  subscribe: (cb: TickCallback, priority: TickPriority) => () => void;
}

const AnimationContext = createContext<AnimationContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Mount inside <Canvas> — NOT outside it. useFrame requires R3F context.
 * SceneCanvas.tsx places this inside <Canvas> before <Suspense>.
 */
export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const tier = useTier();

  // Three priority buckets — Set for O(1) add/delete with stable iteration order
  const buckets = useRef<[Set<TickCallback>, Set<TickCallback>, Set<TickCallback>]>([
    new Set<TickCallback>(), // P0 — spring math
    new Set<TickCallback>(), // P1 — transform writes
    new Set<TickCallback>(), // P2 — post-processing
  ]);

  // Page Visibility API — pause when tab is hidden (saves GPU)
  const paused = useRef(false);
  useEffect(() => {
    const onVisibility = () => { paused.current = document.hidden; };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Tier B throttle accumulator — accumulate delta across skipped frames so
  // spring/lerp math stays physically correct at 30fps (never loses time budget)
  const timerB = useRef(0);
  const TARGET_DELTA_B = 1 / 30; // 33.3ms between ticks at 30fps cap

  // ── Single root ticker ────────────────────────────────────────────────────
  useFrame((state, delta, frame) => {
    // Pause when page is hidden
    if (paused.current) return;

    let effectiveDelta = delta;

    // Tier B: throttle to 30fps — skip frames but accumulate time budget
    if (tier === "B") {
      timerB.current += delta;
      if (timerB.current < TARGET_DELTA_B) return;
      effectiveDelta   = timerB.current; // fire with accumulated delta
      timerB.current   = 0;
    }

    const [p0, p1, p2] = buckets.current;

    // P0 — spring math (always runs, even under reduced-motion)
    for (const cb of p0) cb(state, effectiveDelta, frame);

    // P1 — transform writes
    // Under reduced-motion: callbacks registered via useReducedMotionTick are
    // no-ops already. Regular P1 callbacks still run for entrance scale/opacity.
    for (const cb of p1) cb(state, effectiveDelta, frame);

    // P2 — post-processing uniforms
    for (const cb of p2) cb(state, effectiveDelta, frame);
  });

  // ── Stable subscribe function — never changes identity ───────────────────
  const subscribe = useCallback((cb: TickCallback, priority: TickPriority): (() => void) => {
    buckets.current[priority].add(cb);
    return () => buckets.current[priority].delete(cb);
  }, []); // empty deps — buckets.current is a ref, always the same object

  // useMemo is safe here: subscribe is stable (useCallback []) so value is stable.
  // Cannot use useRef.current in render (react-hooks/refs); useMemo is the correct pattern.
  const value = useMemo<AnimationContextValue>(() => ({ subscribe }), [subscribe]);

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Register a per-frame callback at the given priority level.
 *
 * The callback reference is automatically kept fresh — you can safely
 * reference props/state inside the callback without stale closure issues.
 *
 * Must be called inside a component that is a descendant of <AnimationProvider>.
 *
 * @example
 * useAnimationTick((_, delta) => {
 *   meshRef.current.rotation.y += delta * 0.5;
 * }, 1);
 */
export function useAnimationTick(cb: TickCallback, priority: TickPriority = 1): void {
  const ctx   = useContext(AnimationContext);
  const cbRef = useRef<TickCallback>(cb);

  // useLayoutEffect: runs after DOM commit, before paint — guaranteed to complete
  // before the next RAF fires. Safe to update the ref here for the "latest ref" pattern.
  useLayoutEffect(() => {
    cbRef.current = cb;
  });

  useEffect(() => {
    if (!ctx) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "[AnimatedObject] useAnimationTick called outside <AnimationProvider>. " +
          "Ensure AnimationProvider is inside <Canvas> in SceneCanvas.tsx."
        );
      }
      return;
    }
    // Subscribe a stable wrapper that always calls the latest cb
    const stable: TickCallback = (s, d, f) => cbRef.current(s, d, f);
    return ctx.subscribe(stable, priority);
  }, [ctx, priority]); // re-subscribe only if provider or priority changes
}

/**
 * Like `useAnimationTick` at Priority 1, but the callback is a no-op when
 * `prefers-reduced-motion: reduce` is active. Use this for all visual-only
 * transforms (rotation, parallax, idle motion) — not for entrance scale/opacity
 * which should still run under reduced-motion.
 *
 * @example
 * useReducedMotionTick((_, delta) => {
 *   // This runs at 60fps normally, is silently skipped under reduced-motion
 *   groupRef.current.rotation.y += delta * 0.05;
 * });
 */
export function useReducedMotionTick(cb: TickCallback): void {
  const reducedMotion = useReducedMotion();
  const cbRef = useRef<TickCallback>(cb);

  useLayoutEffect(() => {
    cbRef.current = cb;
  });

  useAnimationTick((s, d, f) => {
    if (!reducedMotion) cbRef.current(s, d, f);
  }, 1);
}

/**
 * Ref-based scalar spring — Priority 0 (math runs before mesh writes).
 *
 * Drives a single number value from its current position toward a target
 * using a critically-damped spring approximation:
 *   lerpFactor = 1 - exp(-(tension × delta) / friction)
 *
 * This formula correctly scales with delta, so the spring settles in the
 * same wall-clock time regardless of frame rate (including the Tier B 30fps cap).
 *
 * For tap spring (tension: 300, friction: 26): settles ≈ 420ms
 * For drag spring (tension: 180, friction: 20): settles ≈ 550ms
 *
 * @returns `valueRef` — read this in P1 callbacks to apply to Three.js objects.
 *          `targetRef` — write to this to change the spring target (direct ref write,
 *           no re-renders).
 *
 * @example
 * const { valueRef, targetRef } = useSpringTick(springs.tap);
 * useAnimationTick(() => {
 *   groupRef.current?.scale.setScalar(valueRef.current);
 * }, 1);
 * // On hover: targetRef.current = 1.1;
 */
export function useSpringTick(config: SpringConfig = defaultSprings.tap) {
  const configRef = useRef<SpringConfig>(config);
  useLayoutEffect(() => { configRef.current = config; });

  const valueRef  = useRef(0);
  const targetRef = useRef(0);

  useAnimationTick((_, delta) => {
    const { tension, friction } = configRef.current;
    // Critically-damped spring approximation — delta-correct, frame-rate independent
    const factor = 1 - Math.exp(-(tension * delta) / friction);
    valueRef.current += (targetRef.current - valueRef.current) * factor;
  }, 0); // Priority 0: spring math runs before any P1 reads valueRef

  return { valueRef, targetRef } as const;
}

/**
 * Ref-based Vec3 spring — three coupled scalar springs sharing one config.
 * Useful for position.set(x, y, z) targets that need spring feel.
 *
 * @returns `xRef, yRef, zRef` — read in P1 callbacks.
 *          `setTarget(x, y, z)` — update spring targets without re-renders.
 *
 * @example
 * const { xRef, yRef, zRef, setTarget } = useVec3SpringTick(springs.drag);
 * useAnimationTick(() => {
 *   groupRef.current?.position.set(xRef.current, yRef.current, zRef.current);
 * }, 1);
 * // On pointer move: setTarget(pointerX * 0.15, pointerY * -0.1, 0);
 */
export function useVec3SpringTick(config: SpringConfig = defaultSprings.drag) {
  const configRef = useRef<SpringConfig>(config);
  useLayoutEffect(() => { configRef.current = config; });

  const xRef = useRef(0); const txRef = useRef(0);
  const yRef = useRef(0); const tyRef = useRef(0);
  const zRef = useRef(0); const tzRef = useRef(0);

  useAnimationTick((_, delta) => {
    const { tension, friction } = configRef.current;
    const factor = 1 - Math.exp(-(tension * delta) / friction);
    xRef.current += (txRef.current - xRef.current) * factor;
    yRef.current += (tyRef.current - yRef.current) * factor;
    zRef.current += (tzRef.current - zRef.current) * factor;
  }, 0);

  const setTarget = useCallback((x: number, y: number, z: number) => {
    txRef.current = x;
    tyRef.current = y;
    tzRef.current = z;
  }, []);

  return { xRef, yRef, zRef, setTarget } as const;
}
