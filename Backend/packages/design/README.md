# @baalvion/design

The shared quality bar for every Baalvion frontend.

**This is not a skin.** It ships no palette, no logo and no opinion about what a
site should look like. Amarisé stays luxury, market-underworld stays terminal
green, GTI stays institutional. What it standardises is the layer underneath
identity — the things that read as amateur when 22 apps each improvise them:

| Improvised per app | What this replaces it with |
| --- | --- |
| Headings sized per breakpoint, or not at all | One fluid modular type scale (`text-bv-h1` … `text-bv-caption`) |
| Ad-hoc `py-24` / `py-12` section padding | A viewport-aware rhythm (`py-bv-section`, `px-bv-gutter`) |
| Stock `shadow-md` on every card | A layered, hue-tinted elevation scale (`shadow-lift-1` … `lift-4`) |
| Whatever easing came to hand | One motion vocabulary (`ease-bv-standard`, `duration-bv-base`) |
| Blank flashes during navigation | `Skeleton`, `SkeletonText`, `LoadingRegion` |
| A bare `null` where data is missing | `EmptyState`, `ErrorState` |

## Why these five things

They were chosen by measurement, not taste. A sweep of all 22 frontends found:

- **~7 `loading.tsx` files across 1,504 pages.** Nearly every navigation flashed
  blank, which is the single loudest "unfinished" signal a site can send.
- **2,027 raw hex colours in TSX**, bypassing each site's own token layer.
- **10,461 arbitrary spacing values** (`p-[13px]`), so no page shared a rhythm.
- **2,381 stock Tailwind shadows**, the default-card look.
- **No global `prefers-reduced-motion` handling** anywhere.

## Install

Already wired into every app in this monorepo. For a new frontend:

```jsonc
// package.json
"dependencies": { "@baalvion/design": "workspace:*" }
```

```ts
// tailwind.config.ts
const config: Config = {
  presets: [require('@baalvion/design/tailwind')],
  // your own colours, fonts and content globs stay exactly as they are
};
```

```css
/* src/app/globals.css — must be the first line */
@import '@baalvion/design/base.css';
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Declaring your identity

The preset reads one variable, and falls back to a neutral slate if you skip it:

```css
:root {
  /* Tint the elevation scale toward your own ground colour. Shadows cast in a
     site's own hue read as considered; pure black reads as a default. */
  --bv-shadow-rgb: 6 8 11;
  --bv-accent-rgb: 255 153 0;
}
```

Hairlines and loading placeholders are *not* keyed to that variable — they mix
against `currentColor`, so they stay visible on a near-black site and a white
one alike with nothing to configure. `--bv-veil-rgb` only feeds the flat
fallback for engines without `color-mix`.

Channels are space-separated RGB so Tailwind's opacity modifier works:
`rgb(var(--bv-accent-rgb) / 0.12)`.

## Components

All are presentational and hook-free, so they render in React Server Components
without a `'use client'` boundary.

```tsx
import { Container, Section, Stat, EmptyState, SkeletonText } from '@baalvion/design';

<Section>
  <Container>
    <EmptyState
      title="No filings yet"
      description="This company has not filed since it was incorporated."
    />
  </Container>
</Section>
```

## Conventions

Every class this package adds is namespaced `bv-` (or a distinct name like
`lift-2`), so it cannot collide with a site's existing tokens. Adopting the
preset changes nothing until you use a class from it — migration is per-file and
reversible.
