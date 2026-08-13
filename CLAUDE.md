@AGENTS.md
# KXBYTE Suite — Theme & Style Guide

Reference for building any KXBYTE Suite page or product surface. Keep this in sync with `Hero.module.css` as the source of truth — this doc describes the *patterns*, the component CSS is canonical for exact values.

## Design direction

- **Theme**: dark. Base surface is near-black, not pure black, to avoid harsh contrast.
- **Accent usage**: ~10% rule. Accent (`#d95b2d`) is reserved for CTAs, brand mark, active/live states, and small badges — never for large surface fills or body backgrounds. Most of the UI runs on black/white/gray.
- **Feel**: clean, Google-Workspace-for-KXBYTE. Flat surfaces, thin hairline borders (`0.6px`), pill shapes for nav/buttons, no heavy shadows except intentional glow accents.
- **Product prefix**: all products are `Kx<Name>` — KxTill, KxInvoice, KxCRM. Only KxTill is live; others render as disabled "Coming soon" states, never hidden.

## Color palette

| Token | Hex | Use |
|---|---|---|
| Base background | `#020202` | Page / hero background |
| Elevated surface | `#111111` | Cards, dropdowns, mobile menu panels |
| Primary text | `#f9f9f9` | Headings, body text (on dark) |
| Accent | `#d95b2d` | CTAs, brand mark, live badges, glow accents |
| Light tint (legacy/light contexts) | `#f3e6e2` | Only used in light-surface contexts, not the dark theme |
| Light background (legacy/light contexts) | `#f4f3f2` | Only used in light-surface contexts |

**Opacity-based neutrals** (preferred over new hex values for borders/fills on dark):
- Border hairline: `rgba(249, 249, 249, 0.14)`
- Subtle fill / hover surface: `rgba(249, 249, 249, 0.04–0.06)`
- Muted/secondary text: `#f9f9f9` at `0.65–0.75` opacity
- Disabled text: `#f9f9f9` at `0.4–0.5` opacity
- Accent-tinted hover/badge fill: `rgba(217, 91, 45, 0.1–0.12)`

## Typography

- Headings: `font-weight: 600`, `letter-spacing: -0.02em` to `-0.03em`
- Hero `h1`: `clamp(1.9rem, 4vw, 2.75rem)`, `line-height: 1.12`
- Body: `1rem`, `line-height: 1.55`, secondary text at reduced opacity (not a separate gray hex)
- Small labels/badges: `0.68–0.75rem`, `font-weight: 600`

## Shape & spacing

- Pills: `border-radius: 999px` — used for nav bar, buttons, badges
- Cards: `border-radius: 14–16px`
- Borders: `0.6px solid` for nav/card edges; `1px` for the mockup top-edge glow line
- Buttons: `padding: 12px 24px` (primary CTAs), `9px 18px` (nav-scale CTAs)

## Component patterns

### Buttons
- **Primary**: `background: #d95b2d`, `color: #f9f9f9`
- **Secondary**: translucent white fill (`rgba(249,249,249,0.06)`) + hairline border — never the old light-tint (`#f3e6e2`) background on dark surfaces

### Cards — "live" vs "coming soon"
- **Live** (e.g. KxTill): accent-tinted border/badge, clickable, hover lift (`translateY(-3px)` + soft accent shadow)
- **Coming soon**: neutral surface, `opacity: 0.7`, non-interactive (`<span>`/`<div>`, not `<Link>`), muted badge, muted feature pills

### Glow accents
Used sparingly, on the hero mockup edge and orbit rings only — not a general-purpose effect:
```css
box-shadow:
  0 -1px 0 rgba(249, 249, 249, 0.15),        /* crisp contact edge */
  0 -14px 34px -8px rgba(249, 249, 249, 0.18), /* soft white glow */
  0 -14px 34px -6px rgba(217, 91, 45, 0.3),    /* accent warmth */
  0 20px 60px -20px rgba(0, 0, 0, 0.7);        /* lift off background */
```
Order matters: tightest/crispest shadow first, widest/softest last.

### Background decoration (hero only)
- Dot grid: `radial-gradient(rgba(249,249,249,0.06) 1.5px, transparent 1.5px)`, `16px` grid — full-hero texture, kept subtle so it doesn't fight text contrast
- Orbit rings: two concentric circles, top-right and bottom-left, accent-colored borders at `0.2–0.4` opacity — a hero-only signature, not reused on other sections (keeps it meaningful instead of decorative noise)

## Rules for new components

1. Never introduce a new hex color — derive from the palette table using opacity.
2. Disabled/unavailable states are always visible, never hidden — mute them, don't remove them.
3. Glow/shadow effects stay reserved for hero-level moments (mockup, maybe future feature spotlights) — don't apply to every card or button, or it stops meaning anything.
4. Mobile breakpoint: `720px` for nav collapse, `780px` for grid collapse — stay consistent with these unless there's a specific reason to diverge.
5. All product cards use the `ready: boolean` pattern (see `Products.tsx`) to toggle live vs. soon states — don't hardcode per-product JSX branches elsewhere.



# UI Design System

Reference for keeping new components visually consistent with the sidebar redesign. Copy these tokens/patterns into any new UI rather than inventing new values.

## Palette

```css
--bg: #0e0f13;              /* app background */
--panel: #16171d;           /* sidebar / panel surface */
--raised: #1b1c23;          /* raised item background */
--raised-hi: #24252e;       /* raised item hover */
--border: rgba(255,255,255,0.07);
--border-strong: rgba(255,255,255,0.14);
--text: #eceef2;            /* primary text */
--text-muted: #a3a5b0;      /* secondary text, inactive labels */
--text-faint: #62636e;      /* tertiary — captions, dividers, disabled */
--accent: #ff6a2b;          /* orange base */
--accent-glow: #ff8c42;     /* orange highlight/glow */
--danger: #ef5350;
```

Never use pure black or pure white. Text max-contrast is `--text` (#eceef2), not #fff.

## Elevation — neomorphic raised

Any interactive "card" (nav item, button, row) sits on `--panel` and gets:

```css
border: 1px solid var(--border);
background: var(--raised);
box-shadow:
  -2px -2px 5px rgba(255,255,255,0.02),   /* top-left highlight */
   3px 3px 8px rgba(0,0,0,0.4);           /* bottom-right shadow */
border-radius: 12px;
```

- **Hover:** background → `--raised-hi`, border → `--border-strong`.
- **Pressed/active:** flip to `inset` shadows (same offsets/blur) — reads as pushed in, not lifted.
- Radius scale: `12px` for rows/buttons, `9–10px` for icon badges, `8px` for nested/small items.

## Active / selected state — gradient pill

Used for the current nav item, not for hover:

```css
background: linear-gradient(90deg,
  rgba(0,0,0,0) 0%, rgba(0,0,0,0) 38%, rgba(255,106,43,0.55) 100%
), var(--raised);
border-color: rgba(255,106,43,0.4);
box-shadow:
  inset -2px -2px 5px rgba(255,255,255,0.02),
  inset 2px 2px 6px rgba(0,0,0,0.35),
  0 0 18px rgba(255,106,43,0.25);
color: #ffffff;
```

Pair with a blurred `::after` on the right edge (`rgba(255,140,66,0.9)`, `filter: blur(6px)`, `opacity: 0.5`) for the glowing tip. Only one gradient direction (left-to-right, dark-to-glow) — don't mirror it or use it vertically.

## Type & spacing

- Font: system stack (`-apple-system, "Segoe UI", sans-serif`). No serif, no display font — this is a utility UI.
- Sizes: `14px` primary label, `13px` secondary/sub-items, `11–12px` captions/labels/version text.
- Weight: `500` for labels, `700` only for logo/wordmark, `600` for small badge glyphs.
- Row padding: `9px 12px`. Gap between icon and label: `10–11px`. Item gap in a stack: `4–6px`.

## Interactive rules

- No underlines on links, ever — set `text-decoration: none` on base *and* `:hover`.
- Every clickable row gets a `border`, even at rest — don't rely on background alone to define its edges.
- Collapsed/icon-only states: hide via `opacity: 0; width: 0` transitions on the label, not conditional unmount — keeps the collapse animation smooth.
- Disabled state: `opacity: 0.6`, no hover background change, `cursor: default`.

## When adding a new component

1. Does it sit on `--panel`? → give it the raised treatment above.
2. Is it a nav/selection control? → reuse the gradient-pill active state, don't invent a new accent treatment.
3. Check it against `prefers-reduced-motion` — transitions should be skippable, not required.