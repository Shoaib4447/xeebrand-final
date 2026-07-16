/**
 * XEEBRAND ParticleField — `components/three/ParticleField.tsx`
 *
 * Narrative particle system, NOT ambient decoration.
 * Exists only in Scenes 1, 2, 4 — per Cinematic spec §4.
 *
 * Scene 1 (hero): 400 motes establish depth of the space.
 * Scene 2 (proof): 150 light trails move toward proof metrics.
 * Scene 4 (process): 600 peak, residue of bar disassembly.
 *
 * Tier B: count halved automatically.
 * Tier C: not mounted at all (SceneCanvas gates that).
 *
 * GPU budget:
 *   Tier A — 400 max, BufferGeometry points, 1px size, blending: Additive
 *   Tier B — 200 max, same approach, size reduced to 0.8px
 */

"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTier } from "@/lib/store";
import { brandColors } from "@/lib/tokens";

interface ParticleFieldProps {
  /** Target particle count for Tier A. Halved automatically for Tier B. */
  count?: number;
  /**
   * If true, particles drift toward +X (used in Scene 2 to "connect"
   * the X mark to the proof metrics that appear to the right).
   */
  directed?: boolean;
  /** Overall opacity of the particle field — fade in/out by scene */
  opacity?: number;
}

// ── Module-level generator — called only from useEffect, never during render ──
// Math.random() is impure (React 19 rule), so it must not run during the
// render phase. useEffect is committed after render, making this safe.
function generateParticleData(count: number, directed: boolean) {
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  const ph  = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const r     = 3 + Math.random() * 2.5;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);

    pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi) - 1.5; // offset behind X

    // Directed mode: drift toward +X
    vel[i * 3]     = directed ? 0.002 + Math.random() * 0.003 : (Math.random() - 0.5) * 0.001;
    vel[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
    vel[i * 3 + 2] = (Math.random() - 0.5) * 0.0005;
    ph[i]          = Math.random() * Math.PI * 2;
  }
  return { positions: pos, velocities: vel, phases: ph };
}

export function ParticleField({
  count = 400,
  directed = false,
  opacity = 1,
}: ParticleFieldProps) {
  const tier        = useTier();
  const actualCount = tier === "A" ? count : Math.floor(count / 2);
  const pointsRef   = useRef<THREE.Points>(null);
  const clock       = useRef(0);

  // Stores the latest generated particle data (positions used as reset values)
  const dataRef = useRef<ReturnType<typeof generateParticleData> | null>(null);
  // Increments each time new data is generated — triggers geometry rebuild
  const [genId, setGenId] = useState(0);

  // ── Generate particle data in effect (not during render) ────────────────
  useEffect(() => {
    dataRef.current = generateParticleData(actualCount, directed);
    setGenId((n) => n + 1); // trigger geometry useMemo
  }, [actualCount, directed]);

  // ── Gradient color map — deterministic (no randomness), safe in useMemo ──
  const colors = useMemo(() => {
    const c     = new Float32Array(actualCount * 3);
    const stops = [
      new THREE.Color(brandColors.yellow),
      new THREE.Color(brandColors.orange),
      new THREE.Color(brandColors.magenta),
      new THREE.Color(brandColors.violet),
      new THREE.Color(brandColors.blue),
    ];
    const tmp = new THREE.Color();
    for (let i = 0; i < actualCount; i++) {
      const t   = (i / actualCount) * (stops.length - 1);
      const idx  = Math.floor(t);
      const frac = t - idx;
      tmp.lerpColors(
        stops[Math.min(idx,     stops.length - 1)],
        stops[Math.min(idx + 1, stops.length - 1)],
        frac
      );
      c[i * 3]     = tmp.r;
      c[i * 3 + 1] = tmp.g;
      c[i * 3 + 2] = tmp.b;
    }
    return c;
  }, [actualCount]);

  // ── Build geometry imperatively once data is ready ────────────────────
  const geometry = useMemo(() => {
    if (!dataRef.current) return null;
    const geo = new THREE.BufferGeometry();
    // Mutable copy of positions for per-frame updates; original kept in dataRef for resets
    geo.setAttribute("position", new THREE.BufferAttribute(dataRef.current.positions.slice(), 3));
    geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
    return geo;
    // genId drives rebuilds when new random data is generated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genId, colors]);

  // ── Per-frame update — drift + gentle oscillation ─────────────────────
  useFrame((_, delta) => {
    if (!pointsRef.current || !dataRef.current) return;
    const { velocities, phases, positions: initPos } = dataRef.current;
    clock.current += delta;

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const pos     = posAttr.array as Float32Array;

    for (let i = 0; i < actualCount; i++) {
      pos[i * 3]     += velocities[i * 3]     + Math.sin(clock.current * 0.3  + phases[i]) * 0.0003;
      pos[i * 3 + 1] += velocities[i * 3 + 1] + Math.cos(clock.current * 0.25 + phases[i]) * 0.0003;
      pos[i * 3 + 2] += velocities[i * 3 + 2];

      // Recycle particles that drift too far back to their spawn position
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      if (Math.sqrt(x * x + y * y + z * z) > 7 || (directed && x > 4)) {
        pos[i * 3]     = initPos[i * 3];
        pos[i * 3 + 1] = initPos[i * 3 + 1];
        pos[i * 3 + 2] = initPos[i * 3 + 2];
      }
    }
    posAttr.needsUpdate = true;
  });

  if (!geometry) return null;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={tier === "A" ? 0.03 : 0.025}
        sizeAttenuation
        vertexColors
        transparent
        opacity={opacity * 0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
