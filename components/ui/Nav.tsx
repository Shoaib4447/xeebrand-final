/**
 * XEEBRAND Navigation — `components/ui/Nav.tsx`
 *
 * Persistent top nav per OS spec §1.3 and Luxury UI spec §2.3.
 *
 * States (animation #4 from OS spec):
 *
 * Transparent-over-hero → solid-on-scroll
 *   Trigger:  scrollY > hero section height
 *   Duration: 0.3s ease-out, background + blur
 *   UX:       "You've left the hero, you're now in content" — orientation cue,
 *             not decoration. Height reduces 80px → 64px on scroll.
 *
 * Active route indicator:
 *   Trigger:  current route match
 *   Duration: 200ms, --ease-entrance
 *   UX:       Underline animates width via scaleX, never a hard color swap alone.
 *
 * Mobile: full-screen menu (no mega-menu, no 3D card-tilt on touch).
 * Desktop: flat nav links — mega-menu deferred to Phase 3.
 *
 * CTAs: exactly two — "Start a project" (primary) + "See our work" (secondary).
 * Per OS spec §1.4: no CTA-verb sprawl.
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./Button";
import { useXeeStore } from "@/lib/store";

const NAV_LINKS = [
  { label: "Work",     href: "/work"     },
  { label: "Services", href: "/services" },
  { label: "Studio",   href: "/studio"   },
  { label: "Journal",  href: "/journal"  },
] as const;

const HERO_HEIGHT_APPROX = typeof window !== "undefined" ? window.innerHeight : 700;

export function Nav() {
  const pathname   = usePathname();
  const navSolid   = useXeeStore((s) => s.navSolid);
  const setNavSolid = useXeeStore((s) => s.setNavSolid);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScrollY = useRef(0);

  // ── Scroll listener — transition transparent → solid ─────────────────────
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setNavSolid(y > HERO_HEIGHT_APPROX * 0.6);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // Run once to set initial state
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [setNavSolid]);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  const isHome = pathname === "/";

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          height:     navSolid ? "64px" : "80px",
          background: navSolid ? "var(--glass-bg)" : "transparent",
          backdropFilter: navSolid ? `blur(var(--glass-blur))` : "none",
          WebkitBackdropFilter: navSolid ? `blur(var(--glass-blur))` : "none",
          borderBottom: navSolid ? "1px solid var(--border-hairline)" : "none",
          transition: "height 0.3s ease-out, background 0.3s ease-out, backdrop-filter 0.3s ease-out",
        }}
      >
        <div className="container-brand h-full flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
            aria-label="Xeebrand — go to homepage"
            data-cursor="interactive"
          >
            <Image
              src="/images/Xeebrand X.png"
              alt="Xeebrand X logomark"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
              priority
            />
            <span
              className="font-display text-[var(--text-primary)] text-lg font-bold tracking-tight hidden sm:block"
              style={{ fontFamily: "'Clash Display', sans-serif", letterSpacing: "-0.02em" }}
            >
              Xeebrand
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
            {NAV_LINKS.map(({ label, href }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative group text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[200ms] text-sm font-medium"
                  aria-current={isActive ? "page" : undefined}
                  data-cursor="interactive"
                >
                  {label}
                  {/* Active + hover underline — scaleX 0→1, --ease-entrance */}
                  <span
                    className="absolute -bottom-0.5 left-0 h-px w-full origin-left"
                    style={{
                      background:  "var(--gradient-brand)",
                      transform:   isActive ? "scaleX(1)" : "scaleX(0)",
                      transition:  "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                  {/* Hover-only underline for non-active */}
                  {!isActive && (
                    <span
                      className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 group-hover:scale-x-100"
                      style={{
                        background: "var(--border-hairline)",
                        transition: "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              href="/work"
              variant="secondary"
              size="sm"
              data-cursor="interactive"
            >
              See our work
            </Button>
            <Button
              href="/start-a-project"
              variant="primary"
              size="sm"
              data-cursor="interactive"
            >
              Start a project
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            data-cursor="interactive"
          >
            <span
              className="block h-px w-6 bg-[var(--text-primary)] origin-center transition-all duration-300"
              style={{ transform: mobileOpen ? "rotate(45deg) translateY(4px)" : "none" }}
            />
            <span
              className="block h-px w-6 bg-[var(--text-primary)] transition-all duration-300"
              style={{ opacity: mobileOpen ? 0 : 1 }}
            />
            <span
              className="block h-px w-6 bg-[var(--text-primary)] origin-center transition-all duration-300"
              style={{ transform: mobileOpen ? "rotate(-45deg) translateY(-4px)" : "none" }}
            />
          </button>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 flex flex-col bg-[var(--surface-1)] md:hidden"
            style={{ paddingTop: "80px" }}
          >
            <nav
              className="flex flex-col gap-2 container-brand py-8"
              aria-label="Mobile navigation"
            >
              {NAV_LINKS.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="block py-4 text-2xl font-display font-bold text-[var(--text-primary)] border-b border-[var(--border-hairline)] hover:text-[var(--xee-magenta)] transition-colors"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  {label}
                </Link>
              ))}
              <div className="flex flex-col gap-3 mt-8">
                <Button href="/work" variant="secondary" size="lg">
                  See our work
                </Button>
                <Button href="/start-a-project" variant="primary" size="lg">
                  Start a project
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
