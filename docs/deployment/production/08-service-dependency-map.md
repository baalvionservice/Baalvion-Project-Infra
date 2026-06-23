# 08 · Service Dependency Map (consolidated container DNS)

In the 6-container grouping, **same-container** calls work over `localhost`, but
**cross-container** calls must target `http://app-<container>:<pm2 port>`. The pm2 PORT
**overrides the service's standalone default** (e.g. rbac-service runs on `3053` here, not its
standalone `3055`). The committed code only had `localhost:<standalone-port>` defaults, so every
cross-container edge below was broken until the env vars in this doc were set.

## Cross-container call edges (deployed services only)

| Caller (container) | Target (container:port) | Env var | Notes |
|---|---|---|---|
| auth-gateway (identity) | auth-service (identity:3001) | `AUTH_SERVICE_URL`, `JWKS_URI` | same-container |
| auth-gateway BFF (identity) | mining (ecosystem:3003) | `SVC_MINING` | cross |
| auth-gateway BFF | imperialpedia (platform:3004) | `SVC_IMPERIALPEDIA` | cross |
| auth-gateway BFF | ir (ecosystem:3008) | `SVC_IR` | cross |
| auth-gateway BFF | dashboard (platform:3009) | `SVC_DASHBOARD` | cross |
| auth-gateway BFF | ctm (ecosystem:3017) | `SVC_CTM` | cross |
| auth-gateway BFF | proxy (edge-realtime:4000) | `SVC_PROXY` | cross |
| auth-gateway BFF | insiders (ecosystem:3050) | `SVC_INSIDERS` | cross |
| auth-gateway BFF | trade-service (commerce:3025) | `SVC_TRADE` | cross |
| auth-gateway BFF | order-execution (trade:3052) | `SVC_ORDER_EXECUTION` | cross |
| order / commerce / inventory / fulfillment (commerce) | rbac (identity:3053) | `RBAC_BASE_URL` (+`/v1`) | cross · **`failMode=closed`** → checkout breaks if wrong |
| order-service (commerce) | inventory (commerce:3014) | `INVENTORY_BASE_URL` (+`/api/v1`) + `INVENTORY_INTERNAL_KEY` | same-container; key-gated oversell guard |
| order-service (commerce) | notification (edge-realtime:3031) | `NOTIFICATION_BASE_URL` (+`/v1`) | cross · order emails via `INTERNAL_SERVICE_SECRET` |
| order-service / auth-service / trade / network-graph / product-registry / trade-documentation | cms (platform:3018) | `CMS_BASE_URL`, `CMS_INTERNAL_URL` | cross · **prod guard rejects a localhost CMS URL** |
| trade-service / insiders (commerce/ecosystem) | auth JWKS (identity:3001) | `JWKS_URI` (dualTokenVerifier) | cross |
| trade-service (commerce) | payment JVM (payments:3015) | `SVC_PAYMENT` | **finance facade OFF (`FINANCE_ENABLED=false`) in MVP** |
| insiders / proxy (ecosystem/edge) | payment JVM (payments:3015) | `PAYMENT_SERVICE_URL` | cross |
| proxy-service (edge-realtime) | auth-service (identity:3001) | `AUTH_SERVICE_URL` | cross |

## Not deployed in the consolidated MVP (documented, intentionally unmapped)

`financial-services-java` is a ~22-module reactor; the consolidated stack runs **only
`payment-service`**. So `order-service → ledger` (Java) and `trade-service → ledger/account/
escrow/settlement/risk` are **not wired**:
- `order-service` ledger posting stays **disabled** (no `LEDGER_INTERNAL_KEY`) — avoids the
  `LEDGER_BASE_URL` default `:3014` colliding with inventory inside app-commerce.
- `trade-service` keeps `FINANCE_ENABLED=false` → uses simulated finance refs. Enabling the full
  trade↔finance saga requires deploying the rest of the Java reactor (out of scope for this stack).
- auth-gateway's finance BFF routes (`ledger/account/escrow/settlement/risk/...`) 502 if hit —
  only `payments` (→ `SVC_PAYMENT`) is live.

## Binding requirement

Cross-container DNS only works because each Node service listens on `0.0.0.0` (Express default)
and the JVM on all interfaces — verified by the live cross-container probes in §10 validation.
