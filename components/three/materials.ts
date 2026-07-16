/**
 * XEEBRAND PBR Material System — `components/three/materials.ts`
 *
 * Single source of truth for every 3D material on the site.
 * Spec: OS spec §2.4 — "one PBR material spec used across every 3D asset"
 *
 * Material tiers:
 *   Tier A — full MeshPhysicalMaterial: clearcoat + iridescence
 *   Tier B — MeshStandardMaterial: roughness/metalness only
 *   Tier C — no material (no Canvas)
 *
 * Gradient: applied via a vertex-color gradient shader, NOT a flat texture.
 * This allows dynamic re-lighting without baking the gradient into UVs.
 */

import * as THREE from "three";
import type { DeviceTier } from "@/lib/device-tier";
import { gradientStops, materialSpec, materialSpecTierB } from "@/lib/tokens";

// ─── Gradient shader — samples from the 5-stop brand ramp ────────────────────

export const gradientVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const gradientFragmentShader = /* glsl */ `
  uniform vec3 uColors[5];
  uniform float uGradientAngle; /* radians, default = 135deg = 2.356 */
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    /* Map world-space position to a 0–1 gradient t-value */
    float cosA = cos(uGradientAngle);
    float sinA = sin(uGradientAngle);
    float t = clamp(
      (vWorldPosition.x * sinA + vWorldPosition.y * cosA + 2.0) / 4.0,
      0.0, 1.0
    );

    /* Sample across the 5-stop ramp */
    float segment = t * 4.0;
    int   idx     = int(floor(segment));
    float frac    = fract(segment);

    vec3 col;
    if      (idx == 0) col = mix(uColors[0], uColors[1], frac);
    else if (idx == 1) col = mix(uColors[1], uColors[2], frac);
    else if (idx == 2) col = mix(uColors[2], uColors[3], frac);
    else               col = mix(uColors[3], uColors[4], frac);

    /* Simple rim-darkening for depth */
    float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
    col = mix(col, col * 0.6, rim * 0.4);

    gl_FragColor = vec4(col, 1.0);
  }
`;

// ─── Gradient uniforms helper ──────────────────────────────────────────────────

export function buildGradientUniforms() {
  return {
    uColors: {
      value: gradientStops.map((hex) => new THREE.Color(hex)),
    },
    uGradientAngle: { value: (135 * Math.PI) / 180 },
  };
}

// ─── Tier-aware material factories ────────────────────────────────────────────

/**
 * Tier A: full MeshPhysicalMaterial with clearcoat + iridescence.
 * Color is set on the material; gradient shader is applied via a separate
 * ShaderMaterial layer or via onBeforeCompile (see XMark.tsx).
 */
export function createTierAMaterial(baseColor = "#FF3D8F"): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(baseColor),
    roughness:          materialSpec.roughness,
    metalness:          materialSpec.metalness,
    clearcoat:          materialSpec.clearcoat,
    clearcoatRoughness: materialSpec.clearcoatRoughness,
    iridescence:        materialSpec.iridescence,
    iridescenceIOR:     materialSpec.iridescenceIOR,
    reflectivity:       materialSpec.reflectivity,
    envMapIntensity:    materialSpec.envMapIntensity,
  });
}

/**
 * Tier B: simplified MeshStandardMaterial, no clearcoat or iridescence.
 * Saves ~30% GPU load on integrated graphics.
 */
export function createTierBMaterial(baseColor = "#FF3D8F"): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color:           new THREE.Color(baseColor),
    roughness:       materialSpecTierB.roughness,
    metalness:       materialSpecTierB.metalness,
    envMapIntensity: materialSpecTierB.envMapIntensity,
  });
}

/**
 * Returns the correct material for the current tier.
 * Tier C: caller should not mount a Canvas at all — this is a safety return only.
 */
export function createMaterialForTier(
  tier: DeviceTier,
  baseColor?: string
): THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial {
  if (tier === "A") return createTierAMaterial(baseColor);
  return createTierBMaterial(baseColor);
}

// ─── Gradient vertex-color helper ─────────────────────────────────────────────
/**
 * Bakes the brand gradient into vertex colors of a BufferGeometry.
 * Samples each vertex's Y-position and assigns a gradient color.
 * Used by XMark when shader injection is not available.
 */
export function applyGradientVertexColors(geometry: THREE.BufferGeometry): void {
  const positions = geometry.getAttribute("position");
  if (!positions) return;

  const colors: number[] = [];
  const stops = gradientStops.map((h) => new THREE.Color(h));
  const tempColor = new THREE.Color();

  // Find bounds for normalisation
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const range = maxY - minY || 1;

  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const t = ((y - minY) / range) * (stops.length - 1);
    const idx = Math.floor(t);
    const frac = t - idx;
    const a = stops[Math.min(idx,     stops.length - 1)];
    const b = stops[Math.min(idx + 1, stops.length - 1)];
    tempColor.lerpColors(a, b, frac);
    colors.push(tempColor.r, tempColor.g, tempColor.b);
  }

  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3)
  );
}
