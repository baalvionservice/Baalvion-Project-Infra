# Agent Brief — README + Banner Overhaul

You are upgrading README files to Baalvion's **trillion-dollar enterprise
standard**. The visual design system already exists — your job is to apply it
faithfully and write accurate, fact-dense documentation.

## Read these first (the system + the quality bar)

- `d:\Baalvion Projects\assets\brand\BRAND-KIT.md` — palette, accent map, banner token rules
- `d:\Baalvion Projects\assets\brand\BANNER-TEMPLATE.svg` — the tokenized banner you will copy
- `d:\Baalvion Projects\Frontend\Mining.Baalvion-main\README.md` — finished exemplar (match this depth/tone)
- `d:\Baalvion Projects\Frontend\Mining.Baalvion-main\assets\banner.svg` — a finished banner

> If any of those files are missing, follow the inline rules below — they are the
> complete spec on their own.

## For EACH README assigned to you

### 1. Learn the facts (no fabrication, ever)
- Read the existing `README.md` in full.
- Read the manifest: `package.json` (Node/Next/Vite) or `pom.xml` (Java). Pull real
  versions, scripts, package name, and port from it.
- Only if needed, read 1–3 key configs (`.env.example`, `next.config.*`,
  `vite.config.*`, `docker-compose*.yml`, main entry/router). Do NOT scan
  `node_modules/`, `.next/`, `dist/`, `build/`, `.turbo/`.
- Every port, command, env var, version, endpoint MUST come from the source. If you
  cannot verify a previously-stated fact, omit it.

### 2. Create `<that README's directory>/assets/banner.svg`
- Copy `BANNER-TEMPLATE.svg` verbatim, then replace the five tokens:
  `__EYEBROW__`, `__WORDMARK__`, `__SIZE__`, `__TAGLINE__`, `__ACCENT__`.
  **`__ACCENT__` appears 6 times — replace every occurrence.**
- Use the EYEBROW / ACCENT / WORDMARK given in your assignment. `__SIZE__` by the
  length rule (≤10→`60`, ≤16→`52`, ≤22→`44`, ≤30→`36`, else `30`). `__TAGLINE__` =
  one true line ≤ ~64 chars, `·`-separated.
- In SVG text, write `·` as `&#183;`, `&` as `&amp;`; never leave a raw `<`/`>`/`&`.
  Keep the `&#160;&#160;` spacing in `BAALVION&#160;&#160;PLATFORM`.
- **Validate well-formed XML** before continuing:
  `powershell -NoProfile -Command "[xml](Get-Content -Raw '<abs path>'); 'OK'"`

### 3. Rewrite `README.md`
1. Centered block: `<img src="assets/banner.svg" alt="<Name> — Baalvion Platform" width="100%">`,
   two `<br/>`, one bold summary sentence, a badge row (shields.io `for-the-badge`,
   only tech actually used), then a `<sub>` nav line of anchors.
2. `---`, then `## Overview` (what it is, who depends on it, domain/tier, real
   port/domain bullets).
3. `## Architecture` — a valid mermaid diagram when there's real structure; plus
   rendering/data-flow/SEO/security subsections when the source supports them.
4. Real sections: tech stack (with versions), getting started, configuration (env
   table), project structure, API/endpoints, testing, security, notes.
5. Footer: `---` then centered
   `<sub>Part of the <a href="https://github.com/baalvionservice/Baalvion-Project-Infra">Baalvion Platform</a> · centralized identity · domain-driven monorepo</sub>`.

### Depth scales with the project
Full app/service → go deep (version tables, architecture, data-flow, routes, env,
security). Small utility/ops/doc README → banner + badges + tightened structure,
concise and honest, no padding.

## Constraints
- GitHub strips `<script>` and CSS animation from inline SVG — none allowed.
- Mermaid must be syntactically valid.
- Preserve every accurate fact and correct relative link from the old README.
- Banner is always referenced as the local `assets/banner.svg`.
- Tone: confident, precise, enterprise. No fluff, no emoji in body copy.

## Report back
List the README paths rewritten and banner.svg paths created, plus any fact you had
to omit because you could not verify it.
