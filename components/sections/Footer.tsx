/**
 * XEEBRAND Footer — `components/sections/Footer.tsx`
 *
 * Per OS spec §4.3: "Footer is a utility zone — motion here only adds cost,
 * not value." No animations. No 3D. Clean, high-legibility navigation.
 */

import Link from "next/link";
import Image from "next/image";

const FOOTER_LINKS = {
  Work:    ["/work", "/work/brand-identity", "/work/digital-experience", "/work/3d-campaigns"],
  Services: ["/services", "/services/brand-identity", "/services/3d-design", "/services/digital-experience", "/services/strategy"],
  Studio:  ["/studio", "/journal", "/contact", "/start-a-project"],
} as const;

const FOOTER_LINK_LABELS: Record<string, string[]> = {
  Work:     ["All work", "Brand identity", "Digital experience", "3D campaigns"],
  Services: ["All services", "Brand identity", "3D & motion", "Digital experience", "Strategy"],
  Studio:   ["About", "Journal", "Contact", "Start a project"],
};

const SOCIAL_LINKS = [
  { label: "Twitter",   href: "#" },
  { label: "LinkedIn",  href: "#" },
  { label: "Dribbble",  href: "#" },
  { label: "Instagram", href: "#" },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-[var(--border-hairline)]"
      style={{ background: "var(--surface-1)" }}
      aria-label="Site footer"
    >
      <div className="container-brand py-16">
        {/* Top row: logo + nav columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          {/* Logo + tagline */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 w-fit" aria-label="Xeebrand homepage">
              <Image
                src="/images/Xeebrand X.png"
                alt="Xeebrand logomark"
                width={28}
                height={28}
                className="w-7 h-7 object-contain"
              />
              <span
                className="text-[var(--text-primary)] font-bold"
                style={{
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: "1.1rem",
                  letterSpacing: "-0.02em",
                }}
              >
                Xeebrand
              </span>
            </Link>
            <p
              className="text-[var(--text-tertiary)] leading-relaxed"
              style={{ fontSize: "var(--text-sm)", maxWidth: "200px" }}
            >
              Premium brand agency. We build things that glow from the inside.
            </p>
            {/* Social links */}
            <div className="flex gap-4 mt-2">
              {SOCIAL_LINKS.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                  aria-label={label}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section} className="flex flex-col gap-3">
              <span
                className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]"
              >
                {section}
              </span>
              {links.map((href, i) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                >
                  {FOOTER_LINK_LABELS[section][i] ?? href.split("/").pop()}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom row: legal */}
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-8 border-t border-[var(--border-hairline)]"
        >
          <p
            className="text-[var(--text-tertiary)]"
            style={{ fontSize: "var(--text-xs)" }}
          >
            &copy; {year} Xeebrand. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((label) => (
              <Link
                key={label}
                href="#"
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors duration-200"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
