# @baalvion/auth-gateway — BFF / Cookie Gateway (Phase 6)

Additive Backend-For-Frontend that issues **HttpOnly cookie sessions** backed by the
**auth-service RS256** authority. **No JWT ever reaches the browser.** Coexists with every
legacy auth path (localStorage Bearer, island HS256, Supabase adapter, Firebase) — nothing is removed.

## 1. Folder structure
```
Backend/services/identity/auth-gateway/
  index.js                 # express app: /health, /auth/*, /api/* (proxy hook)
  config/appConfig.js      # env (auth-service URL, JWKS, redis, cookie strategy)
  lib/
    redis.js               # shared ioredis client
    verifier.js            # @baalvion/auth-node createJwksVerifier (RS256-only + blacklist, fail-closed)
    redisSession.js        # server-side session model + revoke (blacklist jti + delete session)
  middleware/session.js    # BFF middleware: requireSession() · attachUser · enforceOrgScope()
  routes/auth.js           # POST /login /refresh /logout · GET /me · GET /.well-known/session
  .env.example

# Per-app BFF adapters (thin — reuse middleware/session.js):
bff/
  core-bff/  mining-bff/  proxy-bff/  law-bff/  island-bff/
    └ each: express app that mounts requireSession()+attachUser, then http-proxy-middleware
      forwarding to its domain backend(s) with Authorization: Bearer <req._token> (server-side).
```

## 2. Cookie strategy
| Cookie | Contents | Flags | Lifetime |
|---|---|---|---|
| `access_token` | RS256 JWT (short-lived) | **HttpOnly**, Secure(prod), SameSite=Lax, Path=/ | 15m |
| `refresh_token` | auth-service refresh token | **HttpOnly**, Secure(prod), SameSite=Lax, Path=/ | 7d |
- **HttpOnly ⇒ unreadable by JS** → satisfies "no JWT in JS runtime" / XSS-safe.
- Login/refresh **never** put a token in the response body — only `Set-Cookie` + a safe profile.
- `SameSite=Lax` allows top-level login navigation; use `COOKIE_DOMAIN=.baalvion.com` for cross-subdomain SSO.
- Data calls go to `/api/*` with `credentials:'include'`; the gateway reads the cookie server-side and injects the Bearer.

## 3. Session model (Redis)
```
key:   bff:session:<sid>            # sid = the JWT's `sid` claim
value: { sessionId, userId, orgId, roles[], source:"auth-service", createdAt, expiresAt }
TTL:   = refresh-token lifetime (self-expires)
```
- `requireSession()` requires BOTH a valid (JWKS+blacklist) `access_token` **and** an existing `bff:session:<sid>`.
- **Revoke** = `revokeJti(auth:blacklist:<jti>)` + `DEL bff:session:<sid>` → every app (gateway + islands/consumers) rejects instantly.

## 4. Auth flows
```
LOGIN   FE POST /auth/login {email,password} (credentials:include)
        → gateway → auth-service /login (RS256) → create bff:session:<sid> → Set-Cookie access+refresh → { user }
REQUEST FE → /api/<svc>/... (cookie) → requireSession+attachUser → inject Bearer → proxy to backend
REFRESH FE POST /auth/refresh (cookie) → auth-service /refresh → rotate access cookie → { ok }
LOGOUT  FE POST /auth/logout (cookie) → revoke (blacklist jti + del session) → clear cookies → { ok }
```

## 5. Migration order (rollout — additive, rollback-safe)
1. **Deploy gateway in parallel** (this) — no app changes. Validate /login /me /refresh /logout in staging.
2. **admin-platform → cookie-only** (already hybrid + 5C pilot): point auth-sdk `cookieMode` at the gateway; drop Bearer.
3. **2 apps at a time** (auth-service-backed Bearer): Mining+company-dashboard → IR+Imperialpedia → brand-connector+controlthemarket.
4. **Islands** (elite/insiders → GTI): route login + `/api` data through the gateway / island-bff (RS256 accepted via Phase 3B).
5. **Proxy-BaalvionStack** last (heaviest localStorage).
6. **Eliminate localStorage → cookie-only** per app once browser-validated; then HS256 removal becomes safe.

**Rollback:** every app keeps its legacy path; the auth-sdk resolves cookie→localStorage→island→guest, so disabling the gateway falls back to direct Bearer mode with no code change.

## 6. Validation tests (run once a runnable env exists)
1. refresh → still logged in (no LS) · 2. `localStorage.clear()` → no logout · 3. no JWT in JS runtime (HttpOnly) ·
4. login once → works across apps via gateway · 5. revoke `bff:session:<sid>` → all apps logout · 6. island HS256 still works via its BFF bridge.

## Run
`cp .env.example .env` → `pnpm install` (workspace) → `npm start` (port 3026). Requires Redis + auth-service reachable.
