/**
 * XEEBRAND CaseStudyFrame — `components/three/CaseStudyFrame.tsx`
 *
 * Individual case-study card for the Featured Work horizontal gallery.
 *
 * Interaction behaviour (per interaction-framework spec §card-tilt):
 *   Default:  opacity 0.5, scale 0.85  (background frame)
 *   Active:   opacity 1.0, scale 1.0   (centre-most card)
 *   Entrance: y 24 → 0, opacity 0 → target, once on scroll-into-view
 *   Tilt:     Tier A desktop only — rotateX/Y ±4°, spring {stiffness:300,damping:30}
 *   Reduced-motion: static, all at full opacity/scale, no tilt
 *
 * Lives in components/three/ per task spec, but is a pure DOM component —
 * tilt runs via Framer Motion springs (RAF), not R3F's useFrame.
 */

"use client";

import { useRef } from "react";
import { motion, useSpring, useInView } from "framer-motion";
import Image from "next/image";
import { useTier, useReducedMotion } from "@/lib/store";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CaseStudy {
  slug:      string;
  client:    string;
  headline:  string;
  result:    string;
  thumbnail: string;
  tags:      string[];
}

interface CaseStudyFrameProps {
  study:    CaseStudy;
  isActive: boolean;
  /** 0-based index — used for entrance stagger */
  index:    number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TILT_SPRING = { stiffness: 300, damping: 30 } as const;
const TILT_MAX    = 4; // degrees

// ── Component ─────────────────────────────────────────────────────────────────

export function CaseStudyFrame({ study, isActive, index }: CaseStudyFrameProps) {
  const tier          = useTier();
  const reducedMotion = useReducedMotion();

  const enableTilt = tier === "A" && !reducedMotion;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const wrapperRef = useRef<HTMLDivElement>(null);
  const anchorRef  = useRef<HTMLAnchorElement>(null);

  // ── Entrance detection ─────────────────────────────────────────────────────
  const inView = useInView(wrapperRef, { once: true, margin: "-8% 0px" });

  // ── Tilt spring values ─────────────────────────────────────────────────────
  const rotX = useSpring(0, TILT_SPRING);
  const rotY = useSpring(0, TILT_SPRING);

  // ── Pointer handlers ───────────────────────────────────────────────────────
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!enableTilt || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    rotX.set(((e.clientY - cy) / (rect.height / 2)) * -TILT_MAX);
    rotY.set(((e.clientX - cx) / (rect.width  / 2)) *  TILT_MAX);
  }

  function handlePointerLeave() {
    rotX.set(0);
    rotY.set(0);
  }

  // ── Derived animation targets ──────────────────────────────────────────────
  const targetOpacity = reducedMotion ? 1 : inView ? (isActive ? 1 : 0.5) : 0;
  const targetScale   = reducedMotion ? 1 : inView ? (isActive ? 1 : 0.85) : 0.95;
  const targetY       = reducedMotion || inView ? 0 : 24;

  return (
    <div
      ref={wrapperRef}
      role="listitem"
      style={{ perspective: "1000px", flex: "0 0 auto" }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* motion.a — single element carries opacity, scale, tilt + click */}
      <motion.a
        ref={anchorRef}
        href={`/work/${study.slug}`}
        aria-label={`${study.client}: ${study.headline} — ${study.result}`}
        animate={{
          opacity: targetOpacity,
          scale:   targetScale,
          y:       targetY,
        }}
        transition={{
          duration: 0.35,
          ease: [0.16, 1, 0.3, 1],
          delay: inView ? index * 0.06 : 0,
        }}
        style={{
          rotateX: enableTilt ? rotX : 0,
          rotateY: enableTilt ? rotY : 0,
          display:         "flex",
          flexDirection:   "column",
          position:        "relative",
          width:           "clamp(280px, 38vw, 440px)",
          background:      "var(--surface-2)",
          border:          "1px solid var(--border-hairline)",
          borderRadius:    "var(--radius-md)",
          overflow:        "hidden",
          cursor:          "pointer",
          textDecoration:  "none",
          color:           "inherit",
          willChange:      "transform, opacity",
          transformStyle:  "preserve-3d",
        }}
        whileHover={!reducedMotion ? { y: -4, boxShadow: "var(--shadow-2)" } : undefined}
        whileTap={!reducedMotion ? { scale: 0.98 } : undefined}
      >
        {/* ── Thumbnail ─────────────────────────────────────────────────── */}
        <div
          style={{
            position:    "relative",
            width:       "100%",
            aspectRatio: "16 / 9",
            background:  "var(--surface-1)",
            overflow:    "hidden",
            flexShrink:  0,
          }}
        >
          <Image
            src={study.thumbnail}
            alt={`${study.client} brand case study`}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 768px) 85vw, 38vw"
          />
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div
          style={{
            padding:       "var(--space-5)",
            display:       "flex",
            flexDirection: "column",
            gap:           "var(--space-3)",
            flex:          1,
          }}
        >
          {/* Tags */}
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {study.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize:      "var(--text-xs)",
                  color:         "var(--text-tertiary)",
                  border:        "1px solid var(--border-hairline)",
                  borderRadius:  "var(--radius-full)",
                  padding:       "2px 10px",
                  letterSpacing: "0.04em",
                  lineHeight:    "1.8",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Client name */}
          <p
            style={{
              fontSize: "var(--text-sm)",
              color:    "var(--text-tertiary)",
              margin:   0,
            }}
          >
            {study.client}
          </p>

          {/* Headline */}
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize:   "var(--text-xl)",
              fontWeight: 600,
              color:      "var(--text-primary)",
              lineHeight: "var(--leading-tight)",
              margin:     0,
            }}
          >
            {study.headline}
          </h3>

          {/* Result — gradient accent */}
          <p
            className="gradient-text"
            style={{
              fontSize:   "var(--text-sm)",
              fontWeight: 600,
              margin:     0,
            }}
          >
            {study.result}
          </p>
        </div>

        {/* ── Arrow indicator ────────────────────────────────────────────── */}
        <span
          aria-hidden="true"
          style={{
            position:  "absolute",
            bottom:    "var(--space-5)",
            right:     "var(--space-5)",
            color:     "var(--text-tertiary)",
            fontSize:  "1.1rem",
            lineHeight: 1,
          }}
        >
          →
        </span>
      </motion.a>
    </div>
  );
}
