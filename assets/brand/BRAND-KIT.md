# Baalvion README Brand Kit

The system every per-app / per-service / per-package README follows so the whole
monorepo reads as **one** intentional product, not 57 different documents.

> Authoring rule #1: **never fabricate.** Ports, scripts, env vars, tech, and
> contracts in a README must come from that project's real `package.json`,
> source, and existing README. Polish the presentation; preserve the facts.

## The mark

A **centralized core surrounded by federated satellite nodes** — the platform's
architecture as a logo: one identity authority, many autonomous domain services.

## Palette

| Token | Hex | Use |
|-------|-----|-----|
| Indigo | `#4F46E5` / `#6366F1` | Primary brand, gradient start |
| Cyan | `#22D3EE` | Electric accent, gradient end, data layer |
| Violet | `#7C3AED` / `#A78BFA` | Shared-package accent |
| Blue | `#3B82F6` | Mid gradient |
| Ink | `#0A0E1A` | Dark surface |
| Slate | `#0C1228` | Dark surface (mid) |

The accent gradient is always **indigo → cyan** (`url(#accent)`). Each category
also carries one **signature accent** used for the network motif + glow:

| Category | Signature accent | Eyebrow |
|----------|------------------|---------|
| Identity domain / service | `#22D3EE` cyan | `BAALVION · IDENTITY` |
| Commerce / trade / marketplace | `#34D399` emerald | `BAALVION · COMMERCE` |
| Knowledge domain / service | `#A78BFA` violet | `BAALVION · KNOWLEDGE` |
| Ecosystem domain / service | `#F472B6` pink | `BAALVION · ECOSYSTEM` |
| Platform domain / service | `#38BDF8` sky | `BAALVION · PLATFORM` |
| Infrastructure / IaC | `#FBBF24` amber | `BAALVION · INFRASTRUCTURE` |
| Shared package `@baalvion/*` | `#A78BFA` violet | `BAALVION · SHARED PACKAGE` |
| Frontend application | `#22D3EE` cyan | `BAALVION · APPLICATION` |
| docs / ADR | `#38BDF8` sky | `BAALVION · DOCUMENTATION` |

## Banner

Each README gets a hero banner at `<readme-dir>/assets/banner.svg`, made by
**copying** [`BANNER-TEMPLATE.svg`](BANNER-TEMPLATE.svg) and replacing exactly
five tokens — do **not** hand-rewrite the SVG geometry:

| Token | Value |
|-------|-------|
| `__EYEBROW__` | category eyebrow from the table above (uppercase) |
| `__WORDMARK__` | the product/service display name, e.g. `Identity`, `Mining`, `@baalvion/rbac` |
| `__SIZE__` | wordmark font size (px) by length: ≤10 chars → `60`, ≤16 → `52`, ≤22 → `44`, ≤30 → `36`, else `30` |
| `__TAGLINE__` | one line, ≤ ~64 chars, `·`-separated essence |
| `__ACCENT__` | the signature hex (appears 6× in the template) |

XML-escape `&` as `&amp;` inside token values, write `·` as `&#183;`. The banner
is referenced from the README with a centered `<img src="assets/banner.svg">`.

## README structure

Follow [`README-TEMPLATE.md`](README-TEMPLATE.md): centered banner + bold summary
+ badge row + nav; then Overview, Architecture (mermaid when there's real
structure), Getting Started / Usage, Configuration, Project Structure / API,
Testing, Security, Notes; then a family footer. Keep all real content; reorganize,
don't delete or invent. Depth scales with the project — full apps/services go
deep; small ops/doc READMEs stay concise.

## Hard constraints

- GitHub's image proxy **strips scripts and CSS animation** from inline SVG —
  gradients, shapes, and text only.
- SVGs use the system font stack only (no external font loads).
- Mermaid must be syntactically valid (GitHub renders it natively).
- Relative links only; verify they resolve from the README's directory.
