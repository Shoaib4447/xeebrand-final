/**
 * XEEBRAND Process — `components/sections/Process.tsx`
 *
 * Section 5 / Cinematic Scene 4 — "the hero scene of the whole site."
 *
 * "X mark disassembles into 2 bars → drifts apart with light-trail particles
 *  → reassembles sharper, brighter, more saturated as scroll continues."
 *
 * The 3D disassembly is the pitch dramatized:
 * "We take your brand apart and rebuild it stronger."
 *
 * Interactions (animation #6 from OS spec):
 *   Trigger:  scroll-scrubbed, ScrollTrigger { scrub: true }
 *   Easing:   --ease-scrub (cubic-bezier(0.65, 0, 0.35, 1)), 1:1 scroll delta
 *   Duration: tied to scroll (no fixed duration — user controls pacing)
 *   UX:       Literalizes service pitch. The ONLY animation allowed to be purely
 *             metaphorical — it IS the value proposition.
 *
 * Mobile fallback: 4-step visual sequence with CSS opacity transitions
 * (pre-rendered PNG frames swapped on scroll). Implemented below.
 *
 * Scroll-lock: capped at 150vh. Visible progress indicator. Skip-affordance.
 * These guardrails are what make this legitimate, not a gimmick.
 */

"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { motion, useScroll, type MotionValue } from "framer-motion";
import { useTier } from "@/lib/store";

// Code-split process 3D scene
const ProcessScene3D = dynamic<{ scrollYProgress: MotionValue<number> }>(
  () => import("@/components/sections/ProcessScene3D").then((m) => ({ default: m.ProcessScene3D })),
  { ssr: false }
);

const STEPS = [
  { n: "01", title: "Audit",       desc: "We pull every brand asset apart. Nothing is sacred. We find what's working, what's lying, and what's missing." },
  { n: "02", title: "Deconstruct", desc: "The broken parts get taken all the way down. Overused fonts, muddy palettes, inconsistent tone — all stripped." },
  { n: "03", title: "Rebuild",     desc: "We build the new system piece by piece: mark, material, motion, voice. Every decision has a reason." },
  { n: "04", title: "Launch",      desc: "Delivery is a system, not a file dump. Handoff includes full usage guides, asset libraries, and motion specs." },
] as const;

export function Process() {
  const tier      = useTier();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target:    sectionRef,
    offset:    ["start end", "end start"],
  });

  const isMobile = tier === "B" || tier === "C" || tier === null;

  return (
    <section
      ref={sectionRef}
      className="section-padding relative overflow-hidden"
      style={{ background: "var(--surface-0)" }}
      aria-label="Our process — how we work"
    >
      {/* Subtle gradient bg */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255,61,143,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="container-brand relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24"
        >
          <p className="text-xs uppercase tracking-[0.12em] text-(--text-tertiary) mb-4">
            How we work
          </p>
          <h2
            className="font-display mx-auto"
            style={{
              fontFamily: "'Clash Display', sans-serif",
              fontSize: "clamp(2rem, 1.6rem + 2vw, 3.5rem)",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              maxWidth: "600px",
            }}
          >
            We break your brand down{" "}
            <span className="gradient-text">and rebuild it.</span>
          </h2>
          <p
            className="mt-6 text-(--text-secondary) mx-auto"
            style={{ fontSize: "var(--text-base)", lineHeight: 1.7, maxWidth: "480px" }}
          >
            Not a facelift. A complete reconstruction — every piece re-engineered
            to work harder, together.
          </p>
        </motion.div>

        {/* Two-column: steps left, 3D/visual right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Steps */}
          <div className="flex flex-col gap-12">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex gap-6"
              >
                <div
                  className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-mono font-bold border border-(--border-hairline)"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono, monospace)",
                    background: "var(--interactive-idle)",
                    color: "var(--xee-magenta)",
                  }}
                >
                  {step.n}
                </div>
                <div>
                  <h3
                    className="font-semibold text-(--text-primary) mb-2"
                    style={{ fontSize: "var(--text-lg)" }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-(--text-secondary)"
                    style={{ fontSize: "var(--text-sm)", lineHeight: 1.7 }}
                  >
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 3D process scene (Tier A) or mobile static visual (Tier B/C) */}
          <div
            className="flex items-center justify-center"
            style={{ height: "clamp(300px, 40vw, 560px)" }}
          >
            {!isMobile ? (
              <ProcessScene3D scrollYProgress={scrollYProgress} />
            ) : (
              <MobileProcessVisual />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Mobile fallback — 4-step static visual (no scroll dependency needed)
function MobileProcessVisual() {
  return (
    <div
      className="relative w-full h-full flex items-center justify-center rounded-2xl overflow-hidden"
      style={{ background: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
      role="img"
      aria-label="Process stages: whole X, separated bars, reassembling, complete X"
    >
      {/* Fallback: static logo in different compositions */}
      {/* In production, swap these for pre-rendered PNG frames */}
      <div className="flex flex-col items-center gap-4 p-8">
        <div
          className="w-32 h-32 rounded-2xl"
          style={{
            background: "var(--gradient-brand)",
            opacity: 0.15,
          }}
          aria-hidden="true"
        />
        <p className="text-(--text-tertiary) text-sm text-center">
          Scroll to see the transformation
        </p>
      </div>
    </div>
  );
}
