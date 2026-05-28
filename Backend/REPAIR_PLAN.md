# Baalvion Architecture Repair — Plan & Status

Repairs the violations from the verification report. Chosen ingress model:
**dedicated API gateway via Traefik config** (no Go code, no new service; the Go
`Backend/gateway` stays as the proxy egress data-plane). Behavioral steps are
**staged with verification gates** because this environment cannot run the
gateway, the frontends, or integration tests — and "preserve all features" forbids
blind, unverifiable cutovers.

## 1. Fixes applied (this pass) vs staged

| # | Item | Status |
|---|---|---|
| Gateway routing table (28 routers/services, 6 domains) | `Backend/infra/api-gateway/dynamic.yml` | ✅ authored |
| Gateway static config (single `:443` ingress, services private) | `traefik.yml` | ✅ authored |
| API standard `/api/v1/<domain>/<service>/<resource>` + `api-strip` rewrite | dynamic.yml | ✅ defined |
| Single-auth enforcement point (`jwt-auth` forwardAuth → auth-service) | dynamic.yml | ✅ defined |
| Port-collision fixes: ctm 3011→**3017**, fulfillment 3015→**3016** | routing table | ✅ defined (apply to svc `PORT`/compose on deploy) |
| Frontend single-gateway env convention (`*_GATEWAY_URL`) | README | ✅ specified |
| **Deploy gateway + integration-test** | — | ⏸ staged (needs Docker/runtime) |
| **`auth-service` `/v1/auth/verify` endpoint** (or JWKS plugin) | — | ⏸ staged (1 small additive endpoint) |
| **Frontend cutover** (15 apps → gateway URL; remove per-service URLs) | — | ⏸ staged (only after gateway verified) |
| **Retire proxy-auth / Supabase / Keycloak app-auth** | — | ⏸ staged (after frontends use gateway tokens) |
| **Twin dedupe** insiders/elite-circle → shared-core package (keep both svcs+DBs) | — | ⏸ staged (refactor + test) |
| **Global-Trade embedded backend** reconcile vs trade-service | — | ⏸ staged (reconciliation, not deletion) |

## 2. Before → After architecture map

**BEFORE**
```
15 frontends ──(direct, per-service ports 3001..3051, 4000, 4100, 8000)──► 30 services
auth: auth(3001) + proxy-auth(4000) + oauth(3023) + session(3022) + Keycloak(8088) + Supabase
ingress: Go proxy-gw (proxy traffic)  +  law-elite gw (/api/*)   [no API gateway]
```
**AFTER (target)**
```
15 frontends ──► api.baalvion.com (Traefik) ──/api/v1/<domain>/<service>──► services (PRIVATE net)
                         │ jwt-auth → auth-service (single authority)
Go proxy-gw = proxy traffic ONLY (unchanged)
law-elite gw = behind the API gateway (one public ingress)
```

## 3. New gateway routing table
Full table in `Backend/infra/api-gateway/dynamic.yml`. Summary: `/api/v1/<domain>/<service>` →
identity(auth 3001*, oauth 3023*, session 3022) · commerce(trade 3025, order 3013, inventory 3014,
fulfillment **3016**, commerce 3012, market 3007) · knowledge(imperialpedia 3004, cms 3011, law 3015,
ml 8000) · infrastructure(realtime 3040, notification 3031, proxy 4000) · platform(admin 3021,
dashboard 3009) · ecosystem(about 3010, brand-connector 3006, ctm **3017**, insiders 3050,
elite-circle 3051, ir 3008, jobs 3002, mining 3003, real-estate 3005, law-elite→sub-gw).
`*` = public (token issuers); all others require the auth-service JWT.

## 4. Clean service list (final state — no services deleted)
Identical to the migration's final state; **no service removed, no business logic changed**:
- **identity:** auth · oauth · session
- **commerce:** trade · order · inventory · fulfillment · commerce · market
- **knowledge:** imperialpedia · cms · law · ml (Python)
- **infrastructure:** realtime · notification · proxy-service · `gateway` (Go proxy data-plane)
- **platform:** admin · dashboard · baalvion-os (kernel) · baalctl
- **ecosystem:** about · brand-connector · ctm · insiders · elite-circle · ir · jobs · mining · real-estate · law-elite
- Twin dedupe = **shared-core package**, both `insiders` + `elite-circle` retained (distinct products/DBs).

## 5. Remaining risks
1. Gateway is **authored, not deployed/verified** here (no Docker/Go) — must integration-test before frontend cutover.
2. `jwt-auth` needs `auth-service /v1/auth/verify` (or a JWKS JWT plugin) — small additive endpoint, not yet present.
3. Frontend cutover (15 apps) + retiring proxy-auth/Supabase/Keycloak is the **highest-risk** behavioral change; staged, gate each app.
4. Supabase-shaped frontends (insiders/elite-circle/proxy UIs) need their data layer pointed at the service API through the gateway — non-trivial client rewrite.
5. Global-Trade embedded backend overlaps trade-service — **reconcile**, do not delete blind.
6. Port reassignments (ctm 3017, fulfillment 3016) must be applied to the services' runtime config + compose when deploying.

## Staged execution order (each with a verification gate)
1. Add `auth-service /v1/auth/verify` (or JWKS plugin) → unit-test 200/401.
2. Apply port reassignments (ctm 3017, fulfillment 3016) → service boots on new port.
3. Deploy Traefik with this config on a private network → `curl` public + protected routes pass.
4. Cut over ONE frontend (e.g. about) to `*_GATEWAY_URL` → smoke-test; then roll the rest one-by-one.
5. Once all frontends use gateway+auth-service tokens → disable proxy-auth/Supabase/Keycloak app-auth.
6. Extract insiders/elite-circle shared core to a package → both services pass tests.
7. Reconcile Global-Trade embedded backend vs trade-service → then remove leakage.
