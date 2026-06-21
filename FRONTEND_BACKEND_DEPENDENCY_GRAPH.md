# FRONTEND ↔ BACKEND DEPENDENCY GRAPH

> ⚠️ **DEPRECATED — superseded by [MASTER_DEPLOYMENT_COMMANDS.md](MASTER_DEPLOYMENT_COMMANDS.md).**
> Legacy reference only (the dependency mapping itself stays accurate and useful). Deployment
> authority — stack assignment, boot order, domains — is MASTER. Where this file disagrees, **MASTER wins.**

> Which backend services each of the 7 frontends consumes. Generated 2026-06-20. Audit only.
> Legend: ✅ direct hard dependency · 🟡 optional / graceful-degrade / feature-gated · ➖ not consumed
> "auth-gateway" = the BFF (`/auth-bff`, `/trade-bff`, etc. same-origin rewrites). "auth-service" = the RS256 issuer behind it.

## 1. Dependency matrix

| Frontend | auth-service | auth-gateway | cms-service | commerce-service | order-service | inventory-service | rbac-service | Other |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|-------|
| admin-platform | ✅ | 🟡 (BFF gated) | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | admin, session, oauth, ctm, notification, audit, crm, +per-service map |
| AmariseMaisonAvenue | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ➖ | crm 🟡; Razorpay/Stripe (hosted) |
| controlthemarket | 🟡 | ✅ | ➖ | ➖ | ➖ | ➖ | ➖ | ctm-service ✅ |
| Law-Elite-Network | ✅ | 🟡 | ✅ | ➖ | ➖ | ➖ | ➖ | law-service ✅; Razorpay (hosted); Algolia 🟡; Gemini 🟡 |
| Imperialpedia | 🟡 | 🟡 | ✅ | ➖ | ➖ | ➖ | ➖ | imperialpedia-service ✅; static snapshot fallback |
| Global-Trade-Infrastructure | 🟡 | ✅ | ➖ | 🟡 | ✅ | ➖ | ➖ | trade-service ✅; financial-services-java ✅; **own Prisma DB** ✅; sanctions 🟡; payment (multi-gw) ✅ |
| Proxy-BaalvionStack | ✅ | ✅ | 🟡 | ➖ | ➖ | ➖ | ➖ | proxy-service (platform BFF) ✅; payment-service ✅ |

## 2. Per-frontend dependency detail

### admin-platform — the platform control plane
Broadest consumer. Talks to nearly every backend through a gateway proxy + a per-service URL map (`NEXT_PUBLIC_SERVICE_URLS`).
- **Hard:** auth-service (login/refresh), admin-service, session-service, oauth, cms-service.
- **Optional/gated:** auth-gateway (only when `NEXT_PUBLIC_BFF_MODE=on`), commerce/order-execution/inventory/rbac/ctm/notification/audit/crm/marketplace and ~18 domain services via the service map (each loads on demand; missing map → localhost fallback → empty data).
- **Health route** actively pings 6 backends (auth, admin, session, oauth, notification, ctm).
- **Failure mode:** a missing service URL degrades that one dashboard panel; auth-service down blocks login entirely.

### AmariseMaisonAvenue — luxury e-commerce storefront
Full commerce stack consumer.
- **Hard:** auth-service/auth-gateway (`/auth-bff`, account routes), commerce-service (catalog/storefront), order-service (checkout/orders), inventory-service (stock), cms-service (homepage/editorial).
- **Optional:** crm-service.
- **Payments:** Razorpay + Stripe **hosted** checkout (no card data in app; CSP allowlisted). order-service creates the intent.
- **Failure mode:** commerce/order down → storefront/checkout broken (core flow). cms down → homepage falls to `HOMEPAGE_FALLBACK`.

### controlthemarket — market evaluation platform
Narrow consumer.
- **Hard:** auth-gateway (`/auth-bff` → `AUTH_PROXY_TARGET`), ctm-service (`NEXT_PUBLIC_CTM_API_URL`).
- **Graceful:** ctm-service has a mock-data fallback (but `NEXT_PUBLIC_USE_MOCK` must be `false` in prod — code hard-fails otherwise).
- **Not used:** cms, commerce, order, inventory, rbac (authorization derives from token roles).
- **Failure mode:** auth-gateway down → no login; ctm-service down → data endpoints fail (mock disabled in prod).

### Law-Elite-Network — legal network site
- **Hard:** auth-service (server-side BFF `/api/auth/*` proxy), law-service (`NEXT_PUBLIC_API_BASE_URL` — articles/lawyers/bookings/cases/chat).
- **Graceful:** cms-service (`CMS_PUBLIC_URL`) — homepage/static pages degrade to empty on failure.
- **Optional:** Algolia (search), Google Gemini (AI flows), central admin console redirect.
- **Payments:** Razorpay direct (hosted).
- **Not used:** commerce, order, inventory, rbac (in-memory role store).
- **Note:** standalone app (not a monorepo workspace member).

### Imperialpedia — CMS-driven personal-finance content
Resilient by design — **can serve with no live backend** via committed snapshot.
- **Hard (when live):** cms-service (public content), imperialpedia-service (structured KB).
- **Fallback chain:** live CMS → committed `src/generated/personal-finance-content.json` snapshot → demo. CMS/KB failure degrades to snapshot, not an outage.
- **Optional/gated:** auth-service/auth-gateway (`/auth-bff`), Gemini (AI analyst).
- **Not used:** commerce, order, inventory, rbac.
- **Runtime dep:** `REVALIDATE_SECRET` for the ISR revalidate webhook.

### Global-Trade-Infrastructure — trade orchestration (heaviest backend coupling)
The only frontend that **owns its own database** and is effectively a full app, not a thin UI.
- **Own infra:** Prisma → PostgreSQL `gti_orchestration` (`DATABASE_URL`, used by `/api/health`).
- **Hard:** auth-gateway + trade-service (`/trade-bff/*`), financial-services-java (`/finance-bff/*`) — both via `GATEWAY_PROXY_TARGET`; order-service (payments).
- **Identity:** signed identity envelope requires `GATEWAY_SIGNING_SECRET`.
- **Optional:** risk/sanctions-service, Google GenAI.
- **Payments:** multi-gateway (Razorpay/Stripe/PayU/Bank), hosted checkout, order-service creates intents.
- **Failure mode:** DB down → `/api/health` 503 (pod unready); gateway down → auth + trade/finance data fail.

### Proxy-BaalvionStack — proxy/VPN SaaS SPA
Static SPA → all calls leave the browser to backends.
- **Hard:** auth-service + auth-gateway (`/auth-bff` same-origin nginx proxy → `AUTH_PROXY_TARGET`), proxy-service (platform BFF — proxies/presets/analytics/billing/orgs/API-keys), payment-service (BFF `/billing/checkout`).
- **Graceful:** cms-service (branding/white-label, via gateway).
- **Payments:** Razorpay/Stripe/PayU/Cashfree hosted checkout (no card data, no provider keys in SPA).
- **Not used:** commerce, order, inventory, rbac.

## 3. Shared backend surface (deploy-order implications)
These backends are depended on by **multiple** frontends and should be live & reachable before the frontends are cut over:

| Backend | Consumed by | Criticality |
|---------|-------------|-------------|
| **auth-service** | all 7 (directly or via gateway) | 🔴 Platform-critical — gates login everywhere |
| **auth-gateway (BFF)** | admin, amarise, ctm, law(opt), imperialpedia(opt), gti, proxy | 🔴 Same-origin cookie/CSRF layer |
| **cms-service** | admin, amarise, law, imperialpedia, proxy(opt) | 🟠 Content; several have fallbacks |
| **commerce-service** | amarise (hard), admin (opt) | 🟠 e-commerce core for Amarisé |
| **order-service** | amarise, gti, admin(opt) | 🟠 Checkout / payment intent creation |
| **inventory-service** | amarise (hard), admin (opt) | 🟡 Stock display |
| **rbac-service** | admin (opt) only | 🟢 Others use token roles |
| payment-service | amarise, law, gti, proxy (via BFF) | 🟠 Hosted checkout init |
| ctm-service | ctm (hard), admin (opt) | 🟠 CTM data |
| law-service / imperialpedia-service / trade-service / financial-services-java | their respective frontend | 🟠 Domain data |

**Takeaway:** auth-service and auth-gateway are the universal hard dependency — bring them up first. Domain services (commerce/order/inventory/ctm/law/imperialpedia/trade/finance) are per-frontend and can be cut over independently. rbac-service is the least-coupled (admin-only, optional).
