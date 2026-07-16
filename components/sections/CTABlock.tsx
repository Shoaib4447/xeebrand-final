/**
 * XEEBRAND CTABlock — `components/sections/CTABlock.tsx`
 *
 * Section 7 / Cinematic Scene 7 — "The invitation."
 * "Camera pushes in one final time. X mark reacts magnetically to cursor.
 *  The CTA object physically responding — visual handoff from passive to active."
 *
 * Interactions:
 *
 * 10. Magnetic cursor pull
 *     Trigger:  pointer within 120px of 3D object
 *     Easing:   spring {tension: 180, friction: 20} (drag spring)
 *     Duration: settles ~600ms
 *     UX:       Forgives imprecise aim on a moving target. Measurable CTR lift.
 *
 * The X object at rest is the BRIGHTEST point of the whole page (intensityScale 1.8)
 * per Cinematic spec §4: "brightness increases monotonically Scene 1→7."
 * This communicates "transformation complete."
 *
 * The underlying navigation target is a real <a> element — keyboard activatable.
 * CTAObject in 3D wraps this a11y element.
 */

"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useTier } from "@/lib/store";

const CTAScene = dynamic(
  () => import("./CTAScene").then((m) => ({ default: m.CTAScene })),
  { ssr: false }
);

export function CTABlock() {
  const tier   = useTier();
  const router = useRouter();

  const handleStart = useCallback(() => {
    router.push("/start-a-project");
  }, [router]);

  return (
    <section
      className="section-padding relative overflow-hidden"
      style={{ background: "var(--surface-0)" }}
      aria-label="Start your brand project — call to action"
    >
      {/* Full-bleed gradient background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 100% 80% at 50% 50%,
              rgba(139,63,232,0.25) 0%,
              rgba(255,61,143,0.15) 35%,
              rgba(46,159,255,0.10) 65%,
              transparent 100%
            )
          `,
        }}
      />

      <div
        className="container-brand relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16"
      >
        {/* Text column */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 max-w-lg"
        >
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)] mb-6">
            Ready?
          </p>
          <h2
            className="font-display mb-6"
            style={{
              fontFamily: "'Clash Display', sans-serif",
              fontSize: "clamp(2.5rem, 2rem + 3vw, 5rem)",
              fontWeight: 700,
              lineHeight: 1.0,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Let&rsquo;s build{" "}
            <span className="gradient-text">something real.</span>
          </h2>
          <p
            className="text-[var(--text-secondary)] mb-8"
            style={{ fontSize: "var(--text-lg)", lineHeight: 1.6 }}
          >
            Brief us on your brand challenge. We&rsquo;ll come back with a perspective,
            not a pitch deck.
          </p>

          <div className="flex flex-wrap gap-3">
            {/* Primary CTA — the magnetic object IS the primary CTA on desktop,
                but this button is the accessible fallback and mobile CTA */}
            <Button
              href="/start-a-project"
              variant="primary"
              size="lg"
              data-cursor="interactive"
            >
              Start a project
            </Button>
            <Button
              href="/work"
              variant="secondary"
              size="lg"
              data-cursor="interactive"
            >
              See our work
            </Button>
          </div>
        </motion.div>

        {/* 3D X mark — the magnetic CTA object */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex-shrink-0"
          style={{ width: "clamp(240px, 35vw, 480px)", height: "clamp(240px, 35vw, 480px)" }}
        >
          {/* Accessible underlying element — keyboard navigation target */}
          <div id="cta-object-anchor" className="relative w-full h-full">
            {tier !== "C" ? (
              <CTAScene onActivate={handleStart} />
            ) : (
              /* Tier C: static logo as CTA */
              <button
                onClick={handleStart}
                className="w-full h-full flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] rounded-full"
                data-cursor="interactive"
                aria-label="Start a project"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/Xeebrand X.png"
                  alt="Xeebrand X — start a project"
                  className="w-2/3 h-2/3 object-contain opacity-80 hover:opacity-100 transition-opacity duration-300"
                />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
