/**
 * XEEBRAND Testimonial — `components/sections/Testimonial.tsx`
 *
 * Section 6 / Cinematic Scene 6 — deliberate stillness.
 * "Stillness = credibility. A moving quote reads as gimmicky."
 *
 * Per OS spec §4.3: "Testimonial section — not animated" beyond fade-in.
 * Cinematic spec: "Camera stops moving entirely. No particles. No parallax."
 *
 * The ONLY motion here is the section's standard fade-in (#5) — 0.5s, once.
 * Everything else is static and high-contrast. This section gets the most
 * readable typography treatment on the page.
 */

"use client";

import { motion } from "framer-motion";

const TESTIMONIAL = {
  quote:
    "Xeebrand didn't just redesign our brand — they rebuilt the way the market perceives us. We launched the new identity and our pipeline doubled within 90 days.",
  author:  "Isabelle Marchetti",
  role:    "CEO, Lumara",
  rating:  5,
} as const;

export function Testimonial() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="section-padding"
      style={{ background: "var(--surface-1)" }}
      aria-label="Client testimonial"
    >
      <div className="container-brand">
        <div className="max-w-3xl mx-auto text-center">
          {/* Stars — static, no animation */}
          <div className="flex justify-center gap-1 mb-8" aria-label="5 out of 5 stars">
            {Array.from({ length: TESTIMONIAL.rating }).map((_, i) => (
              <span
                key={i}
                aria-hidden="true"
                style={{ color: "var(--xee-yellow)", fontSize: "1.25rem" }}
              >
                ★
              </span>
            ))}
          </div>

          {/* Quote */}
          <blockquote>
            <p
              className="font-display text-[var(--text-primary)]"
              style={{
                fontFamily: "'Clash Display', sans-serif",
                fontSize: "clamp(1.25rem, 1rem + 1.5vw, 2rem)",
                fontWeight: 500,
                lineHeight: 1.4,
                letterSpacing: "-0.01em",
              }}
            >
              &ldquo;{TESTIMONIAL.quote}&rdquo;
            </p>

            {/* Attribution */}
            <footer className="mt-8 flex flex-col items-center gap-1">
              <cite
                className="not-italic font-semibold text-[var(--text-primary)]"
                style={{ fontSize: "var(--text-base)" }}
              >
                {TESTIMONIAL.author}
              </cite>
              <span
                className="text-[var(--text-tertiary)]"
                style={{ fontSize: "var(--text-sm)" }}
              >
                {TESTIMONIAL.role}
              </span>
            </footer>
          </blockquote>
        </div>
      </div>
    </motion.section>
  );
}
