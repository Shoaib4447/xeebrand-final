/**
 * XEEBRAND Button — `components/ui/Button.tsx`
 *
 * Three variants: primary | secondary | ghost
 *
 * Hover system — every hoverable element does EXACTLY ONE of:
 *   Primary  → Sweep (gradient-position sweep, animation #11 from OS spec)
 *   Secondary → Lift (background opacity shift, border lighten)
 *   Ghost    → Sweep (underline draws in from left, scaleX 0→1)
 *
 * Primary hover:
 *   Trigger:  mouseenter
 *   Duration: 0.8s (--duration-slow), gradient-position sweep left→right
 *   UX:       Echoes the logo's specular highlight sweeping across a glossy bar.
 *             Ties micro-interaction back to brand material at the pixel level.
 *
 * Primary active/press:
 *   Trigger:  mousedown
 *   Duration: 100ms (--duration-instant), scale 0.97
 *   UX:       Tactile confirmation click registered.
 *
 * Shadow-glow: only on primary, only on hover (never resting state).
 *             "Glow is a hover reward, not ambient decoration."
 */

import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type BaseProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?:    "sm" | "md" | "lg";
  className?: string;
};

type AsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type AsLink = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type ButtonProps = AsButton | AsLink;

const sizeClasses = {
  sm: "px-5 py-2.5 text-sm",
  md: "px-8 py-3.5 text-base",
  lg: "px-10 py-4 text-lg",
} as const;

export function Button({
  variant  = "primary",
  size     = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const base =
    "relative inline-flex items-center justify-center font-semibold " +
    "rounded-full transition-all select-none " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)] " +
    "active:scale-[0.97] active:duration-[100ms] " +
    sizeClasses[size];

  const variantClass =
    variant === "primary"
      ? [
          "text-[var(--text-primary)]",
          // Gradient via a pseudo-element so we can animate background-position
          "bg-gradient-to-br from-[var(--xee-yellow)] via-[var(--xee-magenta)] to-[var(--xee-blue)]",
          "bg-[length:200%_200%] bg-left",
          "hover:bg-right hover:shadow-[var(--shadow-glow)]",
          "duration-[800ms] ease-in-out",
        ].join(" ")
      : variant === "secondary"
      ? [
          "text-[var(--text-primary)]",
          "bg-[var(--interactive-idle)]",
          "border border-[var(--border-hairline)]",
          "hover:bg-[var(--interactive-hover)] hover:border-[rgba(255,255,255,0.2)]",
          "duration-[200ms] ease-[var(--ease-entrance)]",
        ].join(" ")
      : /* ghost */
        [
          "text-[var(--text-primary)] no-underline",
          "group relative overflow-hidden",
          "hover:text-[var(--xee-magenta)]",
          "duration-[200ms] ease-[var(--ease-entrance)]",
          "after:content-[''] after:absolute after:bottom-0 after:left-0",
          "after:h-px after:w-full after:bg-[var(--gradient-brand)]",
          "after:origin-left after:scale-x-0",
          "hover:after:scale-x-100 after:transition-transform after:duration-[200ms] after:ease-[var(--ease-entrance)]",
        ].join(" ");

  const classes = `${base} ${variantClass} ${className}`;

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...linkRest } = rest as AsLink;
    return (
      <Link href={href} className={classes} {...(linkRest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
