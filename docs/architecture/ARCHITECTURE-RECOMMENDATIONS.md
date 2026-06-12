# Architecture Recommendations Report

**Version:** 1.0
**Date:** 2026-06-12
**Status:** RECOMMENDATIONS ONLY — pending executive review. No change authorized. ARCHITECTURE FREEZE ACTIVE.
**Companion:** `PLATFORM-ARCHITECTURE-REFERENCE.md`

This report covers three open decisions. Each section gives the evidence, a recommendation, the rationale, and an impact analysis. **Nothing here is executed.** Implementation, if approved, is a separate freeze-lift action.

---

## 1. `baalvion.com` vs `trade.baalvion.com` ownership (R-C3)

### The conflict
- The authoritative domain map assigns **`baalvion.com` → `Global-Trade-Infrastructure-main` (Baalvion-Core)**.
- The repository's own code declares its canonical origin as **`https://trade.baalvion.com`** in four places: `next.config.ts` (`SITE_URL`), `src/lib/seo.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`.
- No repository currently owns the apex `baalvion.com` as its canonical site. `about.baalvion.com` (Baalvion-About) is the existing corporate-identity surface; `baalviongroup.com` (corporate parent) is on hold.

### Recommendation: **Baalvion-Core owns `trade.baalvion.com` (product subdomain). Reserve the apex `baalvion.com` as a corporate front door, decided jointly with the `baalviongroup.com` review.**

### Rationale
1. **Honor the code, avoid churn under freeze.** Baalvion-Core already self-identifies as `trade.baalvion.com` across all SEO/canonical surfaces. Adopting the subdomain means **zero code change** and zero SEO re-indexing risk. Forcing the apex onto Baalvion-Core would require editing 4+ files plus canonical/OG/sitemap regeneration and a Google re-crawl — a material change that should not happen during a freeze.
2. **Architectural clarity.** Baalvion-Core is a *product* (the Global Trade Operating System), not the corporate identity. A flagship product living on a product subdomain (`trade.`) is the cleaner long-term model, leaving the apex free for a company-level landing.
3. **Apex is a corporate-identity question, not a product one.** "What sits at `baalvion.com`" is the same question as "what is the Baalvion Group corporate front door" — so it should be resolved together with item 3 (baalviongroup.com), not unilaterally assigned to a trade product.

### Impact analysis
| Dimension | If adopted (trade subdomain) | If apex forced onto Core |
|-----------|------------------------------|--------------------------|
| Code change | None (matches existing `SITE_URL`) | Edit 4 files + OG/canonical + sitemap regen |
| SEO | Stable; no re-index | Canonical change → re-crawl + ranking risk |
| Authoritative map | Amend line #1: `baalvion.com → Core` becomes `trade.baalvion.com → Core`; apex marked "corporate, TBD" | No map text change, but contradicts code until code edited |
| Apex `baalvion.com` | Needs interim handling (recommend temporary 301 → about.baalvion.com or trade.baalvion.com until corporate decision) | Served by Core |
| Freeze compatibility | Documentation-only amendment now; code untouched | Requires code change (freeze conflict) |

### Interim, freeze-safe action (documentation only)
Amend the authoritative map to read **`trade.baalvion.com → Baalvion-Core`** and add an explicit line: **`baalvion.com (apex) → CORPORATE FRONT DOOR — pending decision (see item 3)`**. No DNS, no code, no redirect implemented now.

---

## 2. Canonical CMS port selection: 3011 vs 3018 (R-R1)

### The conflict
- **Port 3011** is used by: the Traefik gateway route (`/api/v1/knowledge/cms` → `cms-service:3011`), `docker-compose.yml` (`baalvion-cms` publishes `3011:3011`), and four of five CMS-consuming frontends (About, IR, Imperialpedia, Law all default `CMS_PUBLIC_URL` to `:3011`).
- **Port 3018** appears in: `cms-service`'s own `.env` (`PORT=3018`) and `Mining.Baalvion-main/.env.local` (`CMS_PUBLIC_URL=...:3018`).
- Prior operational record (project memory) states the **live CMS is the Docker container `baalvion-cms` on `:3011`**, and that a previous `:3018 → :3011` correction in another app was a critical fix.

### Recommendation: **Canonicalize on port `3011`. Treat `3018` as a stale local/PM2 artifact to be reconciled (cms-service `.env` and Mining `.env.local`) in a post-freeze maintenance pass.**

### Rationale
1. **3011 is the production reality.** It is what the gateway routes to, what Docker publishes, and what the majority of consumers expect. The platform's live edge contract is `3011`.
2. **3018 is isolated and divergent.** Only the service's own `.env` and a single frontend (Mining) reference it — the classic signature of a stale local override that drifted from the deployed contract.
3. **Mining is the one at risk.** Because Mining points at `:3018`, its CMS content fetch only succeeds if a `:3018` CMS instance happens to be running locally. Against the canonical `:3011` deployment, Mining's CMS calls would fail. This is latent breakage, not a working alternative.

### Impact analysis
| Dimension | Detail |
|-----------|--------|
| Source of truth | `3011` (gateway + compose + 4/5 frontends + ops record) |
| Files diverging | `Backend/services/knowledge/cms-service/.env` (`PORT=3018`); `Frontend/Mining.Baalvion-main/.env.local` (`CMS_PUBLIC_URL ...:3018`) |
| Risk if unreconciled | Mining CMS content fails against the canonical `:3011` deployment |
| Corrective effort | Low — 2 file edits (env only), no code/schema change |
| Freeze compatibility | Decision can be recorded now; the 2 env edits are deferred to a post-freeze maintenance pass (env changes are out of current freeze scope) |
| Note | This is independent of the folder-rename plan and should be scheduled separately |

### Freeze-safe action (documentation only)
Record `3011` as canonical in the architecture reference (done — see A3/A6/R-R1). Defer the two env reconciliation edits to a named maintenance task post-freeze.

---

## 3. Future role of `baalviongroup.com`

### Current state
No folder, package, or file matching `baalviongroup` / `baalvion-group` / `BaalvionGroup` exists anywhere in the workspace. This is greenfield. The domain is on hold pending corporate-structure review.

### Recommendation: **Keep on hold. When approved, build `baalviongroup.com` as a distinct corporate-parent / holding-company identity (`Baalvion-Group`), CMS-backed, NOT a duplicate of `about.baalvion.com`. Do not create anything until the corporate-structure review defines the entity relationship.**

### Rationale & positioning
The decisive question is **overlap with `about.baalvion.com`**:
- **`about.baalvion.com` (Baalvion-About)** already serves operating-company authority content (corporate, trust, governance, privacy/terms — 63 CMS-managed pages per record). It answers "about the operating company."
- **`baalviongroup.com`** is justified **only if** it represents a different entity layer: the **group/holding umbrella** — group governance, the portfolio of brands (Trade, Mining, Law, Amarisé, etc.), group-level investor/press relations, and corporate structure. It answers "who is the Baalvion Group as a parent."

If the corporate review concludes Baalvion operates as a single company (no distinct group/holding entity), then `baalviongroup.com` should **not** be built as a separate site — it would duplicate About and dilute SEO. In that case, point it via 301 to `about.baalvion.com`.

### Recommended build profile (only if approved)
| Attribute | Recommendation |
|-----------|----------------|
| Standardized name | `Baalvion-Group` |
| Framework | Next.js 15.5.18 (match the fleet) |
| Backend | `cms-service:3011` (reuse central CMS; **no new backend service**) |
| Port | next free frontend port (e.g. 3061) |
| Deploy | PM2 + Firebase App Hosting (match peer corporate sites) |
| Content boundary | Group/holding identity only — must not republish About's operating-company pages |

### Impact analysis
| Scenario | Impact |
|----------|--------|
| Hold (current) | None. No existing surface affected. |
| Build as standalone group site | New repo + CMS website slug; reuses existing CMS backend (no new service). Risk = content overlap with About if boundary not enforced. Adds one site to PM2/Firebase/CI surface. |
| Redirect to About (if no group entity) | Minimal — DNS 301 only; no new repo. |

### Freeze-safe action
None. Decision is deferred to the corporate-structure review. This report registers the recommendation and the About-overlap test as the gating question.

---

## Summary of Recommendations

| # | Decision | Recommendation | Freeze-safe now? | Deferred action |
|---|----------|----------------|------------------|-----------------|
| 1 | baalvion.com vs trade.baalvion.com | Core → `trade.baalvion.com`; apex reserved as corporate front door (decide with #3) | Yes — map amendment only | Apex assignment + optional interim 301 |
| 2 | CMS port 3011 vs 3018 | Canonical = **3011**; 3018 is stale | Yes — recorded | 2 env edits (cms-service, Mining) post-freeze |
| 3 | baalviongroup.com role | Hold; if approved, standalone group identity (`Baalvion-Group`), CMS-backed, distinct from About; else 301 → About | Yes — no action | Executive corporate-structure review |

All three remain **pending executive review**. No implementation is authorized.
