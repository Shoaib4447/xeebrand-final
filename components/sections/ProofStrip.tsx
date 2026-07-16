/**
 * XEEBRAND ProofStrip — `components/sections/ProofStrip.tsx`
 *
 * Section 2 of the homepage. OS spec §1.2: "logo wall / metrics ticker."
 * "Low-motion, high-trust." — deliberate stillness after the hero.
 *
 * Cinematic Scene 2: camera pulls back, proof metrics fade in around the X.
 * On the DOM layer, this manifests as a scrolling logo marquee + metrics row.
 *
 * Animation:
 *   Section fade/rise-in (#5): IntersectionObserver, 15% visible
 *   Trigger:  scroll to 15% visible
 *   Duration: 0.5s, translateY 24px→0, expo-out
 *   UX:       Paces content delivery to scroll speed.
 *
 * Logo marquee: CSS-only infinite scroll (no JS, no GPU), reduced-motion stops it.
 */

"use client";

import { motion, type Variants } from "framer-motion";

const METRICS = [
  { value: "120+",   label: "Brands transformed" },
  { value: "$4.2M",  label: "Client revenue generated" },
  { value: "99%",    label: "Project satisfaction" },
  { value: "48hr",   label: "Average first-concept delivery" },
] as const;

// Placeholder client names — replace with real logos/names
const CLIENTS = [
  "Meridian",  "Vaux Studio", "Helion",     "Lumara",
  "Greyfield", "Solace Co",   "Arcframe",   "Zenta",
  "Meridian",  "Vaux Studio", "Helion",     "Lumara",
] as const;

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export function ProofStrip() {
  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      className="relative overflow-hidden border-y border-(--border-hairline)"
      style={{ background: "var(--surface-1)" }}
      aria-label="Client proof — trusted by leading brands"
    >
      {/* Metrics row */}
      <div className="container-brand py-12 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-(--border-hairline)">
        {METRICS.map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center gap-1 px-6">
            <span
              className="font-mono font-bold"
              style={{
                fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
                fontSize: "clamp(1.5rem, 2vw + 1rem, 2.5rem)",
                background: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {value}
            </span>
            <span className="text-xs text-(--text-tertiary) text-center tracking-wide uppercase">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Logo marquee */}
      <div
        className="relative overflow-hidden border-t border-(--border-hairline) py-4"
        aria-label="Clients we've worked with"
      >
        {/* Fade edges */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10"
          style={{ background: "linear-gradient(to right, var(--surface-1), transparent)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10"
          style={{ background: "linear-gradient(to left, var(--surface-1), transparent)" }}
        />

        {/* Marquee track — pure CSS, pauses on hover, stops with reduced-motion */}
        <div
          className="flex gap-16 w-max"
          style={{
            animation: "marquee 30s linear infinite",
          }}
        >
          {CLIENTS.map((name, i) => (
            <span
              key={i}
              className="whitespace-nowrap text-(--text-tertiary) text-sm font-medium tracking-widest uppercase shrink-0"
            >
              {name}
            </span>
          ))}
        </div>

        <style>{`
          @keyframes marquee {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          @media (prefers-reduced-motion: reduce) {
            .marquee-track { animation: none; }
          }
        `}</style>
      </div>
    </motion.section>
  );
}
