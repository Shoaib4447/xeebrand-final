# XEEBRAND — Website Operating System
### A complete design + engineering spec for a premium 3D-animated marketing site
**Prepared for:** Handoff to Claude Code
**Stack assumption:** Next.js  + React Three Fiber / drei + GSAP (ScrollTrigger) + Tailwind (token-driven, not utility-soup)
**Author role:** Creative Direction · UI/UX · Frontend Architecture · Conversion Strategy

> Every decision below is traceable to one thing: the logomark. A glossy, gradient-lit "X" built from two intersecting bars in 3D space is not a flat icon — it's a physical object with light, weight, and rotation. The entire site's job is to prove that promise is real everywhere, not just in the logo file.

---

## 0. Brand Reading (source of truth)

From the uploaded mark:
- **Form:** two rounded rectangular bars crossing at an angle — not a perfect X, asymmetric arm lengths, implying motion/dynamism rather than a static badge.
- **Material:** glossy, soft-plastic/glass hybrid. Specular highlight along the top edge of each bar, soft core shadow, ambient occlusion where the bars intersect.
- **Gradient:** warm-to-cool diagonal — `#FFC94A → #FF8A3D → #FF3D8F → #8B3FE8 → #2E9FFF`, flowing top-left (warm) to bottom-right (cool).
- **Presentation:** floats on a faint radial halo, drop shadow beneath — an object in space, not a printed logo.

**Design thesis:** *Xeebrand sells transformation — brands going from flat to dimensional, from ordinary to lit-from-within.* Every 3D element on the site should look like it's made of the same material as the logo. Every gradient should draw from the same five-stop ramp. Every animation should feel like something rotating into the light, not sliding on a screen.

---

## 1. Information Architecture

I just need home page for now put the other pages in nav but don't need to build them for now 

### 1.1 Site Map (marketing agency, conversion-first)

```
/                      Home — proof of craft, immediate 3D hero
/work                  Case studies index (filterable grid)
/work/[slug]           Case study detail (long-form, results-led)
/services              Service pillars overview
/services/[slug]       Individual service deep-dive
/studio                About / team / culture / process
/journal               Thought leadership (SEO engine)
/journal/[slug]        Article
/contact               Conversion page (form + calendly-style booking)
/start-a-project       Alt conversion path — qualifying intake flow
```

### 1.2 Page-level content hierarchy (Home, as the template for all)

1. **Hero** — one sentence positioning + the X mark as an interactive 3D hero object
2. **Proof strip** — logo wall / metrics ticker (low-motion, high-trust)
3. **Capabilities** — 3–5 service pillars, each with a distinct 3D micro-scene
4. **Featured work** — 3 case studies, horizontal scroll-driven gallery
5. **Process** — the "how," as a scroll-scrubbed 3D sequence (the X assembling/disassembling)
6. **Testimonial** — single strong quote, minimal motion (credibility needs stillness)
7. **CTA block** — full-bleed gradient, the X as a literal "click to start" object
8. **Footer** — sitemap, contact, socials, newsletter

### 1.3 Navigational model
- Persistent top nav, transparent-over-hero → solid-on-scroll (state change = trust signal: "the interface is aware of where you are")
- Mega-menu for Services/Work, not dropdown lists — mega-menu panels get their own subtle 3D card-tilt treatment, reinforcing brand consistently even in UI chrome
- Progress-aware scroll indicator on long pages (case studies, journal articles)

### 1.4 Conversion architecture
- Two CTA verbs only, everywhere: **"Start a project"** (primary) and **"See our work"** (secondary). No CTA-verb sprawl.
- Every service page and case study ends in the same CTA block component — familiarity compounds conversion.
- Contact form is progressive disclosure (3 short steps, not one long form) — matches the "assembling" motion metaphor from the process section.

---

## 2. Visual Identity System

### 2.1 Color tokens (semantic, not literal — critical for dark/light + 3D lighting reuse)

```css
:root {
  /* Brand ramp — pulled directly from logomark gradient */
  --xee-yellow:  #FFC94A;
  --xee-orange:  #FF8A3D;
  --xee-magenta: #FF3D8F;
  --xee-violet:  #8B3FE8;
  --xee-blue:    #2E9FFF;

  /* Surface system (dark-first — the gradient needs a dark stage to glow) */
  --surface-0: #0A0A0F;   /* page background */
  --surface-1: #121218;   /* raised panels/cards */
  --surface-2: #1B1B24;   /* modals, nav-on-scroll */
  --border-hairline: rgba(255,255,255,0.08);

  /* Text */
  --text-primary:   #F5F5F7;
  --text-secondary: #A0A0AC;
  --text-tertiary:  #6B6B76;

  /* Semantic gradient (reusable everywhere: buttons, 3D materials, underlines) */
  --gradient-brand: linear-gradient(135deg, var(--xee-yellow), var(--xee-orange), var(--xee-magenta), var(--xee-violet), var(--xee-blue));

  /* Interactive states */
  --focus-ring: var(--xee-magenta);
  --success: #34D399;
  --danger:  #FB7185;
}
```

**Rule:** No hex value is ever hardcoded in components. Every gradient a 3D material uses in shader code must sample from `--gradient-brand` stops (converted to a JS array at build time) so a future rebrand only touches one file. This is the same discipline you're already applying to your Next.js dark/light token work — extend it here to WebGL materials too.

### 2.2 Typography

| Role | Typeface | Notes |
|---|---|---|
| Display / Hero | **Clash Display** (or General Sans Extrabold) | Geometric, confident, wide apertures — reads well at huge scale over 3D scenes |
| Body / UI | **Inter** or **Satoshi** | Neutral workhorse, high legibility at small sizes |
| Mono (data, code, case-study stats) | **JetBrains Mono** | Signals precision/credibility in metrics |

Type scale: fluid via `clamp()`, 8-step scale (12/14/16/18/24/32/48/72/120px desktop cap), never fixed px outside the scale.

### 2.3 Spatial system
- 8px base grid, 12-column layout desktop / 4-column mobile
- Generous negative space by default — 3D objects need "room to breathe" or they read as clutter, not craft
- Section padding: 160px desktop / 96px tablet / 64px mobile (top+bottom)

### 2.4 Material language (the bridge between brand and 3D)
Define **one PBR material spec** used across every 3D asset on the site so nothing feels like a random Sketchfab import:
- Base: `MeshPhysicalMaterial`
- `roughness: 0.15–0.25` (glossy, not mirror)
- `clearcoat: 1.0`, `clearcoatRoughness: 0.1` (the plastic/glass sheen from the logo)
- `iridescence: 0.15` subtle, for the color-shift-on-edges effect visible on the logo's bar edges
- Gradient applied via vertex-color or a custom gradient-ramp shader (not a flat texture) so it can be re-lit dynamically
- Single consistent 3-point light rig (key/fill/rim) reused across every scene — rim light always tinted `--xee-blue`, key light always warm, matching the logo's own warm-to-cool falloff

---

## 3. 3D Interaction System

### 3.1 Scene inventory (only 3D where it earns its keep)

| Location | Object | Interaction | Purpose |
|---|---|---|---|
| Hero (Home) | The X mark, full 3D, floating | Pointer parallax + idle rotation | Immediate proof-of-craft; the logo *is* the hero, not a decoration next to text |
| Process section | X mark disassembles into 2 bars → reassembles | Scroll-scrubbed (timeline tied to scrollY) | Visualizes "we take apart your brand and rebuild it sharper" |
| Service cards (hover) | Micro 3D icon per service (flat card by default) | Mouse-enter triggers a 400ms "lift into 3D" | Rewards exploration without forcing GPU cost on every card at once |
| CTA block | X mark as a literal button, floating, magnetic cursor pull | Click-to-navigate, magnetic hover | Turns the brand mark into the conversion action itself |
| Case study hero | Flat 2D hero image with subtle tilt-based parallax (NOT full 3D) | Device-tilt / pointer parallax only | Case studies are about the *client's* work, not ours — 3D restraint here signals craft judgment |

**Guiding rule:** 3D is used exactly 4 times on the primary conversion path. Everywhere else is 2D with light parallax. This is deliberate — a site that's 3D *everywhere* reads as a tech demo, not an agency with taste.

### 3.2 Camera & interaction model
- **Hero scene:** orthographic-feel perspective camera (`fov: 35`, distance tuned so the X fills ~60% of viewport), camera never physically moves — instead the *object* rotates in response to pointer position (`rotation.y = mouseX * 0.15`, damped with `lerp` at 0.05/frame). This reads as "the object is alive" without inducing motion sickness from camera movement.
- **Process scene:** camera is locked; the object's disassembly/reassembly is driven entirely by a `scrollProgress` value (0–1) mapped via GSAP ScrollTrigger to a `useFrame` animation, not by camera dolly. Locked camera = predictable, scrubbable, reversible on scroll-up.
- **No free-orbit controls anywhere on the marketing site.** OrbitControls-style free rotation is for tools/configurators, not brand storytelling — it invites the user to "break" the shot you composed.

### 3.3 Performance tiering (non-negotiable)
Detect device capability on mount, before mounting the Canvas:

```
Tier A (desktop, WebGL2, dPR ≤ 2, no reduced-motion):
  Full PBR material, clearcoat + iridescence, 60fps target, shadows on

Tier B (mid mobile / laptop integrated GPU):
  Simplified material (roughness/metalness only, no clearcoat),
  shadows off, geometry LOD reduced 40%

Tier C (low-end mobile, or WebGL unavailable, or Save-Data header on):
  No Canvas mounted at all. Pre-rendered GLTF → static WebP/AVIF
  render of the same object, CSS-parallax on scroll instead of R3F.
  Visually near-identical at rest; loses only idle rotation.
```

This tiering is the single most important engineering decision in this spec — it's what makes "premium 3D site" compatible with "doesn't get a 40% bounce rate on a 3-year-old Android phone."

---

## 4. Animation Language

Every animation below is justified against a purpose. If a purpose can't be stated in one sentence, the animation is cut — this is the filter Claude Code should apply to any *new* animation not listed here.

### 4.1 Core principles
1. **Motion has mass.** Nothing snaps. Everything eases as if it has weight — matching the "solid glossy object" material language. Default ease: `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) for entrances, `cubic-bezier(0.65, 0, 0.35, 1)` for scroll-scrubbed motion.
2. **Motion is a sentence, not decoration.** Every animated element answers "what is this telling the user?" — hierarchy, causality, or state change. Never motion for motion's sake.
3. **One hero motion per viewport.** Never animate two unrelated things simultaneously in the same viewport — competing motion reads as noise and hurts perceived performance.
4. **Scroll is the primary timeline.** On a marketing site, scroll-position-driven animation (not autoplay/looping) keeps the user in control and ties pacing to their reading speed — critical for conversion pages where rushing = bouncing.

### 4.2 Animation catalog

| # | Animation | Trigger | Duration/Easing | Purpose (why it exists) |
|---|---|---|---|---|
| 1 | Hero X — idle micro-rotation | On mount, continuous, very subtle (±3°) | Infinite, 8s sine loop | Signals "this is alive/3D," not a screenshot — sets the premium expectation in the first 200ms |
| 2 | Hero X — pointer parallax | Pointer move | Lerped, 0.05 damping per frame | Rewards curiosity, gives immediate proof of interactivity without requiring a click — critical for the 3-second "is this real?" test |
| 3 | Hero headline — line-by-line reveal | On mount, after hero 3D settles (~600ms delay) | 0.6s per line, expo-out, staggered 80ms | Sequences attention: object first (emotional hook), then message (rational hook) — matches how people actually process hero sections |
| 4 | Nav — transparent→solid on scroll | scrollY > hero height | 0.3s ease-out, background + blur | Tells the user "you've left the hero, you're now in content" — an orientation cue, not decoration |
| 5 | Section fade/rise-in | IntersectionObserver, 15% visible | 0.5s, translateY 24px→0, expo-out | Standard reveal-on-scroll — paces content delivery to scroll speed, avoids a wall-of-text dump |
| 6 | Process — X disassembly/reassembly | scroll-scrubbed (ScrollTrigger, `scrub: true`) | Tied 1:1 to scroll delta, no fixed duration | Literalizes the service pitch ("we deconstruct and rebuild your brand") — the *only* animation on the site allowed to be purely metaphorical, because it's carrying the core value proposition |
| 7 | Service card hover — 2D→3D lift | mouseenter | 0.4s, custom spring (tension 300, friction 26) | Converts passive browsing into active exploration; the "lift" mimics physically picking up an object, reinforcing tangibility |
| 8 | Featured work — horizontal scroll gallery | Vertical scroll hijacked to horizontal within pinned section | 1:1 scroll-scrub, GSAP pin | Case studies deserve a "flip through a portfolio" feel rather than a cramped carousel — increases dwell time on proof content |
| 9 | Case study image — tilt parallax | Pointer move / device orientation | Lerped, subtle (±4°) | Adds dimensionality to *client* work without a full 3D rebuild — respects that the hero object of a case study page is the client's brand, not ours |
| 10 | CTA block — magnetic cursor pull on X object | Pointer proximity (within 120px) | Spring, 0.3 damping | Turns the literal brand mark into a tactile "come click me" affordance — magnetic buttons have measurable CTR lift because they reduce the precision required to act |
| 11 | Button — gradient shimmer on hover | mouseenter | 0.8s, gradient-position sweep | Echoes the logo's specular highlight sweeping across a glossy bar — ties micro-interactions back to brand material at the pixel level |
| 12 | Page transition — cross-fade + 8% scale | Route change (Next.js) | 0.4s, expo-out | Signals continuity between pages (same "world"), prevents jarring hard-cuts that make a SPA feel broken |
| 13 | Loading state — X mark assembling (used only if initial load > 1.5s) | Route/asset load | Loop until ready, then plays "complete" state once | Turns unavoidable load time into brand reinforcement instead of a generic spinner — but is gated behind a time threshold so it never appears on fast loads and adds artificial delay |
| 14 | Form step transitions (contact) | Step complete | 0.35s slide + fade | Reinforces "progressive disclosure" — reduces perceived form length, a proven conversion lever for multi-field forms |

### 4.3 What's explicitly *not* animated
- Body text (never animate paragraphs beyond a single fade-in on first view)
- Testimonial section (stillness = credibility; a moving quote reads as gimmicky)
- Footer (utility zone — motion here only adds cost, not value)
- Any animation that would replay every time a section re-enters viewport on scroll-up (all reveals are `once: true`)

---

## 5. Responsive & Adaptive Layout Strategy

### 5.1 Breakpoints (content-driven, not device-driven)

| Token | Range | 3D behavior |
|---|---|---|
| `xs` | < 480px | Tier C only. No Canvas. |
| `sm` | 480–767px | Tier C, or Tier B if high-end phone + WiFi detected |
| `md` | 768–1023px | Tier B |
| `lg` | 1024–1439px | Tier A (reduced geometry) |
| `xl` | ≥ 1440px | Tier A (full fidelity) |

### 5.2 Layout adaptation rules
- Hero: desktop = X mark right 55% / text left 45%, side-by-side. Mobile = X mark scales down 60%, moves *above* headline (object-first sequencing preserved), full-width stack.
- Process (scroll-scrubbed 3D): on mobile, this section degrades to a **fixed 4-frame sprite sequence** (pre-rendered PNGs swapped on scroll position) — visually communicates the same disassemble/reassemble idea at near-zero GPU cost.
- Horizontal-scroll work gallery: disabled on touch devices below `md` — replaced with a native vertical swipeable card carousel (respects native scroll physics users already trust on mobile, doesn't fight the OS).
- Nav mega-menu → full-screen mobile menu, no 3D card-tilt on touch (hover-based, meaningless on touch anyway).

### 5.3 Container strategy
- Max content width: 1440px, with edge-bleed sections (hero, CTA) allowed to go full-viewport
- Fluid type + fluid spacing throughout via `clamp()`, so intermediate viewport widths (foldables, unusual tablets) never hit a hard breakpoint jump

---

## 6. Accessibility Strategy

Premium ≠ inaccessible. This is a non-negotiable pillar, not an afterthought pass.

### 6.1 Motion
- Full `prefers-reduced-motion: reduce` support: all entrance/scroll animations collapse to opacity-only fades (no translate/scale/rotate), duration capped at 0.2s
- Idle 3D rotation (animation #1) and magnetic pull (#10) are **fully disabled**, not just slowed, under reduced-motion — continuous motion is the category most associated with vestibular discomfort
- Scroll-scrubbed sections (process, gallery) still function under reduced-motion but drive a simple cross-fade between states instead of continuous interpolation

### 6.2 3D & Canvas accessibility
- Every `<Canvas>` is wrapped with `role="img"` and a descriptive `aria-label` (e.g., "Animated Xeebrand logo mark") — screen readers get the intent, not a blank frame
- Canvas content is never the sole carrier of essential information — headline copy always states in text what the 3D scene is illustrating (e.g., process section headline literally says "We break your brand down and rebuild it" — the animation *supports*, never *replaces*, the message)
- Tier C fallback (static image) is also the screen-reader/no-JS fallback — one asset serves both purposes

### 6.3 Keyboard & focus
- All interactive elements (including the CTA's magnetic X object) are real `<button>`/`<a>` elements underneath the 3D layer — focusable, with visible focus ring using `--focus-ring`, Enter/Space activate exactly as click does
- Horizontal-scroll gallery is keyboard-navigable (arrow keys move focus + scroll position together), not mouse/touch-only
- Skip-to-content link present, lands after nav before hero Canvas

### 6.4 Color & contrast
- All text on gradient/3D backgrounds tested at WCAG AA minimum (4.5:1 body, 3:1 large text) — gradient backgrounds get a scrim (`rgba(10,10,15,0.4)`) behind text where needed rather than relying on gradient luck
- Color is never the sole indicator of state (form errors get icon + text, not just red)

### 6.5 Performance-as-accessibility
- Tier C strategy (Section 3.3) is itself an accessibility feature: low-end devices and constrained connections (`Save-Data` header, `navigator.connection.effectiveType`) get a fully functional, fast site, not a degraded experience

---

## 7. Technical Architecture (for Claude Code)

### 7.1 Recommended stack
```
Next.js 14 (App Router, RSC where possible)
React Three Fiber + drei (3D scenes only — never for layout)
GSAP + ScrollTrigger (scroll-scrubbed timelines)
Framer Motion (simple 2D UI transitions — nav, cards, page transitions)
Tailwind CSS, configured to read from the token file (Section 2.1) — no raw hex in classes
Zustand (tiny global store — scroll progress, device tier, reduced-motion flag)
```

### 7.2 Suggested file structure
```
/app
  /(marketing)/page.tsx              → Home
  /(marketing)/work/page.tsx
  /(marketing)/work/[slug]/page.tsx
  /(marketing)/services/page.tsx
  /(marketing)/services/[slug]/page.tsx
  /(marketing)/studio/page.tsx
  /(marketing)/journal/[slug]/page.tsx
  /(marketing)/contact/page.tsx
/components
  /three
    XMark.tsx                        → the core 3D object, tier-aware
    SceneCanvas.tsx                  → shared Canvas wrapper w/ tier detection
    ProcessScene.tsx
    materials.ts                     → single source PBR material spec (Section 2.4)
  /ui                                 → buttons, nav, cards (2D, Framer Motion)
  /sections                           → Hero, Process, FeaturedWork, CTA, etc.
/lib
  tokens.ts                          → color/gradient/type tokens, imported by both Tailwind config and shader code
  device-tier.ts                     → Tier A/B/C detection logic
  motion-prefs.ts                    → reduced-motion hook
/public/models
  x-mark.glb                         → optimized (Draco-compressed) source geometry
  x-mark-frames/                     → pre-rendered sprite sequence for mobile Process fallback
```

### 7.3 Non-negotiable engineering constraints
- All GLTF models pass through Draco compression; target < 300KB per model
- `SceneCanvas` never mounts before device-tier detection resolves (prevents a Tier-A scene flash-mounting on a low-end device for one frame)
- Every 3D component code-splits via `next/dynamic` with `ssr: false` — never in the initial JS bundle
- Lighthouse budget: LCP < 2.5s on the *Tier C* path (this is the real-world median user), CLS < 0.1, TBT < 200ms

---

## 8. Implementation Roadmap

### Phase 0 — Foundation (Week 1)
- Token system (color, type, spacing) wired into Tailwind config
- Device-tier detection + reduced-motion hook
- Base layout, nav (2D states only), footer
- **Exit criteria:** a fully navigable, fully accessible, zero-3D version of the site exists and is deployable

### Phase 1 — Hero & core 3D system (Week 2)
- `XMark.tsx` component, Tier A material spec, idle rotation + pointer parallax
- Tier B/C fallback rendering pipeline (GLTF → optimized static renders)
- Hero section assembled, headline stagger reveal
- **Exit criteria:** hero performs to Lighthouse budget on all 3 tiers

### Phase 2 — Scroll storytelling (Week 3)
- Process section: ScrollTrigger-driven disassembly/reassembly + mobile sprite fallback
- Featured work horizontal-scroll gallery + mobile carousel fallback
- Section reveal system (#5) applied globally
- **Exit criteria:** every scroll animation degrades correctly under reduced-motion and on mobile

### Phase 3 — Service/case-study templates + CTA system (Week 4)
- Service card hover-lift (#7), case-study tilt-parallax (#9)
- CTA block with magnetic X object (#10)
- Contact form with progressive-disclosure steps (#14)
- **Exit criteria:** full conversion path (Home → Service/Work → Contact) is complete and instrumented

### Phase 4 — Content pages, journal, polish (Week 5)
- Studio, Journal index/detail templates
- Page transitions (#12)
- Loading-state gating logic (#13)
- Micro-interaction pass: button shimmer (#11), focus states, cursor states

### Phase 5 — QA, accessibility audit, performance hardening (Week 6)
- Full WCAG AA pass (automated + manual screen-reader test)
- Cross-device tier testing (real low-end Android, mid iPhone, high-end desktop)
- Lighthouse budget verification on all page templates
- Analytics/CTA instrumentation review against Section 1.4 conversion architecture

---

## 9. Guardrails for Claude Code (read before adding anything new)

1. **New animation?** It must map to a row in Section 4.2 or get a one-sentence justification added to that table before it ships.
2. **New color?** It must derive from `--gradient-brand` stops in `tokens.ts` — no new hex values.
3. **New 3D scene?** Check Section 3.1 first — is this one of the 4 sanctioned 3D moments? If not, default to 2D + parallax.
4. **Touching the Process section?** Its animation (#6) is the single highest-value asset on the site (it *is* the pitch). Changes need visual QA on both desktop-scrub and mobile-sprite paths before merge.
5. **Any Canvas addition** must pass through `device-tier.ts` gating and have a non-3D fallback before it's considered done — "done" does not mean "works on my desktop."
