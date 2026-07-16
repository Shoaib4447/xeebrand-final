/**
 * XEEBRAND CTAObject — `components/three/CTAObject.tsx`
 *
 * The X mark as a literal "click to start" navigation object.
 * Scene 7 of the Cinematic spec — "the invitation."
 *
 * Interactions per 3D Interaction Framework §8:
 *
 * 1. Magnetic cursor pull
 *    Trigger:  pointermove within 120px of object bounding sphere
 *    Easing:   spring { tension: 180, friction: 20 } ("drag" spring — looser, weightier)
 *    Duration: settles ≈600ms perceived
 *    UX:       Forgives imprecise aim on a moving 3D target.
 *              Magnetic targets measurably lift click-through rate.
 *
 * 2. Pre-click anticipation
 *    Trigger:  pointerdown
 *    Easing:   scale 1→0.94, 100ms (--duration-instant)
 *    UX:       Tactile confirmation click registered before navigation begins.
 *
 * 3. Click → route handoff
 *    Trigger:  pointerup (valid click)
 *    Sequence: 0.94 → 1.15 (150ms, expo-out) → 0 (350ms, expo-in)
 *              Navigation begins at the 300ms mark (before collapse finishes)
 *    UX:       "Launching" feel — closes the scene 1→7 narrative loop.
 *
 * 4. Keyboard (Enter/Space on underlying <button>)
 *    Same animation as pointerup — 3D flourish is never pointer-exclusive.
 *
 * This component wraps the 3D content in a real accessible <button> element
 * in DOM space beneath the Canvas overlay — per OS spec §6.3.
 */

"use client";

import { useRef, useEffect, useCallback } from "react";
import { useAnimationTick } from "./AnimatedObject";
import * as THREE from "three";
import { useSpring } from "@react-spring/three";
import { useTier, useReducedMotion } from "@/lib/store";
import { XMark } from "./XMark";
import { springs } from "@/lib/tokens";

const MAGNETIC_RADIUS_PX = 120;
const MAGNETIC_STRENGTH  = 0.35; // max offset in Three.js world units

interface CTAObjectProps {
  onActivate: () => void;
}

export function CTAObject({ onActivate }: CTAObjectProps) {
  const tier         = useTier();
  const reducedMotion = useReducedMotion();
  const groupRef     = useRef<THREE.Group>(null);

  // Current & target magnetic offset
  const magTarget  = useRef({ x: 0, y: 0 });
  const magCurrent = useRef({ x: 0, y: 0 });

  // ── Click animation spring ─────────────────────────────────────────────────
  const [{ scale }, scaleApi] = useSpring(() => ({
    scale:  1,
    config: springs.tap,
  }));

  // ── Magnetic pointer tracking ───────────────────────────────────────────────
  useEffect(() => {
    if (reducedMotion) return;

    const onPointerMove = (e: PointerEvent) => {
      const el = document.getElementById("cta-object-anchor");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MAGNETIC_RADIUS_PX) {
        const strength = (1 - dist / MAGNETIC_RADIUS_PX) * MAGNETIC_STRENGTH;
        magTarget.current = {
          x:  (dx / MAGNETIC_RADIUS_PX) * strength * 2,
          y: -(dy / MAGNETIC_RADIUS_PX) * strength * 2,
        };
      } else {
        magTarget.current = { x: 0, y: 0 };
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [reducedMotion]);

  // ── P1: magnetic position + click scale writes ───────────────────────────
  useAnimationTick(() => {
    if (!groupRef.current) return;
    // Apply click-animation scale via spring .get() — never direct assignment
    groupRef.current.scale.setScalar(scale.get());
    if (reducedMotion) return;
    const LERP = 0.08;
    magCurrent.current.x += (magTarget.current.x - magCurrent.current.x) * LERP;
    magCurrent.current.y += (magTarget.current.y - magCurrent.current.y) * LERP;
    groupRef.current.position.x = magCurrent.current.x;
    groupRef.current.position.y = magCurrent.current.y;
  }, 1);

  // ── Click sequence ──────────────────────────────────────────────────────────
  const handleActivate = useCallback(() => {
    if (reducedMotion) {
      onActivate();
      return;
    }
    // Phase 1: compress
    scaleApi.start({ scale: 0.94, config: { duration: 100 } });
    // Phase 2: overshoot
    setTimeout(() => scaleApi.start({ scale: 1.15, config: { tension: 80, friction: 14 } }), 100);
    // Navigate at 300ms (before collapse completes)
    setTimeout(onActivate, 300);
    // Phase 3: collapse to zero
    setTimeout(() => scaleApi.start({ scale: 0, config: { duration: 350 } }), 250);
  }, [reducedMotion, scaleApi, onActivate]);

  if (!tier || tier === "C") return null;

  return (
    <group ref={groupRef}>
      <XMark
        mode="cta"
        onClickComplete={handleActivate}
      />
    </group>
  );
}
