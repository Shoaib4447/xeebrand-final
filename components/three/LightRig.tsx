/**
 * XEEBRAND Standard Light Rig — `components/three/LightRig.tsx`
 *
 * Exactly one 3-point rig: key (warm), fill (neutral), rim (xee-blue).
 * Reused identically across every scene — makes the site read as
 * one continuous space with consistent material appearance.
 *
 * Spec: OS spec §2.4 & Cinematic spec §4
 *   - Rim light always tinted --xee-blue
 *   - Key light always warm (--xee-orange)
 *   - Light intensity increases monotonically Scene 1→7 (intensityScale prop)
 */

import { lightRig } from "@/lib/tokens";

interface LightRigProps {
  /**
   * Multiplier applied to all light intensities.
   * Scene 1 = 1.0 (darkest), Scene 7 = 1.8 (brightest).
   * This is the single visual metaphor: darkness/potential → brightness/realized.
   */
  intensityScale?: number;
  /** Enable directional shadow (Tier A only) */
  castShadow?: boolean;
}

export function LightRig({
  intensityScale = 1.0,
  castShadow = false,
}: LightRigProps) {
  return (
    <>
      {/* Ambient — low, keeps dark areas from going pure black */}
      <ambientLight intensity={0.25 * intensityScale} />

      {/* Key — warm, top-left, matches logo warm end */}
      <directionalLight
        color={lightRig.key.color}
        intensity={lightRig.key.intensity * intensityScale}
        position={lightRig.key.position}
        castShadow={castShadow}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
      />

      {/* Fill — neutral-cool, opposite key, reduces harsh contrast */}
      <directionalLight
        color={lightRig.fill.color}
        intensity={lightRig.fill.intensity * intensityScale}
        position={lightRig.fill.position}
      />

      {/* Rim — always xee-blue, back-low, gives the edge colour-shift */}
      <pointLight
        color={lightRig.rim.color}
        intensity={lightRig.rim.intensity * intensityScale}
        position={lightRig.rim.position}
        distance={20}
        decay={2}
      />
    </>
  );
}
