# Baalvion — Executive Decision Document (Single Source of Truth)

**Version:** 1.0
**Date:** 2026-06-12
**Status:** ⏳ AWAITING EXECUTIVE APPROVAL — architecture freeze remains active until this document is explicitly approved.
**Supersedes for decision authority:** consolidates `PLATFORM-ARCHITECTURE-REFERENCE.md`, `ARCHITECTURE-RECOMMENDATIONS.md`, `CORPORATE-PRODUCT-STRATEGY.md` (all accepted as baseline reference).

> This is the authoritative decision record. The three baseline documents remain the supporting
> evidence/detail. On approval, Section 4 (DO NOT CHANGE) becomes locked and may only be altered
> by a new executive decision. No code, infrastructure, rename, deployment, or migration is
> authorized by this document.

---

## How to use this document
- **Section 1** = the five decisions requiring executive sign-off. Each states a single final decision (not options).
- **Section 2** = the approved canonical domain → repository → purpose mapping.
- **Section 3** = the approved brand-architecture classification.
- **Section 4** = the locked "DO NOT CHANGE" register.
- **Section 5** = sign-off block. Until signed, status is AWAITING APPROVAL and the freeze holds.

---

## 1. Final Decisions Required (decisions, not options)

### Decision D1 — `baalvion.com` homepage role
**DECISION:** `baalvion.com` (apex) is the **corporate master-brand homepage** — a concise front door to the Baalvion portfolio. It will **not** host the Trade product.
**Interim (freeze-safe):** until a purpose-built homepage exists, apex 301-redirects to `about.baalvion.com`.
**Rationale:** gives the organization a true corporate front door; frees Trade to remain on its subdomain with zero code churn.
**Impact:** documentation/map amendment now; future homepage build + interim redirect are post-approval actions.

### Decision D2 — `about.baalvion.com` positioning
**DECISION:** `about.baalvion.com` **remains a separate site** as the corporate **content-depth / authority layer** (company story, governance, trust, policies, press). The apex links into it; the two must not duplicate pages.
**Rationale:** preserves ~63 indexed CMS pages and SEO equity; keeps the apex lean.
**Impact:** none now; a content-boundary guardrail is enforced when content work resumes.

### Decision D3 — `baalviongroup.com` existence
**DECISION:** `baalviongroup.com` will **NOT** be built as a standalone website. The domain is **reserved defensively and 301-redirects to `baalvion.com`**.
**Exception (single, defined):** it is built as a distinct site **only if** a formal corporate-structure/legal review confirms a separate **holding entity** that must be presented apart from the operating brand. Until such a determination, the decision stands as "no separate site."
**Rationale:** with D1 making the apex the group front door, a separate Group site is a redundant third corporate door.
**Impact:** none now (greenfield, on hold); no repo created.

### Decision D4 — `trade.baalvion.com` canonical ownership
**DECISION:** The Trade product (`Global-Trade-Infrastructure-main` / `Baalvion-Core`) canonically owns **`trade.baalvion.com`**. This matches its existing `SITE_URL` across `next.config.ts`, `seo.ts`, `sitemap.ts`, `robots.ts`. The apex `baalvion.com` is **not** owned by Trade (see D1).
**Rationale:** zero code change, no SEO re-index; a product belongs on a product subdomain.
**Impact:** authoritative map amended so `baalvion.com → Core` reads `trade.baalvion.com → Core`; no code edit required.

### Decision D5 — CMS port standard (confirmation)
**DECISION:** The canonical `cms-service` port is **3011**. Port **3018** is deprecated as a stale local artifact.
**Reconciliation (deferred, post-freeze):** correct `Backend/services/knowledge/cms-service/.env` (`PORT=3018`) and `Frontend/Mining.Baalvion-main/.env.local` (`CMS_PUBLIC_URL …:3018`) to `3011`.
**Rationale:** 3011 is the live contract (Traefik route + docker-compose publish + 4/5 frontends + ops record); Mining is latently broken against it.
**Impact:** decision recorded now; two env edits scheduled as a separate post-freeze maintenance task (not part of any rename phase).

---

## 2. Approved Domain Architecture (final canonical table)

> Repository column = **current folder name** (no renames approved; freeze active). The **Standardized target name** column is the approved future name from the rename plan, deferred until the freeze lifts. One authoritative row per domain.

| Domain | Repository (current — authoritative) | Standardized target (deferred) | Layer | Purpose |
|--------|--------------------------------------|--------------------------------|-------|---------|
| baalvion.com (apex) | — (corporate homepage, to be built / interim 301 → about) | `Baalvion-Group` (if/when built) | Corporate | Master-brand corporate front door (D1) |
| about.baalvion.com | `about-baalvion-main` | `Baalvion-About` | Corporate | Corporate authority/depth content (D2) |
| baalviongroup.com | — (no site; reserved, 301 → baalvion.com) | — | Corporate | Holding-entity domain; standalone only on legal determination (D3) |
| trade.baalvion.com | `Global-Trade-Infrastructure-main` | `Baalvion-Core` | Product | Global Trade Operating System — flagship (D4) |
| mining.baalvion.com | `Mining.Baalvion-main` | `Baalvion-Mining` | Product | Baalvion Mining public + B2B portal |
| jobs.baalvion.com | `Baalvion-Jobs-Portal-main` | `Baalvion-Jobs` | Product | Baalvion careers / talent acquisition (TalentOS) |
| ir.baalvion.com | `IR-Baalvion-main` | `Baalvion-InvestorRelations` | Product | Institutional investor relations portal |
| dashboard.baalvion.com | `company-unified-Dashboard-main` | `Baalvion-Dashboard` | Product | Internal company operations dashboard |
| connect.baalvion.com | `brand-connector-main` | `Baalvion-Connect` | Product | AI brand & creator marketplace |
| founders.baalvion.com | `For Invstors and Founders` | `Baalvion-Insiders` | Product (Insiders sub-eco) | Founder↔investor networking app |
| insiders.baalvion.com | `insiders-seo` | `Baalvion-Insiders-SEO` | Product (Insiders sub-eco) | Public SEO discovery surface for Insiders |
| amarisemaisonavenue.com | `AmariseMaisonAvenue-main` | `AmariseMaisonAvenue` | Independent (silent ownership) | Luxury maison retail brand |
| imperialpedia.com | `Imperialpedia-main` | `Imperialpedia` | Independent | Financial knowledge & AI market intelligence |
| lawelitenetwork.com | `Law-Elite-Network-main` | `LawEliteNetwork` | Independent | Legal knowledge & practitioner discovery |
| controlthemarket.com | `controlthemarket-main` | `ControlTheMarket` | Independent | Proof-of-skill hiring platform |
| proxy.baalvionstack.com (baalvionstack.com) | `Proxy-BaalvionStack` | `BaalvionStack-Web` | Independent (own root domain) | BaalvionStack proxy/infrastructure product UI |
| admin.baalvion.com | `admin-platform` | `Baalvion-Admin` | Internal (platform ops) | Platform/CMS/RBAC administration console |

> `admin.baalvion.com` is internal tooling (not a public brand surface) and is listed for completeness.

---

## 3. Approved Brand Architecture (final classification)

**Model: Hybrid / endorsed house.** Baalvion is the master brand for corporate and platform/infrastructure products; independent verticals retain their own equity with calibrated endorsement.

### 3.1 Corporate Layer ("who Baalvion is")
- `baalvion.com` (apex master-brand homepage — D1)
- `about.baalvion.com` (authority/depth layer — D2)
- `baalviongroup.com` (reserved, no standalone site — D3)

### 3.2 Product Layer — Baalvion-branded, on `*.baalvion.com` ("what Baalvion runs")
- `trade.baalvion.com` — flagship (D4)
- `mining.baalvion.com` · `jobs.baalvion.com` · `ir.baalvion.com` · `dashboard.baalvion.com` · `connect.baalvion.com`
- **Insiders sub-ecosystem:** `founders.baalvion.com` + `insiders.baalvion.com`
- (Internal: `admin.baalvion.com`)

### 3.3 Independent Brands — own domains, calibrated endorsement
- **Endorsed independents** ("A Baalvion company"): `imperialpedia.com` · `lawelitenetwork.com` · `controlthemarket.com` · BaalvionStack (`baalvionstack.com`)
- **Silent ownership** (no visible parent branding): `amarisemaisonavenue.com`

### 3.4 Endorsement rules
1. Corporate + platform/infrastructure products → master-brand endorsed, on `*.baalvion.com`.
2. Endorsed independents → own domain, uniform "A Baalvion company" treatment.
3. Amarisé → silent ownership (luxury equity protection).
4. One corporate front door (apex) + one depth layer (About). No redundant corporate domains.
5. Marketplace/matching products (Connect, Insiders, ControlTheMarket, Law) stay audience-differentiated.

---

## 4. DO NOT CHANGE (locked on approval — requires new executive approval to alter)

| Lock ID | Locked decision |
|---------|-----------------|
| **L1** | Architecture freeze is authoritative: no folder renames, repository moves, deployments, migrations, DNS, PM2, Docker, CI/CD, gateway, or environment-variable changes without explicit executive approval. |
| **L2** | Domain → repository mapping in Section 2 is the single source of truth. No new domains, subdomains, repositories, or duplicate projects. |
| **L3** | `trade.baalvion.com` is owned by `Global-Trade-Infrastructure-main` (Baalvion-Core). The apex `baalvion.com` is the corporate homepage, **not** Trade. (D1, D4) |
| **L4** | `about.baalvion.com` remains a separate authority/depth site. (D2) |
| **L5** | `baalviongroup.com` has **no standalone site**; reserved + 301 → baalvion.com unless a legal holding-entity determination is made. (D3) |
| **L6** | Canonical `cms-service` port is **3011**; 3018 is deprecated. (D5) |
| **L7** | Corrected mappings are permanent: `jobs.baalvion.com → Baalvion-Jobs-Portal-main`, `ir.baalvion.com → IR-Baalvion-main`, `founders.baalvion.com → For Invstors and Founders`, `insiders.baalvion.com → insiders-seo`. |
| **L8** | Brand model is hybrid/endorsed house per Section 3, including Amarisé silent ownership. |
| **L9** | Standardized rename targets are approved **names** but their **execution is deferred**; the rename plan (`PLATFORM-ARCHITECTURE-REFERENCE.md` Part B) must not begin (no Phase 1) without explicit approval. |
| **L10** | Risk register items R-R1…R-R9 are acknowledged; their fixes are deferred and must not be bundled into unrelated work. |

---

## 5. Executive Sign-off

| Decision | Approved? (Y/N) | Notes |
|----------|-----------------|-------|
| D1 — baalvion.com homepage role | ☐ | |
| D2 — about.baalvion.com positioning | ☐ | |
| D3 — baalviongroup.com existence | ☐ | |
| D4 — trade.baalvion.com ownership | ☐ | |
| D5 — CMS port standard (3011) | ☐ | |
| Section 2 — Domain architecture | ☐ | |
| Section 3 — Brand architecture | ☐ | |
| Section 4 — DO NOT CHANGE lock | ☐ | |

**Approver:** _______________________  **Date:** ____________

**On full approval:** status changes to `APPROVED — LOCKED`; Section 4 becomes binding. The architecture freeze remains active afterward except where this document explicitly authorizes a specific, scheduled action. No implementation occurs until separately authorized.

---

## Status footer
- Current status: **⏳ AWAITING EXECUTIVE APPROVAL**
- Architecture freeze: **ACTIVE**
- Changes made by this document: **none** (documentation only)
