# XEEBRAND — 3D Interaction Framework (Engineering Spec)
### Prompt 4 deliverable: where the 3D actually gets built
**Depends on:** OS spec (materials, tiering), Cinematic spec (scene beats), UI system (motion tokens)
**Stack:** React Three Fiber + drei + GSAP ScrollTrigger + `@react-spring/three` for physics-feel object motion

> Format for every interaction below: **Trigger → Duration/Easing → UX problem it solves.** Nothing is listed without that third column — if an effect can't name the problem, it doesn't ship.

---

## 1. Hero scene — `components/three/HeroScene.tsx`

### 1.1 Setup
```tsx
<Canvas
  camera={{ position: [0, 0, 6], fov: 35 }}
  dpr={[1, tier === 'A' ? 2 : 1.5]}
  gl={{ antialias: tier === 'A', powerPreference: 'high-performance' }}
  frameloop={inView ? 'always' : 'demand'}  // stop rendering off-screen
>
  <XMark tier={tier} />
  <ParticleField count={tier === 'A' ? 400 : 0} />
  <KeyLight />
  <RimLight />
</Canvas>
```

### 1.2 Interactions

| Interaction | Trigger | Duration / Easing | UX problem it solves |
|---|---|---|---|
| Idle rotation | `onMount`, continuous | `Math.sin(t / 8) * 0.05` rad, infinite, no easing needed (sinusoidal is self-easing) | Static hero renders read as "screenshot, not real 3D." Perpetual micro-motion proves liveness within the user's first fixation (~200ms), before they've consciously decided to trust the site. |
| Pointer parallax | `pointermove` (normalized -1→1) | `lerp(current, target, 0.05)` per frame (≈17-frame settle at 60fps ≈ 280ms perceived) | Instant 1:1 tracking feels twitchy/robotic; a lerp gives the object *inertia*, reading as physical mass — matches the "solid glossy object" material claim from the OS spec. |
| Entrance | `onMount`, after asset load | scale `0 → 1`, `600ms`, `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out), 150ms delay after Canvas mounts | A hard pop-in on load reads as broken/glitchy. Expo-out scale-in reads as the object "arriving," consistent with cinematic-spec Scene 1 framing. |
| Reduced-motion fallback | `prefers-reduced-motion: reduce` | opacity `0→1`, `200ms` linear, idle rotation + parallax disabled entirely | Vestibular safety (see OS spec §6.1) — this is a hard override, not a "slower" version. |

---

## 2. Object animation system — `components/three/AnimatedObject.tsx`

Central spring-based controller reused by every 3D object on the site (not just the X mark) so all object motion shares one physics feel.

```tsx
const { rotation, position, scale } = useSpring({
  rotation: targetRotation,
  position: targetPosition,
  scale: targetScale,
  config: { tension: 300, friction: 26 }, // "spring-tap" from UI tokens
});
```

| Interaction | Trigger | Duration/Easing | UX problem it solves |
|---|---|---|---|
| Service-card 3D lift | `pointerenter` on card DOM wrapper | spring `{tension: 300, friction: 26}`, settles ≈400ms | A flat icon that "pops into 3D" on intent-to-interact rewards curiosity without spending GPU budget rendering full 3D on every card simultaneously — mounts on hover, unmounts 600ms after `pointerleave` (grace period prevents flicker on fast mouse crossing). |
| Process disassembly | scroll (`ScrollTrigger.scrub: true`, no fixed duration) | `--ease-scrub` mapped 1:1 to scroll delta | Ties the site's central metaphor directly to reading pace — a fixed-duration autoplay here would fight the user's own scroll rhythm and feel like it's happening *to* them, not *because of* them. |
| CTA magnetic pull | `pointermove` within 120px radius of object bounding sphere | spring `{tension: 180, friction: 20}` (looser = "drag" feel per UI tokens) | Reduces the precision required to "hit" the CTA — magnetic targets have measurable click-through lift because they forgive imprecise aim, which matters more on a moving 3D object than a static button. |
| Object idle-to-active handoff | any state change (hover end → click) | cross-fade spring configs over 150ms | Prevents a visible "snap" between two different spring stiffnesses — this is the seam most naive Three.js interaction systems miss. |

---

## 3. Cursor system — `components/ui/CursorFollower.tsx` (Tier A desktop only)

| Interaction | Trigger | Duration/Easing | UX problem it solves |
|---|---|---|---|
| Default state | mount | dot, 8px, `--duration-fast` fade-in | Signals immediately that this is a "designed" cursor, priming expectation before first hover. |
| Hover-interactive | `pointerenter` on any `[data-cursor="interactive"]` | scale `1 → 2.5`, invert to ring, `200ms`, `--ease-entrance` | Gives non-obvious hit-targets (e.g. the 3D X mark, magnetic CTA) an explicit "this is clickable" signal that a normal arrow cursor can't communicate over a Canvas element. |
| Drag/scrub zones (gallery) | `pointerenter` on horizontal-scroll section | cursor swaps to a small "↔" glyph, `150ms` | Tells the user *how* to interact (drag/scroll horizontally) before they try and fail — a discoverability fix, not decoration. |
| Disabled on touch | `matchMedia('(pointer: coarse)')` | n/a — component doesn't mount | Custom cursors on touch devices are inert and just add JS weight for zero benefit. |

---

## 4. Scroll-triggered camera system — `lib/three/cameraRig.ts`

```ts
gsap.timeline({
  scrollTrigger: {
    trigger: '#scene-root',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1.2,          // 1.2s smoothing — camera lags scroll slightly, avoids whip-pan
    pin: false,           // pin only enabled for Scene 4 (Process) sub-timeline
  }
})
.to(camera.position, { x: 0, y: 0.4, z: 9, duration: 1 }, 'scene2')
.to(camera.position, { x: 2.2, y: -0.6, z: 7, duration: 1 }, 'scene3')
// ...per-scene keyframes, labeled to match Cinematic Scene Design doc
```

| Interaction | Trigger | Duration/Easing | UX problem it solves |
|---|---|---|---|
| Continuous dolly (Scenes 1→3, 5→7) | scroll position | `scrub: 1.2` (time-based smoothing, not scroll-distance-based) | Raw scroll-to-transform binding (`scrub: true`) feels mechanically tied to the wheel and amplifies trackpad jitter; a numeric scrub value adds a critically-damped follow so camera motion reads as physical, not input-mirrored. |
| Process scrub-lock (Scene 4) | scroll, `pin: true`, capped at 150vh | `scrub: 0.5` (tighter — this scene wants a more direct 1:1 feel since it's the emotional payload) | Looser smoothing elsewhere would make this scene feel sluggish exactly when precision matters most (watching parts assemble). |
| DOF focus rack (Scene 3, panel pass) | camera z-position crossing each panel's focal plane | `bokehScale` tweened `0 → 4 → 0` per panel, `--ease-scrub` | Directs attention without an arrow/spotlight — removes a decision point for the viewer. |
| Scroll-direction reversal | `scrollTrigger.direction` | all above timelines are fully reversible (no `once: true` on scroll-tied tweens) | Cinematic sites frequently break on scroll-up; every scroll-tied tween here is authored to be scrub-reversible by construction, not patched after the fact. |

---

## 5. Section transitions — `components/three/SceneTransition.tsx`

| Interaction | Trigger | Duration/Easing | UX problem it solves |
|---|---|---|---|
| Cross-scene DOF blend | last 10% of scene N's scroll range overlapping first 10% of scene N+1 | shared `--ease-scrub`, ~10% of scroll range | Produces a soft-focus "dissolve" instead of a hard visual seam, preserving the "one continuous shot" premise from the Cinematic spec without an actual cut. |
| Route change (Home → Service page) | Next.js route transition | `opacity 1→0` + `scale 1→1.08`, `400ms`, `--ease-exit` out / `--ease-entrance` in | Signals "same world, different room" — an instant hard-cut between a 3D-rich home and a flatter service page would feel like the site broke. |
| Canvas unmount on route leave | `useEffect` cleanup | Canvas fades 200ms before actual unmount/dispose | Disposing WebGL context mid-visible-frame causes a visible flash-to-black; a short fade masks teardown latency. |

---

## 6. Loading experience — `components/three/LoadGate.tsx`

```
useProgress() [drei] → tracks asset (GLTF/texture) load %
  if totalLoadTime < 1500ms → no loader shown, Canvas fades straight in
  if totalLoadTime ≥ 1500ms → gated loader activates (see below)
```

| Interaction | Trigger | Duration/Easing | UX problem it solves |
|---|---|---|---|
| Gated cold-load animation | load time crosses 1500ms threshold | X-assembly loop, screen-space SVG (not 3D), loops until `progress === 100` | Avoids the two failure modes: a spinner (generic, no brand value) or an unconditional brand-loader (adds artificial delay to already-fast loads, penalizing your best-case users). |
| Load-complete handoff | `progress === 100` | assembly animation plays one final "snap to complete" pass, `400ms`, `--ease-entrance`, then cross-fades to live Canvas over `300ms` | A loader that just vanishes reads as abrupt; a completion beat gives closure before handing off. |
| Asset fetch failure | GLTF load `onError` | Canvas never mounts; Tier-C static fallback renders instead, no error UI shown to user | Silent graceful degradation — a visible "3D failed to load" error is a worse experience than simply not knowing 3D was ever attempted. |

---

## 7. Product/work showcase interactions — `components/three/CaseStudyFrame.tsx`

| Interaction | Trigger | Duration/Easing | UX problem it solves |
|---|---|---|---|
| Frame focus-in (horizontal gallery) | active frame crosses screen-center threshold | scale `0.85 → 1`, opacity `0.5 → 1`, `--duration-base`, `--ease-entrance` | Makes the "current" case study unambiguous in a horizontally-scrolling set without needing numbered pagination UI. |
| Tilt-parallax on hover | `pointermove` over frame (desktop only) | rotateX/Y max ±4°, spring `{tension: 300, friction: 30}` | Adds tactility to what's otherwise a flat image — cheaper than full 3D per-case-study, and appropriate restraint (per Cinematic spec: case studies are about the client's work, not ours). |
| Drag-to-scroll (touch) | native touch scroll inside pinned horizontal section | native momentum, no custom easing override | Fighting native touch-scroll physics with custom JS easing is the #1 mobile-usability failure mode for scroll-hijacked galleries — this interaction deliberately does *not* get a custom curve. |

---

## 8. CTA animations — `components/three/CTAObject.tsx`

| Interaction | Trigger | Duration/Easing | UX problem it solves |
|---|---|---|---|
| Magnetic pull | pointer within 120px | spring `{tension: 180, friction: 20}` | See §2 — forgives imprecise aim on a moving target. |
| Pre-click anticipation | `pointerdown` | scale `1 → 0.94`, `100ms`, `--duration-instant` | Gives tactile confirmation the click registered *before* navigation/async work completes — removes the "did that work?" doubt window. |
| Click → route handoff | `pointerup` (valid click) | object scale `0.94 → 1.15 → 0` over `500ms`, staged: 150ms overshoot (`--ease-entrance`) then 350ms collapse (`--ease-exit`), page transition begins at the 300ms mark | The overshoot-then-collapse reads as "launching" — reinforces that clicking this specific object (not a generic button) is what's driving navigation, closing the Cinematic spec's Scene 7 narrative loop. |
| Keyboard activation (Enter/Space) | focus + keypress on underlying real `<button>` | identical animation to pointerup path | The 3D flourish must never be pointer-exclusive — same visual result triggered from the accessible DOM element underneath (see OS spec §6.3). |

---

## 9. Global engineering rules

1. **One `useFrame` loop per Canvas**, not one per object — every object's per-frame update lives in a single root ticker that distributes deltas, preventing N independent RAF-adjacent loops from fighting for frame budget.
2. **All easing curves are defined once** in `lib/motion-tokens.ts` and imported everywhere (GSAP, react-spring, CSS) — no inline `cubic-bezier()` strings anywhere in component code.
3. **Every scroll-tied tween is authored reversible** — no `once: true` unless the interaction is explicitly a one-time reveal (e.g., hero entrance).
4. **DOF, particles, and shadows are the first three things stripped per tier** (in that order) — geometry simplification is the last resort, since silhouette fidelity matters more to brand perception than post-processing.
