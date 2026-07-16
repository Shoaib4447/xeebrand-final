/**
 * XEEBRAND Design Tokens — JavaScript source of truth.
 *
 * RULE: No hex value is ever hardcoded in component files.
 * Every shader gradient, Three.js material color, and GSAP tween
 * value is imported from here. A future rebrand touches ONLY this file.
 *
 * Mirror of globals.css `:root` block. Keep in sync.
 */

import * as THREE from "three";

// ─── Brand color ramp ────────────────────────────────────────────────────────
export const brandColors = {
  yellow:  "#FFC94A",
  orange:  "#FF8A3D",
  magenta: "#FF3D8F",
  violet:  "#8B3FE8",
  blue:    "#2E9FFF",
} as const;

/** Ordered gradient stops (top-left warm → bottom-right cool) */
export const gradientStops = [
  brandColors.yellow,
  brandColors.orange,
  brandColors.magenta,
  brandColors.violet,
  brandColors.blue,
] as const;

/** THREE.Color versions of the gradient stops — import-once for shader use */
export const gradientStopsThree = gradientStops.map(
  (hex) => new THREE.Color(hex)
);

// ─── Surface system ──────────────────────────────────────────────────────────
export const surfaces = {
  0: "#0A0A0F",
  1: "#121218",
  2: "#1B1B24",
} as const;

// ─── Lighting config — single 3-point rig reused across all scenes ───────────
export const lightRig = {
  /** Key light: warm, top-left, matches logo warm-end */
  key: {
    color:     new THREE.Color(brandColors.orange),
    intensity: 3.5,
    position:  new THREE.Vector3(-4, 6, 4),
  },
  /** Fill light: neutral-cool, opposite side, low intensity */
  fill: {
    color:     new THREE.Color("#ffffff"),
    intensity: 0.8,
    position:  new THREE.Vector3(4, 2, 2),
  },
  /** Rim light: always xee-blue, back-low, gives the logo-edge colour-shift */
  rim: {
    color:     new THREE.Color(brandColors.blue),
    intensity: 2.0,
    position:  new THREE.Vector3(3, -3, -5),
  },
} as const;

// ─── PBR Material spec — Section 2.4 of OS spec ─────────────────────────────
export const materialSpec = {
  roughness:          0.18,
  metalness:          0.0,
  clearcoat:          1.0,
  clearcoatRoughness: 0.10,
  iridescence:        0.15,
  iridescenceIOR:     1.3,
  reflectivity:       0.5,
  transmission:       0.0,
  envMapIntensity:    1.2,
} as const;

/** Simplified material for Tier B (no clearcoat, no iridescence) */
export const materialSpecTierB = {
  roughness:  0.25,
  metalness:  0.0,
  envMapIntensity: 0.8,
} as const;

// ─── Motion tokens — mirrors globals.css & luxury UI spec §1.6 ───────────────
export const easing = {
  /** expo-out — anything appearing */
  entrance: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** expo-in — anything leaving */
  exit:     [0.7, 0, 0.84, 0] as [number, number, number, number],
  /** scroll-tied motion */
  scrub:    [0.65, 0, 0.35, 1] as [number, number, number, number],
} as const;

/** GSAP-compatible string versions */
export const easingGSAP = {
  entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
  exit:     "cubic-bezier(0.7, 0, 0.84, 0)",
  scrub:    "cubic-bezier(0.65, 0, 0.35, 1)",
} as const;

/** React Spring physics configs */
export const springs = {
  /** Cards, buttons — snappy, controlled */
  tap:  { tension: 300, friction: 26 },
  /** Magnetic/drag — looser, weightier */
  drag: { tension: 180, friction: 20 },
  /** 3D tilt on case-study frames */
  tilt: { tension: 300, friction: 30 },
} as const;

/** Duration values in milliseconds */
export const durations = {
  instant: 100,
  fast:    200,
  base:    350,
  slow:    600,
} as const;

// ─── Scene camera keyframes — matches Cinematic Scene Design doc §4 ──────────
export const cameraKeyframes = {
  /** Scene 1 — opening hold (hero) */
  scene1: { position: [0, 0, 6]     as [number, number, number], fov: 35 },
  /** Scene 2 — pull back, reveal proof metrics */
  scene2: { position: [0, 0.4, 9]   as [number, number, number], fov: 35 },
  /** Scene 3 — lateral tracking past service panels */
  scene3: { position: [2.2, -0.6, 7] as [number, number, number], fov: 35 },
  /** Scene 4 — locked for process disassembly */
  scene4: { position: [0, 0, 5]     as [number, number, number], fov: 35 },
  /** Scene 5 — slow push-in, case studies */
  scene5: { position: [0, 0, 4]     as [number, number, number], fov: 35 },
  /** Scene 6 — still, warm, testimonial */
  scene6: { position: [0, 0, 5]     as [number, number, number], fov: 35 },
  /** Scene 7 — final push, brightest, CTA */
  scene7: { position: [0, 0, 4.5]   as [number, number, number], fov: 35 },
} as const;

// ─── Particle budgets per scene, per Cinematic spec §4 ───────────────────────
export const particleBudgets = {
  scene1: 400,
  scene2: 150,
  scene4: 600,
} as const;
