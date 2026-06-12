# Baalvion — Corporate & Product Structure Strategy

**Version:** 1.0
**Date:** 2026-06-12
**Status:** STRATEGY & RECOMMENDATIONS ONLY — for executive review. ARCHITECTURE FREEZE ACTIVE.
**Companions:** `PLATFORM-ARCHITECTURE-REFERENCE.md`, `ARCHITECTURE-RECOMMENDATIONS.md`

> Positioning and brand-architecture strategy. No change is authorized or implemented by this
> document. All technical facts derive from the adopted architecture reference baseline.

---

## 0. Layer Model (overview)

```
                         ┌──────────────────────────────┐
                         │        CORPORATE LAYER        │   "Who Baalvion is"
                         │  baalvion.com (apex)          │
                         │  about.baalvion.com           │
                         │  baalviongroup.com (proposed) │
                         └───────────────┬──────────────┘
                                         │ endorses / governs
            ┌────────────────────────────┼────────────────────────────┐
            ▼                                                          ▼
 ┌────────────────────────┐                          ┌──────────────────────────────┐
 │     PRODUCT LAYER       │  "What Baalvion runs"    │      INDEPENDENT BRANDS       │
 │  (Baalvion-branded)     │                          │  (standalone equity)          │
 │  trade.baalvion.com     │                          │  amarisemaisonavenue.com      │
 │  mining.baalvion.com    │                          │  imperialpedia.com            │
 │  jobs.baalvion.com      │                          │  lawelitenetwork.com          │
 │  ir.baalvion.com        │                          │  controlthemarket.com         │
 │  dashboard.baalvion.com │                          │  baalvionstack ecosystem      │
 │  connect.baalvion.com   │                          └──────────────────────────────┘
 │  [insiders sub-eco]     │
 └────────────────────────┘
```

**Brand-architecture stance (recommended):** a **hybrid / endorsed house**. Baalvion is the master brand for platform and infrastructure products (Product Layer, all on `*.baalvion.com`). Independent verticals retain their own brand equity on their own domains with light parent endorsement ("A Baalvion company").

---

## 1. CORPORATE LAYER

### 1.1 `baalvion.com` (apex)
- **Purpose:** The master-brand front door for the entire Baalvion organization.
- **Target audience:** Everyone — partners, investors, press, recruits, and customers seeking "the company behind the products."
- **Business role:** Master brand / navigation hub to the product and brand portfolio.
- **Relationship to Baalvion:** *Is* Baalvion — the canonical corporate identity.
- **Recommended positioning:** Concise, high-signal corporate homepage that establishes the Baalvion identity and routes visitors to products and brands. **Should NOT host the Trade product** (see overlap note + `ARCHITECTURE-RECOMMENDATIONS.md` item 1).
- **Potential overlaps:** Major overlap with `about.baalvion.com` and `baalviongroup.com` — three candidate "corporate front doors." This document resolves that to a single hierarchy (§5). Current technical conflict: the Trade repo declares `SITE_URL=trade.baalvion.com`, so the apex is presently unowned by any built site.

### 1.2 `about.baalvion.com`
- **Purpose:** Deep corporate-authority content — company story, governance, trust, privacy/terms, leadership.
- **Target audience:** Due-diligence readers, journalists, partners, regulators, candidates researching the company.
- **Business role:** SEO/authority content hub; the "depth" behind the brand front door. (Already ~63 CMS-managed pages with strong indexing.)
- **Relationship to Baalvion:** Official corporate content surface of the operating company.
- **Recommended positioning:** Remain the **content-depth authority layer** beneath the apex — not a competing homepage. Apex = identity + navigation; About = depth.
- **Potential overlaps:** Overlaps the apex if both try to be "the homepage." Resolve by boundary: apex is a concise brand front door that *links into* About for depth.

### 1.3 `baalviongroup.com` (proposed — ON HOLD)
- **Purpose (if built):** Group / holding-company identity — corporate structure, brand portfolio, group governance, group-level investor/press relations.
- **Target audience:** Investors, regulators, M&A counterparties, group-level stakeholders.
- **Business role:** Parent/holding entity front door — distinct from the operating brand.
- **Relationship to Baalvion:** Would represent the **parent entity** above the operating company, *if such a legal/structural entity exists*.
- **Recommended positioning:** **Build only if a distinct group/holding entity genuinely exists.** Otherwise it is a third redundant corporate front door — reserve the domain defensively and 301 → `baalvion.com`.
- **Potential overlaps:** Direct overlap with both `baalvion.com` and `about.baalvion.com`. Three corporate domains cannot each be a homepage.

---

## 2. PRODUCT LAYER (Baalvion-branded, on `*.baalvion.com`)

### 2.1 `trade.baalvion.com` — Global Trade Operating System (flagship)
- **Purpose:** Sovereign global trade operating system — trade lifecycle, customs, compliance, finance orchestration.
- **Target audience:** Enterprises, trade operators, financial institutions, customs/logistics partners.
- **Business role:** Flagship platform product (backed by `trade-service` + the 21-module Java financial suite). Likely the company's primary revenue/strategic engine.
- **Relationship to Baalvion:** Core Baalvion-branded product (repo `Baalvion-Core`).
- **Recommended positioning:** Product subdomain `trade.baalvion.com` (matches existing code), endorsed by the master brand. The "crown jewel" but presented as a *product*, not the company.
- **Potential overlaps:** Finance/knowledge adjacency with `imperialpedia.com` (analytics) and the Java finance suite; trade-finance content could overlap Imperialpedia's market intelligence — keep Imperialpedia as public knowledge, Trade as the operational platform.

### 2.2 `mining.baalvion.com` — Baalvion Mining Inc
- **Purpose:** Public website + B2B trade portal for Baalvion Mining.
- **Target audience:** Mining buyers, B2B trade partners, the public, investors in the mining vertical.
- **Business role:** Subsidiary/vertical brand operating as a Baalvion product line.
- **Relationship to Baalvion:** A Baalvion subsidiary brand presented on a Baalvion subdomain (hybrid: it has its own "Inc" identity but lives under the master brand).
- **Recommended positioning:** Endorsed subsidiary — "Baalvion Mining." Distinct vertical, master-brand endorsed.
- **Potential overlaps:** Could feed Trade (mining is a trade commodity vertical). Define handoff: Mining = vertical brand + B2B portal; Trade = cross-commodity operating platform.

### 2.3 `jobs.baalvion.com` — Talent / Careers (TalentOS)
- **Purpose:** Global talent acquisition and careers portal (Baalvion's own hiring), with a recruiter dashboard.
- **Target audience:** Candidates seeking Baalvion roles; internal recruiters/hiring teams.
- **Business role:** Employer-brand and recruitment surface for Baalvion itself.
- **Relationship to Baalvion:** Baalvion's internal hiring front door (repo `Baalvion-Jobs-Portal-main`, `jobs-service`).
- **Recommended positioning:** Employer-brand surface under the master brand ("Careers at Baalvion").
- **Potential overlaps:** **Notable overlap with `controlthemarket.com`** (a proof-of-skill *hiring product*). Boundary: `jobs.baalvion.com` = Baalvion hiring *for itself*; ControlTheMarket = a hiring *product sold to others*. Keep distinct; do not merge.

### 2.4 `ir.baalvion.com` — Investor Relations
- **Purpose:** Institutional investor relations portal — financials, governance, thesis, capital ops.
- **Target audience:** Institutional investors, analysts, regulators.
- **Business role:** Official IR surface for Baalvion.
- **Relationship to Baalvion:** Baalvion's investor-facing corporate-finance surface (repo `IR-Baalvion-main`, `ir-service`).
- **Recommended positioning:** Master-brand-endorsed IR portal. Sits at the corporate/product boundary; could be linked prominently from the apex.
- **Potential overlaps:** **Overlap with the Insiders sub-ecosystem and `baalviongroup.com`.** IR = *Baalvion's own* investor relations; Insiders (founders.baalvion.com) = founder↔investor *networking community*; baalviongroup (if built) = group-level investor relations. Define: IR = our shareholders; Insiders = a marketplace/community product.

### 2.5 `dashboard.baalvion.com` — Unified Company Dashboard
- **Purpose:** Internal company operating system / unified dashboard.
- **Target audience:** Internal employees and operators across the company.
- **Business role:** Internal cross-product operations console (backed by `dashboard-service` + realtime).
- **Relationship to Baalvion:** Internal tooling, not customer-facing.
- **Recommended positioning:** Internal product; keep behind auth, not part of public brand navigation.
- **Potential overlaps:** Overlaps `admin.baalvion.com` (admin platform). Boundary: `admin` = platform/CMS/RBAC administration; `dashboard` = company operations/BI. Clarify to avoid feature drift.

### 2.6 `connect.baalvion.com` — Baalvion Connect
- **Purpose:** AI-powered brand and creator marketplace.
- **Target audience:** Brands and creators seeking matches/collaborations.
- **Business role:** Marketplace product (backed by `brand-connector-service`).
- **Relationship to Baalvion:** Baalvion-branded marketplace product.
- **Recommended positioning:** Endorsed product — "Baalvion Connect."
- **Potential overlaps:** Marketplace-pattern overlap with `connect` ↔ Insiders ↔ marketplace-service ↔ ControlTheMarket. Several "matching/marketplace" products exist; recommend a portfolio review to ensure differentiated audiences (brands/creators vs founders/investors vs hiring).

### 2.7 Insiders sub-ecosystem (not in original classification — added for completeness)
- **`founders.baalvion.com`** (repo `For Invstors and Founders`, `insiders-service`): authenticated founder↔investor networking, deal flow, memberships, Elite tiers.
- **`insiders.baalvion.com`** (repo `insiders-seo`): public, crawlable SEO discovery surface for founder/investor profiles; complements the app.
- **Business role:** A community/marketplace product pair (app + SEO front door).
- **Recommended positioning:** Treat as one **"Baalvion Insiders"** product sub-ecosystem within the Product Layer. ⚠️ Both currently lack deploy config (R-R5).
- **Potential overlaps:** With `ir.baalvion.com` (investors), `connect.baalvion.com` (marketplace), and `marketplace-service`/Baalvion Invest. Recommend explicit audience boundaries (Insiders = founder/investor network; IR = our shareholders; Connect = brands/creators).

---

## 3. INDEPENDENT BRANDS (standalone domains)

### 3.1 `amarisemaisonavenue.com` — Amarisé Maison Avenue
- **Purpose:** Luxury retail / maison brand and commerce.
- **Target audience:** Luxury consumers.
- **Business role:** Standalone consumer luxury brand (commerce-service backed).
- **Relationship to Baalvion:** Owned by Baalvion but **deliberately decoupled** — luxury equity is diluted by visible conglomerate endorsement.
- **Recommended positioning:** **House-of-brands / silent ownership.** No prominent Baalvion branding; parent link only in legal/footer.
- **Potential overlaps:** None at the brand level (distinct audience). Shares commerce backend only.

### 3.2 `imperialpedia.com` — Imperialpedia
- **Purpose:** Financial knowledge & analytics platform with AI market intelligence.
- **Target audience:** Investors, analysts, finance-curious public.
- **Business role:** Content/knowledge brand and SEO engine (imperialpedia-service + CMS).
- **Relationship to Baalvion:** Baalvion-owned independent knowledge brand.
- **Recommended positioning:** Standalone brand with optional light endorsement; strong organic-search asset.
- **Potential overlaps:** Knowledge/analytics adjacency with Trade and IR. Boundary: Imperialpedia = public knowledge/SEO; Trade/IR = operational/official surfaces.

### 3.3 `lawelitenetwork.com` — Law Elite Network
- **Purpose:** Global legal knowledge and practitioner-discovery platform.
- **Target audience:** Legal professionals and clients seeking counsel.
- **Business role:** Vertical professional-network brand (law-service + its own `law-elite-gateway:8090` sub-platform).
- **Relationship to Baalvion:** Baalvion-owned independent vertical brand.
- **Recommended positioning:** Standalone professional brand; light endorsement acceptable.
- **Potential overlaps:** Professional-network/discovery pattern shared with Insiders and Connect; audiences differ (legal vs founders vs creators). Keep separate.

### 3.4 `controlthemarket.com` — ControlTheMarket
- **Purpose:** Proof-of-skill hiring platform.
- **Target audience:** Employers and skilled candidates (external market).
- **Business role:** Standalone hiring-product brand (ctm-service).
- **Relationship to Baalvion:** Baalvion-owned independent product brand.
- **Recommended positioning:** Standalone; explicitly differentiated from `jobs.baalvion.com` (which is Baalvion's *own* hiring). CTM is a *product for the market*.
- **Potential overlaps:** **Hiring-space overlap with `jobs.baalvion.com`** — see §2.3. Position CTM as the sellable product; jobs as internal employer brand.

### 3.5 BaalvionStack ecosystem (`proxy.baalvionstack.com` / `baalvionstack.com`)
- **Purpose:** Proxy/infrastructure product (BaalvionStack) — customer dashboard UI (`proxy.baalvionstack.com`) over a proxy data-plane (Go gateway :10000/:1080) and `proxy-service:4000`.
- **Target audience:** Developers and infrastructure customers.
- **Business role:** Standalone infrastructure product line on its **own root domain** (`baalvionstack.com`).
- **Relationship to Baalvion:** Baalvion-owned but operates as a separate developer-facing brand/ecosystem.
- **Recommended positioning:** Independent developer brand ("BaalvionStack") with master-brand endorsement; the only product family deliberately on a non-`baalvion.com` root.
- **Potential overlaps:** Naming-only confusion (the repo `Proxy-BaalvionStack` is a frontend SPA, not the gateway). No audience overlap.

---

## 4. Overlap Map (consolidated)

| Overlap cluster | Domains | Resolution |
|-----------------|---------|------------|
| **Corporate front door** | baalvion.com · about.baalvion.com · baalviongroup.com | One hierarchy (§5): apex = brand homepage; About = depth; Group = only if distinct entity, else 301 |
| **Hiring / talent** | jobs.baalvion.com · controlthemarket.com | jobs = Baalvion hiring *for itself*; CTM = hiring *product for the market* |
| **Investor / capital** | ir.baalvion.com · founders.baalvion.com (Insiders) · baalviongroup.com · marketplace-service | IR = our shareholders; Insiders = founder/investor network; Group = group-level IR; Marketplace = deal platform |
| **Marketplace / matching** | connect.baalvion.com · founders.baalvion.com · controlthemarket.com · lawelitenetwork.com | Differentiate by audience (brands/creators · founders/investors · hiring · legal) |
| **Internal consoles** | admin.baalvion.com · dashboard.baalvion.com | admin = platform/CMS/RBAC; dashboard = company operations/BI |
| **Knowledge / analytics** | imperialpedia.com · trade.baalvion.com · ir.baalvion.com | Imperialpedia = public knowledge/SEO; Trade/IR = operational/official |

---

## 5. Strategic Recommendations

### 5.1 Future homepage strategy for `baalvion.com`
**Recommendation:** Make the apex a **concise corporate master-brand homepage** — Baalvion as an operating group, with clear routes to the product portfolio (Trade, Mining, Connect, Insiders, IR) and to the independent brands. Do **not** place the Trade product on the apex.

- **Interim (freeze-safe, no build):** 301 `baalvion.com` → `about.baalvion.com` until the apex homepage is built.
- **Target state:** Purpose-built apex homepage (`Baalvion-Group` repo profile from `ARCHITECTURE-RECOMMENDATIONS.md` §3 can serve this) that links to About for depth.
- **Why:** Frees Trade to stay on `trade.baalvion.com` (zero code churn), and gives the organization a true front door instead of a product masquerading as the company.

### 5.2 Should `about.baalvion.com` remain separate?
**Recommendation:** **Yes — keep it separate, as the content-depth authority layer.** It already carries ~63 indexed CMS pages and SEO equity; collapsing it into the apex would forfeit that and bloat the homepage.

- **Boundary:** apex = identity + navigation (lean); About = depth (governance, trust, story, press, policies).
- **Guardrail:** enforce a content boundary so the two never duplicate the same page (duplicate titles cannibalize SEO).

### 5.3 Is `baalviongroup.com` needed?
**Recommendation:** **Most likely NO — do not build a separate site.** If `baalvion.com` apex becomes the corporate/group homepage (5.1), a separate `baalviongroup.com` is a redundant third front door.

- **Build separately ONLY IF** the corporate-structure review confirms a distinct legal **holding entity** that must be presented apart from the operating brand (e.g., for investor/regulatory separation).
- **Otherwise:** reserve the domain defensively and **301 → `baalvion.com`**.
- These three corporate-layer decisions are **interdependent** — decide them together, not in isolation.

### 5.4 Long-term brand architecture
**Recommendation: adopt a documented hybrid / endorsed-house model.**

```
Baalvion (master brand)
├── Branded house (on *.baalvion.com, endorsed):
│     Trade · Mining · Jobs/Careers · IR · Dashboard · Connect · Insiders · About
├── Endorsed independent brands (own domains, light "A Baalvion company"):
│     Imperialpedia · Law Elite Network · ControlTheMarket · BaalvionStack
└── Silent-ownership brand (own domain, minimal endorsement):
      Amarisé Maison Avenue (luxury — decoupled to protect equity)
```

**Principles:**
1. **Platform/infrastructure & corporate products** → `*.baalvion.com`, master-brand endorsed (consistency, shared trust).
2. **Vertical/consumer brands with independent equity** → own domains, semi-autonomous, light endorsement.
3. **Luxury** (Amarisé) → silent ownership; no visible conglomerate branding.
4. **One corporate front door** (apex), one depth layer (About); avoid redundant corporate domains.
5. **Differentiate the marketplace/matching cluster** by audience to prevent internal cannibalization.
6. **Endorsement consistency:** define a single "A Baalvion company" treatment (placement, wording) applied uniformly to the endorsed independents.

---

## 6. Constraints & Status
- **Architecture freeze ACTIVE.** This document changes nothing: no renames, moves, deploy, infra, DNS, PM2, Docker, CI/CD, gateway, or env edits.
- All recommendations are **pending executive review** and are intentionally consistent with `ARCHITECTURE-RECOMMENDATIONS.md` (apex/Trade split, CMS port, baalviongroup hold).
- Two domains (`founders.baalvion.com`, `insiders.baalvion.com`) were added to the taxonomy for completeness and should be folded into the official classification.
