/**
 * XEEBRAND Motion Preferences — `lib/motion-prefs.ts`
 *
 * React hook that returns the current prefers-reduced-motion state
 * and updates reactively if the user changes their OS setting mid-session.
 *
 * Usage:
 *   const { reducedMotion } = useMotionPrefs();
 *   if (reducedMotion) { // disable idle rotation, parallax, magnetic pull }
 */

"use client";

import { useEffect, useState } from "react";

export interface MotionPrefs {
  /** true when prefers-reduced-motion: reduce is active */
  reducedMotion: boolean;
}

const QUERY = "(prefers-reduced-motion: reduce)";

export function useMotionPrefs(): MotionPrefs {
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    // SSR-safe initialiser
    if (typeof window === "undefined") return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    setReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return { reducedMotion };
}
