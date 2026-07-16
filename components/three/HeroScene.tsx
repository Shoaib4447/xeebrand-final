/**
 * XEEBRAND HeroScene — `components/three/HeroScene.tsx`
 *
 * Scene 1 of the Cinematic spec: the opening shot.
 *
 * "Camera holds still, close on the X mark, key light sweeping across
 *  the glossy surface, faint particle motes drifting in the dark field."
 *
 * Interactions (all per 3D Interaction Framework §1):
 *
 * 1. Idle micro-rotation — onMount, continuous (±3°, 8s sine)
 *    UX: Proves liveness in the user's first 200ms fixation.
 *
 * 2. Pointer parallax — pointermove, lerp 0.05/frame (≈280ms perceived)
 *    UX: Physical inertia feel — object has mass, not screen-stuck.
 *
 * 3. Entrance scale-in — after mount, 600ms expo-out, 150ms delay
 *    UX: Object "arrives" instead of popping.
 *
 * 4. Scene 1 particles — 400 (Tier A) / 200 (Tier B) motes establish depth.
 *
 * Canvas setup: fov 35, camera at z=6, object fills ~60% of viewport.
 * Pointer coords tracked at the DOM level (not inside Canvas) to avoid
 * raycasting cost and so the effect works even when pointer hovers the
 * overlapping DOM headline text.
 *
 * This component is code-split via next/dynamic (ssr: false) — see Hero.tsx.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Environment } from "@react-three/drei";
import { LightRig } from "./LightRig";
import { XMark } from "./XMark";
import { ParticleField } from "./ParticleField";
import { SceneCanvas } from "./SceneCanvas";
import { useReducedMotion } from "@/lib/store";

interface HeroSceneProps {
  className?: string;
}

export function HeroScene({ className = "" }: HeroSceneProps) {
  const reducedMotion = useReducedMotion();
  // Track pointer at DOM level — cheaper than R3F raycasting, works over overlay text
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const rawPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (reducedMotion) return;

    const onMove = (e: PointerEvent) => {
      // Normalize to -1→1
      rawPointer.current = {
        x: (e.clientX / window.innerWidth)  * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    };

    // Throttle state update to rAF to avoid React re-renders on every mousemove
    const tick = () => {
      setPointer({ ...rawPointer.current });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion]);

  return (
    <SceneCanvas
      ariaLabel="Animated Xeebrand X logomark — a glossy 3D object in warm-to-cool gradient colours"
      fallbackSrc="/images/Xeebrand X.png"
      fallbackAlt="Xeebrand X logomark"
      className={className}
    >
      {/* Scene 1 lighting — intensityScale 1.0 (darkest: Scene 1 of 7) */}
      <LightRig intensityScale={1.0} castShadow />

      {/* Environment map for reflections — Tier A only */}
      <Environment preset="studio" environmentIntensity={0.4} />

      {/* The X mark — the entire hero is this object */}
      <XMark
        mode="hero"
        pointerNorm={reducedMotion ? { x: 0, y: 0 } : pointer}
      />

      {/* Scene 1 particles — establishes depth of space (400 / 200 by tier) */}
      {!reducedMotion && <ParticleField count={400} directed={false} opacity={0.9} />}
    </SceneCanvas>
  );
}
