/**
 * XEEBRAND Global Store — `lib/store.ts`
 *
 * Tiny Zustand store carrying the three pieces of global state
 * that multiple components need without prop-drilling:
 *   1. deviceTier — drives 3D/fallback rendering decisions
 *   2. scrollProgress — 0→1 across the full homepage, drives cinematic rig
 *   3. reducedMotion — gates all continuous animation
 *
 * Populated once by <StoreInitializer> (a Client Component in layout)
 * and then read wherever needed via these hooks.
 */

import { create } from "zustand";
import type { DeviceTier } from "./device-tier";

interface XeeStore {
  // ── Device capability ──────────────────────────────────────────────────────
  deviceTier: DeviceTier | null; // null = not yet detected (server render)
  setDeviceTier: (tier: DeviceTier) => void;

  // ── Scroll ─────────────────────────────────────────────────────────────────
  /** 0→1 across the full scrollable height of the page */
  scrollProgress: number;
  setScrollProgress: (progress: number) => void;

  // ── Motion ─────────────────────────────────────────────────────────────────
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;

  // ── Nav state ──────────────────────────────────────────────────────────────
  /** true once scrollY has crossed the hero section height */
  navSolid: boolean;
  setNavSolid: (solid: boolean) => void;
}

export const useXeeStore = create<XeeStore>((set) => ({
  deviceTier:     null,
  setDeviceTier:  (tier) => set({ deviceTier: tier }),

  scrollProgress:    0,
  setScrollProgress: (progress) => set({ scrollProgress: progress }),

  reducedMotion:    false,
  setReducedMotion: (value) => set({ reducedMotion: value }),

  navSolid:    false,
  setNavSolid: (solid) => set({ navSolid: solid }),
}));

// ── Convenience selectors ─────────────────────────────────────────────────────
export const useTier        = () => useXeeStore((s) => s.deviceTier);
export const useScrollProg  = () => useXeeStore((s) => s.scrollProgress);
export const useReducedMotion = () => useXeeStore((s) => s.reducedMotion);
export const useNavSolid    = () => useXeeStore((s) => s.navSolid);
