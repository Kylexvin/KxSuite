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