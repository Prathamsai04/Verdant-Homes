# Design System

## Theme

“A shaded Bengaluru courtyard after rain, with one saffron chair catching the light.” Public pages use a committed deep moss identity over true white, with graphite text and a bright saffron counterpoint. Admin surfaces become restrained and task-oriented while preserving the same green.

## Color

- `--color-bg: oklch(1 0 0)` — public canvas
- `--color-surface: oklch(0.965 0.008 150)` — quiet panels
- `--color-ink: oklch(0.19 0.018 150)` — primary text
- `--color-muted: oklch(0.46 0.025 150)` — secondary text
- `--color-primary: oklch(0.4 0.106 150)` — cultivated moss
- `--color-primary-deep: oklch(0.25 0.073 150)` — immersive sections
- `--color-accent: oklch(0.72 0.16 64)` — saffron action accent
- `--color-danger: oklch(0.54 0.18 28)`; `--color-success: oklch(0.5 0.13 145)`

Public color strategy is Committed; product/admin strategy is Restrained. Saturated fills use white text. Focus uses a high-contrast saffron ring.

## Typography

Marcellus gives public display copy the character of carved courtyard signage. Manrope carries body copy and all product UI. Marketing headings use a fluid modular scale up to 5.6rem; admin headings use a fixed rem scale.

## Components

Buttons are compact capsules only where the shape supports action—not as universal decoration. Public rooms use image-led editorial rows instead of repetitive icon cards. Forms use 12px corners, persistent labels, clear help/error text, and 44px minimum targets. Admin tables collapse to labeled records on narrow screens.

## Layout

Public content uses a 1200px shell, wide image crops, asymmetrical compositions, and alternating dense/expansive spacing. Admin uses a conventional sidebar, content toolbar, and responsive table. Body prose is capped at 70ch.

## Motion

Marketing uses one composed hero reveal and small image/underline transitions. Product motion is 150–220ms and communicates state only. Every animation is removed or reduced to a crossfade under `prefers-reduced-motion`.
