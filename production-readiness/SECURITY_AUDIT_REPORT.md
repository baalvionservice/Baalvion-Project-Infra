# Baalvion Platform — Security Audit Report
**Date:** 2026-06-03  
**Auditor:** Security Reviewer (AI-assisted, evidence-based)  
**Scope:** Production-readiness, OWASP Top 10, commerce + identity + admin surfaces  
**Branch:** `feat/platform-foundation`  
**Methodology:** Static analysis via Grep/Read tooling; no code was modified.

---

## Executive Summary

The Baalvion monorepo demonstrates a high level of security engineering maturity in its core identity and commerce stacks: the auth-gateway BFF with RS256/JWKS, double-submit CSRF, HttpOnly cookie sessions, server-authoritative pricing in order-service, HMAC-signed guest cart tokens, and ownership enforcement are all well-implemented. Helm/security-headers via `helmet()` are applied to most services.

However, several CRITICAL and HIGH issues remain that prevent safe production launch:

- A **well-known dev secret** (`baalvion-internal-dev-secret`) is the default for inter-service authentication across multiple services that do **not** fail-fast in production, meaning a misconfigured deployment ships with a publicly-known shared secret.
- The **trade-service** allows **mass-assignment of untrusted `req.body`** directly into Sequelize models on create, enabling tenant spoofing and data injection across deals, documents, organizations, and messages.
- **Unprotected SSRF** exists in the `proxy-service` SIEM-export path (`auditExportService.js`) — an admin-configurable sink URL is fetched with no allowlist or SSRF guard.
- **Unsanitized CMS HTML** is rendered via `dangerouslySetInnerHTML` on multiple frontends without DOMPurify, creating a stored XSS vector whenever an editor or a CMS compromise inserts a payload.
- The **auth-node HS256 fallback** can silently activate in any service if `JWT_PUBLIC_KEY` is absent at startup, allowing HS256-signed tokens to be accepted with the shared `accessSecret`.

---

## Severity Counts

| Severity | Count |
|----------|-------|
| CRITICAL | 4     |
| HIGH     | 7     |
| MEDIUM   | 5     |
| LOW      | 3     |

---

## Findings Table

| ID | Title | Severity | Service | File:line | Exploitability | Status |
|----|-------|----------|---------|-----------|----------------|--------|
| C-01 | Dev `INTERNAL_SERVICE_SECRET` default with no prod fail-fast in proxy-service and insiders-service | CRITICAL | proxy-service, insiders-service | `routes/billingRoutes.js:16`, `insiders-service/routes/billingRoutes.js:13` | Remote — any caller who knows the public string `baalvion-internal-dev-secret` can invoke payment-service internal APIs | CONFIRMED |
| C-02 | trade-service mass-assignment via `db.Model.create(req.body)` | CRITICAL | trade-service | `controller/dealController.js:48`, `listingController.js:41`, `documentController.js:36`, `messageController.js:34`, `organizationController.js:43`, `complianceController.js:36` | Authenticated remote — attacker sets arbitrary DB fields including `buyer_org_id`, `seller_org_id`, `tenantId`, `status` | CONFIRMED |
| C-03 | Unsanitized HTML from CMS rendered via `dangerouslySetInnerHTML` | CRITICAL | Frontend (controlthemarket, Imperialpedia, Mining, AmariseMaisonAvenue, brand-connector) | `controlthemarket-main/src/components/blog/ArticleView.tsx:92`, `Imperialpedia-main/src/modules/content-engine/components/ArticlePage.tsx:124`, `Mining.Baalvion-main/src/app/blog/[slug]/page.tsx:106`, `Mining.Baalvion-main/src/app/guides/[slug]/page.tsx:102`, `brand-connector-main/src/app/campaigns/[id]/page.tsx:250`, CTM candidate task pages 142/146/166/170 | Stored XSS — a compromised CMS account or malicious editor inserts a payload that executes in every reader's browser | CONFIRMED |
| C-04 | HS256 fallback silently activates when `JWT_PUBLIC_KEY` is unset | CRITICAL | `@baalvion/auth-node` (all consumers) | `packages/auth-node/index.js:106-112,161,267` | Any service misconfigured without `JWT_PUBLIC_KEY` silently falls back to HS256 and accepts HS256 tokens signed with the shared secret | CONFIRMED |
| H-01 | SSRF in `auditExportService` SIEM webhook — no URL allowlist/guard | HIGH | proxy-service | `service/auditExportService.js:68,80` | Authenticated admin — triggers POST to any URL including internal metadata endpoints | CONFIRMED |
| H-02 | Admin-service webhook delivery: `isHttpUrl` allows private/loopback URLs | HIGH | admin-service | `service/developerService.js:176-181,306` | Authenticated admin — webhook delivery worker will call internal-network URLs stored via admin console | CONFIRMED |
| H-03 | No login-specific rate limit on auth-gateway `/auth/login` | HIGH | auth-gateway | `index.js:64`, `routes/auth.js:51` | Unauthenticated remote — global 1000 req/min allows credential-stuffing; no per-email or per-IP login throttle | CONFIRMED |
| H-04 | `S3_SECRET_KEY` defaults to `baalvion_dev_pass` in commerce-service and law-service | HIGH | commerce-service, law-service | `commerce-service/utils/s3Client.js:21`, `knowledge/law-service/service/storage.js:15` | Deployment misconfiguration — if env var absent, MinIO uses well-known dev credential; no fail-fast guard | CONFIRMED |
| H-05 | CMS `secretCrypto.getKey()` defaults to known dev AES key without prod fail-fast | HIGH | cms-service | `utils/secretCrypto.js:19` | All tenant payment credentials encrypted with a publicly-known key if `CMS_SECRETS_KEY` absent. Note: `appConfig.js:82` does check this for non-dev, but secretCrypto itself silently uses the dev key; code path risk if config check is bypassed. | CONFIRMED |
| H-06 | trade-service `express-rate-limit` is optional; silently no-ops when package absent | HIGH | trade-service | `middleware/rateLimit.js:7,31-33` | Unauthenticated remote — rate limiting may be completely disabled on the trade API surface | CONFIRMED |
| H-07 | Unsanitized user HTML in CTM candidate task pages | HIGH | Frontend/controlthemarket | `src/app/(app)/candidate/tasks/[id]/page.tsx:142,146,166,170` | Stored XSS from task instructions/outputs set by an admin or employer — executes in candidate browser | CONFIRMED |
| M-01 | No CSRF protection on admin-service or order-service; only auth-gateway BFF has CSRF | MEDIUM | admin-service, order-service | `admin-service/index.js`, `order-service/index.js` | CSRF requires the victim to have a valid session cookie from another auth pathway; reduced risk if services are only called via the BFF | SUSPECTED |
| M-02 | `realtime-service/index.js:64` hardcodes `DB_PASSWORD` fallback `baalvion_dev_pass` in application code | MEDIUM | realtime-service (platform) | `services/platform/realtime-service/index.js:64` | Only exploitable if env var unset; DB credential defaulting to known string | CONFIRMED |
| M-03 | Trust proxy enabled platform-wide (14+ services use `app.set('trust proxy', 1)`) with no upstream proxy validation | MEDIUM | Multiple services | Multiple `index.js` files | Allows IP spoofing via forged `X-Forwarded-For` header for rate-limit bypass | CONFIRMED |
| M-04 | Ledger-service error handler logs `err.stack` to `console.error` which may reach log aggregators | MEDIUM | ledger-service | `middleware/errorMiddleware.js:10-12` | Stack traces may expose internal file paths and SQL errors in log streams | CONFIRMED |
| M-05 | `DEMO_PASSWORD: 'Baalvion123!'` exported from `platformStore.js` and appears in `seeders/devSeed.js` and `scripts/testEndpoints.js` | MEDIUM | proxy-service | `service/platformStore.js:604`, `seeders/devSeed.js:8`, `scripts/testEndpoints.js:28` | If dev seed runs in production (or admin credentials are not rotated post-seed), attacker can log in as platform admin | CONFIRMED |
| L-01 | `Postman collection` contains `Baalvion123!` demo password in committed JSON | LOW | proxy-service | `Baalvion-API.postman_collection.json:139,419` | Leaked in repo history; rotatable | CONFIRMED |
| L-02 | `aud`/`iss` JWT verification is optional — only enforced when env vars are set | LOW | `@baalvion/auth-node` | `packages/auth-node/index.js:104-105,263-264` | Tokens from a different issuer accepted if `JWT_ISSUER` not configured in a service | CONFIRMED |
| L-03 | `commerce-service/index.js:27` mounts storefront routes with `cors()` (no origin restriction) globally for `/api/v1/commerce/storefront/:storeId` | LOW | commerce-service | `index.js:27` | Any origin can cross-origin read storefront data; acceptable for public APIs but should be explicitly documented | CONFIRMED |

---

## Detailed Writeups — CRITICAL & HIGH

### C-01 — Dev `INTERNAL_SERVICE_SECRET` Default — No Prod Fail-Fast (proxy-service, insiders-service)

**Evidence:**
```
Backend/services/infrastructure/proxy-service/routes/billingRoutes.js:16
  const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'baalvion-internal-dev-secret';

Backend/services/ecosystem/insiders-service/routes/billingRoutes.js:13
  const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'baalvion-internal-dev-secret';
```

The `payment-service` and `cms-service` **do** fail-fast in production (`appConfig.js:93-95`, `cms/appConfig.js:72-76`). However, `proxy-service/routes/billingRoutes.js` and `insiders-service/routes/billingRoutes.js` use the same well-known string as a fallback with **no fail-fast guard**. These modules forward the secret directly to `payment-service` in `x-internal-secret` headers. If `INTERNAL_SERVICE_SECRET` is unset in either service's production environment, any actor who knows `baalvion-internal-dev-secret` (it is in committed source and `.env.example` files across at least 4 services) can call `POST /v1/billing/checkout` as if they were a trusted internal caller.

**PoC Sketch:**
```bash
curl -X POST https://proxy.baalvion.com/v1/billing/checkout \
  -H "x-internal-secret: baalvion-internal-dev-secret" \
  -H "x-internal-service: attacker" \
  -d '{"websiteSlug":"proxy-baalvionstack","amount":1,"currency":"USD","idempotencyKey":"x"}'
```
(Note: the checkout route itself uses `authMiddleware`, reducing exposure slightly, but the internal secret still reaches payment-service if INTERNAL_SERVICE_SECRET is the dev default there.)

**Fix:** Add an explicit `requireEnv` or fail-fast block in both files:
```js
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET;
if (!INTERNAL_SECRET || INTERNAL_SECRET === 'baalvion-internal-dev-secret') {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[billing] INTERNAL_SERVICE_SECRET must be set in production');
  }
}
```

---

### C-02 — trade-service Mass-Assignment via `db.Model.create(req.body)`

**Evidence:**
```
Backend/services/commerce/trade-service/controller/dealController.js:48
  const deal = await db.Deal.create(req.body);

Backend/services/commerce/trade-service/controller/listingController.js:41
  const listing = await db.Listing.create(payload);  // payload = { ...req.body }

Backend/services/commerce/trade-service/controller/documentController.js:36
  const doc = await db.Document.create(req.body);

Backend/services/commerce/trade-service/controller/messageController.js:34
  const message = await db.Message.create(req.body);

Backend/services/commerce/trade-service/controller/organizationController.js:43
  const org = await db.Organization.create(req.body);

Backend/services/commerce/trade-service/controller/complianceController.js:36
  const cc = await db.ComplianceCase.create(req.body);
```

An authenticated caller can set **any column** the model exposes, including `buyer_org_id`, `seller_org_id`, `tenantId`, `status`, `signed_at` on a Deal, and `companyId` on Listings (partially mitigated — `companyId` is overridden from `req.auth.orgId` but only when `req.auth.orgId` is present). There are no input schemas, no field allowlists, and no server-side validation. A caller can:
- Create a Deal with `buyer_org_id` and `seller_org_id` set to victim orgs they do not belong to.
- Set `status: 'finalized'` on creation, bypassing the finalization workflow.
- Inject arbitrary JSON into any `metadata`/`JSONB` field.

**Fix:** Define explicit schema maps per model and pick only allowed fields:
```js
// Example for createDeal
const DEAL_ALLOWED = ['title', 'description', 'currency', 'value', 'terms'];
const payload = {
  ...pick(req.body, DEAL_ALLOWED),
  buyer_org_id: req.auth.orgId,  // server-set
  seller_org_id: validateOrgId(req.body.seller_org_id),
  status: 'draft',               // server-set, never from client
};
const deal = await db.Deal.create(payload);
```

---

### C-03 — Stored XSS via Unsanitized CMS HTML (`dangerouslySetInnerHTML`)

**Evidence (non-exhaustive):**
```
Frontend/controlthemarket-main/src/components/blog/ArticleView.tsx:92
  dangerouslySetInnerHTML={{ __html: article.body }}

Frontend/Imperialpedia-main/src/modules/content-engine/components/ArticlePage.tsx:124
  dangerouslySetInnerHTML={{ __html: article.body }}

Frontend/Mining.Baalvion-main/src/app/blog/[slug]/page.tsx:106
  dangerouslySetInnerHTML={{ __html: post.contentHtml }}

Frontend/Mining.Baalvion-main/src/app/guides/[slug]/page.tsx:102
  dangerouslySetInnerHTML={{ __html: guide.content }}

Frontend/brand-connector-main/src/app/campaigns/[id]/page.tsx:250
  dangerouslySetInnerHTML={{ __html: campaign.description }}

Frontend/controlthemarket-main/src/app/(app)/candidate/tasks/[id]/page.tsx:142,146,166,170
  dangerouslySetInnerHTML={{ __html: round.instructions }}
  dangerouslySetInnerHTML={{ __html: round.expectedOutputs }}
  dangerouslySetInnerHTML={{ __html: task.instructions }}
  dangerouslySetInnerHTML={{ __html: task.expectedOutputs }}
```

Content is sourced from CMS APIs and internal data stores without HTML sanitization before rendering. A compromised CMS editor account, an injected DB record, or an SSRF-exploited CMS write can deliver `<script>` tags or `<img onerror=...>` payloads to all readers of that content. The CTM candidate-task path is particularly severe because task `instructions` and `expectedOutputs` are written by employers and displayed to all candidates.

**Fix:** Add `isomorphic-dompurify` at every `dangerouslySetInnerHTML` call site with a strict config:
```tsx
import DOMPurify from 'isomorphic-dompurify';
const SAFE_CONFIG = { ALLOWED_TAGS: ['p','b','i','em','strong','ul','ol','li','a','br','h2','h3','code','pre'], ALLOWED_ATTR: ['href'] };
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.body, SAFE_CONFIG) }} />
```
For JSON-LD `<script>` uses, `JSON.stringify(data)` is safe because React will not interpret it as HTML inside a `<script type="application/ld+json">`.

---

### C-04 — HS256 Fallback Silently Activates When `JWT_PUBLIC_KEY` Is Absent

**Evidence:**
```
Backend/packages/auth-node/index.js:106-112
  const hs256FallbackDefault = env !== 'production';
  const allowHs256Fallback =
    opts.allowHs256Fallback != null
      ? opts.allowHs256Fallback
      : (process.env.JWT_ALLOW_HS256_FALLBACK
          ? process.env.JWT_ALLOW_HS256_FALLBACK === 'true'
          : hs256FallbackDefault);

Backend/packages/auth-node/index.js:161
  const hs256Allowed = () => !canVerifyRs256 || allowHs256Fallback;

Backend/packages/auth-node/index.js:267
  if (hs256Allowed() && (!header.alg || header.alg === 'HS256')) {
    return normalize(jwt.verify(token, accessSecret, { algorithms: ['HS256'] }));
  }
```

If a service starts without `JWT_PUBLIC_KEY` in its environment (e.g., a misconfigured deployment), `canVerifyRs256` is `false`, which makes `hs256Allowed()` return `true`. The service will then accept HS256-signed tokens using the shared `accessSecret`. In production (`env !== 'production'` is checked), the default is `false` — but this relies entirely on `NODE_ENV=production` being set. If `NODE_ENV` is absent or wrong, any service silently accepts HS256. The `requireRs256InProduction` flag is `false` by default and is not consistently set by all service adapters.

**Fix:** Set `requireRs256InProduction: true` in every service's `jwtserver.js` adapter, OR require `JWT_PUBLIC_KEY` via `requireEnv` at startup. The `allowHs256Fallback` default should be changed to `false` unconditionally and migration services should explicitly opt in.

---

### H-01 — SSRF in `auditExportService` SIEM Webhook

**Evidence:**
```
Backend/services/infrastructure/proxy-service/service/auditExportService.js:68
  await fetch(cfg.url, {
    method: 'POST',
    headers: { Authorization: `Splunk ${cfg.token}`, ... },
    body: ...
  });

Backend/services/infrastructure/proxy-service/service/auditExportService.js:80
  await fetch(cfg.url, { method: 'POST', ... });
```

`cfg.url` comes from the encrypted `sink_config` stored by an admin. The `deliver()` function uses the URL directly with no SSRF guard (no allowlist, no DNS resolution check). The notification-service and ctm-service do correctly implement `assertSafeUrl` (from `utils/safeUrl.js`), but audit-export does not.

An admin with access to SIEM configuration can point the sink at `http://169.254.169.254/latest/meta-data` (AWS IMDS) or internal cluster services and retrieve sensitive data in the HTTP response or logs.

**Fix:** Import and apply `assertSafeUrl` before every `fetch(cfg.url, ...)` call in `auditExportService.deliver()`. For Splunk HEC, maintain an allowlist of known Splunk cloud endpoints.

---

### H-02 — Admin Webhook SSRF: `isHttpUrl` Allows Private Network URLs

**Evidence:**
```
Backend/services/platform/admin-service/service/developerService.js:176-181
  function isHttpUrl(value) {
    try {
      const u = new URL(String(value));
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch { return false; }
  }
```

`isHttpUrl` validates only the URL scheme; it does not block `http://localhost:3055`, `http://10.0.0.1`, `http://169.254.169.254`, or any RFC-1918/loopback address. When the delivery worker calls the webhook URL, it will reach any internal service. The comment in `testWebhook()` (line 427) states the admin-service itself does not make outbound calls and defers to the delivery worker, but the delivery worker then fires at the stored URL without further guards.

**Fix:** Replace `isHttpUrl` with `assertSafeUrl` from `notification-service/utils/safeUrl.js` (or the equivalent from `developer-service/utils/safeUrl.js`). Import the shared guard and run it both at creation time and in the delivery worker.

---

### H-03 — No Per-Login Rate Limiting on Auth Gateway

**Evidence:**
```
Backend/services/identity/auth-gateway/index.js:64
  app.use(rateLimit({ windowMs: 60_000, max: 1000, ... }));

Backend/services/identity/auth-gateway/routes/auth.js:51
  router.post('/login', async (req, res) => { ... });
```

The global rate limiter allows 1000 requests per minute per IP. There is no separate, tighter limiter on `/auth/login`. The `auth-service` itself has a Redis-backed per-user sliding-window limiter (`rateLimiter.js` + `redis.js:68` `LOGIN_WINDOW: 15*60`), but this only activates **after** the gateway proxies the request. A distributed credential-stuffing attack using many IPs can test ~16 passwords/second per IP before hitting any limit.

**Fix:** Add a dedicated login rate limiter at the gateway:
```js
const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,  // 15 min
  max: 10,                // 10 attempts per IP per 15 min
  keyGenerator: (req) => `${req.ip}:${req.body?.email || ''}`,
  message: { error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many login attempts' } },
});
router.post('/login', loginLimiter, async (req, res) => { ... });
```

---

### H-04 — S3/MinIO `SECRET_KEY` Defaults to `baalvion_dev_pass`

**Evidence:**
```
Backend/services/commerce/commerce-service/utils/s3Client.js:21
  const SECRET = process.env.S3_SECRET_KEY || 'baalvion_dev_pass';

Backend/services/knowledge/law-service/service/storage.js:15
  const SECRET_KEY = process.env.MINIO_SECRET_KEY || 'baalvion_dev_pass';
```

No fail-fast guard exists in either file. If `S3_SECRET_KEY` / `MINIO_SECRET_KEY` is not set in production, the object store credential defaults to the same well-known string used throughout the codebase. An attacker who has network access to the MinIO endpoint can authenticate and access all stored files (product media, legal documents).

**Fix:** Use `requireEnv('S3_SECRET_KEY')` from `@baalvion/auth-node` or add an equivalent startup check that throws in non-development environments.

---

### H-05 — CMS AES Vault Key Defaults to Known Dev String

**Evidence:**
```
Backend/services/knowledge/cms-service/utils/secretCrypto.js:19
  process.env.CMS_SECRETS_KEY ||
  process.env.INTERNAL_SECRETS_KEY ||
  'baalvion-cms-dev-secret-key-change-me';
```

Although `appConfig.js:82-84` throws if `CMS_SECRETS_KEY` is missing in non-development environments, `secretCrypto.js:getKey()` is called independently and silently falls back. Any code path that calls `secretCrypto` without triggering `appConfig` first (e.g., a script, a CLI import) will use the well-known dev key. All tenant payment credentials in the vault would then be decryptable using the known key.

**Fix:** Move the key-existence check into `getKey()` itself:
```js
function getKey() {
  const raw = process.env.CMS_SECRETS_KEY || process.env.INTERNAL_SECRETS_KEY;
  if (!raw && process.env.NODE_ENV !== 'development') {
    throw new Error('[secretCrypto] CMS_SECRETS_KEY must be set in production');
  }
  return crypto.createHash('sha256').update(String(raw || 'baalvion-cms-dev-secret-key-change-me')).digest();
}
```

---

### H-06 — trade-service Rate Limiting Is Optional and Silent No-Op

**Evidence:**
```
Backend/services/commerce/trade-service/middleware/rateLimit.js:7
  try { expressRateLimit = require('express-rate-limit'); } catch { /* falls back below */ }

Backend/services/commerce/trade-service/middleware/rateLimit.js:31-33
  console.warn('[rateLimit] express-rate-limit not installed; rate limiting is DISABLED.');
  return (_req, _res, next) => next();
```

`express-rate-limit` is listed in package.json for the service (based on finding it in audit output), but the dynamic require pattern means a missing package at runtime silently disables all rate limiting. Trade endpoints handle sensitive financial data (deals, letters of credit, compliance cases). A node_modules build failure or incomplete `pnpm install` would expose the trade API to unbounded requests.

**Fix:** Move `express-rate-limit` to a hard `require` at module top level (not inside try/catch). If the package is missing the service should fail to start, not silently disable security controls.

---

### H-07 — Stored XSS via CTM Task Instructions (Employer-Controlled)

**Evidence:**
```
Frontend/controlthemarket-main/src/app/(app)/candidate/tasks/[id]/page.tsx:142
  dangerouslySetInnerHTML={{ __html: round.instructions }}
Backend/services/ecosystem/ctm-service (employer sets task data)
```

Unlike the CMS content (C-03), task instructions are set by **employers** who are external, potentially adversarial parties. This is a direct stored XSS surface — an employer submits `<script>alert(document.cookie)</script>` as a task instruction; every candidate who views the task executes it.

**Fix:** Same as C-03: apply DOMPurify sanitization before rendering.

---

## MEDIUM Findings

### M-01 — No CSRF Protection on admin-service or order-service Direct Endpoints

The auth-gateway BFF applies double-submit CSRF (`requireCsrf`) on all proxied `POST/PUT/PATCH/DELETE` requests. However, `admin-service` and `order-service` expose their own HTTP ports and use Bearer-token or cookie auth. If any frontend component calls these services directly (bypassing the BFF), there is no CSRF protection. Audit found no CSRF middleware in these services. Risk is MEDIUM because both services expect authorization headers, which browsers do not send cross-origin by default; however, this gap should be explicitly closed.

**Fix:** Either ensure all mutating traffic goes exclusively through the BFF, or add a CSRF middleware to each service's public-facing router.

### M-02 — `realtime-service` DB Password Fallback in Application Code

```
Backend/services/platform/realtime-service/index.js:64
  password: process.env.DB_PASSWORD || 'baalvion_dev_pass',
```

This is the `platform` realtime-service (not the `infrastructure` one). DB password defaults to the well-known string in source code. **Fix:** Use `requireEnv` or throw in production.

### M-03 — IP Spoofing via `trust proxy: 1` Without Upstream Validation

14+ services blindly trust `X-Forwarded-For`. Without a strict allowlist of trusted proxy IPs (e.g., only the load balancer), attackers can forge their source IP to bypass IP-based rate limiting. **Fix:** Set `app.set('trust proxy', '<load-balancer-cidr>')` instead of `1`.

### M-04 — Error Handler Logs `err.stack` to console (ledger-service)

`ledger-service/middleware/errorMiddleware.js:10-12` logs the full stack trace to `console.error` unconditionally. In production environments that ship console logs to aggregation platforms, this may expose internal file paths, Sequelize SQL query fragments, and column names. **Fix:** Use a structured logger (pino/winston) that redacts stacks in production.

### M-05 — `DEMO_PASSWORD` in Exported `platformStore.js` Module

`DEMO_PASSWORD: 'Baalvion123!'` is exported as a module constant. This value appears in 3 committed files including the Postman collection. If any dev-seed pathway runs in production (e.g., by mistake on first deployment), the platform admin account will have a known password. **Fix:** Remove the export; use a one-way hash check. Ensure `ensureSeed()` is guarded by `NODE_ENV === 'development'`.

---

## LOW Findings

### L-01 — Postman Collection Commits Demo Password
`Baalvion-API.postman_collection.json` lines 139 and 419 contain `Baalvion123!`. Anyone with repo access has this credential. Rotate and remove from VCS if not already rotated.

### L-02 — JWT Audience/Issuer Validation Is Optional
`auth-node/index.js:104-105` sets `verifyIssuer` and `verifyAudience` to `null` if env vars are unset. A token from a different issuer is accepted silently. **Fix:** Make `JWT_ISSUER` and `JWT_AUDIENCE` required via `requireEnv` in each service's JWT config, or set defaults that are always verified.

### L-03 — Commerce Storefront Routes Use Unrestricted `cors()`
`commerce-service/index.js:27` mounts storefront routes with `cors()` (allows all origins). This is documented intent (public read-only). Acceptable, but should be noted in security review as it prevents cookies from being sent cross-origin only by virtue of having no `credentials: true`.

---

## Prioritized Remediation Plan

### Phase 1 — Before Any Production Traffic (Block)

| Priority | Finding | Effort |
|----------|---------|--------|
| 1 | **C-01** — Add fail-fast for `INTERNAL_SERVICE_SECRET` in `proxy-service/routes/billingRoutes.js` and `insiders-service/routes/billingRoutes.js` | 30 min |
| 2 | **C-02** — Replace `db.Model.create(req.body)` with field allowlists in all 6 trade-service controllers | 4 h |
| 3 | **C-03 + H-07** — Install `isomorphic-dompurify` and wrap all `dangerouslySetInnerHTML` calls that render non-static content | 2 h |
| 4 | **C-04** — Set `requireRs256InProduction: true` in every service adapter; add `requireEnv('JWT_PUBLIC_KEY')` at startup | 2 h |
| 5 | **H-01** — Add `assertSafeUrl` to `auditExportService.deliver()` | 1 h |
| 6 | **H-02** — Replace `isHttpUrl` with `assertSafeUrl` in `developerService.js` (creation + delivery worker) | 1 h |
| 7 | **H-04** — Add fail-fast for `S3_SECRET_KEY` / `MINIO_SECRET_KEY` in both services | 30 min |
| 8 | **M-05** — Guard `ensureSeed()` with `NODE_ENV === 'development'` check and remove `DEMO_PASSWORD` export | 1 h |

### Phase 2 — Before Public Launch (High)

| Priority | Finding | Effort |
|----------|---------|--------|
| 9  | **H-03** — Add per-email + per-IP login rate limiter to auth-gateway `/auth/login` | 1 h |
| 10 | **H-05** — Move key-existence check into `secretCrypto.getKey()` | 30 min |
| 11 | **H-06** — Harden `rateLimit.js` in trade-service to fail at startup if package missing | 30 min |
| 12 | **M-02** — Fix realtime-service `DB_PASSWORD` fallback | 15 min |
| 13 | **L-01** — Rotate `Baalvion123!` credentials; remove from Postman collection | 1 h |

### Phase 3 — Ongoing Hardening (Medium/Low)

| Priority | Finding | Effort |
|----------|---------|--------|
| 14 | **M-01** — Add CSRF middleware to admin-service and order-service, or enforce BFF-only traffic via network policy | 2 h |
| 15 | **M-03** — Restrict `trust proxy` to specific proxy CIDRs | 1 h |
| 16 | **M-04** — Replace `console.error` in ledger-service error handler with pino/structured logger; gate stack exposure | 30 min |
| 17 | **L-02** — Require `JWT_ISSUER` / `JWT_AUDIENCE` via `requireEnv` in all service auth configs | 2 h |
| 18 | **L-03** — Document storefront CORS policy; confirm no state-changing operations are exposed | Trivial |

---

## Audit Coverage Notes

- **Not audited** (out of scope or time): Java financial-services-java suite (requires Maven runtime), Kubernetes/Helm manifests, CI/CD pipeline secrets, Redis ACL configuration, DB user privilege scope (RLS adoption per-service), OAuth service flows, insiders-service auth beyond billing.
- **npm audit:** Root monorepo: 0 high/critical. `trade-service`: 3 high (tar via bcrypt via @mapbox/node-pre-gyp — update bcrypt to >=5.1.1 which pins a safe tar version). `auth-service`: 0. `payment-service`: 0.
- **RLS/tenancy:** `@baalvion/tenancy` package exists with correct per-tenant isolation. Adoption per-service was not fully verified; this should be audited per-domain before GA.

---

*Report generated by security-reviewer agent. All findings are evidence-based with direct file:line citations. CONFIRMED = code evidence seen; SUSPECTED = structural inference.*
