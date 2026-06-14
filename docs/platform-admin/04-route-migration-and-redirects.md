# 04 — Route Migration & Redirect Mapping

Old → new routes for every discovered admin surface. Conventions:
- **Global module:** `/admin/<module>`
- **Product module:** `/admin/products/<product>/<category>/<resource>`

The unified console serves under `/admin/*` on a single origin (e.g. `admin.baalvion.com`). Today the central `admin-platform` serves at **root** (`/dashboard`, `/users`, `/cms`…) and each product app serves its own `/admin/*` on its own domain — so **both** the central root routes and the per-product-domain routes are remapped.

---

## A. Migration strategy

1. **Central admin-platform** routes move from root → `/admin/*` (a one-time route-group/basePath change). 1:1, near-zero reuse loss.
2. **Per-product apps**: their admin tree is lifted into a product module under `/admin/products/<product>/*` and rendered by the shell (manifest-driven where possible; custom components otherwise).
3. **Cross-domain 301/308 redirects** from each old product-domain `/admin/*` to the unified console, preserving deep links and query strings. Redirects live at the edge (Cloudflare) + a Next.js `redirects()` fallback per app during the transition window.
4. **Reuse %** = how much existing FE component code survives the move (high when the page is a self-contained table/editor; low when it was tangled with the product's own shell/auth).

---

## B. Route migration table (representative; full route lists in `01-module-inventory.md`)

| Product | Module | Old Route | New Route | Redirect? | Reuse % | Complexity |
|---------|--------|-----------|-----------|-----------|---------|-----------|
| Platform | Dashboard | `/dashboard` | `/admin/dashboard` | Y (301) | 95% | Low |
| Platform | Users | `/users` | `/admin/users` | Y | 95% | Low |
| Platform | CMS | `/cms/*` | `/admin/content/*` | Y | 90% | Low |
| Platform | Commerce | `/commerce/*` | `/admin/commerce/*` | Y | 95% | Low |
| Platform | Audit | `/audit-logs`, `/audit-center` | `/admin/audit/*` | Y | 90% | Low |
| Imperialpedia | Content | `/admin/content` | `/admin/products/imperialpedia/content` | Y (xdomain) | 70% | Med |
| Imperialpedia | Knowledge | `/admin/glossary` | `/admin/products/imperialpedia/knowledge/glossary` | Y | 70% | Med |
| Imperialpedia | SEO | `/admin/seo` | `/admin/products/imperialpedia/seo` | Y | 60% | Med |
| Imperialpedia | Analytics | `/admin/analytics/*` | `/admin/analytics?product=imperialpedia` | Y | 40% | Med (dedup) |
| Jobs | ATS | `/(admin)/jobs/[jobId]/pipeline` | `/admin/products/jobs/ats/jobs/[jobId]/pipeline` | Y (xdomain) | 75% | Med |
| Jobs | Candidates | `/(admin)/candidates` | `/admin/products/jobs/ats/candidates` | Y | 75% | Med |
| Jobs | Campus | `/(admin)/campus/*` | `/admin/products/jobs/campus/*` | Y | 75% | Med |
| Jobs | Users/Roles | `/(admin)/users`, `/(admin)/roles` | `/admin/users?product=jobs` | Y | 30% | Med (dedup) |
| Connect | Campaigns | `/admin/campaigns/[id]/analytics` | `/admin/products/connect/campaigns/[id]/analytics` | Y (xdomain) | 70% | Med |
| Connect | Creators | `/admin/creators/verify` | `/admin/products/connect/creators/verify` | Y | 70% | Med |
| Connect | Finance | `/admin/revenue` | `/admin/monetization?product=connect` | Y | 30% | Med (dedup) |
| Law | Console | `/admin/dashboard`, `/admin/[resource]` | `/admin/products/law/*` | Y (xdomain) | 65% | Low |
| CTM | Intelligence | `/(app)/admin/intelligence` | `/admin/products/ctm/intelligence` | Y (xdomain) | 70% | Med |
| CTM | Rankings | `/(app)/admin/rankings` | `/admin/products/ctm/intelligence/rankings` | Y | 70% | Med |
| CTM | Integrations | `/(app)/admin/integrations` | `/admin/developers?product=ctm` | Y | 30% | Med (dedup) |
| Amarise | Commerce | `/admin/commerce` | `/admin/commerce?brand=amarise` | Y (xdomain) | 50% | High (merge) |
| Amarise | SEO/Content | `/admin/seo`, `/admin/content` | `/admin/content?website=amarise`, `/admin/seo?...` | Y | 40% | High (merge) |
| IR | Pages | `/admin/pages` | `/admin/content?website=ir` | Y (xdomain) | 50% | Med (CMS merge) |
| IR | Investor | `/admin/voting`, `/admin/subscribers` | `/admin/products/ir/investor/*` | Y | 70% | Med |
| Mining | Marketplace | `/admin/catalog`, `/admin/products` | `/admin/products/mining/marketplace/*` | Y (xdomain) | 70% | Med |
| Mining | Trust | `/admin/fraud`, `/admin/disputes` | `/admin/trust-safety?product=mining` | Y | 30% | Med (dedup) |
| Proxy | Network | `/admin/AdminNetworkMap` | `/admin/products/proxy/network/map` | Y (xdomain) | 55% | Med |
| Proxy | Revenue | `/admin/AdminRevenue` | `/admin/monetization?product=proxy` | Y | 25% | Med (dedup) |
| Insiders | Core | `/protocol/admin/AdminDashboard` | `/admin/products/insiders/dashboard` | Y (xdomain) | 60% | Low |
| About | (all) | `/admin/*` | `/admin/content?website=about` | Y (already retired) | n/a | Deprecate |
| Company-Dash | (all) | `/app/*` | `/admin/*` (exec views merged) | Y | 30% | High (evaluate) |
| MarketUnderworld | (all) | — (spec) | `/admin/products/marketunderworld/*` | n/a | 0% (build-new) | High |

---

## C. Redirect map — worked examples (the requested pattern)

```
/imperialpedia/admin/articles      → /admin/products/imperialpedia/content/articles
/imperialpedia/admin/glossary      → /admin/products/imperialpedia/knowledge/glossary
/imperialpedia/admin/seo           → /admin/products/imperialpedia/seo
/jobs/(admin)/candidates           → /admin/products/jobs/ats/candidates
/connect/admin/campaigns           → /admin/products/connect/campaigns
/ctm/admin/intelligence            → /admin/products/ctm/intelligence
/law/admin/dashboard               → /admin/products/law/dashboard
/mining/admin/catalog              → /admin/products/mining/marketplace/catalog
/proxy/admin/AdminRevenue          → /admin/monetization?product=proxy           (dedup → global)
/amarise/admin/commerce            → /admin/commerce?brand=amarise               (dedup → global)
/about/admin/*                     → /admin/content?website=about                (deprecated)
# central admin-platform root → /admin namespace
/dashboard                         → /admin/dashboard
/users                             → /admin/users
/cms/websites                      → /admin/content/websites
/commerce/orders                   → /admin/commerce/orders
```

## D. Redirect map — machine-readable (extend per full route list)

```json
[
  { "from": "https://imperialpedia.baalvion.com/admin/content",   "to": "https://admin.baalvion.com/admin/products/imperialpedia/content", "status": 301 },
  { "from": "https://imperialpedia.baalvion.com/admin/glossary",  "to": "https://admin.baalvion.com/admin/products/imperialpedia/knowledge/glossary", "status": 301 },
  { "from": "https://imperialpedia.baalvion.com/admin/seo",       "to": "https://admin.baalvion.com/admin/products/imperialpedia/seo", "status": 301 },
  { "from": "https://jobs.baalvion.com/candidates",               "to": "https://admin.baalvion.com/admin/products/jobs/ats/candidates", "status": 301 },
  { "from": "https://jobs.baalvion.com/jobs",                     "to": "https://admin.baalvion.com/admin/products/jobs/ats/jobs", "status": 301 },
  { "from": "https://connect.baalvion.com/admin/campaigns",       "to": "https://admin.baalvion.com/admin/products/connect/campaigns", "status": 301 },
  { "from": "https://connect.baalvion.com/admin/creators",        "to": "https://admin.baalvion.com/admin/products/connect/creators", "status": 301 },
  { "from": "https://ctm.baalvion.com/admin/intelligence",        "to": "https://admin.baalvion.com/admin/products/ctm/intelligence", "status": 301 },
  { "from": "https://ctm.baalvion.com/admin/integrations",        "to": "https://admin.baalvion.com/admin/developers?product=ctm", "status": 301 },
  { "from": "https://law.baalvion.com/admin/dashboard",           "to": "https://admin.baalvion.com/admin/products/law/dashboard", "status": 301 },
  { "from": "https://mining.baalvion.com/admin/catalog",          "to": "https://admin.baalvion.com/admin/products/mining/marketplace/catalog", "status": 301 },
  { "from": "https://mining.baalvion.com/admin/fraud",            "to": "https://admin.baalvion.com/admin/trust-safety?product=mining", "status": 301 },
  { "from": "https://proxy.baalvion.com/admin/AdminRevenue",      "to": "https://admin.baalvion.com/admin/monetization?product=proxy", "status": 301 },
  { "from": "https://ir.baalvion.com/admin/pages",                "to": "https://admin.baalvion.com/admin/content?website=ir", "status": 301 },
  { "from": "https://amarise.baalvion.com/admin/commerce",        "to": "https://admin.baalvion.com/admin/commerce?brand=amarise", "status": 301 },
  { "from": "https://about.baalvion.com/admin",                   "to": "https://admin.baalvion.com/admin/content?website=about", "status": 301 },
  { "from": "https://admin.baalvion.com/dashboard",               "to": "https://admin.baalvion.com/admin/dashboard", "status": 301 },
  { "from": "https://admin.baalvion.com/users",                   "to": "https://admin.baalvion.com/admin/users", "status": 301 },
  { "from": "https://admin.baalvion.com/cms/websites",            "to": "https://admin.baalvion.com/admin/content/websites", "status": 301 }
]
```

> **Generation:** the complete redirect list is generated programmatically from `platform.products.manifest` + the discovered route inventory (one entry per old route). Hostnames are illustrative — substitute real domains. Keep redirects ≥ 6 months; log hits (`cms_seo_redirects.hit_count` pattern) to find stragglers before removal.

## E. Redirect & migration guardrails

- **No chains/loops:** validate the generated map (each `from` resolves in ≤1 hop). Reuse the existing `cms_seo_redirects` loop-detection.
- **Preserve query + hash** on redirect; map deep dynamic routes (`[id]`, `[jobId]`) by pattern.
- **Auth continuity:** same `baalvion_refresh` cookie domain (`.baalvion.com`) → users stay logged in across the redirect (no re-auth).
- **Transition window:** dual-run (old app admin + new console) behind a feature flag per product; flip product-by-product; decommission the old admin only after redirect-hit volume drops to ~0.
