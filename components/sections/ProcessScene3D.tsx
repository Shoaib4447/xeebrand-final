/**
 * XEEBRAND ProcessScene3D — `components/sections/ProcessScene3D.tsx`
 *
 * The X-mark disassembly/reassembly sequence — Cinematic Scene 4.
 * Camera locked. Object transform driven by scrollYProgress (0→1).
 *
 * Spec §3.2: "camera is locked; driven entirely by scrollProgress value (0–1)
 * mapped via GSAP ScrollTrigger to useFrame animation, not by camera dolly."
 *
 * ScrollTrigger scrub: 0.5 (tighter on this scene — emotional payload needs
 * more direct 1:1 feel, per Framework spec §4).
 *
 * Hard constraints from spec:
 *   - Max 150vh of scroll consumed (hard cap — can't look "stuck")
 *   - Visible progress indicator (thin bar)
 *   - Skip-affordance: Tab or click below jumps past
 */

"use client";

import { useState, useEffect } from "react";
import type { MotionValue } from "framer-motion";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { LightRig } from "@/components/three/LightRig";
import { XMark } from "@/components/three/XMark";
import { ParticleField } from "@/components/three/ParticleField";
import { useReducedMotion } from "@/lib/store";

interface ProcessScene3DProps {
  scrollYProgress: MotionValue<number>;
}

export function ProcessScene3D({ scrollYProgress }: ProcessScene3DProps) {
  const reducedMotion = useReducedMotion();

  // Subscribe to MotionValue — drives XMark disassembly reactively.
  // Re-renders are acceptable here: this only mounts when Tier A is active
  // and fires only while the Process section is in viewport.
  const [localProgress, setLocalProgress] = useState(0);

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      // Map full-page 0→1 to scene-local 0→1
      setLocalProgress(Math.max(0, Math.min(1, (v - 0.1) / 0.8)));
    });
    return unsub;
  }, [scrollYProgress]);

  // Particle opacity peaks at local scroll 0.35–0.65 (the disassembly moment)
  const particleOpacity = (() => {
    if (localProgress < 0.35 || localProgress > 0.65) return 0;
    if (localProgress < 0.5) return (localProgress - 0.35) / 0.15;
    return (0.65 - localProgress) / 0.15;
  })();

  return (
    <div className="relative w-full h-full">
      {/* Progress indicator — spec guardrail: bounded sequence, not a bug */}
      <div
        className="absolute top-0 left-0 right-0 h-px z-10"
        style={{ background: "var(--border-hairline)" }}
        role="progressbar"
        aria-label="Process section scroll progress"
        aria-valuenow={Math.round(localProgress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full"
          style={{
            background: "var(--gradient-brand)",
            width: `${localProgress * 100}%`,
            transition: "width 0.05s linear",
          }}
        />
      </div>

      <SceneCanvas
        ariaLabel="Animated X mark disassembling and reassembling — visualizing the brand reconstruction process"
        fallbackSrc="/images/Xeebrand X.png"
        className="w-full h-full"
      >
        {/* Scene 4 — intensified lighting (midpoint of the Scene 1→7 journey) */}
        <LightRig intensityScale={1.4} />

        {/* X mark in process mode — springs toward disassembly as scroll increases */}
        <XMark mode="process" scrollProgress={localProgress} />

        {/* Particles: 600 peak, only during the disassembly window */}
        {!reducedMotion && particleOpacity > 0 && (
          <ParticleField count={600} opacity={particleOpacity} />
        )}
      </SceneCanvas>
    </div>
  );
}
