/**
 * XEEBRAND Camera Rig — `lib/three/cameraRig.ts`
 *
 * GSAP ScrollTrigger-driven camera dolly system.
 *
 * Core mechanic (cinematic spec §1):
 *   scroll position = timecode, not page position.
 *   One persistent GSAP timeline drives camera position across all 7 scenes.
 *   Camera moves on a fixed rail — never orbits freely.
 *
 * Architecture:
 *   buildCameraRig(scrollEl)  — GSAP DOM factory, creates a singleton timeline
 *                               that tweens a plain RigTarget object.
 *   useCameraRig()            — R3F hook (must be inside Canvas + AnimationProvider),
 *                               reads RigTarget each frame via P0 animation tick,
 *                               applies to camera via position.set() + lookAt().
 *   CameraRigController       — render-null React component wrapping the hook.
 *
 * Singleton: ONE ScrollTrigger per page lifetime regardless of how many
 * Canvas instances call useCameraRig — all share the same target ref.
 *
 * Why plain target object?
 *   Three.js r185 makes camera.position read-only (Vector3 property descriptor).
 *   GSAP tweening camera.position.x/y/z would work, but runs outside the R3F
 *   frame loop. The target pattern keeps Three.js mutations inside useFrame
 *   (via useAnimationTick P0), preventing GSAP/R3F interleaving issues.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import type * as THREE from "three";
import { useAnimationTick } from "@/components/three/AnimatedObject";
import { useReducedMotion } from "@/lib/store";
import { easingGSAP } from "@/lib/tokens";

// ─── Scene keyframe table ────────────────────────────────────────────────────
//
// Per cinematic spec §2 — scroll progress ranges 0→1 across the full page.
// `end` = the scroll progress value at which this scene's camera position is
// fully arrived. Tweens begin at the previous scene's `end`.
//
// Scene 3 (20–42%) is longest — lateral gallery pass needs time to breathe.
// Scene 4 (42–62%) holds still — process section scrub-lock is the pin, not dolly.
// Scene 6 (80–88%) retreats slightly — stillness signals the testimonial section.
const SCENE_KF = [
  { end: 0.08, x:  0,   y:  0,    z: 6   }, // Scene 1 — opening hold, hero
  { end: 0.20, x:  0,   y:  0.4,  z: 9   }, // Scene 2 — pull back, reveal context
  { end: 0.42, x:  2.2, y: -0.6,  z: 7   }, // Scene 3 — lateral tracking, capabilities
  { end: 0.62, x:  0,   y:  0,    z: 5   }, // Scene 4 — locked, process disassembly
  { end: 0.80, x:  0,   y:  0,    z: 4   }, // Scene 5 — slow push-in, featured work
  { end: 0.88, x:  0,   y:  0,    z: 5   }, // Scene 6 — static hold, testimonial
  { end: 1.00, x:  0,   y:  0,    z: 4.5 }, // Scene 7 — final push, CTA
] as const;

// Mobile halves z-depth — objects are visible at narrower FOV without being huge
const MOBILE_Z_SCALE = 0.5;

// ─── Types ───────────────────────────────────────────────────────────────────

/** Plain JS object that GSAP tweens. Never a Three.js type — avoids read-only conflicts. */
export interface RigTarget {
  x: number;
  y: number;
  z: number;
}

export interface CameraRigResult {
  timeline: gsap.core.Timeline;
  destroy:  () => void;
}

// ─── Singleton state (one per page lifetime) ─────────────────────────────────
//
// Multiple SceneCanvas instances each call useCameraRig, but only ONE
// ScrollTrigger is created. All hooks read from the same _target ref.
let _target:     RigTarget | null  = null;
let _timeline:   gsap.core.Timeline | null = null;
let _pinTrigger: ScrollTrigger | null = null;
let _refCount = 0;

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Creates (or returns the existing) singleton camera rig.
 *
 * Tweens a plain `target` object across 7 scene keyframes.
 * `scrub: 1.2` gives the camera a 1.2s lag behind scroll — eliminates
 * trackpad/mousewheel jitter while preserving the "user is in control" feel.
 *
 * @param scrollEl  Element whose scroll drives the trigger. Use `#main-content`
 *                  (the full page) for the root dolly.
 * @param isMobile  When true, halves z-depth so objects stay visible at FOV 50°.
 */
export function buildCameraRig(
  scrollEl: HTMLElement,
  isMobile: boolean,
): CameraRigResult {
  _refCount++;

  if (_target && _timeline) {
    // Rig already exists — return a destroy handle that only decrements the ref
    return {
      timeline: _timeline,
      destroy:  releaseRig,
    };
  }

  // Register once — safe to call multiple times (GSAP deduplicates)
  gsap.registerPlugin(ScrollTrigger);

  const zScale = isMobile ? MOBILE_Z_SCALE : 1;
  const first  = SCENE_KF[0];

  // Shared target object — GSAP tweens .x .y .z; useCameraRig reads them in useFrame
  _target = { x: first.x, y: first.y, z: first.z * zScale };

  // ── Main dolly timeline ────────────────────────────────────────────────────
  //
  // Total duration = 1.0 so tween positions map 1:1 to scroll progress (0→1).
  // scrub: 1.2 — GSAP smooths the playhead toward the "true" scroll position
  //   over 1.2s, dampening fast scrolls (avoids camera whip-pan / motion sickness).
  _timeline = gsap.timeline({
    scrollTrigger: {
      trigger: scrollEl,
      start:   "top top",
      end:     "bottom bottom",
      scrub:   1.2,
    },
  });

  // Initialise target at Scene 1 position (sets GSAP's "from" state for first tween)
  _timeline.set(_target, { x: first.x, y: first.y, z: first.z * zScale }, 0);

  // Add transition tween for each scene boundary.
  // Each tween:
  //   - starts at the previous scene's `end` progress value
  //   - has `duration` = the scroll progress width of the transition
  //   - uses --ease-scrub (cubic-bezier 0.65 0 0.35 1) for natural S-curve movement
  for (let i = 1; i < SCENE_KF.length; i++) {
    const prev = SCENE_KF[i - 1];
    const curr = SCENE_KF[i];

    _timeline.to(
      _target,
      {
        x:        curr.x,
        y:        curr.y,
        z:        curr.z * zScale,
        duration: curr.end - prev.end, // scroll progress width = tween duration
        ease:     easingGSAP.scrub,
      },
      prev.end, // position in timeline = where previous scene ended
    );
  }

  // ── Scene 4 process section pin ────────────────────────────────────────────
  //
  // Cinematic spec §4: Scene 4 is the "hero scene" — scrub-locked for up to
  // 150vh. The pin is a SEPARATE ScrollTrigger from the dolly so the dolly
  // can hold its Scene 4 position while the pin consumes the scroll budget.
  // scrub: 0.5 — tighter than the global 1.2 for emotional precision.
  const processEl = document.getElementById("process-section");
  if (processEl) {
    _pinTrigger = ScrollTrigger.create({
      trigger:    processEl,
      start:      "top top",
      end:        "+=150vh",   // hard cap per cinematic spec §4 guardrail
      pin:        true,
      pinSpacing: true,
      scrub:      0.5,
    });
  }

  return {
    timeline: _timeline,
    destroy:  releaseRig,
  };
}

/**
 * Releases one consumer's hold on the rig.
 * Destroys the singleton when the last consumer unmounts.
 */
function releaseRig(): void {
  _refCount = Math.max(0, _refCount - 1);
  if (_refCount > 0) return;

  _timeline?.kill();
  _pinTrigger?.kill();

  // Kill all ScrollTriggers associated with the rig
  // (catches any that buildCameraRig may have created via the ScrollTrigger API)
  ScrollTrigger.getAll().forEach((st) => st.kill());

  _timeline   = null;
  _pinTrigger = null;
  _target     = null;
  _refCount   = 0;
}

// ─── R3F hook ─────────────────────────────────────────────────────────────────

/**
 * Mounts the camera rig to the R3F camera.
 * Must be called inside a component rendered inside `<Canvas>` + `<AnimationProvider>`.
 *
 * All camera mutations happen inside useAnimationTick P0 (R3F's useFrame).
 * useEffect is used only for GSAP rig lifecycle — never for camera mutations.
 * This satisfies react-hooks/immutability (no hook return values mutated in effects).
 *
 * On each frame (P0 — before any scene object transforms):
 *   - First frame only: set FOV (35° desktop / 50° mobile) + baseline Scene 1 position
 *   - Every frame: camera.position.set(target) + camera.lookAt(0,0,0)
 *
 * prefers-reduced-motion: rig never mounts — camera holds at Scene 1 position.
 * Mobile (< 768px):  FOV 50° and z-depth halved.
 * Desktop (≥ 768px): FOV 35° per spec §3.2.
 */
export function useCameraRig(): void {
  const { camera } = useThree();
  const reducedMotion = useReducedMotion();
  // Holds pointer to singleton target — written in useEffect, read in tick
  const targetRef      = useRef<RigTarget | null>(null);
  // One-time flag: FOV + baseline position, set on first frame inside useFrame
  const initializedRef = useRef(false);
  // Track isMobile for the tick (determined once per mount)
  const isMobileRef    = useRef(false);

  // ── GSAP rig lifecycle ONLY — no camera mutations here ──────────────────
  // react-hooks/immutability: never mutate a hook return value in effects.
  // camera mutations live entirely in the useAnimationTick callback below.
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    isMobileRef.current = isMobile;

    if (reducedMotion) {
      targetRef.current = null;
      return;
    }

    const scrollEl = document.getElementById("main-content") ?? document.body;
    const { destroy } = buildCameraRig(scrollEl, isMobile);

    // _target is set synchronously inside buildCameraRig
    targetRef.current = _target;

    return () => {
      destroy();
      targetRef.current = null;
    };
  }, [reducedMotion]); // camera intentionally excluded — no mutations here

  // ── P0 tick: all camera mutations inside useFrame (not in effects) ───────
  //
  // Priority 0 — runs before any P1 scene object transforms.
  // camera.position.set() — safe in Three.js r185 (writes to Vector3.x/y/z)
  // camera.lookAt()       — updates camera.quaternion; all scenes target [0,0,0]
  //
  // eslint-disable react-hooks/immutability -- useAnimationTick wraps R3F's
  // useFrame, which is the prescribed imperative mutation zone for Three.js
  // objects. camera from useThree() is an R3F-managed object explicitly
  // designed for mutation via position.set()/lookAt() inside the render loop.
  useAnimationTick(() => {
    const cam = camera as THREE.PerspectiveCamera;

    // First frame: set FOV and baseline position.
    // Done here (not in useEffect) to satisfy react-hooks/immutability.
    if (!initializedRef.current) {
      initializedRef.current = true;
      const isMobile = isMobileRef.current;
      // FOV: 35° desktop (spec §3.2) / 50° mobile (tighter crop, less depth loss)
      cam.fov = isMobile ? 50 : 35;
      cam.updateProjectionMatrix();
      // Baseline: Scene 1 position — applies even when reducedMotion
      const zScale = isMobile ? MOBILE_Z_SCALE : 1;
      cam.position.set(SCENE_KF[0].x, SCENE_KF[0].y, SCENE_KF[0].z * zScale);
      cam.lookAt(0, 0, 0);
    }

    // reducedMotion: hold at baseline (set above), no dolly
    const t = targetRef.current;
    if (!t) return;

    // Apply GSAP-driven target to camera
    cam.position.set(t.x, t.y, t.z);
    // All 7 scenes target lookAt [0,0,0] — single call covers all transitions
    cam.lookAt(0, 0, 0);
  }, 0);
  // eslint-enable react-hooks/immutability
}

// ─── Render-null controller ──────────────────────────────────────────────────

/**
 * Place inside `<SceneCanvas>` (inside Canvas > AnimationProvider).
 * Calls useCameraRig() — no DOM output.
 *
 * Example:
 *   <Canvas>
 *     <AnimationProvider>
 *       <CameraRigController />
 *       {children}
 *     </AnimationProvider>
 *   </Canvas>
 */
export function CameraRigController(): null {
  useCameraRig();
  return null;
}
