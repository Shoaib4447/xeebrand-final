/**
 * XEEBRAND Device Tier Detection — `lib/device-tier.ts`
 *
 * Determines A/B/C rendering tier BEFORE any Canvas is mounted.
 * This is the #1 engineering decision from the OS spec (§3.3):
 * it's what makes "premium 3D" compatible with real-world device diversity.
 *
 * Tier A — desktop, WebGL2, dPR ≤ 2, no reduced-motion
 *   Full PBR: clearcoat, iridescence, shadows, 60fps target
 *
 * Tier B — mid mobile / laptop integrated GPU
 *   Roughness/metalness only, no clearcoat, shadows off, LOD -40%
 *
 * Tier C — low-end mobile, no WebGL, Save-Data, reduced-motion
 *   No Canvas. Static pre-rendered image fallback.
 */

export type DeviceTier = "A" | "B" | "C";

export interface TierResult {
  tier: DeviceTier;
  reasons: string[];
  /** dPR at detection time */
  dpr: number;
  /** true if WebGL2 confirmed available */
  hasWebGL2: boolean;
  /** true if matchMedia('(pointer: coarse)') — touch primary device */
  isCoarsePointer: boolean;
  /** true if prefers-reduced-motion: reduce */
  reducedMotion: boolean;
}

/** Synchronously detect device tier. Call before mounting any Canvas. */
export function detectDeviceTier(): TierResult {
  const reasons: string[] = [];

  // Guard: server-side rendering — always return Tier B (safe middle ground)
  if (typeof window === "undefined") {
    return {
      tier: "B",
      reasons: ["SSR environment"],
      dpr: 1,
      hasWebGL2: false,
      isCoarsePointer: false,
      reducedMotion: false,
    };
  }

  const dpr = Math.min(window.devicePixelRatio ?? 1, 3);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  // ── Tier C gates ─────────────────────────────────────────────────────────

  // Reduced-motion: idle rotation and continuous animations are vestibular risks.
  // Reduced-motion users get Tier C (static image), not a slower animation.
  if (reducedMotion) {
    reasons.push("prefers-reduced-motion");
    return { tier: "C", reasons, dpr, hasWebGL2: false, isCoarsePointer, reducedMotion };
  }

  // Save-Data header (low bandwidth / data-saver mode)
  if (
    "connection" in navigator &&
    (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection?.saveData
  ) {
    reasons.push("Save-Data header active");
    return { tier: "C", reasons, dpr, hasWebGL2: false, isCoarsePointer, reducedMotion };
  }

  // Slow network (2G / slow-2G)
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  if (conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") {
    reasons.push(`slow network: ${conn.effectiveType}`);
    return { tier: "C", reasons, dpr, hasWebGL2: false, isCoarsePointer, reducedMotion };
  }

  // WebGL2 check — required for Tier A/B
  let hasWebGL2 = false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    hasWebGL2 = !!gl;
    // Clean up the context immediately
    const loseCtx = gl?.getExtension("WEBGL_lose_context");
    loseCtx?.loseContext();
  } catch {
    hasWebGL2 = false;
  }

  if (!hasWebGL2) {
    reasons.push("WebGL2 unavailable");
    return { tier: "C", reasons, dpr, hasWebGL2, isCoarsePointer, reducedMotion };
  }

  // Very small viewport (< 480px width) — OS spec §5.1 xs = Tier C
  if (window.innerWidth < 480) {
    reasons.push("viewport < 480px (xs breakpoint)");
    return { tier: "C", reasons, dpr, hasWebGL2, isCoarsePointer, reducedMotion };
  }

  // ── Tier B gates ─────────────────────────────────────────────────────────

  // Small viewport (480–767px) — OS spec §5.1 sm = Tier B
  if (window.innerWidth < 768) {
    reasons.push("viewport 480–767px (sm breakpoint)");
    return { tier: "B", reasons, dpr, hasWebGL2, isCoarsePointer, reducedMotion };
  }

  // High device pixel ratio on mid-range devices stresses the GPU
  if (dpr > 2 && isCoarsePointer) {
    reasons.push("high dPR on coarse-pointer device (likely mid-range mobile)");
    return { tier: "B", reasons, dpr, hasWebGL2, isCoarsePointer, reducedMotion };
  }

  // Tablet range (768–1023px) — OS spec §5.1 md = Tier B
  if (window.innerWidth < 1024) {
    reasons.push("viewport 768–1023px (md breakpoint)");
    return { tier: "B", reasons, dpr, hasWebGL2, isCoarsePointer, reducedMotion };
  }

  // ── Tier A — everything else (desktop, 1024px+, WebGL2, not reduced-motion)
  reasons.push("desktop, WebGL2, sufficient viewport");
  return { tier: "A", reasons, dpr, hasWebGL2, isCoarsePointer, reducedMotion };
}

/** Re-detect on resize with debounce. Returns cleanup function. */
export function watchTier(
  callback: (result: TierResult) => void,
  debounceMs = 300
): () => void {
  let timer: ReturnType<typeof setTimeout>;
  const handler = () => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(detectDeviceTier()), debounceMs);
  };
  window.addEventListener("resize", handler, { passive: true });
  return () => {
    clearTimeout(timer);
    window.removeEventListener("resize", handler);
  };
}
