/**
 * XEEBRAND CTAScene — `components/sections/CTAScene.tsx`
 *
 * Wraps SceneCanvas + CTAObject for the CTA block.
 * Separated from CTABlock to allow next/dynamic ssr:false code-split.
 * Lighting at intensityScale 1.8 — brightest point of the full journey.
 */

"use client";

import { SceneCanvas } from "@/components/three/SceneCanvas";
import { LightRig } from "@/components/three/LightRig";
import { CTAObject } from "@/components/three/CTAObject";

interface CTASceneProps {
  onActivate: () => void;
}

export function CTAScene({ onActivate }: CTASceneProps) {
  return (
    <SceneCanvas
      ariaLabel="Interactive Xeebrand X mark — click or press Enter to start a project"
      fallbackSrc="/images/Xeebrand X.png"
      fallbackAlt="Start a project"
      className="w-full h-full"
    >
      {/* Scene 7 — brightest lighting in the journey (transformation complete) */}
      <LightRig intensityScale={1.8} />
      <CTAObject onActivate={onActivate} />
    </SceneCanvas>
  );
}
