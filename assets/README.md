# Brand Assets

Visual identity for the Baalvion Platform. The mark is a **centralized core with
federated satellite nodes** — a direct expression of the platform's architecture:
one centralized identity authority surrounded by autonomous domain services.

## Files

| File | Purpose |
|------|---------|
| [`banner-dark.svg`](banner-dark.svg) | README hero — dark theme (`prefers-color-scheme: dark`) |
| [`banner-light.svg`](banner-light.svg) | README hero — light theme |
| [`logo.svg`](logo.svg) | Square app mark (512×512) — docs, avatars, favicon source |
| [`social-preview.svg`](social-preview.svg) | Source for the GitHub social card (1280×640) |
| [`social-preview.png`](social-preview.png) | Upload at **Settings → General → Social preview** |
| [`screenshots/`](screenshots/) | Live product captures used in the root README (1440×900 @1.5×) |

## Palette

| Token | Hex | Use |
|-------|-----|-----|
| Indigo | `#4F46E5` | Primary brand |
| Violet | `#7C3AED` | Shared-package accent |
| Blue | `#3B82F6` | Mid gradient |
| Cyan | `#22D3EE` | Electric accent / data layer |
| Ink | `#0A0E1A` | Dark surface |
| Slate | `#0C1228` | Dark surface (mid) |
| Mist | `#EEF2FF` | Light surface |

Gradients run **indigo → cyan** (left → right) for accents and **indigo → cyan**
(top-left → bottom-right) for the logo tile.

## Usage notes

- The banners are referenced from the root [`README.md`](../README.md) via a
  `<picture>` element so GitHub serves the right variant per color scheme.
- SVGs use a system font stack (`Segoe UI`/`system-ui`) so they render without
  external font loads. Keep effects to gradients, shapes, and text — GitHub's
  image proxy strips scripts and CSS animation from inline SVG.
- The social-preview PNG is the only binary asset; regenerate it from
  `social-preview.svg` (e.g. headless Chromium at `deviceScaleFactor: 2`,
  or `rsvg-convert -w 2560 -h 1280`) if the design changes.
