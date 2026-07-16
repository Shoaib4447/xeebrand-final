/**
 * XEEBRAND XMark — `components/three/XMark.tsx`
 *
 * Core 3D brand object. All animation driven via useFrame with direct
 * Three.js API calls (position.set, scale.setScalar, rotation.*).
 * NO @react-spring/three animated.* wrappers — they attempt direct
 * property assignment (mesh.position = value) which Three.js disallows
 * since position/scale are read-only Vector3 descriptors.
 *
 * Interactions:
 *
 * 1. Idle micro-rotation — onMount, continuous ±3°, 8s sine
 * 2. Pointer parallax — lerp(current, target, 0.05) per frame ≈280ms settle
 * 3. Entrance scale — 0→1, expo-out feel via lerp
 * 6. Process disassembly — bar positions lerped toward scroll-driven targets
 */

"use client";

import { useRef, useEffect, useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useAnimationTick } from "./AnimatedObject";
import { useTier, useReducedMotion } from "@/lib/store";
import { gradientStops, materialSpec, materialSpecTierB } from "@/lib/tokens";

// ─── Geometry constants ────────────────────────────────────────────────────────
const BAR_ARGS: [number, number, number] = [0.55, 2.20, 0.42];
const BAR_RADIUS  = 0.20;
const CROSS_ANGLE = Math.PI / 4; // 45°

interface XMarkProps {
  mode?:            "hero" | "cta" | "process";
  scrollProgress?:  number;
  pointerNorm?:     { x: number; y: number };
  onClickComplete?: () => void;
}

export function XMark({
  mode           = "hero",
  scrollProgress = 0,
  pointerNorm    = { x: 0, y: 0 },
}: XMarkProps) {
  const tier          = useTier();
  const reducedMotion = useReducedMotion();

  // ── Refs — outer group (rotation + scale), inner groups (bar position) ────
  const groupRef     = useRef<THREE.Group>(null);
  const bar1GroupRef = useRef<THREE.Group>(null);
  const bar2GroupRef = useRef<THREE.Group>(null);

  // ── Animation state refs — all mutable, no React re-renders ───────────────
  const clock    = useRef(0);
  const rotY     = useRef(0);
  const rotX     = useRef(0);
  const scaleVal = useRef(0);           // entrance lerp 0→1
  const bar1Pos  = useRef({ x: 0, y: 0, z: 0 });
  const bar2Pos  = useRef({ x: 0, y: 0, z: 0 });

  // ── Materials — one instance per bar, never shared ────────────────────────
  // Separate instances avoid the timing race that "material" read-only error
  // causes when a single <primitive> object is re-attached to two meshes.
  const mat1 = useMemo(() => buildMaterial(tier, 0), [tier]); // warm (yellow)
  const mat2 = useMemo(() => buildMaterial(tier, 4), [tier]); // cool (blue)
  useEffect(() => () => { mat1?.dispose(); mat2?.dispose(); }, [mat1, mat2]);

  // ── P0: spring / lerp math — runs before any mesh writes ───────────────────
  useAnimationTick((_, delta) => {
    clock.current += delta;

    // Entrance scale lerp: 0→1 (instant under reduced-motion)
    scaleVal.current = Math.min(1, scaleVal.current + delta * (reducedMotion ? 20 : 1.8));

    if (reducedMotion) return;

    // 1. Idle micro-rotation ±0.05 rad, 8s sine period
    const idleY = Math.sin(clock.current / 8)      * 0.05;
    const idleX = Math.sin(clock.current / 10 + 1) * 0.025;

    // 2. Pointer parallax targets
    const targetY = (mode === "hero" || mode === "cta")
      ? pointerNorm.x * 0.15 + idleY
      : idleY;
    const targetX = (mode === "hero" || mode === "cta")
      ? -pointerNorm.y * 0.10 + idleX
      : idleX;

    rotY.current += (targetY - rotY.current) * 0.05;
    rotX.current += (targetX - rotX.current) * 0.05;

    // 6. Process disassembly lerp targets
    if (mode === "process") {
      const t = Math.min(scrollProgress * 2, 1);
      const tx1 = { x: -1.2 * t, y:  1.0 * t, z:  0.3 * t };
      const tx2 = { x:  1.2 * t, y: -1.0 * t, z: -0.3 * t };
      const L   = 0.08;

      bar1Pos.current.x += (tx1.x - bar1Pos.current.x) * L;
      bar1Pos.current.y += (tx1.y - bar1Pos.current.y) * L;
      bar1Pos.current.z += (tx1.z - bar1Pos.current.z) * L;
      bar2Pos.current.x += (tx2.x - bar2Pos.current.x) * L;
      bar2Pos.current.y += (tx2.y - bar2Pos.current.y) * L;
      bar2Pos.current.z += (tx2.z - bar2Pos.current.z) * L;
    }
  }, 0);

  // ── P1: Three.js object writes — reads settled spring values from P0 ─────────
  useAnimationTick(() => {
    const group = groupRef.current;
    const b1g   = bar1GroupRef.current;
    const b2g   = bar2GroupRef.current;
    if (!group) return;

    group.scale.setScalar(scaleVal.current);
    if (reducedMotion) return;

    group.rotation.y = rotY.current;
    group.rotation.x = rotX.current;

    if (mode === "process" && b1g && b2g) {
      b1g.position.set(bar1Pos.current.x, bar1Pos.current.y, bar1Pos.current.z);
      b2g.position.set(bar2Pos.current.x, bar2Pos.current.y, bar2Pos.current.z);
    }
  }, 1);

  if (!tier || tier === "C" || !mat1 || !mat2) return null;

  const smoothness = tier === "A" ? 8 : 4;

  return (
    <group ref={groupRef}>
      {/* Bar 1 — "\" stroke, warm end of gradient */}
      <group ref={bar1GroupRef}>
        <RoundedBox
          args={BAR_ARGS}
          radius={BAR_RADIUS}
          smoothness={smoothness}
          rotation={[0, 0, CROSS_ANGLE]}
          castShadow
          receiveShadow
        >
          <primitive object={mat1} attach="material" />
        </RoundedBox>
      </group>

      {/* Bar 2 — "/" stroke, cool end of gradient */}
      <group ref={bar2GroupRef}>
        <RoundedBox
          args={BAR_ARGS}
          radius={BAR_RADIUS}
          smoothness={smoothness}
          rotation={[0, 0, -CROSS_ANGLE]}
          castShadow
          receiveShadow
        >
          <primitive object={mat2} attach="material" />
        </RoundedBox>
      </group>
    </group>
  );
}

// ─── Material factory — called in useMemo ─────────────────────────────────────
function buildMaterial(
  tier: "A" | "B" | "C" | null,
  stopIndex: number
): THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial | null {
  if (!tier || tier === "C") return null;
  const color = new THREE.Color(gradientStops[stopIndex]);
  if (tier === "A") {
    return new THREE.MeshPhysicalMaterial({
      color,
      roughness:          materialSpec.roughness,
      metalness:          materialSpec.metalness,
      clearcoat:          materialSpec.clearcoat,
      clearcoatRoughness: materialSpec.clearcoatRoughness,
      iridescence:        materialSpec.iridescence,
      iridescenceIOR:     materialSpec.iridescenceIOR,
      envMapIntensity:    materialSpec.envMapIntensity,
    });
  }
  return new THREE.MeshStandardMaterial({
    color,
    roughness:       materialSpecTierB.roughness,
    metalness:       materialSpecTierB.metalness,
    envMapIntensity: materialSpecTierB.envMapIntensity,
  });
}
