# XEEBRAND — AI-Assisted Implementation Task Board
### Production-ready workflow · Clean architecture · Fast interactions
**Depends on:** All four spec files (OS spec, Cinematic, Luxury UI, Interaction Framework)
**Stack:** Next.js 16 · React 19 · React Three Fiber 9 · Three.js r185 · GSAP · Framer Motion · Zustand · Tailwind v4

---

## Build Status Snapshot

### Done ✅
- `app/layout.tsx` — fonts, StoreInitializer, Nav, CursorFollower
- `app/globals.css` — full design token system
- `app/page.tsx` — homepage section composition
- `lib/tokens.ts` · `lib/device-tier.ts` · `lib/store.ts` · `lib/motion-prefs.ts`
- `components/StoreInitializer.tsx`
- `components/three/materials.ts` · `SceneCanvas.tsx` · `LightRig.tsx`
- `components/three/XMark.tsx` — rewritten, useFrame-only, no @react-spring/three
- `components/three/ParticleField.tsx` · `HeroScene.tsx` · `CTAObject.tsx`
- `components/ui/Button.tsx` · `Nav.tsx` · `CursorFollower.tsx`
- `components/sections/` — all 7 sections: Hero, ProofStrip, Capabilities, Process, ProcessScene3D, Testimonial, CTABlock, CTAScene, Footer

### Missing ❌
- `components/three/AnimatedObject.tsx` — single useFrame root ticker
- `lib/three/cameraRig.ts` — GSAP ScrollTrigger camera dolly (the spec's core mechanic)
- `lib/three/useDOFController.ts` — depth of field for Scene 3
- `components/three/SceneTransition.tsx` — cross-scene DOF dissolve + route transitions
- `components/three/LoadGate.tsx` — cold-load gating with X-assembly SVG
- `components/three/CaseStudyFrame.tsx` — tilt-parallax work showcase card
- `components/sections/FeaturedWork.tsx` — Section 4 (entirely absent from page.tsx)
- `tests/` — Playwright E2E + Vitest unit + axe-core a11y

---

## Execution Order

```
Task 1 (AnimatedObject)
  └── Task 2 (CameraRig)
        └── Task 3 (DOF)
              └── Task 6 (SceneTransition)
  ├── Task 4 (FeaturedWork)   ← parallel with Task 2
  └── Task 5 (LoadGate)       ← parallel with Task 2
Task 7 (Performance)          ← after all features
Task 8 (Accessibility)        ← after Task 7
Task 9 (Tests)                ← last, validates everything
```

---

## Reusable Component Registry

| Component | Consumed by | Contract |
|---|---|---|
| `AnimatedObject` / `useAnimationTick` | XMark, ParticleField, CTAObject, CaseStudyFrame | `tick(cb, priority)` → cleanup fn |
| `SceneCanvas` | HeroScene, ProcessScene3D, CTAScene | `tier`, `ariaLabel`, `inView` |
| `LightRig` | All scene canvases | `intensityScale` 1.0 → 1.8 per scene |
| `XMark` | HeroScene, ProcessScene3D, CTAObject | `mode`, `scrollProgress`, `pointerNorm` |
| `useDOFController` | SceneCanvas, SceneTransition | `scrollProgress` in → `bokehScale` out |
| `useCameraRig` | Root Canvas | `camera` ref in → `{ timeline, destroy }` out |
| `Button` | Hero, CTABlock, Nav | `variant`, `href` or `onClick` |

---

---

## Task 1 — Central `AnimatedObject` controller + single `useFrame` budget

**Status:** ❌ Not started  
**Priority:** CRITICAL — blocks Tasks 2, 3, 6  
**Files:** `components/three/AnimatedObject.tsx`

### Why it exists
Per interaction spec §9 rule 1: *"One `useFrame` loop per Canvas."* Currently XMark, ParticleField, and CTAObject each run independent frame loops — N separate RAF-adjacent loops fighting for frame budget. This consolidates them into one root ticker with priority-ordered dispatch.

### Exact prompt
```
Act as senior React Three Fiber engineer. Build `components/three/AnimatedObject.tsx`
— a provider + hook system that replaces per-component useFrame calls with one shared
root ticker.

Requirements:
- `<AnimationProvider>` wraps every Canvas. Runs ONE useFrame that collects callbacks
  registered by children via `useAnimationTick(cb, priority)`.
- Priority 0 = physics/spring updates. Priority 1 = transform writes. Priority 2 =
  post-processing. This ordering prevents stale reads (springs settle before meshes move).
- `useAnimationTick` returns an `unsubscribe` function; call it in useEffect cleanup.
- Each callback receives `(state: RootState, delta: number, frame: number)`.
- Export `useSpringTick(config)` — a thin wrapper that drives a ref-based spring
  (no @react-spring, pure lerp) and writes results to a ref each frame.
  Returns `{ valueRef, setTarget }`. Import easing from `lib/tokens.ts`.
- Zero re-renders. All mutation happens inside the ticker, never setState.
- Tier B frame cap: if `useTier() === 'B'`, throttle to 30fps via
  `performance.now()` delta check inside the provider.
- Page Visibility API: pause ticker when `document.hidden === true`.
- File: components/three/AnimatedObject.tsx
```

### Architecture
```tsx
// Provider (one per Canvas)
<AnimationProvider>
  <XMark />           // registers via useAnimationTick at Priority 1
  <ParticleField />   // registers via useAnimationTick at Priority 0
  <CTAObject />       // registers via useAnimationTick at Priority 1
</AnimationProvider>
```

### Animation specs
- Priority 0: spring math (lerp computations, spring target resolution)
- Priority 1: THREE object mutations (`mesh.position.set`, `group.scale.setScalar`)
- Priority 2: post-processing uniform writes (`uniforms.bokehScale.value = x`)

### Responsive requirements
- Tier A: full 60fps, no cap
- Tier B: 30fps cap (halves GPU pressure on integrated graphics)
- Tier C: AnimationProvider never mounts (no Canvas)

### Accessibility checks
- Ticker pauses on `document.visibilitychange` → `hidden` (no CPU drain while tabbed away)
- `prefers-reduced-motion`: expose `useReducedMotionTick()` variant that skips Priority 1 mutations and only runs static entrance-fade

### Testing procedures
- **Unit:** mock `useFrame` — assert tick callback count = 1 regardless of 10 subscribers
- **Unit:** assert priority order — Priority 0 callback executes before Priority 1 callback
- **Unit:** assert cleanup — after `unsubscribe()`, callback no longer fires
- **Perf:** Chrome DevTools Performance panel → `AnimationProvider` frame time < 2ms at 10 active subscribers

---

---

## Task 2 — Camera rig `lib/three/cameraRig.ts`

**Status:** ❌ Not started  
**Priority:** HIGH — the spec's central mechanic  
**Files:** `lib/three/cameraRig.ts`, updates `lib/tokens.ts`

### Why it exists
The cinematic spec's core: *"scroll position = timecode, not page position."* One persistent GSAP timeline drives camera position/rotation across all 7 scenes. Currently missing — each section handles its own scroll independently, breaking the "one continuous shot" premise.

### Exact prompt
```
Act as senior Three.js + GSAP ScrollTrigger engineer. Build `lib/three/cameraRig.ts`.

Architecture:
- Export `buildCameraRig(camera: THREE.PerspectiveCamera, scrollEl: HTMLElement)`
  → returns `{ timeline, destroy }`.
- One GSAP timeline, scrollTrigger: { trigger: '#scene-root', start: 'top top',
  end: 'bottom bottom', scrub: 1.2 }.
- Scene keyframes (store in lib/tokens.ts → cameraKeyframes if not present):
    Scene 1 (0–8%):   position [0, 0, 6],    lookAt [0, 0, 0]  — held opening shot
    Scene 2 (8–20%):  position [0, 0.4, 9],  lookAt [0, 0, 0]  — pull back reveal
    Scene 3 (20–42%): position [2.2,-0.6, 7], lookAt [0, 0, 0] — lateral gallery pass
    Scene 4 (42–62%): position [0, 0, 5],    lookAt [0, 0, 0]  — held, object moves
    Scene 5 (62–80%): position [0, 0, 4],    lookAt [0, 0, 0]  — push-in case studies
    Scene 6 (80–88%): position [0, 0, 5],    lookAt [0, 0, 0]  — hold (testimonial stillness)
    Scene 7 (88–100%): position [0, 0, 4.5], lookAt [0, 0, 0]  — final push CTA
- Scene 4 sub-timeline: nested, scrub: 0.5, pin: true on #process-section.
  Max scroll consumed: 150vh (cinematic spec §4 guardrail — hard cap, skip-affordance).
- Scene boundaries overlap 10%: last 10% of scene N easing blends into first 10%
  of scene N+1 via shared --ease-scrub curve (no visible seam).
- Camera lerp damp: scrub: 1.2 globally. scrub: 0.5 for Scene 4 only.
- Export `useCameraRig()` hook: mounts rig to R3F camera in useEffect,
  calls destroy() on unmount (full GSAP cleanup — kill timeline + ScrollTrigger).
- Constraint: NO OrbitControls anywhere. Camera moves on fixed rail only.
- Constraint: all tweens reversible — no once: true on scroll-tied tweens.
- prefers-reduced-motion: if active, skip all dolly; camera holds at Scene 1 position.
  Sections render in normal scroll flow without choreography.
```

### Architecture
```
lib/
  three/
    cameraRig.ts        ← build here
lib/
  tokens.ts             ← add cameraKeyframes export
```

### Animation specs
- Global scrub: `1.2` (1.2s time-based smoothing — camera lags scroll slightly, eliminates trackpad jitter)
- Scene 4 scrub: `0.5` (tighter — emotional payload needs precision)
- Scene boundaries: overlapping ease, 10% blend zone per spec §5
- No `duration` on scroll-tied tweens — duration is implicit in scroll distance

### Responsive requirements
- Desktop FOV: `35` (spec §3.2)
- Mobile FOV: `50` (tighter crop — less 3D depth visible on narrow viewport)
- FOV swap: inside `useCameraRig` via `window.innerWidth` check on mount, not media query (avoids Tailwind breakpoint coupling)
- Mobile: camera rig mounts but dolly distance is halved (objects need to be closer at narrow viewport)

### Accessibility checks
- `prefers-reduced-motion`: camera stays at Scene 1 position for entire page — no visual dolly
- Keyboard: Tab past Scene 4 → GSAP `kill()` called on the pin, focus-skip past the locked scroll zone
- Screen reader: camera choreography is decorative; all section content accessible without camera being in any particular position

### Testing procedures
- **Integration:** mock GSAP ScrollTrigger; assert `camera.position.z === 9` at scroll 14% (Scene 2 midpoint)
- **Integration:** assert `camera.position.z === 4` at scroll 84% (Scene 5 midpoint)
- **Integration:** scroll up from 50% to 20% — assert camera position reverses correctly
- **Manual:** rapid scroll up/down — verify no position jitter or overshoot
- **Manual:** Tab through page with keyboard — verify Scene 4 pin is skippable via focus movement

---

---

## Task 3 — DOF system `lib/three/useDOFController.ts`

**Status:** ❌ Not started  
**Priority:** MEDIUM — depends on Task 2  
**Files:** `lib/three/useDOFController.ts`, updates `components/three/SceneCanvas.tsx`

### Why it exists
Scene 3 (Capabilities gallery pass): as the camera sweeps laterally past the four capability panels, DOF sharpens on the active panel and blurs the others — directing attention without an arrow or spotlight (invisible UX, per cinematic spec §3).

### Exact prompt
```
Act as senior React Three Fiber + post-processing engineer. Build the DOF
focus-rack system for Scene 3 (Capabilities, scrollProgress 20–42%).

Requirements:
- Use `@react-three/postprocessing` DepthOfField effect inside SceneCanvas.tsx.
- `bokehScale` is a ref updated by the camera rig — NOT useState. Zero re-renders.
- As scrollProgress moves through 20–42%, bokehScale tweens:
    0.20 → 0.26: bokehScale 0 → 4 (panel 1 sharp)
    0.26 → 0.32: bokehScale 4 → 0 → 4 (transition, panel 2 sharp)
    0.32 → 0.38: bokehScale 4 → 0 → 4 (transition, panel 3 sharp)
    0.38 → 0.42: bokehScale 4 → 0 (panel 4 sharp, dissolve out)
- Three focus planes at world-Z positions matching the 4 capability card Z-depths.
- DOF is Tier A only — Tier B/C: DepthOfField never mounts (zero import cost via
  dynamic import with ssr: false and tier check before render).
- Export `useDOFController()` hook:
    - Takes scrollProgress: number
    - Returns bokehScaleRef: React.MutableRefObject<number>
    - Updates ref inside AnimationProvider tick at Priority 2
    - Never calls setState
- Constraint: DepthOfField must NOT create a new WebGLRenderTarget per frame.
  Check with `renderer.info.memory.textures` — count must be stable after load.
```

### Architecture
```
lib/three/useDOFController.ts    ← build here
components/three/SceneCanvas.tsx ← add <EffectComposer><DepthOfField /></EffectComposer>
                                    inside Canvas, Tier A only
```

### Animation specs
- `bokehScale` range: 0 (sharp) → 4 (blurred background)
- Focus distance: matched to each capability panel's world-Z position
- Transition between panels: lerp at 0.1/frame (≈ 10 frames = 167ms at 60fps)
- Only active during scrollProgress 0.20–0.42 — zero cost outside this range

### Responsive requirements
- Tier A (desktop): full DOF enabled
- Tier B (tablet/integrated GPU): DOF completely disabled — `<DepthOfField>` never mounts
- Tier C (mobile): no Canvas — not applicable

### Accessibility checks
- DOF is applied to the 3D canvas layer only — DOM text in Capabilities section is never blurred
- Screen reader: DOF effect is purely decorative; no ARIA implications
- `prefers-reduced-motion`: DOF disabled (no animated blur transitions)

### Testing procedures
- **Unit:** assert `bokehScaleRef.current === 0` at scrollProgress `0.15` (Scene 2)
- **Unit:** assert `bokehScaleRef.current > 0` at scrollProgress `0.31` (Scene 3 midpoint)
- **Perf:** frame time with DOF active < 8ms on M1 Chrome (DevTools flamegraph)
- **Memory:** `renderer.info.memory.textures` count stable after 10s (no RenderTarget leak)

---

---

## Task 4 — Featured Work section + `CaseStudyFrame`

**Status:** ❌ Not started — section entirely absent from page.tsx  
**Priority:** HIGH — missing section  
**Files:** `components/sections/FeaturedWork.tsx`, `components/three/CaseStudyFrame.tsx`, updates `app/page.tsx`

### Why it exists
OS spec §1.2 section 4: *"Featured work — 3 case studies, horizontal scroll-driven gallery."* Cinematic Scene 5: camera push-in, case-study frames approach and recede with DOF. Currently absent from `page.tsx` entirely.

### Exact prompt
```
Act as senior Next.js + React Three Fiber engineer. Build the Featured Work section
(Section 4 per OS spec §1.2). Add it between Capabilities and Process in app/page.tsx.

Components:

1. `components/sections/FeaturedWork.tsx` — section shell
   - Section background: --surface-1 (differentiated from hero --surface-0)
   - Eyebrow label: "Our work" / H2: "Proof in the work." (gradient-text on "work.")
   - 3 case-study cards in a horizontal layout
   - Desktop (Tier A): GSAP pin + translateX driven by vertical scroll (Scene 5 pattern)
     Pinned for 200vh of scroll; cards translate from +100% to -100% across that distance.
   - Tablet (Tier B): CSS scroll-snap horizontal scroll, scroll-snap-type: x mandatory
   - Mobile / Tier C: native horizontal scroll with overflow-x: auto, no GSAP, no pin
   - After cards: "See all work →" ghost button → /work
   - aria-label="Featured case studies"

2. `components/three/CaseStudyFrame.tsx` — card component
   Per interaction spec §7:
   - DOM layer: real <a href="/work/[slug]"> card with image, client name, result metric
   - Default state: opacity 0.5, scale 0.85 (background frames)
   - Active (nearest screen center): opacity 1.0, scale 1.0 via Framer Motion
   - Scale and opacity driven by distance from viewport center (IntersectionObserver ratio)
   - Tilt parallax on hover (Tier A desktop only):
       rotateX/Y max ±4°, spring {tension: 300, friction: 30}, useFrame-driven
       Overlay div, pointer-events: none, never blocks the underlying <a>
   - Touch: native momentum scroll — do NOT override with custom curve (spec §7 guardrail)
   - Keyboard: Tab focuses the <a>, Enter navigates

Data shape (TypeScript interface, hardcode 3 cases):
interface CaseStudy {
  slug: string;
  client: string;
  headline: string;
  result: string;        // "Pipeline doubled in 90 days"
  thumbnail: string;     // /images/case-*.webp
  tags: string[];
}

Hardcoded cases:
  { slug: 'lumara', client: 'Lumara', headline: 'Rebuilt from scratch', result: 'Pipeline doubled in 90 days', thumbnail: '/images/case-lumara.webp', tags: ['Brand Identity', '3D Design'] }
  { slug: 'solace-co', client: 'Solace Co.', headline: 'From generic to iconic', result: 'Client revenue up 3.4× in 6 months', thumbnail: '/images/case-solace.webp', tags: ['Campaign Strategy', 'Digital Experience'] }
  { slug: 'greyfield', client: 'Greyfield', headline: 'The silent rebrand', result: 'Valuation increased 60% post-launch', thumbnail: '/images/case-greyfield.webp', tags: ['Brand Identity', 'Motion'] }

Insert <FeaturedWork /> between <Capabilities /> and <Process /> in app/page.tsx.
```

### Architecture
```
components/
  sections/
    FeaturedWork.tsx        ← section shell + GSAP pin
  three/
    CaseStudyFrame.tsx      ← tilt-parallax card (Tier A only)
app/
  page.tsx                  ← add <FeaturedWork /> after <Capabilities />
public/
  images/
    case-lumara.webp        ← placeholder images (user provides real ones)
    case-solace.webp
    case-greyfield.webp
```

### Animation specs
- Card entrance (whileInView): `opacity 0.5→1, scale 0.85→1, 350ms, --ease-entrance`
- Tilt parallax: `rotateX/Y` max `±4°`, spring `{ tension: 300, friction: 30 }`, lerp 0.05/frame
- GSAP pin: `scrub: 1.0`, pinned for `200vh`, horizontal translate `-100%` to `+100%`
- No animation on touch devices — native scroll physics only

### Responsive requirements
- Desktop ≥ 1024px (Tier A): GSAP horizontal pin + 3D tilt on hover
- Tablet 480–1023px (Tier B): CSS `scroll-snap-type: x mandatory`, no GSAP, no 3D
- Mobile < 480px / Tier C: `overflow-x: auto`, `-webkit-overflow-scrolling: touch`, no JS scroll override

### Accessibility checks
- `<section aria-label="Featured case studies">`
- `role="list"` on card container; each card has `role="listitem"`
- Each `<a>` has `aria-label="{client}: {headline} — {result}"`
- Left/Right arrow keys navigate between cards when one is focused
- `prefers-reduced-motion`: no tilt, no scale, no GSAP pin — cards display as a static grid

### Testing procedures
- **Keyboard:** Tab → each card's `<a>` receives focus in order; Enter navigates to `/work/[slug]`
- **Screen reader:** VoiceOver announces "Featured case studies, list, 3 items. Lumara: Rebuilt from scratch — Pipeline doubled in 90 days, link."
- **Responsive:** Playwright mobile viewport (375px): verify `scroll-snap-type` is active, GSAP pin is not initialized
- **Perf:** `FeaturedWork.tsx` chunk < 15KB gzipped (verify with `@next/bundle-analyzer`)

---

---

## Task 5 — `LoadGate.tsx` — cold-load experience

**Status:** ❌ Not started  
**Priority:** MEDIUM  
**Files:** `components/three/LoadGate.tsx`, `lib/useLoadState.ts`

### Why it exists
Interaction spec §6: if initial load takes ≥ 1500ms, show the X-assembly loop — turning unavoidable wait time into brand reinforcement. If load is fast (< 1500ms), no loader ever appears. This guards against two failure modes: unconditional loaders that add artificial delay to fast loads, and missing loaders that leave users with a blank screen on slow connections.

### Exact prompt
```
Act as senior React/Next.js engineer. Build `components/three/LoadGate.tsx`.

Per interaction spec §6:
- Uses drei's `useProgress()` to track asset load percentage.
- Time gate: start a 1500ms timer on mount. If `progress === 100` before timer fires
  → no gate shown, Canvas fades straight in (opacity 0→1, 300ms).
  If timer fires before progress === 100 → activate the gated loader.

Gated loader (screen-space only — never the 3D Canvas):
- Full-screen overlay: background --surface-0, z-index above everything.
- SVG animation: two rounded rectangles (matching XMark geometry, 2D):
    - Start: bars separated (translateX ±120px)
    - Loop: bars slide toward center (600ms, --ease-entrance), lock with spring
      overshoot (scale 1→1.05→1, 200ms), hold 400ms, repeat.
    - Animate with CSS @keyframes — zero JS animation, zero layout shift.
- When `progress === 100`:
    - Play one final "snap complete" pass: bars lock, scale 1→1.08→1 (200ms spring),
      hold 100ms.
    - Gate fades out (opacity 1→0, 400ms, --ease-entrance).
    - Gate unmounts completely after fade (not just opacity 0 — full DOM removal
      to free paint layer).
    - Canvas cross-fades in (opacity 0→1, 300ms, delay 100ms after gate starts fading).
- On GLTF/asset load error:
    - Gate dismisses silently (no error UI ever shown to user).
    - Canvas never mounts.
    - Tier C static fallback renders in its place.
- Export `useLoadState(): { isReady: boolean, progress: number }` from lib/useLoadState.ts.
- `<LoadGate>` wraps Canvas in layout.tsx or per-scene — configurable via prop.
- Gate must have: role="progressbar" aria-valuenow={progress} aria-label="Loading 3D experience"
- When complete: aria-live="polite" region announces "Ready."
```

### Architecture
```
components/three/LoadGate.tsx   ← gate component
lib/useLoadState.ts             ← shared state hook
```

### Animation specs
- Bar separation → lock: `600ms, --ease-entrance (cubic-bezier(0.16, 1, 0.3, 1))`
- Completion spring overshoot: `scale 1→1.08→1, 200ms`
- Gate fade-out: `opacity 1→0, 400ms, --ease-entrance`
- Canvas fade-in: `opacity 0→1, 300ms, delay 100ms`
- All bar animations: CSS `@keyframes` only — no JS animation loop

### Responsive requirements
- Gate SVG: scales via `viewBox` — same on all viewport sizes
- Text "Loading" label: `--text-sm`, `--text-tertiary`, centered below SVG
- Tier C: LoadGate never mounts (no Canvas to gate)

### Accessibility checks
- `role="progressbar"` with `aria-valuenow={Math.round(progress)}` updated as load progresses
- `aria-label="Loading 3D experience"`
- On completion: `<div aria-live="polite" aria-atomic="true">Ready.</div>` (mounted briefly, then removed)
- Gate does not trap keyboard focus — Tab still reaches browser chrome / skip-to-content

### Testing procedures
- **Mock slow load:** stub `useProgress` to return 50% → verify gate overlay is visible in DOM
- **Mock fast load:** stub `useProgress` to resolve in 500ms → verify gate never mounts (check `document.querySelector('[role="progressbar"]') === null`)
- **Completion:** progress goes 50% → 100% → verify gate unmounts (not just opacity 0) within 800ms
- **Error path:** mock GLTF `onError` → verify Canvas never mounts, Tier C fallback renders

---

---

## Task 6 — `SceneTransition.tsx` + route transitions

**Status:** ❌ Not started  
**Priority:** MEDIUM — depends on Tasks 2 and 3  
**Files:** `components/three/SceneTransition.tsx`, updates `app/layout.tsx`

### Why it exists
Cinematic spec §5: *"Never a hard cut, never a fade-to-black. Every scene-to-scene transition is a continuous camera move."* Scene boundaries need a DOF-blend dissolve. Additionally, navigating between routes (Home → /work) must feel like "same world, different room" — a cross-fade + scale transition rather than a hard-cut.

### Exact prompt
```
Act as senior Next.js App Router + Framer Motion engineer. Build two transition systems:

1. `components/three/SceneTransition.tsx` — cross-scene DOF dissolve (in-page)
   - Pure data layer, no DOM output.
   - Props: from: SceneId (1–7), to: SceneId, scrollProgress: number
   - During last 10% of `from` range + first 10% of `to` range (per cinematic spec §5):
     blend = inverseLerp(rangeStart, rangeEnd, scrollProgress)
     bokehScale = lerp(fromBokeh, toBokeh, blend)
   - Passes blended bokehScale to useDOFController via React context.
   - SceneId type: 1 | 2 | 3 | 4 | 5 | 6 | 7
   - Each SceneId maps to a DOF bokehScale target:
       1→0, 2→0, 3→4, 4→0, 5→2, 6→0, 7→0
   - Zero re-renders — all values written to refs.

2. Route transitions — Next.js App Router
   - In app/layout.tsx, wrap children in:
       <AnimatePresence mode="wait">
         <motion.main
           key={pathname}
           initial={{ opacity: 0, scale: 0.92 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 1.08 }}
           transition={{ duration: 0.4, ease: [0.7, 0, 0.84, 0] }}
           id="main-content"
         >
           {children}
         </motion.main>
       </AnimatePresence>
   - Use `usePathname()` as the AnimatePresence key (App Router — NOT router.events).
   - Canvas unmount: 200ms before route change fires, fade Canvas opacity to 0
     (prevents WebGL context teardown flash). Detect via Framer `exit` animation start.
   - Canvas remount: delay 100ms after enter animation starts.
   - prefers-reduced-motion: duration: 0 for both in and out (Framer's
     useReducedMotion() → override transition prop).
```

### Architecture
```
components/three/SceneTransition.tsx   ← DOF blend layer
app/layout.tsx                         ← add AnimatePresence + motion.main
```

### Animation specs
- Route exit: `opacity 1→0, scale 1→1.08, 400ms, ease-exit (cubic-bezier(0.7,0,0.84,0))`
- Route enter: `opacity 0→1, scale 0.92→1, 400ms, ease-entrance (cubic-bezier(0.16,1,0.3,1))`
- Canvas fade before unmount: `opacity 1→0, 200ms`
- Canvas fade on mount: `opacity 0→1, 300ms, delay 100ms`
- DOF blend: `lerp(from, to, t)` per frame, t driven by scrollProgress

### Responsive requirements
- Route transitions: all tiers, all viewports
- Canvas fade delay: only when Canvas is present (skip for Tier C)
- DOF blend: Tier A only (DOF system itself is Tier A only — SceneTransition degrades gracefully to no-op on B/C)

### Accessibility checks
- Route change: `aria-live="polite"` region announces new page title after transition
- Focus: `<main id="main-content">` receives focus on route completion (verify Next.js App Router does this; fix if not)
- `prefers-reduced-motion`: transition duration becomes `0` — instant route swap, no animation
- Canvas visibility: `aria-hidden="true"` on Canvas during fade-out so screen readers don't see a disappearing canvas

### Testing procedures
- **Navigate Home → /work:** verify Canvas opacity transitions before route unmounts (timing assertion with `performance.now()`)
- **Navigate back:** verify `<main>` receives focus after transition completes
- **Reduced-motion:** verify Framer motion duration is `0` (check computed transition values)
- **DOF blend:** at scrollProgress 0.18 (boundary Scene 2/3): assert `bokehScaleRef.current` is between 0 and 4 (blended)

---

---

## Task 7 — Performance hardening

**Status:** ❌ Not started — run after all features are built  
**Priority:** HIGH — production gate  
**Files:** Multiple (audit and fix, no new files)

### Why it exists
A 3D marketing site with poor performance scores kills the "premium" perception it was built to create. Every optimization below is traceable to a specific user-facing metric.

### Exact prompt
```
Act as senior web performance engineer. Audit and fix the Xeebrand site for
production performance. Do NOT add new features — only optimize existing code.

Checklist — implement every item:

1. THREE.js disposal audit
   Every component in components/three/ that creates BufferGeometry, Material,
   or Texture must call .dispose() in useEffect cleanup.
   Audit: XMark.tsx, ParticleField.tsx, CTAObject.tsx, HeroScene.tsx,
   ProcessScene3D.tsx, CaseStudyFrame.tsx, materials.ts.
   Check with renderer.info.memory before/after route changes — no growth.

2. Texture consolidation
   All static images (thumbnails, logos, case study images) loaded via a single
   `useTexture([...urls])` call at the Canvas root, not per-component.
   This uses THREE.js texture caching — same URL = same GPU texture.

3. frameloop='demand' verification
   SceneCanvas.tsx uses IntersectionObserver to pause rendering off-screen.
   Verify: observer threshold is 0.01 (1% visible = resume rendering).
   Verify: `gl.resetState()` is called on resume to clear stale WebGL state.

4. Bundle splitting
   Run `npx @next/bundle-analyzer`.
   Targets:
   - three.js: in its own chunk, not bundled with page JS
   - gsap: in its own chunk
   - framer-motion: in its own chunk
   Add to next.config.ts:
     experimental: { optimizePackageImports: ['three', 'gsap', 'framer-motion'] }
   Verify each chunk < 100KB gzipped.

5. Image optimization
   All case study thumbnails and hero images: next/image with:
   - sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 480px"
   - quality={85}
   - priority on above-fold images only (hero, first case study card)
   - Convert all images to .webp if not already.

6. Web Vitals targets (measure with Lighthouse CI, throttled mobile profile):
   LCP < 2.5s  — hero H1 is server-rendered text, so LCP = text not Canvas
   CLS = 0     — Canvas must have explicit width/height before mount (no layout shift)
   INP < 200ms — verify all pointer handlers in 3D scenes are { passive: true }

Output: comment in each changed file listing the specific optimization applied.
```

### Testing procedures
- **Lighthouse CI:** `npx lighthouse http://localhost:3000 --throttling-method=simulate --form-factor=mobile` → score ≥ 90 performance
- **Memory:** `renderer.info.memory.geometries` and `.textures` at load, after 30s, after route change — zero growth confirms no leaks
- **RAF count:** `window.__rAF_count` (patched in test) — exactly 1 active RAF after all 3D components mount
- **Bundle:** `@next/bundle-analyzer` — three.js, gsap, framer-motion each in own chunk < 100KB gzipped

---

---

## Task 8 — Accessibility audit

**Status:** ❌ Not started — run after Task 7  
**Priority:** HIGH — production gate (WCAG 2.1 AA)  
**Files:** Multiple (audit and fix)

### Exact prompt
```
Act as senior web accessibility specialist. Audit the Xeebrand site against
WCAG 2.1 AA. Fix every finding — do not just report.

Checklist:

1. Canvas ARIA
   Every <Canvas> must have role="img" and a descriptive aria-label.
   Files to check: HeroScene.tsx, ProcessScene3D.tsx, CTAScene.tsx, CaseStudyFrame.tsx.
   Fix: SceneCanvas.tsx already accepts ariaLabel prop — verify it's passed everywhere.

2. Custom cursor
   CursorFollower.tsx must have pointer-events: none (already set — verify it
   does not intercept any click events by testing with pointer-events inspector).
   Verify CursorFollower never mounts on touch devices (coarse pointer check).

3. Color contrast — verify with https://webaim.org/resources/contrastchecker/
   - --text-primary  (#F5F5F7) on --surface-0 (#0A0A0F): target ≥ 7:1 (AAA)
   - --text-secondary (#A0A0AC) on --surface-0: target ≥ 4.5:1 (AA) — may fail, fix if so
   - --text-tertiary  (#6B6B76) on --surface-0: will fail AA — verify it is NEVER
     used for meaningful content (only decorative labels, icons). Audit all usages.

4. Reduced-motion kill switch — verify ALL of the following respond to prefers-reduced-motion:
   - Three.js useFrame idle rotation (XMark.tsx — already implemented, verify)
   - Framer Motion: add Framer's useReducedMotion() check to Hero.tsx and CTABlock.tsx
   - CSS keyframes: globals.css must have @media (prefers-reduced-motion: reduce) block
     that disables: scrollCue animation, marquee animation, any CSS @keyframes
   - GSAP ScrollTrigger: add reducedMotion check to cameraRig.ts — if active, skip all dolly
   - AnimationProvider: useReducedMotionTick() variant skips Priority 1 mutations

5. Keyboard navigation — test with keyboard only, no mouse:
   a. Nav: all links Tab-reachable in DOM source order; hamburger toggled by Space/Enter
   b. CTA X mark: underlying <button> is Tab-focusable; Enter triggers animation + navigate
   c. Process section (Scene 4 pin): Tab while in scroll-jacked zone must jump past it.
      Implement: on Tab keydown inside the pinned zone, call ScrollTrigger.kill() and
      scroll to end of pin zone.
   d. FeaturedWork cards: Left/Right arrow keys scroll the card list.
   e. "Skip to content" link: first Tab from body → link appears → Enter → focus jumps
      to #main-content. Verify.

6. ARIA landmarks — verify all exist:
   <header> with role="banner" (Nav)
   <main id="main-content"> 
   <footer> with role="contentinfo"
   Each section: aria-label describing its purpose (7 sections × 1 label each)

Fix every finding. Do not just report.
```

### Testing procedures
- **axe-core:** `npx @axe-core/cli http://localhost:3000` → zero violations
- **VoiceOver (macOS):** navigate entire page with VoiceOver + keyboard only — verify all section labels, card announcements, CTA activation
- **Contrast:** WebaIM checker for each text/surface combination listed above
- **Keyboard:** Tab through entire page without mouse — every interactive element reachable, no focus traps

---

---

## Task 9 — Testing suite

**Status:** ❌ Not started — run last  
**Priority:** HIGH — production gate  
**Files:** `tests/` directory (new), updates `package.json`

### Exact prompt
```
Act as senior QA engineer. Set up the complete testing suite for Xeebrand.
Stack: Playwright (E2E) + Vitest (unit) + @axe-core/playwright (a11y).

Install:
  npm install -D playwright vitest @axe-core/playwright @playwright/test
  npx playwright install chromium firefox

1. Playwright config (playwright.config.ts):
   projects: [
     { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
     { name: 'chromium-mobile',  use: { ...devices['Pixel 5'] } },
     { name: 'firefox',         use: { ...devices['Desktop Firefox'] } },
   ]
   baseURL: 'http://localhost:3000'
   reporter: [['html'], ['list']]

2. E2E tests (tests/e2e/):

homepage.spec.ts:
  - Page loads: no console errors (intercept console.error), status 200
  - Hero: h1 visible, text contains "Your brand"; two CTA buttons visible
  - Hero 3D: canvas[role="img"] present, has aria-label
  - Scroll to Capabilities: 4 service cards visible
  - Hover card: verify translateY changes (computed style before/after)
  - Scroll to FeaturedWork: 3 case study links visible
  - Scroll to Process: canvas OR MobileProcessVisual is present
  - Scroll to CTA: "Start a project" button navigates to /start-a-project
  - Footer: all 4 nav column headings present

nav.spec.ts:
  - Initial: nav background is transparent (no backdrop-filter)
  - After scroll 200px: nav has solid background (check computed backdrop-filter)
  - Mobile: hamburger button visible at 375px; click opens menu; Escape closes menu
  - Mobile menu: all nav links visible when open

accessibility.spec.ts:
  - @axe-core/playwright: `await checkA11y(page)` on homepage — zero violations
  - Skip-to-content: first Tab → link visible → Enter → document.activeElement === main
  - Canvas aria-labels: all canvas elements have non-empty aria-label
  - Reduced-motion: `page.emulateMedia({ reducedMotion: 'reduce' })` →
    verify no CSS animations running (check computed animation-name === 'none' on
    animated elements)

3. Vitest unit tests (tests/unit/):

device-tier.spec.ts:
  - Mock navigator.hardwareConcurrency, window.innerWidth, WebGL2 support
  - Assert: innerWidth < 480 → Tier C
  - Assert: Save-Data header → Tier C  
  - Assert: WebGL2 unavailable → Tier C
  - Assert: coarse pointer + high dPR → Tier B
  - Assert: all clear → Tier A

tokens.spec.ts:
  - gradientStopsThree: all 5 values are valid THREE.Color inputs (no throw on `new THREE.Color(v)`)
  - cameraKeyframes: scene 1 z-position > scene 5 z-position (camera moves closer)
  - springs: tap.tension > drag.tension (tap spring is stiffer than drag)

cameraRig.spec.ts:
  - Mock GSAP; assert buildCameraRig returns { timeline, destroy }
  - Assert camera.position.z === 6 at scroll 0 (Scene 1)
  - Assert camera.position.z === 9 at scroll 14% (Scene 2)
  - Assert destroy() calls timeline.kill() and ScrollTrigger.kill()

animatedObject.spec.ts:
  - 10 subscribers registered → assert useFrame called once (not 10 times)
  - Priority 0 callback fires before Priority 1 callback
  - After unsubscribe() → callback no longer receives tick calls

4. package.json scripts:
  "test":        "vitest run && playwright test"
  "test:unit":   "vitest run"
  "test:e2e":    "playwright test"
  "test:a11y":   "playwright test tests/e2e/accessibility.spec.ts"
  "test:watch":  "vitest"
```

### Testing procedures
- **CI gate:** all 9 tasks above must pass before any deploy
- **Coverage:** Vitest coverage for `lib/` directory — target ≥ 80% line coverage
- **Visual regression:** Playwright `expect(page).toHaveScreenshot()` for hero, capabilities, CTA sections at desktop + mobile viewports
- **Cross-browser:** Playwright runs chromium + firefox on every PR

---

## Quick Reference — Spacing Token Map (Tailwind ↔ Spec)

| Spec token | Value | Tailwind class |
|---|---|---|
| `--space-1` | 4px | `gap-1`, `p-1` |
| `--space-2` | 8px | `gap-2`, `mb-2` |
| `--space-3` | 12px | `gap-3`, `mb-3` |
| `--space-4` | 16px | `gap-4`, `mb-4`, `p-4` |
| `--space-5` | 24px | `gap-6`, `mb-6`, `p-6` |
| `--space-6` | 32px | `gap-8`, `mb-8`, `p-8` |
| `--space-7` | 48px | `gap-12`, `mb-12` |
| `--space-8` | 64px | `gap-16`, `mb-16`, `py-16` |
| `--space-9` | 96px | `gap-24`, `mb-24` |
| `--space-10` | 160px | `gap-40` |
| Section padding (total) | 160px desktop / 96px tablet / 64px mobile | `.section-padding` class |

**Off-spec values to avoid:** `gap-5` (20px), `gap-10` (40px), `mb-5` (20px), `mb-10` (40px), `mb-14` (56px), `mb-20` (80px), `py-20` (80px)

---

## Quick Reference — Motion Token Map

| Token | Value | Usage |
|---|---|---|
| `--ease-entrance` | `cubic-bezier(0.16, 1, 0.3, 1)` | anything appearing |
| `--ease-exit` | `cubic-bezier(0.7, 0, 0.84, 0)` | anything leaving |
| `--ease-scrub` | `cubic-bezier(0.65, 0, 0.35, 1)` | scroll-tied motion |
| `--duration-instant` | 100ms | state toggles |
| `--duration-fast` | 200ms | hover states |
| `--duration-base` | 350ms | entrances, card lifts |
| `--duration-slow` | 600ms | page-level transitions |
| Spring tap | `{ tension: 300, friction: 26 }` | buttons, cards |
| Spring drag | `{ tension: 180, friction: 20 }` | magnetic effects |
