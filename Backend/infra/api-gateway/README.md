# Baalvion API Gateway (Traefik) — single public ingress

Realizes repair Steps 1–2 as **declarative config** (no Go, no new service). The Go
`Backend/gateway` is unchanged — it remains the **proxy egress data-plane** for
customer proxy traffic, a separate concern from this API ingress.

## Files
- `traefik.yml` — static config (entrypoints `:80`→`:443`, file provider, dashboard).
- `dynamic.yml` — the **routing table**: 28 routers/services across the 6 domains + 4 middlewares.

## Path & auth model
- **Path:** `https://api.baalvion.com/api/v1/<domain>/<service>/<resource>`
  → `api-strip` middleware rewrites to the service's own `/v1/<resource>` mount (services keep their current `/v1` routes — non-breaking).
- **Auth (unification point):** the `jwt-auth` middleware (`forwardAuth` → `auth-service`) validates the **auth-service** JWT on every protected route. `identity/auth` + `identity/oauth` are public (token issuers). Because services are private and only reachable through this gateway, **auth-service becomes the single enforced authority** — proxy-auth (:4000), Supabase, and Keycloak are no longer reachable for app auth without going through the gateway.
  - `forwardAuth` expects `GET /v1/auth/verify` on auth-service → `2xx`(+`X-User-Id`/`X-Tenant-Id`/`X-Roles`) or `401`. **If that endpoint doesn't exist yet, add it (small, additive) or switch `jwt-auth` to a JWKS-validating JWT plugin against `auth-service/.well-known/jwks.json`.** This is the only backend code change Step 2 needs.

## Port-collision fixes baked into the table
- `ctm-service` 3011 → **3017** (was colliding with `cms-service` 3011)
- `fulfillment-service` 3015 → **3016** (was colliding with `law-service` 3015)
These are the upstream targets in `dynamic.yml`; update the two services' `PORT`/compose to match when deploying.

## Frontend env convention (Step 3 — staged)
Every frontend collapses its many per-service URLs to ONE:
```
NEXT_PUBLIC_GATEWAY_URL=https://api.baalvion.com      # Next.js apps
VITE_GATEWAY_URL=https://api.baalvion.com             # Vite apps
```
and calls `${GATEWAY}/api/v1/<domain>/<service>/<resource>`. **Do not flip the
live defaults until this gateway is deployed and verified** (otherwise every app
points at a non-running ingress).

## Run / verify (when an environment is available)
```
docker run -p 80:80 -p 443:443 \
  -v $PWD/traefik.yml:/etc/traefik/traefik.yml \
  -v $PWD/dynamic.yml:/etc/traefik/dynamic.yml traefik:v3
# then: curl https://api.baalvion.com/api/v1/identity/auth/health   (public)
#       curl -H "Authorization: Bearer <jwt>" .../api/v1/commerce/order/...   (protected)
```
Not run in the authoring environment (no Docker/Go here) — deploy + integration-test before frontend cutover.
