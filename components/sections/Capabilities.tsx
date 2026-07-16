/**
 * XEEBRAND Capabilities — `components/sections/Capabilities.tsx`
 *
 * Section 3 of the homepage. OS spec §1.2: "3–5 service pillars."
 *
 * Animation #7 — Service card hover "2D→3D lift":
 *   Trigger:  mouseenter
 *   Duration: 0.4s, custom spring {tension: 300, friction: 26}
 *   UX:       Converts passive browsing into active exploration.
 *             "Lift" mimics physically picking up an object.
 *
 * Per the spec, the full 3D micro-scene per card is deferred to Phase 3.
 * This implements the 2D card with the lift behavior + gradient icon.
 * The icon slot is ready to receive a mounted 3D scene on hover.
 *
 * Card hover rule (Luxury UI §2.5):
 *   Cards → Lift (translateY + shadow) — not Sweep or Glow.
 */

"use client";

import { motion } from "framer-motion";

const SERVICES = [
  {
    icon: "⬡",
    title: "Brand Identity",
    description:
      "From logomark to material language — we build the entire physical grammar of your brand.",
    tag: "Foundation",
  },
  {
    icon: "◈",
    title: "3D Design & Motion",
    description:
      "Objects that live in real light. Animations that earn every frame. Nothing decorative.",
    tag: "Craft",
  },
  {
    icon: "◬",
    title: "Digital Experience",
    description:
      "Websites and apps that feel like premium objects — fast, tactile, conversion-architected.",
    tag: "Engineering",
  },
  {
    icon: "⬖",
    title: "Campaign Strategy",
    description:
      "Positioning, narrative, and launch architecture that turns craft into market momentum.",
    tag: "Strategy",
  },
] as const;

const sectionVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden:   { opacity: 0, y: 24 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export function Capabilities() {
  return (
    <section
      className="section-padding"
      aria-label="Our capabilities — service pillars"
    >
      <div className="container-brand">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 max-w-lg"
        >
          <p className="text-xs uppercase tracking-[0.12em] text-(--text-tertiary) mb-4">
            What we do
          </p>
          <h2
            className="font-display"
            style={{
              fontFamily: "'Clash Display', sans-serif",
              fontSize: "clamp(2rem, 1.6rem + 2vw, 3.5rem)",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Every discipline,{" "}
            <span className="gradient-text">one material language.</span>
          </h2>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {SERVICES.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ServiceCard({
  icon,
  title,
  description,
  tag,
}: (typeof SERVICES)[number]) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{
        y: -4,
        transition: { type: "spring", stiffness: 300, damping: 26 },
      }}
      className="group relative flex flex-col gap-4 p-8 rounded-2xl cursor-pointer"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border-hairline)",
        boxShadow: "var(--shadow-1)",
      }}
      data-cursor="interactive"
    >
      {/* Shadow upgrade on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ boxShadow: "var(--shadow-2)" }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Icon slot — Phase 3 will mount a 3D micro-scene here on hover */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
        style={{
          background: "var(--interactive-idle)",
          border: "1px solid var(--border-hairline)",
        }}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Tag */}
      <span
        className="text-xs uppercase tracking-widest font-semibold"
        style={{
          background: "var(--gradient-brand)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {tag}
      </span>

      {/* Title */}
      <h3
        className="font-semibold text-(--text-primary)"
        style={{ fontSize: "var(--text-lg)" }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className="text-(--text-secondary) leading-relaxed mt-auto"
        style={{ fontSize: "var(--text-sm)" }}
      >
        {description}
      </p>

      {/* Arrow link */}
      <div className="flex items-center gap-1 text-xs text-(--text-tertiary) group-hover:text-(--xee-magenta) transition-colors duration-200 mt-2">
        <span>Learn more</span>
        <span
          className="transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden="true"
        >
          →
        </span>
      </div>
    </motion.div>
  );
}
