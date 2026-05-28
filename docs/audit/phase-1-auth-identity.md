# PHASE 1 — AUTHENTICATION & IDENTITY AUDIT — BAALVION ECOSYSTEM

> Generated audit (read-only mapping). No code was modified.
> Evidence tags: **[V]** verified directly from code · **[S]** surveyed / high confidence (representative sample read) · **[U]** uncertain / not runtime-verified.

> **Headline finding:** There is **no single identity system**. There are **at least 5 distinct, mutually-incompatible auth paradigms** running concurrently (custom RS256 `auth-service`, Keycloak, Firebase, Supabase-compat shims, and per-service local HS256 islands), plus mock/stub auth in production code paths. The documented "one platform scheme" (`.env.example`, `catalog/CONTRACT.md`) describes an *intended* unification that the code does **not** implement.

---

## 1. SYSTEM INVENTORY

### Frontends (15) — `Frontend/`

| # | App | Framework | Auth paradigm | Token storage | Status |
|---|-----|-----------|---------------|---------------|--------|
| 1 | AmariseMaisonAvenue-main | Next 15.5.9 / React 19 (firebase dep) | None in-app; reads bearer | cookie or localStorage `authToken` | **No login page** — public storefront [V] |
| 2 | Baalvion-Jobs-Portal-main | Next 14.2.35 / React 18 | **Keycloak** (password grant) + mock/server toggle | localStorage `baalvion_jobs_refresh_token` + access | Real, cleanest [V] |
| 3 | For Invstors and Founders | React 18 / Vite | **Supabase-compat shim** → insiders-service | localStorage `insiders.session` | Real (custom backend) [V] |
| 4 | Global-Trade-Infrastructure-main | Next 15.0.3 / React 18 (firebase dep) | **STUB** "Keycloak/OIDC" | n/a | `auth-gateway.ts` returns hardcoded session; `validateIdentity()` always `true` [V] |
| 5 | IR-Baalvion-main | Next 15.5.9 / React 19 (firebase dep) | REST `auth-client.ts` → ir-service | [S] | [S] |
| 6 | Imperialpedia-main | Next 15.5.9 / React 19 (firebase dep) | `AuthFlowMock.tsx` (showcase mock) + `auth-client.ts` | [S] | Mock present [V] |
| 7 | Law-Elite-Network-main | Next 15.1.11 / React 19 | REST `/auth/login` (ex-Firebase) | localStorage `baalvion_law_token` | Real [V] |
| 8 | Mining.Baalvion-main | Next 15.5.9 / React 19 (firebase dep) | None | n/a | **No auth files** — public [V] |
| 9 | Proxy-BaalvionStack | React 18 / Vite | Custom `authClient.ts` → proxy-service | [S] `session-state.ts` | [S] |
| 10 | about-baalvion-main | Next 15.5.9 / React 19 (firebase dep) | None | n/a | **No auth files** — public [V] |
| 11 | admin-platform | Next 15.3.2 / React 19 | Identity admin console → auth/oauth/session services | `authStore` [S] | Real (admin UI) [S] |
| 12 | baalvion-elite-circle-main | React 18 / Vite | **Supabase-compat shim** → elite-circle-service (twin of #3) | localStorage (supabase-style) | Real [V] |
| 13 | brand-connector-main | Next 15.5.9 / React 19 | **CONFLICTED**: Firebase + JWT exchange + dev mock + Keycloak shim | `brandTokenStore` + cookies | Mid-migration, incoherent [V] |
| 14 | company-unified-Dashboard-main | Next 15.5.9 / React 19 (firebase dep) | REST → proxy-backend | `tokenStore` | Real [V] |
| 15 | controlthemarket-main | Next 15.5.9 / React 19 (firebase dep) | `auth-context.tsx` → ctm-service | [S] | [S] |

> `firebase` is a dependency in 8 Next apps, but most do **not** use Firebase Auth — leftover from a "Firebase Studio"-style template. Only **brand-connector** calls `firebase/auth` at runtime. **No frontend imports `@baalvion/auth-sdk`** — every app rolled its own client. [V]

### Backends — `Backend/`

**Shared packages** (`packages/`):
- `@baalvion/auth-node` (`index.js`) — canonical JWT lib (`createAuthServer`, `createJwksVerifier`). The **only** module *meant* to import `jsonwebtoken` (catalog rule C3). [V]
- `@baalvion/auth-sdk` — frontend client + `tokenStorage` (localStorage `baalvion_tokens`). **Unused by any frontend.** [V]
- `@baalvion/rbac` — 7-tier role hierarchy + permission guards. **Used only by `@baalvion/service-kit`.** [V]
- `@baalvion/middleware` — `createAuthMiddleware` (RS256, JTI blacklist), CSRF, rate-limit, HMAC service auth. **Almost no service imports it.** [V]

**Identity domain** (`services/identity/`): `auth-service` (central RS256 issuer), `oauth-service` (real OAuth2/OIDC + PKCE), `session-service` (RS256 verify). [V]

**NestJS platform** (`platform/baalvion-os/`): real **Keycloak** verifier (`passport-jwt` + `jwks-rsa`, RS256/JWKS). Target backend for Jobs-Portal & brand-connector. [V]

**~20 domain services** each with local `middleware/authMiddleware.js` + `utils/jwtserver.js` (auth-node adapter): commerce {commerce, fulfillment, inventory, market, order, trade}, ecosystem {about, brand-connector, ctm, elite-circle, insiders, ir, jobs, law-elite, mining, real-estate}, infrastructure {notification, proxy, realtime}, knowledge {cms, imperialpedia, law}, platform {admin, dashboard}. [V/S]

**Infra**: `docker/keycloak/realm-baalvion.json`, Go `gateway/`, `docker-compose.yml`, PostgreSQL/Redis/MinIO. [V]

---

## 2. FRONTEND AUTH MAP

**Pattern families:**

**(a) Custom-backend REST (auth-service family)** — Law-Elite [V], company-unified-Dashboard [V], admin-platform [S], IR/CTM [S].
- Law-Elite: `src/lib/firebase/auth.ts` → `apiClient.post('/auth/login')`, `/auth/register`, `/auth/logout`; `accessToken` in `localStorage['baalvion_law_token']`; vestigial `auth` stub for legacy compile.
- company-unified-Dashboard: `src/lib/auth.ts` + `api-client.ts` `tokenStore`; roles `ADMIN/INVESTOR/CO_FOUNDER/EMPLOYEE`; `hasRole()` = **exact frontend-only match**.

**(b) Keycloak (real)** — Baalvion-Jobs-Portal [V].
- `src/lib/keycloak.ts`: `kcLogin()` = OIDC **Direct Access Grant** (`grant_type=password`) to `…/realms/baalvion/protocol/openid-connect/token`, client `baalvion-web`; `kcRefresh`, `kcLogout`. Roles from `realm_access.roles`.
- `src/services/adapters/server/auth.server.ts`: stores access+refresh via `setTokens`; refresh in `localStorage['baalvion_jobs_refresh_token']`; `checkSession()` → baalvion-os `/users/me`.
- Parallel `auth.mock.ts` adapter (mock/server switch).

**(c) Supabase-compat shim → custom backend** — For Invstors [V] & baalvion-elite-circle [V] (byte-twins).
- `src/integrations/supabase/client.ts` reproduces `supabase-js` surface but POSTs to `…/ecosystem/insiders/v1` (or elite). Session in `localStorage['insiders.session']` = `{access_token, refresh_token, user{roles[]}}`; refresh via `/auth/refresh`. **Not real Supabase.**
- Pages: `pages/Auth.tsx`, `AuthCallback.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `useAuth.tsx`, `ProtectedRoute.tsx`.

**(d) Firebase (real) + JWT exchange + dev-mock — brand-connector [V] (incoherent):**
- `src/contexts/AuthContext.tsx`: prod = `firebase/auth` → `fetchBackendJwt(firebaseToken)` POST `${AUTH_URL}/login` `{firebaseToken}` → `brandTokenStore`; cookies via `auth-cookies`.
- dev = `signInAs(role)` writes `localStorage['mock_role']`, hardcoded mock profiles (`admin_root`, `brand_user_1`, `creator_user_1`).
- `src/lib/fb-compat/auth.ts`: contradicts the above — all auth fns throw "Authentication is handled by Baalvion ID (Keycloak)".
- `src/lib/baalvion.ts`: axios client expects a Keycloak bearer (`setAccessToken`) — **no caller sets it** in the Firebase path.
- Roles: `ADMIN/BRAND/CREATOR`.

**(e) Stub/fake — Global-Trade [V], Imperialpedia mock [V]:**
- `Global-Trade/src/services/identity/auth-gateway.ts`: `authorizeSession()` returns hardcoded `{actorId:'USR-ALEX-101', role:'EXECUTIVE_COMMANDER', token:'eyJ...', authLevel:4}`; `validateIdentity()` returns `true` unconditionally.
- `Imperialpedia/src/app/admin/control/security-showcase/AuthFlowMock.tsx`.

**(f) No auth** — Amarise, Mining, about-baalvion (public; `firebase` dep unused for auth). [V]

**Login/signup page → backend mapping:**

| App | Login page | Endpoint | Backend |
|-----|-----------|----------|---------|
| Jobs-Portal | `modules/auth/services/auth.api.ts` → `kcLogin` | `…/realms/baalvion/…/token` | Keycloak → baalvion-os |
| Law-Elite | `lib/firebase/auth.ts` | `POST /auth/login` | law-service / auth-service [U] |
| For Invstors / Elite-Circle | `pages/Auth.tsx` | `POST /auth/login`,`/auth/refresh` | insiders / elite-circle-service |
| brand-connector | `app/auth/.../page.tsx` + `AuthContext` | Firebase → `POST {AUTH_URL}/login {firebaseToken}` | brand-connector-service [U] |
| company-Dashboard | `lib/auth.ts` | proxy-backend `/auth/*` | proxy-service [S] |
| admin-platform | `lib/api/auth.ts` | `/auth/*`, `/oauth/clients`, `/sessions` | auth/oauth/session services [S] |

---

## 3. BACKEND AUTH MAP

### 3.1 Central identity — `services/identity/auth-service` [V]
- **Issuer of record.** `utils/jwtRsa.js` signs **RS256** access tokens via direct `jsonwebtoken`; claims = `{jti, sub, email, org_id, role, permissions, sid}`; `iss/aud` from config; `kid` from `config/vault.js`. Refresh = RS256 `{jti, sub, sid, family_id}`.
- `service/authService.js`: register / login / refresh (rotation + reuse-detection + family revoke) / logout (Redis JTI blacklist) / MFA (TOTP) / email-verify / password-reset / invites / orgs / sessions / audit.
- Password hashing: `utils/password.js` = **argon2id** (fallback bcrypt rounds 12), auto-detect on verify.
- `middleware/authMiddleware.js` verifies via `jwtRsa` (RS256), Redis blacklist, `req.auth = {userId:sub, orgId:org_id, sessionId:sid, role, permissions, jti}`.
- **Dead code:** `utils/jwtserver.js` (auth-node, `claimStyle:'id'`, HS256, `disableRs256`) exists and claims to be the canonical delegation, but `authService.js` imports `jwtRsa`, **not** `jwtserver`. The "delegates to canonical authority" comment is **false** for the real path.
- Routes (`routes/authRoutes.js`): `POST /register|/login|/refresh|/logout|/forgot-password|/reset-password|/verify-token|/accept-invite`, `GET /verify-email|/validate-invite|/me|/sessions|/audit-logs`, `PATCH /me`, `DELETE /sessions[/:id]`, MFA `/mfa/challenge|/enable|/verify|/disable`.

### 3.2 OAuth/OIDC — `services/identity/oauth-service` [V]
- Real **OAuth2 Authorization-Code + PKCE (S256)** server. `service/oauthService.js`: `createAuthorizationCode`, `exchangeCodeForTokens` (single-use code, redirect/client/PKCE checks), `issueTokens`. Codes in `auth.oauth_authorization_codes`. Signs via `utils/keys.js` (direct `jsonwebtoken`).

### 3.3 Session — `services/identity/session-service` [V]
- `utils/jwtVerify.js`: RS256-only (`allowHs256Fallback:false`) via auth-node, key from `config.jwt.publicKey*`.

### 3.4 Domain services — adapter pattern (~20) [V on order/elite/notification; S on rest]
- `utils/jwtserver.js` = `createAuthServer({ accessSecret, env })` exporting `verifyAccessToken` only (verify-only, no issuance).
- `middleware/authMiddleware.js` extracts claims. **Two camps:**
  - **Mismatched** (read `id`/`orgId`/`sessionId`): `order-service` [V] and commerce/ecosystem/knowledge jwtserver-adapter services [S]. E.g. `order-service`: `req.auth = {userId: decoded.id, orgId: decoded.orgId, sessionId: decoded.sessionId, …}`.
  - **Correct** (read `sub`/`org_id`): `notification-service` [V] (`userId=decoded.sub`, `orgId=decoded.org_id`), `@baalvion/middleware`, `auth-service`, `admin-service`.
- `requireRole`: **exact-match** `roles.includes(req.auth.role)` (order-service) or array `req.auth.roles.some(...)` (elite-circle) — **not** the `@baalvion/rbac` hierarchy.

### 3.5 Independent local-auth islands (own users table + bcrypt + own token issuance) [V]
- **trade-service** (`controller/authController.js`): bcrypt **rounds 10**; own register/login/MFA/refresh; issues `signAccessToken({id,email,role,tenantId,orgCode})` = auth-node **raw HS256 passthrough**; refresh in **httpOnly cookie** `refresh_token`; roles `admin/operator/client`.
- **proxy-service** (`utils/jwtserver.js`): a **second full RS256/JWKS issuer** — `claimStyle:'sub'`, `normalizeClaims`, `keysDir`, `getJwks`, `requireRs256InProduction:true`. Emits `{sub, organizationId, sessionId}` (note `organizationId`, **not** `org_id`). Own bcrypt login.
- **elite-circle-service / insiders-service**: own `controller/authController.js` (bcrypt) + Supabase-compat `queryController.js` per-table POLICIES engine (read/write: public/auth/owner/admin, `mod`, `adminWrite`).
- **law-service** (`controller/authController.js`, bcrypt); plus **law-elite/gateway** `auth.middleware.js` = direct `jsonwebtoken` HS256, `JWT_SECRET` required, no algorithm pinning, self-declared "ISOLATED sub-system (own identity)".
- **admin-service** (`service/adminService.js`): directly **mints RS256 impersonation tokens** with `jsonwebtoken` — `{sub, role, permissions:[], sid: impersonationId, impersonated_by: adminUserId, jti}`, key read from fs.

---

## 4. JWT FLOW MAP

### Issuers & formats

| Issuer | Lib | Alg | Subject | Org claim | Session claim | iss / aud |
|--------|-----|-----|---------|-----------|---------------|-----------|
| auth-service `jwtRsa.js` | direct jwt | **RS256** | `sub` | `org_id` | `sid` | configured |
| admin-service (impersonation) | direct jwt | RS256 | `sub` | (none) | `sid` | configured |
| oauth-service `keys.js` | direct jwt | RS256 [S] | `sub` | `org_id` [U] | — | configured |
| proxy-service (auth-node) | auth-node | RS256+JWKS / HS256 fb | `sub` | **`organizationId`** | **`sessionId`** | `baalvion-auth`/`baalvion-platform` |
| trade-service (auth-node raw) | auth-node `signAccessToken` | **HS256** | `id` | — (`tenantId`) | — | none |
| elite/insiders/law (local) | bcrypt+jwt | HS256 [S] | varies | varies | varies | varies |
| Keycloak realm `baalvion` | Keycloak | RS256/JWKS | `sub` | (none) | — | `…/realms/baalvion` |
| auth-service `jwtserver.js` (**dead**) | auth-node `claimStyle:'id'` | HS256 | `id` | `orgId` | `sessionId` | optional |

### Verification compatibility matrix (Frontend → Backend → issuer → verify)

| Frontend | Backend it calls | Token issuer | Verify method | Compatible? |
|----------|------------------|--------------|---------------|-------------|
| Jobs-Portal | baalvion-os (NestJS) | **Keycloak** | passport-jwt + jwks-rsa RS256 | ✅ [V] |
| For Invstors / Elite-Circle | insiders/elite-circle-service | local authController | local jwtserver (HS256) | ✅ self-contained [V] |
| Law-Elite | law-service / auth-service | local or auth-service | local authMiddleware | ⚠️ depends on target [U] |
| company-Dashboard / Proxy-Stack | proxy-service | proxy-service RS256 | proxy jwtserver | ✅ self-contained [V] |
| brand-connector | brand-connector-service | Firebase→exchanged JWT [U] | jwtserver adapter | ⚠️ unverified exchange [U] |
| Amarise | commerce/order/inventory | **unknown issuer** (`authToken`) | order-svc reads `id/orgId/sessionId` | ⚠️ no matching issuer found [U] |
| admin-platform | auth/oauth/session | auth-service RS256 | RS256 (correct claims) | ✅ [S] |

**Cross-service incompatibilities (structural, [V]):**
1. **auth-service (`org_id`/`sid`) vs proxy-service (`organizationId`/`sessionId`)** — two RS256 issuers, **same `iss=baalvion-auth`/`aud=baalvion-platform`**, different org/session claim names. A token from one populates the other's fields as `undefined`.
2. **Issuer `sub` vs consumer `id`** — auth-service emits `sub`; ~18 jwtserver-adapter services read `decoded.id` → `userId` resolves **`undefined`** (and `orgId`/`sessionId` undefined) → **tenant isolation silently lost** if central tokens reach them. Whether central tokens actually flow there is **[U]**.
3. **HS256 vs RS256**: trade/law-elite/elite/insiders issue HS256; auth-service/proxy issue RS256. Root `.env.example` sets `JWT_PUBLIC_KEY` + `JWT_ALLOW_HS256_FALLBACK=false`; if applied, HS256-issuing services **cannot verify their own tokens**. **[U]** (per-service `.env` may diverge).

### Expiry / refresh / revocation
- Access TTL: 15m (auth-service, Keycloak `accessTokenLifespan:900`); refresh 7d. [V]
- Refresh rotation + reuse-detection (family revoke): auth-service [V], trade-service [V], proxy-service [S].
- Revocation: Redis JTI blacklist on logout (auth-service, `@baalvion/middleware`) [V]. No global cross-service blacklist. [V]
- Keys: dev keypair via `scripts/gen-dev-jwt-keys.mjs` → `docker/secrets/*.pem` (gitignored); prod expects Vault/external-secrets. [V]

---

## 5. ROLE / RBAC MAP

**Every system has its own role vocabulary — no shared definition.** [V]

| System | Roles | Where defined | Enforcement |
|--------|-------|---------------|-------------|
| `@baalvion/rbac` (canonical, mostly unused) | viewer<member<editor<manager<admin<owner<super_admin | `packages/rbac/src/index.ts` | hierarchy + permission strings |
| auth-service | member (default), owner (on register); perms = `Object.keys(service_roles)` | `service/authService.js` | local `requireRole` exact-match |
| Keycloak realm | admin, recruiter, creator, brand, lawyer, client | `realm-baalvion.json` | baalvion-os RolesGuard (`realm_access`+`resource_access`) |
| Jobs-Portal `KNOWN_ROLES` | admin, recruiter, **interviewer, finance, candidate**, client, creator, brand, lawyer | `lib/keycloak.ts` | frontend derivation (superset of realm — drift) |
| trade-service | admin, operator, client | `authController.js` | exact-match |
| company-Dashboard | ADMIN, INVESTOR, CO_FOUNDER, EMPLOYEE | `lib/auth.ts` | **frontend-only** `hasRole` |
| brand-connector | ADMIN, BRAND, CREATOR | `AuthContext.tsx` | frontend mock + cookies |
| Global-Trade | EXECUTIVE_COMMANDER, `authLevel` 1-4 | `auth-gateway.ts` (stub) | none (always allow) |
| elite/insiders | admin, moderator(`mod`), owner, auth | `queryController.js` POLICIES | per-table backend engine [V] |

**Group classification:**
- *Platform/global:* `super_admin` (rbac), `admin` (Keycloak/most).
- *App-specific:* recruiter/interviewer/finance (jobs), creator/brand (brand-connector), lawyer (law), operator (trade), investor/co_founder (dashboard).
- *Admin:* `admin`/`super_admin`/`ADMIN`/`EXECUTIVE_COMMANDER` (4 spellings).
- *Org/team:* `owner`/`member` (auth-service org membership; `org_id` scoping).

**RBAC risks [V]:**
- Two `requireRole` semantics: `@baalvion/rbac` (hierarchy — `super_admin` passes everything) vs local services (exact-match — `super_admin` **fails** `requireRole('admin')`).
- `role` (scalar) vs `roles[]` (array) shape mismatch between services.
- Frontend-only enforcement (company-Dashboard, brand-connector, Global-Trade).
- Default-on-missing `role: decoded.role || 'viewer'` (safe-low) in order/auth services.

---

## 6. KEYCLOAK INTEGRATION STATUS

**Realm** `docker/keycloak/realm-baalvion.json` [V]:
- `sslRequired: "none"`, `registrationAllowed: true`, `accessTokenLifespan: 900`.
- Realm roles: admin, recruiter, creator, brand, lawyer, client.
- Clients:
  - `baalvion-os` — confidential, `secret: "dev-only-change-me"` (**hardcoded**), `serviceAccountsEnabled`, `directAccessGrantsEnabled`, `redirectUris:["*"]`, `webOrigins:["*"]`.
  - `baalvion-web` — public SPA, `directAccessGrantsEnabled:true` (password grant from browser), redirectUris `localhost:3030/3035/3026/9002`, `webOrigins:["+"]`.

**Real integrations [V]:**
- `Backend/platform/baalvion-os` (NestJS): `src/auth/jwt.strategy.ts` verifies Keycloak RS256 via JWKS (`jwks-rsa`), `issuer=KEYCLOAK_ISSUER`, roles from `realm_access`+`resource_access`. `roles.decorator.ts`, `jwt-auth.guard.ts`. ✅
- `Frontend/Baalvion-Jobs-Portal-main`: `lib/keycloak.ts` password grant → baalvion-os. ✅

**Claimed-but-not-real Keycloak [V]:**
- `brand-connector` `fb-compat/auth.ts` + `baalvion.ts` — runtime actually uses Firebase; KC never wired.
- `Global-Trade` `auth-gateway.ts` — stub, no OIDC call.

**Is Keycloak the central authority?** **No.** [V] Keycloak governs only baalvion-os↔Jobs-Portal (and aspirationally brand-connector). The custom RS256 `auth-service` + ~20 domain services + Supabase-shim apps + local-auth islands all **bypass Keycloak entirely**.

---

## 7. SECURITY FINDINGS

| Sev | Finding | Evidence |
|-----|---------|----------|
| **HIGH** | Hardcoded fallback JWT secrets in **every** service `appConfig.js` (`'replace-me'`, `'replace-with-strong-secret'`, `'replace-with-strong-access-secret'`). Unset `JWT_ACCESS_SECRET` → **well-known shared HS256 secrets** → token forgery / cross-service impersonation. [V] |
| **HIGH** | Keycloak client secret `"dev-only-change-me"` committed; `redirectUris:["*"]`, `webOrigins:["*"]`, `sslRequired:"none"`. [V] |
| **HIGH** | **Stub auth in production code**: Global-Trade `validateIdentity()` → `true`; `authorizeSession()` returns hardcoded admin session. [V] |
| **HIGH** | Two RS256 issuers (auth-service, proxy-service) share `iss/aud` but differ in claim names → identity/privilege confusion across trust boundary. [V] |
| **MED** | localStorage token storage in ~all SPAs → **XSS token theft**. [V] |
| **MED** | Keycloak **Direct Access Grant** on a **public** SPA client (`baalvion-web`) — password in browser, no PKCE/auth-code redirect. [V] |
| **MED** | Inconsistent password hashing: argon2id/bcrypt-12 (auth-service) vs **bcrypt-10** (trade-service) vs unspecified bcrypt (elite/insiders/law/proxy). [V] |
| **MED** | law-elite gateway `jwt.verify(token, secret)` with **no `algorithms` pin**. [V] |
| **MED** | brand-connector dev `signInAs()` mock + `mock_role` localStorage; `NODE_ENV`-guarded only. [V] |
| **MED** | Tenant isolation depends on `orgId`/`org_id` claim that resolves `undefined` in mismatched consumers (§4 #2). [V structural / U runtime] |
| **LOW** | `@baalvion/middleware` `createServiceAuthMiddleware` computes `bodyHash` with `createHmac('sha256','hash')` — literal `'hash'` key instead of secret (likely bug). [V] `packages/middleware/src/index.ts:180` |
| **LOW** | CSRF cookie `baalvion-csrf` set `httpOnly:false` — JS-readable, exposed to XSS. [V] |
| **LOW** | Built artifacts committed (`For Invstors/dist/assets/Auth-*.js`); stale untracked duplicate service trees on disk (§8 #6). [V] |
| **LOW** | `realtime-service`/`ctm-service` `accessSecret` defaults to empty string → fail-closed but masks misconfig. [V] |

---

## 8. DUPLICATE / CONFLICTING AUTH SYSTEMS

1. **5 paradigms concurrently** [V]: (a) custom RS256 auth-service, (b) Keycloak, (c) Firebase (brand-connector), (d) Supabase-compat shims (insiders/elite), (e) per-service local HS256 islands (trade, law-elite, etc.).
2. **Two RS256 issuers**, both `iss=baalvion-auth`: `auth-service` (`org_id`/`sid`) and `proxy-service` (`organizationId`/`sessionId`). [V]
3. **Three+ token issuers minting directly** (bypassing the "single home" C3 rule): auth-service `jwtRsa.js`, oauth-service `keys.js`, admin-service impersonation. [V]
4. **Dead/contradictory adapters**: auth-service `jwtserver.js` (unused) whose comment falsely claims to be the canonical path. [V]
5. **Canonical packages unused**: `@baalvion/auth-sdk` (no frontend imports), `@baalvion/middleware`/`@baalvion/rbac` (no JS service imports). Documentation-only layer. [V]
6. **Untracked stale duplicates**: `Backend/elite-circle-service`, `Backend/insiders-service`, `Backend/about-service` exist on disk with their own auth code but are **not git-tracked** (`git ls-files` → 0); tracked copies live under `Backend/services/...`. [V]
7. **Claim-name reader split**: notification-service reads `sub`/`org_id` (correct); order-service & peers read `id`/`orgId`/`sessionId` (legacy). [V]
8. **brand-connector internal triple-conflict**: Firebase vs Keycloak shim vs mock. [V]

---

## 9. CRITICAL RISKS (ranked)

1. **No unified identity / token interoperability** — a token from one subsystem is not verifiable / correctly interpreted by another. Cross-app SSO is impossible today. [V]
2. **Forgeable tokens via shared default secrets** if any service starts without `JWT_ACCESS_SECRET`. [V]
3. **Production stub auth** (Global-Trade always-authorize). [V]
4. **Silent tenant-isolation loss** where issuer `sub`/`org_id` meets consumer `id`/`orgId`. [V structural]
5. **Keycloak misconfig** (wildcards, committed secret, `sslRequired:none`, password grant on public client). [V]
6. **Two RS256 issuers with identical `iss/aud`** — token-confusion surface. [V]
7. **XSS → account takeover** via localStorage tokens across all SPAs. [V]

---

## 10. MISSING COMPONENTS

- A **single source of identity truth** actually used by all apps. [V]
- **Shared token contract** (one claim schema). [V]
- **Adoption of the canonical packages** that already exist but are unused. [V]
- **Central revocation/blacklist** spanning services. [V]
- **Unified RBAC model** + backend enforcement for frontend-only role checks. [V]
- **Real Keycloak wiring** for brand-connector and Global-Trade. [V]
- **Secrets hygiene** + per-service `.env` audit (only root `.env.example` reviewed). [U]
- **Confirmation** of which backend Amarise/IR/CTM/Imperialpedia authenticate against. [U]

---

## 11. RECOMMENDED UNIFIED TARGET ARCHITECTURE (direction only — not a redesign)

Two viable centers of gravity already half-built:
- **Keycloak + baalvion-os** (clean OIDC/JWKS, real RS256 verification), or
- **auth-service** (custom RS256 + OAuth2/PKCE via oauth-service + MFA + session-service + admin-platform console).

A unification phase should pick **one** as the single IdP, converge on **one RS256/JWKS token contract** (`sub`, `org_id`, `roles[]`, `permissions[]`, `sid`), make all services **verify via shared JWKS** (auth-node `createJwksVerifier` already supports this), retire the local HS256 islands and Firebase/Supabase-shim/stub auth, and adopt `@baalvion/rbac` + `@baalvion/middleware` + `@baalvion/auth-sdk`. *(Detailed design is Phase 2.)*

---

## 12. PRIORITIZED NEXT ACTIONS (audit follow-ups, not fixes)

1. **Decide the single IdP** (Keycloak vs auth-service) — blocks everything else.
2. **Verify per-service `.env`** for real secrets/keys and whether `JWT_PUBLIC_KEY`+`HS256_FALLBACK=false` is actually deployed (resolves §4 [U]s).
3. **Confirm runtime token flow** for mismatched consumers (do auth-service tokens reach order/commerce?).
4. **Inventory which backend each unverified frontend hits** (Amarise, IR, CTM, Imperialpedia, brand-connector exchange endpoint).
5. **Catalog all direct `jsonwebtoken` importers vs C3 allowlist** (`catalog/enforce.mjs`).
6. **Map the full role→permission matrix per app** to size RBAC unification.
7. **Flag stub/mock auth** (Global-Trade, Imperialpedia, brand-connector mock) for removal before any prod deploy.

---

### Audit coverage / confidence
- **Fully read [V]:** auth-node, rbac, middleware, auth-sdk; auth-service (jwtRsa, jwtserver, authService, authMiddleware, password, routes); order/notification/elite-circle/session/admin/proxy adapters; oauth-service (core); admin impersonation; trade-service authController; baalvion-os jwt.strategy/roles; Keycloak realm; Jobs-Portal keycloak/auth.server; brand-connector AuthContext/fb-compat/baalvion; company-Dashboard auth; Law-Elite auth; Amarise api-client; Supabase shim client; Global-Trade auth-gateway; root `.env.example`; all `appConfig.js` secret defaults.
- **Surveyed [S]:** remaining ~15 jwtserver-adapter services (identical pattern); IR/CTM/Proxy-Stack/admin-platform frontend internals.
- **Uncertain [U]:** runtime token routing; per-service `.env` real values; oauth-service token claim details; brand-connector exchange endpoint existence.

_No code modified. End of Phase 1._
