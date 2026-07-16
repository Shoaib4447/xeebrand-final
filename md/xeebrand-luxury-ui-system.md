# XEEBRAND — Luxury UI System
### Prompt 3 deliverable: design tokens + component specs + one motion language
**Depends on:** `xeebrand-website-os-spec.md` (brand tokens inherited), `xeebrand-cinematic-scene-design.md` (foreground UI layer this system lives in)

> Rule for the whole document: **glassmorphism is a material choice for exactly one context — floating over the 3D scene — never a default.** Everywhere else (forms, standard cards, journal pages) the interface is solid, high-contrast, and quiet, because luxury reads as restraint, not blur-everything.

---

## 1. Design tokens

### 1.1 Color (extends OS spec Section 2.1 — UI-specific additions only)
```css
:root {
  /* Glass — used only where content floats over the 3D canvas */
  --glass-bg: rgba(18, 18, 24, 0.55);
  --glass-border: rgba(255, 255, 255, 0.12);
  --glass-blur: 20px;

  /* Solid surfaces — used everywhere else (forms, journal, footer, case studies) */
  --surface-solid-1: #121218;
  --surface-solid-2: #1B1B24;

  /* Interactive */
  --interactive-idle: rgba(255, 255, 255, 0.06);
  --interactive-hover: rgba(255, 255, 255, 0.10);
  --interactive-active: rgba(255, 255, 255, 0.14);

  /* State */
  --state-error-bg: rgba(251, 113, 133, 0.12);
  --state-success-bg: rgba(52, 211, 153, 0.12);
}
```

### 1.2 Typography scale (fluid, 8 steps)
```css
--text-xs:   clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem);
--text-sm:   clamp(0.875rem, 0.84rem + 0.18vw, 0.9375rem);
--text-base: clamp(1rem, 0.96rem + 0.2vw, 1.0625rem);
--text-lg:   clamp(1.125rem, 1.06rem + 0.3vw, 1.25rem);
--text-xl:   clamp(1.5rem, 1.3rem + 1vw, 2rem);
--text-2xl:  clamp(2rem, 1.6rem + 2vw, 3rem);
--text-3xl:  clamp(3rem, 2.2rem + 4vw, 5rem);
--text-4xl:  clamp(4rem, 2.8rem + 6vw, 7.5rem);

--font-display: 'Clash Display', sans-serif;
--font-body:    'Inter', sans-serif;
--font-mono:    'JetBrains Mono', monospace;

--leading-tight: 1.05;   /* display */
--leading-normal: 1.5;   /* body */
--tracking-tight: -0.02em; /* large display type */
--tracking-wide: 0.04em;   /* eyebrow/label text */
```

### 1.3 Spacing (8px base)
```css
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
--space-5: 24px;  --space-6: 32px;  --space-7: 48px;  --space-8: 64px;
--space-9: 96px;  --space-10: 160px;
```

### 1.4 Grid
```css
--grid-columns-desktop: 12;
--grid-columns-mobile: 4;
--grid-gutter: 24px;
--container-max: 1440px;
--container-padding-desktop: 80px;
--container-padding-mobile: 20px;
```

### 1.5 Radius & elevation
```css
--radius-sm: 8px;   --radius-md: 16px;  --radius-lg: 24px;  --radius-full: 999px;

--shadow-1: 0 2px 8px rgba(0,0,0,0.24);
--shadow-2: 0 8px 24px rgba(0,0,0,0.32);
--shadow-glow: 0 0 40px rgba(255, 61, 143, 0.25); /* brand-tinted, used sparingly on primary CTA only */
```

### 1.6 Motion tokens (the one motion language — every component below draws from these, nothing else)
```css
--ease-entrance: cubic-bezier(0.16, 1, 0.3, 1);   /* expo-out — anything appearing */
--ease-exit:     cubic-bezier(0.7, 0, 0.84, 0);    /* expo-in — anything leaving */
--ease-scrub:    cubic-bezier(0.65, 0, 0.35, 1);   /* scroll-tied motion */
--spring-tap:    { tension: 300, friction: 26 };   /* buttons, cards — snappy, controlled */
--spring-drag:   { tension: 180, friction: 20 };   /* magnetic/drag effects — looser, weightier */

--duration-instant: 100ms;  /* state toggles: checkbox, radio */
--duration-fast:    200ms;  /* hover states */
--duration-base:    350ms;  /* entrances, card lifts */
--duration-slow:    600ms;  /* page-level transitions */
```

**Motion law:** duration scales with the *size* of the thing moving — small state changes are fast (100–200ms), whole-section entrances are slower (350–600ms). Nothing in this system uses a duration outside this table. This single rule is why the site will feel like one hand designed it.

---

## 2. Component specs

### 2.1 Buttons

**Primary**
- Background: `--gradient-brand`, 135deg
- Text: `--text-primary`, `--font-body`, 600 weight
- Padding: `14px 32px`, `--radius-full`
- Hover: gradient-position sweeps left→right over `--duration-slow` (`background-position` animated, `--ease-entrance`) — this is animation #11 from the OS spec, reused here as the canonical hover
- Active/press: scale to 0.97, `--duration-instant`, spring-tap
- Shadow: `--shadow-glow` on hover only (rest state has no glow — glow is a hover reward, not ambient decoration)

**Secondary**
- Background: `--interactive-idle`, 1px `--border-hairline`
- Hover: background → `--interactive-hover`, border → `rgba(255,255,255,0.2)`, `--duration-fast`
- No gradient, no glow — secondary actions stay visually quiet by design (hierarchy discipline)

**Ghost/Text link**
- No background ever. Underline draws in from left on hover (`--duration-fast`, transform-origin left, `scaleX 0→1`) — never a color change alone, since color-only hover states fail low-vision users

### 2.2 Cards

**Standard card (services, journal)** — solid, not glass
- Background: `--surface-solid-1`
- Border: 1px `--border-hairline`
- Radius: `--radius-md`
- Padding: `--space-6`
- Hover: `translateY(-4px)`, shadow `--shadow-1 → --shadow-2`, `--duration-base`, `--ease-entrance`, spring-tap for the transform
- This is where the OS spec's "2D→3D lift" (animation #7) attaches — on hover, a card's icon slot swaps from static illustration to the mounted 3D micro-scene

**Floating card (only inside cinematic scenes, over the Canvas)** — glass, the *one* sanctioned glassmorphism use
- Background: `--glass-bg`, `backdrop-filter: blur(var(--glass-blur))`
- Border: 1px `--glass-border`
- Radius: `--radius-lg`
- Justification: this is the only context where content needs to visually sit *in front of* moving 3D content while staying legible — blur here is functional (separates layers), not aesthetic preference

### 2.3 Navigation

- Idle (over hero): transparent background, `--text-primary` at 100% opacity (hero is dark enough for contrast without a scrim)
- Scrolled: background → `--glass-bg` + blur (justified: nav floats over scrolling content, same functional case as floating cards), height reduces `80px → 64px`, `--duration-fast`
- Mega-menu panel: solid `--surface-solid-2` (not glass — a dropdown needs full legibility, sitting over arbitrary page content, not the controlled-contrast hero), entrance: opacity + `translateY(-8px)→0`, `--duration-base`
- Active route indicator: underline, animates width via `scaleX`, `--duration-fast`, `--ease-entrance` — never a hard color swap alone

### 2.4 Forms

- Input fields: solid `--surface-solid-1` background, 1px `--border-hairline`, `--radius-sm`
- Focus: border → `--focus-ring` (magenta), 2px, plus a `0 0 0 4px rgba(255,61,143,0.15)` focus ring — visible for keyboard nav, WCAG-compliant contrast
- Label: `--text-sm`, `--text-secondary`, animates up-and-shrink from placeholder position on focus/fill (`--duration-fast`, `--ease-entrance`) — classic floating-label pattern, chosen because it keeps the field labeled at all times (accessibility win over pure-placeholder patterns)
- Error state: border → `--danger`, background tint → `--state-error-bg`, icon + message below field (never color-only)
- Multi-step progress (contact form): thin bar at top, width animates via `scaleX`, `--duration-base`, `--ease-scrub` — ties directly to the OS spec's form-step transition (animation #14)

### 2.5 Hover states — system-wide rule
Every hoverable element does **exactly one** of these three things, never combined arbitrarily:
1. **Lift** (translateY + shadow) — cards, images
2. **Sweep** (gradient/underline draw) — buttons, links
3. **Glow** (shadow-glow appears) — primary CTA only, reserved so it stays meaningful

No component invents a fourth hover behavior — this is what makes hover states feel like "one system," not per-component improvisation.

### 2.6 Loading sequences

- **Standard route/data load (<1.5s):** no visible loader at all — skeleton screens (`--surface-solid-2` blocks, subtle shimmer sweep, `--duration-slow` loop) for card grids; nothing for sub-second loads (a loader that flashes for 200ms reads as jank, not polish)
- **Cold load / first paint (>1.5s, gated per OS spec animation #13):** the X mark assembling loop, screen-space HTML+SVG version (not the full 3D asset — a load screen must never itself be the thing waiting to load)
- **Button loading state (form submit):** label cross-fades to a small spinner built from the gradient ramp (conic-gradient, rotating, `--duration-slow` per rotation), button width holds fixed (no layout shift), `--duration-fast` cross-fade in/out

### 2.7 Micro-interactions
- Checkbox/radio: `--duration-instant` fill animation, spring-tap
- Toggle switch: track color-fades + thumb slides together, `--duration-fast`
- Cursor (desktop only, Tier A): default arrow replaced with a small dot that scales 1→2.5× and inverts to a ring over interactive elements, `--duration-fast` — reinforces "this site is tactile" at the smallest possible scale, present in every single hover across the site, which is precisely why it must stay this restrained (anything bigger would be exhausting at this frequency)
- Toast/notification: enters from top, `translateY(-100%)→0` + fade, `--duration-base`, `--ease-entrance`; exits reverse with `--ease-exit`, auto-dismiss 4s unless hovered

---

## 3. The one motion language — summary rule for Claude Code

Every interactive element on the site is classified into exactly one of four motion roles. There is no fifth.

| Role | Tokens used | Examples |
|---|---|---|
| **State toggle** | `--duration-instant`, spring-tap | checkbox, radio, tab switch |
| **Hover feedback** | `--duration-fast`, `--ease-entrance` | buttons, links, nav items |
| **Entrance/reveal** | `--duration-base`/`--duration-slow`, `--ease-entrance` | cards, sections, modals |
| **Scroll-tied** | `--ease-scrub`, no fixed duration (scrub: true) | cinematic scenes, progress bars |

Before implementing any new interactive element, classify it into one of these four rows first. If it doesn't fit, that's a signal to simplify the interaction, not to add a fifth motion category.
