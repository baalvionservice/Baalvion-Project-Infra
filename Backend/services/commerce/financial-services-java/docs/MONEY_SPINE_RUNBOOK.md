# Money-Spine Runbook

Verified bring-up of the Baalvion financial money-spine and its payment-completion webhook
cascade into the order-execution-service (oes). Factual; reflects the live `baalvion-financial`
compose project.

## What the money-spine is

The minimal set of services that move money and prove an order paid, end-to-end:

| Service | Container port | Verified host port | Role |
|---|---|---|---|
| risk-service | 3035 | 13035 | pre-trade risk / sanctions checks |
| ledger-service | 3014 | 13014 | double-entry posting (system of record for money) |
| payment-service | 3015 | 13015 | payment lifecycle → emits `payments.transaction.completed` |
| audit-service | 3020 | 13020 | consumes Kafka, fans out HMAC-signed webhooks |
| escrow-service | 3017 | 13017 | escrow hold / release |
| settlement-service | 3018 | 13018 | settlement |

Backing infra in the same compose project: `postgres` (host **5433**), `kafka` (host 9092),
`redis` (host 6380). All services share one `baalvion` Postgres DB with per-service schemas and
per-service Flyway history.

> The order-execution-service (oes) is a **Node host process** on **:3052** (not in this compose
> project). It is the webhook sink that cascades the order to `payment_confirmed`.

## Per-module image build

Every service builds from the shared parametrized Dockerfile (`SERVICE` build-arg). Each image
runs a full Maven build, so the first build is slow. Build only the money-spine modules:

```bash
cd Backend/services/commerce/financial-services-java
docker compose build risk-service ledger-service payment-service audit-service escrow-service settlement-service
```

## Host-port overrides

Compose defaults to the container ports on the host (3035/3014/3015/3020/3017/3018). To run the
suite alongside other processes that already hold those ports, set the `*_HOST_PORT` overrides
(this is how the verified `13xxx` host ports above are produced). Container ports never change.

```bash
RISK_HOST_PORT=13035 \
LEDGER_HOST_PORT=13014 \
PAYMENT_HOST_PORT=13015 \
AUDIT_HOST_PORT=13020 \
ESCROW_HOST_PORT=13017 \
SETTLEMENT_HOST_PORT=13018 \
docker compose up -d risk-service ledger-service payment-service audit-service escrow-service settlement-service
```

## Flyway baseline (shared DB)

Because every service shares the `baalvion` DB, a sibling's first Flyway run would otherwise
refuse with "non-empty schema, no history table". The compose `x-service-env` sets these so each
service can initialize its own history against the shared DB (defaults already correct):

- `SPRING_FLYWAY_BASELINE_ON_MIGRATE=true` — let each service baseline against the shared DB.
- `SPRING_FLYWAY_BASELINE_VERSION=0` — baseline at v0 so each service's own V1+ migrations still apply.

## Seed the audit → oes webhook subscription (REQUIRED every fresh start)

The audit→oes subscription is **not persisted in code** and is lost on a fresh stack start. After
the stack is healthy, register it idempotently:

```bash
node Backend/scripts/seed-finance-webhooks.cjs
```

Config (env, with verified-live defaults):

| Var | Default |
|---|---|
| `AUDIT_URL` | `http://127.0.0.1:13020` |
| `OES_FINANCE_WEBHOOK_URL` | `http://host.docker.internal:3052/v1/internal/finance-events` |
| `FINANCE_WEBHOOK_SECRET` | `dev_finance_webhook_secret_change_me_min32` (must equal oes `FINANCE_WEBHOOK_SECRET`) |
| `TENANT_ID` | `11111111-1111-1111-1111-111111111111` |
| `EVENT_PATTERN` | `payments.transaction.completed` (Java regex — send dots UNESCAPED) |

The script GETs existing subscriptions first and skips if an **active** one already targets the
same url + pattern; otherwise it POSTs to create. Re-running is safe. A soft-deleted
(`active:false`) row is re-created. Exits non-zero on any failure.

## Proven end-to-end flow

1. Order created in oes (host :3052) → status `pending_payment`.
2. payment-service completes the transaction → emits Kafka `payments.transaction.completed`.
3. ledger-service posts the double-entry (debits = credits) — money system of record.
4. audit-service consumes the Kafka event → POSTs an HMAC-signed webhook to each matching
   subscriber. The signature is `X-Webhook-Signature: sha256=<hex>` over the body using the
   shared secret.
5. oes receives it at `POST /v1/internal/finance-events`, verifies the signature against its
   `FINANCE_WEBHOOK_SECRET`, and cascades the order to **`payment_confirmed`**.
6. Escrow path: escrow-service **hold** → **release** against the same transaction.

If step 5 never fires after a fresh start, the audit→oes subscription was not seeded — run
`seed-finance-webhooks.cjs`.
