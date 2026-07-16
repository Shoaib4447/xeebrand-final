/**
 * XEEBRAND DOF Pass — `components/three/DOFPass.tsx`
 *
 * EffectComposer + DepthOfField for Scene 3 (Capabilities lateral pass).
 *
 * Placed inside <AnimationProvider> inside the R3F Canvas.
 * Tier A ONLY — dynamically imported in SceneCanvas with a tier guard.
 * Never mounts on Tier B/C → zero import cost for those tiers.
 *
 * bokehScale is driven imperatively by useDOFController (P2 tick).
 * No React state, no re-renders. Effect uniforms are written directly to the
 * DepthOfFieldEffect instance each frame.
 *
 * WebGLRenderTarget stability guarantee:
 *   EffectComposer creates its RenderTargets once on mount and reuses them.
 *   Setting multisampling={0} disables MSAA RenderTargets (extra cost, not needed).
 *   Texture count must be stable after first render — verified via
 *   renderer.info.memory.textures in Task 7 performance audit.
 *
 * Focus parameters (Scene 3 camera at z=7, looking at z=0, far=100):
 *   focusDistance = 0.07   (normalized: 7 / 100 = 0.07 — focus on scene origin)
 *   focalLength   = 0.025  (controls blur falloff — subtle, not cinematic heavy)
 *   bokehScale    = 0 → 4  (driven each frame by useDOFController)
 */

"use client";

import { useRef } from "react";
import { EffectComposer, DepthOfField } from "@react-three/postprocessing";
import type { DepthOfFieldEffect } from "postprocessing";
import { useDOFController } from "@/lib/three/useDOFController";

/**
 * World-space Z distance from camera to scene origin at Scene 3.
 * camera.position.z = 7 (see cameraKeyframes.scene3), camera.far = 100.
 * focusDistance (normalized) = distance / far = 7 / 100.
 */
const FOCUS_DISTANCE = 0.07;

/** Controls how quickly objects blur out of focus. 0.025 = subtle depth cue. */
const FOCAL_LENGTH = 0.025;

export function DOFPass() {
  // Ref to the DepthOfFieldEffect instance — passed to useDOFController
  // which writes .bokehScale imperatively in the P2 animation tick.
  const effectRef = useRef<DepthOfFieldEffect>(null);

  // Wire up the DOF controller — returns bokehScaleRef for external readers
  useDOFController(effectRef);

  // Initial bokehScale=0 (sharp) — the P2 tick drives all subsequent values.
  // EffectComposer multisampling={0}: disable MSAA to prevent extra RenderTarget
  // allocation (satisfies "no new RenderTarget per frame" constraint).
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <DepthOfField
        ref={effectRef}
        focusDistance={FOCUS_DISTANCE}
        focalLength={FOCAL_LENGTH}
        bokehScale={0}
      />
    </EffectComposer>
  );
}
