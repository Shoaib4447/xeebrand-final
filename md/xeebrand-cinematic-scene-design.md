# XEEBRAND — Cinematic Scene Design
### Prompt 2 deliverable: scroll-as-camera-dolly system
**Depends on:** `xeebrand-website-os-spec.md` (tokens, material language, tiering — inherited, not repeated here)

> The core mechanic: **scroll position = timecode, not page position.** The user isn't scrolling past content, they're dollying a camera through a fixed set. Every scene is a shot. Every shot exists to move the story forward one beat. If a scene doesn't move the pitch forward, it's cut.

---

## 1. The camera model

One virtual camera rig persists for the entire homepage. It never resets between sections — it moves continuously along a scripted path, and `scrollProgress` (0→1 across the whole page) is the single driver.

```
scrollProgress (0–1)
   → mapped per-scene to a local 0–1 range via GSAP ScrollTrigger
   → drives: camera.position, camera.rotation, DOF/blur, light intensity,
             particle density, object transforms
```

- **Camera never orbits freely.** It moves on a fixed rail (position keyframes), like a dolly track — this is what makes it feel directed rather than explorable. Free orbit = user is now the cinematographer, which breaks pacing and hurts usability.
- **Scroll velocity is damped**, not 1:1. Fast scrolls don't whip-pan the camera (motion sickness risk); a lerp (`0.08` factor) smooths the actual camera position toward the scroll-target position every frame. The user feels *in control* of speed but never feels the jank of a raw scroll-to-transform binding.
- **Scroll-jacking is used exactly once** (Scene 4, gallery) — everywhere else, native scroll stays native. Hijacking scroll globally is the #1 cause of "cinematic sites" becoming unusable sites.

---

## 2. Scene-by-scene breakdown

Each scene = one narrative beat. Format: **What the visitor sees → What it's teaching them → Why this technique, not another.**

### Scene 1 — Opening shot (Hero, scrollProgress 0–0.08)
**Sees:** Camera holds still, close on the X mark, key light sweeping across the glossy surface, faint particle motes drifting in the dark field behind it.
**Teaches:** "This is a company that makes things *this* precise." First impression = craft, before a single word of copy.
**Why:** A held opening shot (no camera movement yet) lets the eye register material quality before anything moves — matches film grammar (establish, then move). Particle system here is doing narrative work, not decoration: it establishes *depth of the space* the camera is about to travel through, foreshadowing the dolly.
**Usability guardrail:** Headline + CTA are DOM elements pinned in screen-space (not 3D-scene elements) so they're always legible, always keyboard/SEO-accessible, regardless of camera state.

### Scene 2 — Pull back, reveal context (scrollProgress 0.08–0.20)
**Sees:** Camera dollies backward and slightly up; the X mark shrinks into the frame as proof-metric cards (logo wall, numbers) fade in around it in mid-ground layers.
**Teaches:** "This craft is backed by results, not just aesthetics" — moves visitor from emotional hook to rational proof in one continuous motion, no hard cut.
**Why:** A pull-back (dolly-out) is the film-language equivalent of "let me show you the bigger picture" — it's the *only* camera move that reads that way. Cutting instead of dollying here would sever the emotional momentum built in Scene 1.
**Guardrail:** Proof metrics are real DOM text (screen-reader accessible, indexable), positioned via 3D-to-screen projection so they track the camera but remain selectable text.

### Scene 3 — Descend into capability (Services, scrollProgress 0.20–0.42)
**Sees:** Camera moves laterally (screen-left to screen-right) at a slight downward angle, passing three floating panels, each lighting up as it crosses the camera's focal point (depth-of-field sharpens on the active panel, blurs the other two).
**Teaches:** Sequential comprehension of service pillars — one at a time, in order, without visitor needing to choose what to look at.
**Why:** Lateral tracking shot = "walking past a gallery," the correct metaphor for "here are our disciplines, one by one." DOF-driven focus does the attention-directing work that a spotlight or arrow would do more crudely — it's invisible UX, not decoration, because it removes the decision "what do I look at" from the visitor.
**Guardrail:** Each panel's title/description is legible even when blurred-background (text itself never gets DOF blur — only the 3D backing object does). Reduced-motion users get the three panels as a static stacked list; no camera pass required to read them.

### Scene 4 — The transformation (Process, scrollProgress 0.42–0.62) — **the hero scene of the whole site**
**Sees:** Camera holds a fixed orbit-locked position; the X mark itself disassembles into its two bars, drifts apart with visible light-trail particles, then reforms — sharper, brighter, more saturated — as scroll continues.
**Teaches:** This *is* the pitch, dramatized: "we take your brand apart and rebuild it stronger." No copy could do this move faster than the visual does.
**Why:** This is the one scene where scroll-jacking + full scrub-lock is justified — it's the emotional peak of the story, and giving it undivided scroll-attention (rather than letting it compete with lateral camera drift) is a deliberate pacing choice, same as a director holding a shot longer at a film's climax.
**Guardrail:** Hard scroll-distance cap (max 150vh of scroll consumed) so it can't be mistaken for the page being "stuck." Visible progress indicator (thin bar) so the visitor knows this is a bounded sequence, not a bug. Skip-affordance: pressing Tab or clicking below jumps past it instantly.

### Scene 5 — Proof through motion (Featured Work, scrollProgress 0.62–0.80)
**Sees:** Camera transitions to a slow forward push (dolly-in) as three case-study "frames" (like floating monitors/plaques) approach and recede, one becoming sharp/large in turn.
**Teaches:** "Here's the work in the real world" — a forward push reads as *approaching* something real, contrasting with the more abstract, weightless motion of Scenes 1–4.
**Why:** Push-in is the film-grammar move for "getting closer to truth/reality" — appropriate exactly once, right when we pivot from brand-story to case-study proof.
**Guardrail:** Each case-study frame is a real link (full DOM `<a>` card underneath), openable via keyboard, and each thumbnail is a compressed static image — no per-case-study 3D asset, keeping this scene light despite being late in the page (cumulative GPU load matters more the further down the page you go).

### Scene 6 — Stillness (Testimonial, scrollProgress 0.80–0.88)
**Sees:** Camera stops moving entirely. Lighting settles to flat, even, warm. No particles. No parallax.
**Teaches:** Credibility needs a breath — after five scenes of motion, deliberate stillness makes the human voice (the quote) the most prominent thing on the page by contrast alone.
**Why:** In film, a static shot after a sequence of moving ones reads as "pay attention, this matters." It's the strongest possible signal precisely *because* everything before it moved.

### Scene 7 — The invitation (CTA, scrollProgress 0.88–1.0)
**Sees:** Camera pushes in one final time on the X mark (now reassembled, at rest, brightest point of the whole journey), which reacts magnetically to cursor proximity.
**Teaches:** "This is where the story hands control back to you" — the CTA object physically responding to the visitor's cursor is the visual handoff from passive viewer to active participant.
**Why:** Ending on the same object we opened on (Scene 1) closes the narrative loop — classic film structure (bookending). The brightness increase from Scene 1 to Scene 7 is a deliberate, measurable lighting delta communicating "transformation complete."

---

## 3. Parallax layer system

Three depth planes, used consistently across every scene:

| Layer | Depth (z) | Content | Parallax factor |
|---|---|---|---|
| Background | far | Gradient field, ambient particles | 0.1× scroll speed |
| Midground | mid | Scene-specific 3D objects (X mark, panels, frames) | 1.0× (moves with camera dolly) |
| Foreground/UI | screen-space | Headlines, nav, CTAs, body copy | 0× (pinned, always legible) |

**Rule:** Foreground UI is *never* subject to camera transforms. This is the single most important usability guardrail in this document — it's what keeps a cinematic site readable instead of nauseating. Text rides in a separate screen-space layer (HTML overlay via `position: fixed`/projected coordinates), always upright, always sharp, always selectable.

---

## 4. Lighting & particle systems — narrative rules, not ambience

- **One key light per scene, always warm** (drawn from `--xee-yellow`/`--xee-orange`), **one rim light, always cool** (`--xee-blue`) — consistent across all 7 scenes so the site reads as one continuous space, not seven disconnected demos.
- **Light intensity increases monotonically from Scene 1 → Scene 7.** This is the single visual metaphor underlying the whole page: darkness/potential → brightness/realized outcome. It's measurable (lux values keyframed in the camera-rig config) and testable, not vibes.
- **Particles exist only in Scenes 1, 2, and 4** — never as ambient decoration in every scene. Scene 1: establishes depth. Scene 2: light trails toward the proof metrics (visually "connecting" claim to evidence). Scene 4: light-trail residue during disassembly (selling the "transformation" idea). Scenes 3, 5, 6, 7 are deliberately particle-free — restraint is what makes the three particle moments read as meaningful instead of like a screensaver.

---

## 5. Depth transitions between scenes

Never a hard cut, never a fade-to-black. Every scene-to-scene transition is a **continuous camera move** (dolly/pan/push), because the whole thesis is "one journey," not "seven pages." Concretely:
- Scene boundaries are ScrollTrigger ranges with overlapping easing (last 10% of Scene N's camera motion blends into first 10% of Scene N+1 via shared easing curve) — no visible seam.
- DOF blur is used at scene boundaries to soft-transition focus from one midground object to the next, standing in for a cut without ever actually cutting.

---

## 6. Usability guardrails (the constraint that makes this legitimate, not a gimmick)

1. **Every scene's message exists in real, readable DOM text** — someone with JS disabled, a screen reader, or reduced-motion gets the full narrative, just without the camera choreography.
2. **Scroll is never fully hijacked except Scene 4**, and even there it's capped, indicated, and skippable.
3. **No scene requires more than 3 seconds of "figuring out what to look at”** — DOF and light intensity always do that job so the visitor's eye is guided, never searching.
4. **Page remains linkable/indexable** — this is a single scrolling route (Home), not a client-side-only experience; all copy is server-rendered DOM, 3D is a progressive enhancement layer on top.
5. **Total GPU particle count is capped and budgeted** (Scene 1: 400 particles, Scene 2: 150, Scene 4: 600 peak during disassembly) — tested against the Tier A/B/C system from the OS spec; Tier C gets zero particles and a static-image equivalent of each scene's key frame.
