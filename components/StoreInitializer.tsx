/**
 * XEEBRAND Store Initializer — `components/StoreInitializer.tsx`
 *
 * Client Component that runs on mount to:
 *   1. Detect device tier (must run client-side, before Canvas mounts)
 *   2. Read prefers-reduced-motion
 *   3. Push results into Zustand store
 *
 * Renders nothing. Place once inside RootLayout, outside Suspense.
 */

"use client";

import { useEffect } from "react";
import { detectDeviceTier } from "@/lib/device-tier";
import { useXeeStore } from "@/lib/store";

export function StoreInitializer() {
  const setDeviceTier   = useXeeStore((s) => s.setDeviceTier);
  const setReducedMotion = useXeeStore((s) => s.setReducedMotion);

  useEffect(() => {
    const result = detectDeviceTier();
    setDeviceTier(result.tier);
    setReducedMotion(result.reducedMotion);

    // React to OS setting changes during session
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [setDeviceTier, setReducedMotion]);

  return null;
}
