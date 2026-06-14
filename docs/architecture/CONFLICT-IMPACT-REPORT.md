# Baalvion — Conflict Impact Report ("What Breaks If We're Wrong")

**Version:** 1.0
**Date:** 2026-06-12
**Status:** PRE-APPROVAL RISK ANALYSIS — no decision is locked. ARCHITECTURE FREEZE ACTIVE.
**Companion to:** `EXECUTIVE-DECISION-DOCUMENT.md` (held, unlocked)

> Failure-mode analysis for the pending decisions. Quantifies blast radius and reversibility so the
> executive can weigh the cost of being wrong before locking. No change is made or authorized.

**Severity scale:** CRITICAL (broad outage / hard to reverse) · HIGH · MEDIUM · LOW
**Reversibility:** EASY (config/redirect) · MODERATE (code + SEO lag) · HARD (structural/brand)

---

## Scenario 1 — D1 wrong: apex committed to `baalvion.com` as corporate homepage, but that was the wrong call

**What we'd have done:** apex = corporate master-brand homepage; interim `301 baalvion.com → about.baalvion.com` until a homepage is built; Trade stays on `trade.baalvion.com`.

**What breaks if that's wrong:**

| Area | Impact | Severity |
|------|--------|----------|
| Code / runtime | **Nothing.** Trade already self-identifies as `trade.baalvion.com` (`next.config.ts:3`, `seo.ts:10`, `sitemap.ts:3`, `robots.ts:3`); no repo's `SITE_URL` is apex. No frontend or gateway route depends on apex ownership. | — |
| SEO | The interim `301 → about` is cached by search engines. Reversing later forces re-processing of the apex signal and may briefly split authority between apex and about. | LOW–MEDIUM |
| Brand | External links/cards pointing at `baalvion.com` expecting "the company" land on About (acceptable) or a homepage that later changes message. Minor confusion. | LOW |
| Wasted work | A purpose-built apex homepage may need rescoping if the corporate narrative changes. | LOW |

**Blast radius:** essentially zero technical surface; cost is redirect/SEO churn + possibly a rebuilt homepage.
**Reversibility: EASY.** Apex is greenfield + a redirect. No production system is coupled to it.
**Net:** Choosing apex-as-homepage is the **low-regret** option even if reconsidered later.

---

## Scenario 2 — D1/D4 wrong: Trade remains the apex (`baalvion.com` serves the Trade product)

**What we'd have done instead:** point `baalvion.com` at `Global-Trade-Infrastructure-main` (Trade), making the trade product the company front door.

**What breaks:**

| Area | Impact | Severity |
|------|--------|----------|
| SEO / canonical | Trade emits `SITE_URL = https://trade.baalvion.com` in **4 files** (`next.config.ts:3`, `src/lib/seo.ts:10`, `src/app/sitemap.ts:3`, `src/app/robots.ts:3`). Served at `baalvion.com`, every canonical tag, OG URL, sitemap entry, and robots sitemap line points to a *different host* → **canonical/host mismatch, duplicate-content signals, sitemap pointing to the wrong domain**. High risk of deindex/ranking loss. | **HIGH** |
| Code change required | Must rewrite all 4 files to apex (or implement host-aware canonicals), then regenerate sitemap and request re-crawl. This is a **code change during/after freeze**, not a config toggle. | HIGH |
| Duplicate exposure | If both `baalvion.com` and `trade.baalvion.com` resolve to Trade, two live hosts serve identical content without strict canonical discipline → SEO cannibalization. | MEDIUM |
| Brand / positioning | Investors, press, recruits, and partners land on a trade-operations product instead of a company identity. No corporate front door exists. | HIGH (brand) |
| Infra | DNS + Firebase App Hosting backend domain re-pointing for the apex; gateway routing itself is host-independent (path-based) so unaffected. | LOW |

**Blast radius:** Trade's entire SEO surface + corporate brand perception.
**Reversibility: MODERATE–HARD.** Code edits are quick, but SEO re-indexing lag is **weeks**, and brand impressions are sticky.
**Net:** This is the **higher-cost error.** Asymmetry vs Scenario 1 is the core argument for D4 (Trade on subdomain).

---

## Scenario 3 — D5 wrong: CMS port mismatch reaches production (3011 vs 3018)

**Key reframing:** in production, public frontends reach CMS through the **gateway path** (`/api/v1/knowledge/cms`), not a raw port. The number `3011`/`3018` matters as an **internal port contract** between three places that must agree:
1. Traefik upstream → `cms-service:3011` (`Backend/infra/api-gateway/dynamic.yml`)
2. `docker-compose.yml` → `baalvion-cms` publishes `3011:3011`
3. `cms-service/.env` → `PORT=3018` ⚠️ (diverges)

**Failure mode — if the container actually boots on 3018 while routing expects 3011:**

| Area | Impact | Severity |
|------|--------|----------|
| CMS reachability | Gateway forwards to `:3011`; service listens on `:3018` → **connection refused** for all CMS traffic through the gateway. | **CRITICAL** |
| Affected sites | Every CMS-backed frontend loses content: **about, mining, IR, imperialpedia, law** (5 public sites). Homepages/articles render fallback or 500. | CRITICAL |
| SEO | CMS-driven sitemaps and article pages 500 or serve empty → crawl errors, deindex risk across 5 domains. | HIGH |
| Local dev divergence | `Mining.Baalvion-main/.env.local` points `CMS_PUBLIC_URL → :3018`; if local CMS runs on 3011 (per ops record), Mining's content fetch fails locally regardless of prod. | MEDIUM (latent) |

**If 3011 is the correct/running port (the recommended decision):** about/IR/imperialpedia/law work; **only Mining is misconfigured** (its `:3018` reference) → Mining-only CMS breakage until its env is reconciled.

**Blast radius:** up to **5 public sites + their SEO** if the deprecated 3018 is what boots; the fix is trivial (align all three to 3011) but the outage is wide.
**Reversibility: EASY (technically)** — one-line port alignment — **but detection may be slow** if it only surfaces as empty CMS content rather than a hard crash.
**Net:** The decision (3011) is correct per evidence; the real danger is **inconsistent enforcement** — the deprecated `3018` in `cms-service/.env` and Mining's `.env.local` must be reconciled so production cannot accidentally boot the wrong contract.

---

## Scenario 4 — D3 reversed later: `baalviongroup.com` introduced after the fact

**What we'd have done:** D3 = no standalone site (reserve + `301 → baalvion.com`). Scenario: a later corporate/legal review mandates a real Group site.

**Migration cost (greenfield, mostly additive):**

| Cost component | Detail | Effort |
|----------------|--------|--------|
| New repo | `Baalvion-Group`, Next 15.5.18; auto-included by `pnpm-workspace.yaml` glob `Frontend/*`; `pnpm install` regenerates lockfile. | LOW |
| Backend | **None new** — reuse `cms-service:3011` + a new CMS website slug. | LOW |
| Orchestration | New PM2 entry, Firebase App Hosting config, optional CI workflow. | LOW–MED |
| DNS / TLS | Provision `baalviongroup.com` + cert; remove the prior `301 → baalvion.com`. | LOW |
| **Corporate content re-partition** | **The real cost.** If apex (D1) + About (D2) already host the corporate narrative, introducing a Group layer forces a **three-way content split** (apex brand homepage / About depth / Group holding identity). Overlapping pages must be deduplicated to avoid SEO cannibalization. | **MEDIUM–HIGH** |
| Redirect unwind | Search engines must reprocess `baalviongroup.com` from "301→baalvion" to a live site; transient ranking flux. | MEDIUM |
| Governance | `EXECUTIVE-DECISION-DOCUMENT.md` D3/L5 and brand Section 3 require re-approval. | LOW (process) |

**Timing asymmetry:** introducing the Group site **later is more expensive than deciding now**, because corporate content built under D1/D2 must be untangled across three surfaces. The longer apex/About accumulate corporate content, the larger the re-partition.

**Blast radius:** additive; near-zero risk to existing *product* systems. Concentrated risk = corporate-content overlap + redirect/SEO churn.
**Reversibility: MODERATE.** Standing it up is straightforward; re-splitting established corporate content and unwinding the redirect is the friction.
**Net:** D3 (hold) is cheap to hold. The mitigation that makes a future reversal cheap is to **define the apex/About/Group content boundaries now** (even while not building Group), so the slots are reserved conceptually.

---

## Comparative Summary

| Scenario | Worst-case severity | Reversibility | Primary cost driver |
|----------|--------------------|---------------|--------------------|
| 1 — apex-as-homepage wrong | LOW–MEDIUM | EASY | Redirect/SEO churn |
| 2 — Trade-as-apex | HIGH | MODERATE–HARD | 4-file SEO rewrite + re-index lag + brand |
| 3 — CMS port mismatch in prod | CRITICAL (if 3018 boots) | EASY fix / slow detect | Internal port-contract inconsistency → 5-site CMS outage |
| 4 — baalviongroup.com added later | MEDIUM | MODERATE | Three-way corporate content re-partition |

**Decision-weighting takeaways (analysis only):**
- The **D1/D4 asymmetry** is decisive: apex-as-homepage (S1) is low-regret; Trade-as-apex (S2) is the costly error. This supports the pending decisions.
- **D5 risk is operational, not conceptual:** 3011 is right; the exposure is the un-reconciled `3018` in two files. Enforce the contract in all three places before any deploy.
- **D3 is cheap to hold but cheaper-to-reverse if content boundaries are reserved now** — recommend documenting the apex/About/Group split even while Group stays unbuilt.

---

## Status
- No decision locked; `EXECUTIVE-DECISION-DOCUMENT.md` remains `⏳ AWAITING APPROVAL`.
- Architecture freeze: **ACTIVE.** Changes made by this report: **none** (documentation only).
