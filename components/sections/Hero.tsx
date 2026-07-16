/**
 * XEEBRAND Hero Section — `components/sections/Hero.tsx`
 *
 * Section 1 of the homepage per OS spec §1.2.
 * "One sentence positioning + the X mark as an interactive 3D hero object."
 *
 * Layout (per OS spec §5.2):
 *   Desktop: X mark right 55% / text left 45%, side-by-side
 *   Mobile:  X mark above headline (object-first preserved), full-width stack
 *
 * Animations:
 *
 * 3. Hero headline — line-by-line reveal
 *    Trigger:  onMount, after 3D settles (~600ms delay)
 *    Duration: 0.6s per line, expo-out, staggered 80ms between lines
 *    UX:       Sequences attention: object first (emotional hook) → text (rational hook)
 *
 * 3D:
 *   HeroScene is code-split via next/dynamic (ssr: false) — never in initial bundle.
 *   Tier C gets the static logo image shown via SceneCanvas fallback.
 *
 * CTAs: exactly two — "Start a project" (primary) + "See our work" (secondary).
 */

"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

// Code-split: 3D scene never in initial JS bundle (ssr: false required for WebGL)
const HeroScene = dynamic(
  () => import("@/components/three/HeroScene").then((m) => ({ default: m.HeroScene })),
  { ssr: false }
);

// Headline broken into lines for staggered reveal
const HEADLINE_LINES = [
  "Your brand,",
  "dimensionalised.",
];
const SUBLINE =
  "We take your brand apart and rebuild it stronger — from flat to lit-from-within.";

// Framer Motion variants — expo-out approximation (CSS var can't be used in Framer directly)
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.6 } },
};

const lineVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export function Hero() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: "100svh" }}
      aria-label="Hero — Xeebrand brand agency introduction"
    >
      {/* ── Background gradient field ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 70% 50%, rgba(139,63,232,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 50% 50% at 30% 60%, rgba(46,159,255,0.12) 0%, transparent 60%),
            var(--surface-0)
          `,
        }}
      />

      {/* ── Content grid ── */}
      <div
        className="container-brand relative z-10 flex flex-col-reverse md:flex-row items-center justify-between gap-12"
        style={{ minHeight: "100svh", paddingTop: "96px", paddingBottom: "64px" }}
      >
        {/* Left — text (45% desktop) */}
        <div className="flex-1 w-full md:max-w-[45%] flex flex-col items-start justify-center gap-6">

          {/* Eyebrow label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2"
          >
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full border border-[var(--border-hairline)] text-[var(--text-tertiary)]"
            >
              Brand Agency
            </span>
          </motion.div>

          {/* Display headline — line-by-line reveal */}
          <motion.h1
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full"
          >
            {HEADLINE_LINES.map((line, i) => (
              <motion.span
                key={i}
                variants={lineVariants}
                className="block gradient-text font-display"
                style={{
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: "clamp(3rem, 2.2rem + 4vw, 5.5rem)",
                  fontWeight: 700,
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                {line}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-[var(--text-secondary)] max-w-md"
            style={{ fontSize: "clamp(1rem, 0.96rem + 0.2vw, 1.125rem)", lineHeight: 1.6 }}
          >
            {SUBLINE}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap gap-3 mt-2"
          >
            <Button href="/start-a-project" variant="primary" size="lg" data-cursor="interactive">
              Start a project
            </Button>
            <Button href="/work" variant="secondary" size="lg" data-cursor="interactive">
              See our work
            </Button>
          </motion.div>

          {/* Proof micro-stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex gap-8 mt-4 pt-6 border-t border-[var(--border-hairline)] w-full"
          >
            {[
              { value: "120+", label: "Brands transformed" },
              { value: "8yr",  label: "In the craft" },
              { value: "4.9",  label: "Client rating" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span
                  className="font-mono font-bold text-[var(--xee-magenta)]"
                  style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)", fontSize: "clamp(1.125rem, 1vw + 0.8rem, 1.5rem)" }}
                >
                  {value}
                </span>
                <span className="text-xs text-[var(--text-tertiary)] tracking-wide uppercase">
                  {label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — 3D hero object (55% desktop) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full md:w-[55%] flex items-center justify-center"
          style={{ height: "clamp(340px, 50vw, 680px)" }}
          data-cursor="interactive"
        >
          <HeroScene className="w-full h-full" />
        </motion.div>
      </div>

      {/* ── Scroll cue ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        aria-hidden="true"
      >
        <span className="text-[var(--text-tertiary)] text-xs tracking-widest uppercase">Scroll</span>
        <div
          className="w-px h-10 origin-top"
          style={{
            background: "linear-gradient(to bottom, var(--xee-magenta), transparent)",
            animation: "scrollCue 2s ease-in-out infinite",
          }}
        />
      </motion.div>

      <style>{`
        @keyframes scrollCue {
          0%, 100% { opacity: 0.3; transform: scaleY(0.6); }
          50% { opacity: 1; transform: scaleY(1); }
        }
      `}</style>
    </section>
  );
}
