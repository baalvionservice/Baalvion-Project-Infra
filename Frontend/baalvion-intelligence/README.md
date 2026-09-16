<div align="center">

<img src="assets/banner.svg" alt="Baalvion Intelligence — Baalvion Platform" width="100%">

<br/>
<br/>

**A real-time global news intelligence product — AI-powered summaries, trends, sentiment, and alerts, exposed as a documented API for AI agents and businesses, alongside a self-serve developer dashboard.**

<p>
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=nextdotjs&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white">
  <img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare%20Workers-F38020?style=for-the-badge&logo=cloudflareworkers&logoColor=white">
  <img alt="Recharts" src="https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logo=chartdotjs&logoColor=white">
</p>

<sub><a href="#overview">Overview</a> · <a href="#architecture">Architecture</a> · <a href="#tech-stack">Tech Stack</a> · <a href="#getting-started">Getting started</a> · <a href="#configuration">Configuration</a></sub>

</div>

---

## Overview

**Baalvion Intelligence** monitors companies, competitors, industries, and world events in real
time, with AI-powered summaries, trends, sentiment, and alerts — a news API built for AI agents
and businesses, plus a dashboard for people who want the same intelligence without writing code.

- **Dev port:** `3070` (`next dev --turbopack -p 3070`)
- **Canonical production host:** `https://signal.baalvion.com`
- **Deployment target:** Cloudflare Workers (`@opennextjs/cloudflare`, `wrangler`)
- **Auth model:** central Baalvion identity via `@baalvion/auth-sdk`; the access token is held
  in memory only (never `localStorage`) and re-derived from the httpOnly refresh cookie set by
  auth-service through the same-origin `/auth-bff/[...path]` route

## Architecture

### Route groups

- **`(marketing)`** — public site: blog, company, docs, legal, pricing, login, signup.
- **`dashboard`** — the authenticated product: overview, entity explorer, trends, alerts,
  API keys, billing, usage.
- **`auth-bff`** — same-origin proxy to auth-service for the httpOnly cookie session.

### Data & developer APIs

```mermaid
flowchart LR
    B["Browser<br/><i>Next.js 15 · :3070</i>"]
    B -->|"/auth-bff/*"| GW["Auth Gateway<br/><i>httpOnly cookie session</i>"]
    B -->|"news-api.server.ts (Bearer NEWS_API_KEY)"| NS["news-service<br/><i>NEWS_SERVICE_URL</i>"]
    B -->|"developer-api.server.ts"| DS["developer-service<br/><i>DEVELOPER_SERVICE_URL — API keys · usage · quota</i>"]
    B -.->|"billing checkout"| RP["Razorpay"]

    classDef app fill:#22D3EE,stroke:#0E7490,color:#04121A;
    class B app;
```

Both `news-api.server.ts` and `developer-api.server.ts` run server-side only — the news API key
and developer-service calls never reach the client bundle. Plan quotas are enforced against
`src/lib/plan-quota.ts` / `plans.ts` (Free, Starter, and higher self-serve tiers).

### Documentation

A public docs section (`(marketing)/docs`) ships a real developer-facing nav (`docs-nav.ts`):
Getting Started, Authentication, and an MCP Server guide are live; Endpoints, SDKs, Webhooks,
Examples, Rate Limits, and FAQ are flagged `available: false` — present in navigation, not yet
published.

## Tech Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · Radix UI · Recharts · Cloudflare Workers
(`@opennextjs/cloudflare`)

## Getting Started

```bash
pnpm install
pnpm run dev        # http://localhost:3070
```

## Configuration

| Variable | Purpose |
|---|---|
| `NEWS_SERVICE_URL` | news-service base (server-only) |
| `NEWS_API_KEY` | Bearer token for news-service (server-only) |
| `DEVELOPER_SERVICE_URL` | developer-service base — API keys, usage, quota (server-only) |

---

<sub>Part of the <a href="https://github.com/baalvionservice/Baalvion-Project-Infra">Baalvion Platform</a> · centralized identity · domain-driven monorepo</sub>
