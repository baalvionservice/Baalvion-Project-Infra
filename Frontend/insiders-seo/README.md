# Baalvion Insiders — Public SEO Site (Next.js)

Server-rendered (SSG/ISR) public surface for the Baalvion founder↔investor platform. Its job is to get
**hundreds of investor and founder profiles indexed fast** so founders searching "investors in &lt;sector&gt;"
or "who funded &lt;company&gt;" land on Baalvion. © Baalvion. All rights reserved.

## What it renders (all server-side, crawlable)
- `/` — landing (value prop + sectors + active investors) — Organization JSON-LD.
- `/investors` — directory (filter chips by sector).
- `/investors/[slug]` — investor profile **+ recent investments** + Organization JSON-LD + per-page meta/OG.
- `/investors/sector/[sector]` — programmatic hub ("Investors in &lt;Sector&gt;") for founder search intent.
- `/founders` + `/founders/[slug]` — curated founder profiles + Organization JSON-LD.
- `/sitemap.xml` — dynamic, lists every investor, founder and sector hub (auto-updates via ISR).
- `/robots.txt` — allows all, points at the sitemap.

New profiles are picked up within `REVALIDATE` (default 5 min) — no rebuild needed (`dynamicParams` + ISR).

## Data source
Server-side fetch of the **curated, PII-safe** public endpoints on insiders-service:
`/v1/public/founders`, `/v1/public/founders/:id`, `/v1/public/investors`, `/v1/public/investors/:id`.
No contact details, financials, pitch decks or data rooms are ever exposed to crawlers.

## Run
```bash
npm install
cp .env.example .env        # set INSIDERS_API_URL + SITE_URL
npm run dev                 # http://localhost:3060   (insiders-service must be running on :3050)
npm run build && npm start  # production (ISR)
```

## Env
- `INSIDERS_API_URL` (default `http://localhost:3050/v1`) — backend public API base.
- `SITE_URL` (default `https://insiders.baalvion.com`) — canonical origin for canonicals/sitemap/OG.
