# BAALVION SYSTEM CONTRACT

The backend architecture contract for the Baalvion federated monorepo. This is not
documentation — it is **executed in CI** by [`enforce.mjs`](./enforce.mjs) and
[`validate.mjs`](./validate.mjs). A violation blocks the merge.

Run locally:

```bash
npm run architecture:check     # validate.mjs + enforce.mjs
```

---

## Domains (locked — 6)

| Domain | Responsibility | Forbidden |
|---|---|---|
| **Identity** | Authenticate principals; resolve tenant/RBAC. | Business, billing or content data. |
| **Commerce** | Trade, marketplace, payment, billing, financial ops. | Identity, knowledge, infra provisioning. |
| **Knowledge & Intelligence** | Editorial content, member knowledge, analytics. | Money movement, identity, provisioning. |
| **Infrastructure** | Proxy, edge, ASN/network provisioning. | Users, commerce, content. |
| **Platform/Admin** | Catalog, audit, notification control planes. | Domain business data; user auth. |
| **Ecosystem** | Reseller, affiliate, white-label channels. | Identity, core ledgers, infra. |

Every catalog descriptor MUST carry one `domain` from this set (schema-required).

---

## The 7 hard rules (CI-blocking)

| # | Rule | How it is enforced |
|---|---|---|
| **C1** | one service = one DB | descriptor declares ≤1 system-of-record (`postgres`); timeseries/analytics/cache are projections |
| **C2** | no cross-service DB access | no source `require`/`import` escapes a service dir into a sibling service |
| **C3** | no auth duplication | `jsonwebtoken` may be imported **only** in the canonical/allowlisted auth surface |
| **C4** | gateway is the only entry point | exactly one descriptor has `ingress: public`, and it is the gateway |
| **C5** | comms via contracts/events | every `dependsOn` resolves; every event exists in `@baalvion/contracts` |
| **C6** | identity only via auth-node | folded into C3 — no ad-hoc token verify outside the authority |
| **C7** | kernel owns identity only | Prisma confined to the kernel (`platform/baalvion-os`) |

Plus: **CATALOG** (all descriptors valid against `schema.json`) and **SCAFFOLD**
(every deployable Backend service has a descriptor — services are created via the
scaffold tool, never by hand).

### Violation examples
- `payment-service` opens a pool to `trade-service`'s database → **C2**.
- `marketplace-service` adds `import jwt from 'jsonwebtoken'` → **C3**.
- a frontend calls `insiders-service` directly, bypassing the gateway → **C4**.

---

## Auth authority

`@baalvion/auth-node` is the **single permitted home** for `jsonwebtoken` (token
verify / RS256+JWKS issue / HS256 fallback / refresh). Backend services consume it
through a thin `utils/jwtserver.js` adapter. `@baalvion/middleware` is the canonical
shared Express integration (RS256 + JTI blacklist + `req.auth`).

### Allowlist (finite, reasoned, ratcheting)
`enforce.mjs` permits `jsonwebtoken` only in `auth-node`, `middleware`, and a fixed
list of issuer/edge/sub-stack files (auth-service issuer, proxy issuer + socket,
oauth-service, session/admin/notification edge verifiers, the realtime remote-JWKS
verifier, and the acquired `law-elite` sub-stack). Each entry has a reason in the
gate source. **Any new `jsonwebtoken` import outside this set fails CI** — the
residual can only shrink. Migrating an allowlisted file to `auth-node` means deleting
its allowlist entry.

---

## Data rules

- **Postgres** = system of record (per service; the only SoR).
- **ClickHouse** = analytics only. **Redis** = cache only. **Timeseries** = metrics only.
- Source of truth: the owning service's Postgres is authoritative for its data.
- Projection: ClickHouse/Redis/Timeseries are read-only projections derived from events.
