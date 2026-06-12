# Baalvion Mining — Corporate & Quarry Platform Architecture

> Enterprise mining + quarry + minerals + logistics platform for **Baalvion Industries
> Private Limited** (CIN `U43121OD2025PTC048479`), operating as **Baalvion Mining Inc.**
>
> **Integrity rule (enforced everywhere):** no fabricated statistics, production figures,
> reserves, mine/quarry data, license numbers, certifications, projects, products, news, or
> leadership. Unknown data renders `"Information pending company disclosure."` or an honest
> empty state. The content store ships **empty**; management populates it via the CMS/admin.

---

## 1. Frontend Route Map

### Corporate & identity
| Route | Purpose |
|---|---|
| `/` | Home |
| `/about` | About Us — mission/vision/values/timeline/structure |
| `/leadership` | Leadership & Governance (profiles "coming soon") |
| `/investors` | Investor Relations (+ investor contact form) |
| `/corporate-documents` | Corporate document centre |
| `/careers` | Careers (honest open-roles empty state) |
| `/contact` | Contact (functional form → `/api/contact`) |
| `/news`, `/news/[slug]` | News & Media + article detail |
| `/gallery` | Gallery (branded placeholders, labelled) |

### Operations & quarry
| Route | Purpose |
|---|---|
| `/operations` | Mining Operations overview |
| `/mine-sites` | Mine & site portfolio |
| `/equipment` | Equipment & fleet showcase |
| `/quality` | Quality control & assurance |
| `/supply-chain` | Supply chain & logistics network |
| `/projects` | Project portfolio |
| `/logistics` | Logistics partners (generic categories) |
| `/quarry` | Quarry Operations hub |
| `/quarry/{locations,capabilities,production,equipment,safety,environmental,rehabilitation}` | Quarry sub-modules |

### Products
| Route | Purpose |
|---|---|
| `/products` | Catalogue landing (category taxonomy) |
| `/products/[category]` | Products within a category |
| `/products/[category]/[slug]` | Product detail + inquiry form |

### Compliance, ESG & responsibility
| Route | Purpose |
|---|---|
| `/licenses` | Licenses & Compliance Center (framework + validity indicators) |
| `/licenses/[kind]` | Per-category license list (quarry/mining/environmental/government/industry/corporate/iso) |
| `/certifications` | Certifications & licenses (request-on-demand) |
| `/esg` | Sustainability / ESG |
| `/hse` | Health, Safety & Environment |
| `/community`, `/csr` | Community development / CSR |
| `/responsible-sourcing` | Responsible sourcing / modern slavery |
| `/tenders` | Tenders & procurement |

### Commerce surfaces (pre-existing)
`/marketplace`, `/marketplace/[productId]`, `/directory`, `/directory/[supplierId]`, `/solutions`,
`/partnership-plan`, `/guides`, `/guides/[slug]`, `/blog`, `/blog/[slug]`, `/trade/[slug]`, `/help`, `/search`.

### Legal
`/privacy`, `/terms`, `/cookies`, `/disclaimer`, `/aml-kyc`, `/refund-policy`,
`/responsible-sourcing`, `/data-processing`.

### API
`/api/contact`, `/api/partnership` (functional), and content APIs below.

---

## 2. Content Model / Database Schema

Canonical TypeScript types: [`src/lib/content/types.ts`](../src/lib/content/types.ts). These map 1:1
to the would-be relational tables. Suggested Postgres schema (Prisma-style):

```
model Location        { id, name, type, addressLine, city, region, country, postalCode, lat, lng, phone, email, status }
model QuarrySite       { id, name, slug @unique, locationId?, materials[], capabilities[], productionCapacity?, equipment[], safetyPrograms[], environmentalManagement[], rehabilitation?, description?, status, seoJson }
model MineSite         { id, name, slug @unique, locationId?, minerals[], capabilities[], productionCapacity?, description?, status, seoJson }
model Equipment        { id, name, category, description?, siteId?, imageJson?, status }
model ProductCategory  { id, name, slug @unique, description?, parentId?, imageJson?, status, seoJson }
model Product          { id, name, slug @unique, categoryId, description?, specsJson[], grade?, size?, applications[], datasheetsJson[], galleryJson[], status, seoJson }
model License          { id, kind, title, authority?, number?, status, issuedOn?, expiresOn?, documentJson?, publiclyVisible, notes? }
model Project          { id, name, slug @unique, category?, summary?, locationId?, stage?, galleryJson[], status, seoJson }
model NewsArticle      { id, title, slug @unique, category?, excerpt?, body?, coverImageJson?, publishedOn?, status, seoJson }
model TeamMember       { id, name?, role, bio?, photoJson?, order, status }
model GalleryItem      { id, title, assetJson, album?, status }
model MediaAsset       { id, url, alt, caption?, kind, ownerType, ownerId }   // or embed as JSON
```
Enums: `PublishStatus(draft|published|archived)`, `LicenseKind(7)`, `LicenseStatus(active|pending|expired|renewing|not-disclosed)`.
Indexes: `slug @unique`, `status`, `License.expiresOn` (expiry tracking), `Product.categoryId`.

The frontend reads exclusively through the provider [`src/lib/content/store.ts`](../src/lib/content/store.ts)
(`loadStore()` → swap the empty in-memory return for a DB/CMS read; getters filter to `published`
and respect `License.publiclyVisible`). No call sites change when persistence is wired.

---

## 3. API Architecture

Envelope (`src/lib/api/respond.ts`): `{ success: boolean, data?: T, error?: string }`.

| Resource | GET | POST / PUT / DELETE |
|---|---|---|
| `/api/products` | `{ products, categories }` | admin → **501** (scaffold) |
| `/api/products/[slug]` | one product (404 if absent) | admin → 501 |
| `/api/licenses` | public licenses; `?kind=` filter (400 on bad kind) | admin → 501 |
| `/api/quarry` | published quarry sites | admin → 501 |
| `/api/news` | published news; `?slug=` one | admin → 501 |
| `/api/projects` | published projects | admin → 501 |
| `/api/contact` | — | **functional**: zod + rate-limit + honeypot + email-ready |
| `/api/partnership` | — | **functional** |

Write handlers call `requireAdmin(req)` ([`src/lib/api/admin-guard.ts`](../src/lib/api/admin-guard.ts) —
`Authorization: Bearer $ADMIN_API_TOKEN`, fail-closed) then return `501` with a TODO documenting
intended CRUD (create/update/delete + media upload + publish & visibility toggle). All run on the
Node runtime; GETs are try/catch-wrapped → `500` on unexpected error; internals never leak.

---

## 4. CMS / Admin Architecture

Two viable production paths (the seam is identical — `loadStore()` + the `/api/*` write contract):

1. **Central Baalvion CMS (`cms-service`)** — already used for `/blog`. Add content types matching
   the models above; `loadStore()` fetches the published delivery API; admin editing happens in the
   existing `admin-platform` console. Preferred (no new admin to build/secure).
2. **Embedded admin** — implement the `POST/PUT/DELETE` handlers against Postgres (Prisma), add
   session/RBAC auth (replace the `ADMIN_API_TOKEN` placeholder), media upload to object storage,
   and a `/admin/content` UI. Each model needs: list, create, edit, publish/unpublish, visibility
   toggle (licenses), media upload (products/news/gallery/sites), expiry alerts (licenses).

Admin capabilities required: **Products, Product Categories, Licenses, Quarry Sites, Mine Sites,
Equipment, Projects, News, Team, Gallery, ESG/HSE content, Locations** — all editable without code.

---

## 5. Header / Footer Design System

**Header** (`src/components/layout/Navbar.tsx`) — data-driven `NAV[]`; desktop renders click
mega-menus (Radix `DropdownMenu`) for grouped items, plain links otherwise; mobile uses a Radix
`Accordion` inside a `Sheet`. Groups: **About, Operations, Quarry, Products, Investors, Careers,
Contact** (+ search, Sign In, Get in touch). Sticky, backdrop-blur, keyboard-accessible.

**Footer** (`src/components/layout/Footer.tsx`) — brand/contact block (CIN, HQ + registered office,
phone, email, LinkedIn/X) + four link columns: **Corporate · Operations · Compliance · Legal**.
Renders on **every public page** (verified). Bottom bar: copyright + Data Protection / Corporate
Documents / Compliance.

Tokens: `bg-primary` navy `#0B2540`, `text-secondary` teal `#21CEDD`; `container … max-w-7xl`;
shadcn `Card/Badge/Button`; `lucide-react` icons; branded SVG/PNG assets only (no external images).

---

## 6. Component Inventory (new)

- **Content layer:** `lib/content/types.ts`, `lib/content/store.ts`, `lib/content/license-kinds.ts`
- **API layer:** `lib/api/respond.ts`, `lib/api/admin-guard.ts`, `app/api/{products,products/[slug],licenses,quarry,news,projects}/route.ts`
- **Common:** `components/common/PendingDisclosure.tsx` (`PendingDisclosure`, `EmptyState`)
- **Company:** `components/company/{ExecutiveProfileCard,LeadershipGrid,GovernanceSection,PendingDisclosure}`
- **Products:** `components/products/{ProductCard,CategoryCard,ProductInquiryForm}`
- **Licenses:** `components/licenses/{LicenseCard,LicenseStatusBadge,ComplianceSummary}`
- **Layout:** rebuilt `Navbar` (mega-menu), `Footer` (enterprise), `CookieConsent` (granular)
- **Branding:** `app/opengraph-image.tsx`, `app/twitter-image.tsx`, `scripts/generate-raster-assets.mjs`, `lib/brand-assets.ts`

---

## 7. Missing Business Information (required from management)

Nothing below is fabricated — supply real values via the CMS/admin to activate each surface:

1. **Quarry sites** — names, locations/coordinates, materials, **production capacity**, equipment, safety & environmental programs, rehabilitation plans.
2. **Mine sites** — names, locations, minerals, capacity.
3. **Products** — categories + SKUs with specifications, grade, size, applications, **technical datasheets**, images.
4. **Licenses & certifications** — genuine quarry/mining licenses, environmental clearances, government approvals, registrations, ISO certs: **authority, number, issue/expiry dates, certificate PDFs, visibility**.
5. **Leadership** — executive names, roles, bios, photos; board/governance detail.
6. **Projects** — real projects (name, location, stage, capex/timeline if public).
7. **News & media** — press releases / articles.
8. **Investor & financial** — annual reports, financial disclosures, corporate filings.
9. **Equipment/fleet** — real machinery inventory.
10. **Gallery/photography** — licensed images of sites, minerals, equipment, facilities, people.
11. **HSE / ESG metrics** — only if the company wishes to publish verified figures.
12. **Config** — real `NEXT_PUBLIC_GA_MEASUREMENT_ID`, email provider (`EMAIL_PROVIDER` + creds), `ADMIN_API_TOKEN`.
13. **Legal** — counsel review of all policy copy; confirm LinkedIn/X profile URLs.

---

## 8. Production Implementation Roadmap

| Phase | Scope | Effort |
|---|---|---|
| **A — Persistence** | Provision Postgres; Prisma schema from §2; implement `loadStore()` against DB **or** wire the central CMS content types | 1–2 wk |
| **B — Admin/CMS** | Implement `POST/PUT/DELETE` per resource; real session/RBAC auth (replace `ADMIN_API_TOKEN`); media upload; license expiry alerts | 1–2 wk |
| **C — Data load** | Management supplies §7 data via admin; QA each surface flips from empty/pending to live | gated on business |
| **D — Photography & brand** | Replace branded SVG/PNG placeholders with licensed photography; raster brand set already generated | gated on business |
| **E — Config & launch** | Real GA id, email provider, social URLs; counsel sign-off on legal copy; CWV/a11y/SEO pass; production CSP nonce | 3–5 days |

**Status today:** all frontend surfaces, navigation, content model, API contract, and admin scaffold
are **built, type-checked (0 errors) and production-built (132 pages)**. Every data-bearing page renders
an honest empty / pending-disclosure state until management supplies real data — nothing is fabricated.
