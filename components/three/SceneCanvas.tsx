/**
 * XEEBRAND SceneCanvas — `components/three/SceneCanvas.tsx`
 *
 * Shared Canvas wrapper that:
 *   1. Gates mounting behind device-tier detection (never flashes on low-end)
 *   2. Applies tier-appropriate dPR, antialiasing, and power preference
 *   3. Stops rendering when off-screen (frameloop="demand" via IntersectionObserver)
 *   4. Provides a11y role="img" + aria-label wrapping every Canvas
 *   5. Shows Tier C static fallback when Canvas would not mount
 *
 * Usage:
 *   <SceneCanvas ariaLabel="Animated Xeebrand logo">
 *     <XMark />
 *   </SceneCanvas>
 */

"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { useTier } from "@/lib/store";
import type { DeviceTier } from "@/lib/device-tier";

interface SceneCanvasProps {
  /** Accessible description of the 3D content — required, no exceptions */
  ariaLabel: string;
  /** Static image shown when Tier C (no Canvas) or during SSR */
  fallbackSrc?: string;
  fallbackAlt?: string;
  className?: string;
  children: React.ReactNode;
}

export function SceneCanvas({
  ariaLabel,
  fallbackSrc,
  fallbackAlt,
  className = "",
  children,
}: SceneCanvasProps) {
  const tier = useTier();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // ── Stop rendering when off-screen (saves GPU on long scroll pages) ─────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── Not yet detected (SSR or pre-mount) → render nothing, avoid flash ───────
  if (tier === null) {
    return (
      <div
        ref={containerRef}
        className={`relative ${className}`}
        style={{ background: "transparent" }}
      />
    );
  }

  // ── Tier C → static fallback image, no Canvas ────────────────────────────────
  if (tier === "C") {
    return (
      <div
        ref={containerRef}
        className={`relative ${className}`}
        role="img"
        aria-label={ariaLabel}
      >
        {fallbackSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fallbackSrc}
            alt={fallbackAlt ?? ariaLabel}
            className="w-full h-full object-contain"
            loading="eager"
          />
        )}
      </div>
    );
  }

  // ── Tier A/B → full Canvas ────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 35, near: 0.1, far: 100 }}
        dpr={[1, tier === "A" ? 2 : 1.5]}
        gl={{
          antialias:        tier === "A",
          powerPreference:  "high-performance",
          alpha:            true,
          preserveDrawingBuffer: false,
        }}
        frameloop={inView ? "always" : "demand"}
        shadows={tier === "A"}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}
