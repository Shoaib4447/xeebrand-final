/**
 * XEEBRAND FeaturedWork — `components/sections/FeaturedWork.tsx`
 *
 * Section 4 of the homepage (inserted between Capabilities and Process).
 * OS spec §1.2: "Featured Work — 3 hero case studies, horizontal gallery."
 *
 * Tier system (progressive enhancement, bottom → top):
 *   Tier C / mobile : overflow-x auto, no JS override
 *   Tier B           : CSS scroll-snap-type x mandatory
 *   Tier A           : GSAP ScrollTrigger pin, 200 vh, cards translate
 *                      via translateX scrub. Active card tracked via
 *                      progress → index mapping in onUpdate.
 *   reduced-motion  : static grid, no pin, no tilt, all cards full opacity
 *
 * Active card is the one closest to viewport centre:
 *   Tier A — GSAP onUpdate progress → round to nearest index
 *   Tier B/C — IntersectionObserver ratio comparison
 *   reduced-motion — all cards treated as active (isActive = true)
 *
 * Keyboard: Arrow Left / Right moves focus between cards.
 *
 * Aria: <section aria-label="Featured case studies">, role="list",
 *       each card <a> has its own aria-label (see CaseStudyFrame).
 */

"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion } from "framer-motion";
import { CaseStudyFrame, type CaseStudy } from "@/components/three/CaseStudyFrame";
import { Button } from "@/components/ui/Button";
import { useTier, useReducedMotion } from "@/lib/store";

// ── GSAP plugin registration ──────────────────────────────────────────────────
gsap.registerPlugin(ScrollTrigger, useGSAP);

// ── Case study data ───────────────────────────────────────────────────────────

const CASE_STUDIES: CaseStudy[] = [
  {
    slug:      "lumara",
    client:    "Lumara",
    headline:  "Rebuilt from scratch",
    result:    "Pipeline doubled in 90 days",
    thumbnail: "/images/case-lumara.webp",
    tags:      ["Brand Identity", "3D Design"],
  },
  {
    slug:      "solace-co",
    client:    "Solace Co.",
    headline:  "From generic to iconic",
    result:    "Client revenue up 3.4× in 6 months",
    thumbnail: "/images/case-solace.webp",
    tags:      ["Campaign Strategy", "Digital Experience"],
  },
  {
    slug:      "greyfield",
    client:    "Greyfield",
    headline:  "The silent rebrand",
    result:    "Valuation increased 60% post-launch",
    thumbnail: "/images/case-greyfield.webp",
    tags:      ["Brand Identity", "Motion"],
  },
] as const;

const NUM_CARDS = CASE_STUDIES.length;

// ── Section header variants ───────────────────────────────────────────────────

const EASE_ENTRANCE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const headerVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_ENTRANCE } },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function FeaturedWork() {
  const tier          = useTier();
  const reducedMotion = useReducedMotion();

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef   = useRef<HTMLDivElement>(null);

  // Active card: -1 = all active (mobile / reduced-motion)
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // ── Tier B/C IntersectionObserver (non-A, non-reduced-motion) ──────────────
  const cardObsRatios = useRef<number[]>([0, 0, 0]);
  const cardObsRefs   = useRef<Array<HTMLDivElement | null>>([]);

  const setCardRef = useCallback((el: HTMLDivElement | null, i: number) => {
    cardObsRefs.current[i] = el;
  }, []);

  useEffect(() => {
    if (tier === "A" || reducedMotion) return;

    const ratios = cardObsRatios.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = cardObsRefs.current.findIndex((r) => r === entry.target);
          if (idx !== -1) ratios[idx] = entry.intersectionRatio;
        });
        const maxRatio  = Math.max(...ratios);
        const bestIdx   = maxRatio > 0.2 ? ratios.indexOf(maxRatio) : -1;
        setActiveIndex(bestIdx); // eslint-disable-line react-hooks/set-state-in-effect
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1.0] },
    );

    const refs = cardObsRefs.current;
    refs.forEach((el) => { if (el) observer.observe(el); });

    return () => observer.disconnect();
  }, [tier, reducedMotion]);

  // ── Tier A: set all-active for non-A tiers ─────────────────────────────────
  useEffect(() => {
    if (tier !== "A" || reducedMotion) {
      setActiveIndex(-1); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [tier, reducedMotion]);

  // ── GSAP horizontal pin (Tier A only) ─────────────────────────────────────
  useGSAP(
    () => {
      if (!trackRef.current || tier !== "A" || reducedMotion) return;

      const track = trackRef.current;

      gsap.to(track, {
        x: () => {
          const vw          = window.innerWidth;
          const PADDING     = Math.max(20, Math.min(80, vw * 0.055));
          return -(track.scrollWidth - vw + PADDING);
        },
        ease: "none",
        scrollTrigger: {
          trigger:    sectionRef.current,
          start:      "top top",
          end:        "+=200vh",
          pin:        true,
          scrub:      1.0,
          pinSpacing: true,
          onUpdate:   (self) => {
            const idx = Math.round(self.progress * (NUM_CARDS - 1));
            setActiveIndex(idx);
          },
        },
      });
    },
    { scope: sectionRef, dependencies: [tier, reducedMotion] },
  );

  // ── Keyboard navigation between cards ─────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const anchors = Array.from<HTMLAnchorElement>(
      sectionRef.current?.querySelectorAll(".fw-card-link") ?? [],
    );
    if (anchors.length === 0) return;
    const focused = document.activeElement;
    const idx     = anchors.indexOf(focused as HTMLAnchorElement);
    if (e.key === "ArrowRight") anchors[Math.min(idx + 1, anchors.length - 1)]?.focus();
    if (e.key === "ArrowLeft")  anchors[Math.max(idx - 1, 0)]?.focus();
  }

  // ── Track scroll style — progressively enhanced ───────────────────────────
  const isReducedOrMobile = reducedMotion || tier === "C" || tier === null;
  const isTierB           = !isReducedOrMobile && tier === "B";
  const isTierA           = tier === "A" && !reducedMotion;

  const trackStyle: React.CSSProperties = {
    display:    "flex",
    gap:        "var(--space-5)",
    // Tier A: GSAP handles position; needs fixed width so scrollWidth is accurate
    // Tier B: native scroll-snap
    // Tier C/mobile/reduced: overflow-x auto
    overflowX:      isTierA ? "visible" : "auto",
    scrollSnapType: isTierB ? "x mandatory" : undefined,
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
    // Left-padding so first card aligns with container gutter
    paddingInline: isTierA
      ? undefined
      : "clamp(var(--container-padding-mobile), 5vw, var(--container-padding-desktop))",
    // Extra right-padding so last card can fully scroll into view
    paddingRight: isTierA ? undefined : "clamp(20px, 5vw, 80px)",
  };

  const clipStyle: React.CSSProperties = isTierA
    ? {
        overflow:    "hidden",
        // Negative margin to counteract container gutter so cards can bleed edge-to-edge
        marginInline: "calc(-1 * clamp(20px, 5vw, 80px))",
        paddingInline: "clamp(20px, 5vw, 80px)",
      }
    : {};

  return (
    <section
      ref={sectionRef}
      id="featured-work"
      aria-label="Featured case studies"
      className="section-padding"
      style={{ background: "var(--surface-1)", overflow: isTierA ? "hidden" : undefined }}
    >
      {/* ── Section header ───────────────────────────────────────────────── */}
      <motion.div
        className="container-brand"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={headerVariants}
        style={{ marginBottom: "var(--space-7)" }}
      >
        {/* Eyebrow */}
        <p
          style={{
            fontSize:      "var(--text-xs)",
            fontWeight:    500,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color:         "var(--text-tertiary)",
            marginBottom:  "var(--space-3)",
          }}
        >
          Our work
        </p>

        {/* H2 */}
        <h2
          className="font-display"
          style={{
            fontSize:   "var(--text-2xl)",
            fontWeight: 700,
            lineHeight: "var(--leading-tight)",
            color:      "var(--text-primary)",
            maxWidth:   "18ch",
          }}
        >
          Proof in the{" "}
          <span className="gradient-text">work.</span>
        </h2>
      </motion.div>

      {/* ── Cards track ──────────────────────────────────────────────────── */}
      <div
        style={clipStyle}
        onKeyDown={handleKeyDown}
      >
        <div
          ref={trackRef}
          role="list"
          style={trackStyle}
          aria-label="Case studies"
        >
          {CASE_STUDIES.map((study, i) => (
            <div
              key={study.slug}
              ref={(el) => setCardRef(el, i)}
              style={{
                flex:           "0 0 auto",
                scrollSnapAlign: isTierB ? "start" : undefined,
              }}
            >
              <CaseStudyFrame
                study={study}
                isActive={activeIndex === -1 || activeIndex === i}
                index={i}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <motion.div
        className="container-brand"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        style={{
          marginTop:  "var(--space-8)",
          textAlign:  "center",
        }}
      >
        <Button variant="secondary" href="/work">
          See all work →
        </Button>
      </motion.div>
    </section>
  );
}
