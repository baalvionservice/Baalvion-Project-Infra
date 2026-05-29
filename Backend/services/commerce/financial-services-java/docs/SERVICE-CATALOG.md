# Service Catalog

Authoritative inventory of the financial-services module: ports, schemas, packages, the Kafka
topics each service produces and consumes, and primary endpoints. All services share one
PostgreSQL database (`baalvion`) with one schema each (RLS-isolated) and one Flyway history table
each (`flyway_history_<svc>`).

> Identity, Auth, API-Gateway/BFF, Notification, and Admin are **platform-owned** and intentionally
> not implemented in this module.

## Quick reference

| Service | Port | Schema | Package | Group id |
|---------|------|--------|---------|----------|
| ledger-service | 3014 | `ledger` | `com.baalvion.ledger` | `ledger-service-group` |
| payment-service | 3015 | `payments` | `com.baalvion.payment` | `payment-service-group` |
| account-service | 3016 | `accounts` | `com.baalvion.account` | `account-service-group` |
| escrow-service | 3017 | `escrow` | `com.baalvion.escrow` | `escrow-service-group` |
| settlement-service | 3018 | `settlement` | `com.baalvion.settlement` | `settlement-service-group` |
| reconciliation-service | 3019 | `reconciliation` | `com.baalvion.reconciliation` | `reconciliation-service-group` |
| audit-service | 3020 | `audit` | `com.baalvion.audit` | (aggregator + DLT groups) |
| reporting-service | 3024 | `reporting` | `com.baalvion.reporting` | — |
| risk-service | 3025 | `risk` | `com.baalvion.risk` | `risk-service-group` |
| common-security | _(library)_ | — | `com.baalvion.common.security` | — |

## Event topology (Kafka)

| Service | Produces | Consumes |
|---------|----------|----------|
| ledger | `ledger.entry.posted`, `ledger.entry.reversed`, `payments.ledger.posted`, `payments.ledger.failed` | `payments.transaction.initiated` (saga), `escrow.hold.*` (posts suspense journals) |
| payment | `payments.transaction.initiated/completed/failed/reversed` (via transactional outbox) | `payments.ledger.posted`, `payments.ledger.failed` |
| account | `account.created`, `account.kyc.updated` | `payments.transaction.completed`, `escrow.hold.*` (balance saga, exactly-once inbox) |
| escrow | `escrow.hold.created/released/refunded/disputed` | — |
| settlement | `settlement.batch.created`, `settlement.batch.submitted` | `payments.transaction.completed` (auto-feeds the open batch) |
| reconciliation | `settlement.batch.reconciled` | — (inbound scheme advice via file/SFTP poller, off by default) |
| audit | outbound HMAC webhooks (HTTP) | topic pattern `(payments\|ledger\|settlement\|escrow\|account)\..*`, plus `*.DLT` |
| reporting | — | — |
| risk | `risk.assessment.completed` | `payments.transaction.initiated` |

All events are JSON strings (`StringSerializer`/`StringDeserializer` on the saga path). Consumers
use a `DefaultErrorHandler` with `ExponentialBackOffWithMaxRetries(3)` at 1s/5s/25s; exhausted
records dead-letter to `<topic>.DLT`.

## Primary endpoints

| Service | Base path | Highlights |
|---------|-----------|------------|
| ledger | `/api/v1/ledger` | `POST /entries`, `POST /entries/{id}/reverse`, `GET /accounts/{id}/balance` |
| payment | `/api/v1/payments` | `POST /initiate`, `/{id}/complete\|fail\|reverse`, `POST /bulk`, `GET /{id}/fee-breakdown`, `/approvals` (maker-checker) |
| account | `/api/v1/accounts` | CRUD, `PATCH /{id}/kyc`, `/{id}/credit\|debit`, `/{id}/limits`, KYC document vault |
| escrow | `/api/v1/escrow` | `POST /`, `/{id}/release\|refund\|dispute` |
| settlement | `/api/v1/settlement/batches` | create, `/{id}/generate\|file\|submit`, `/{id}/items` |
| reconciliation | `/api/v1/reconciliation` | `POST /runs`, `/items`, `/items/{id}/resolve` |
| audit | `/api/v1/audit` | `POST /events`, `GET /events`, `/dlt` (+ `/{id}/replay\|discard`), `/webhooks` |
| reporting | `/api/v1/reports` | `POST /` (202), `GET /{id}`, `/{id}/download` |
| risk | `/api/v1/risk` | `GET /assessments`, `/transactions/{txnId}/assessment` |

Operational endpoints on every service: `/actuator/health` (+`/liveness`,`/readiness`),
`/actuator/prometheus`, and (dev) `/swagger-ui.html`.

## Cross-service flows

- **Payment ↔ Ledger saga** (choreographed): `initiate` → outbox → `payments.transaction.initiated`
  → ledger posts double-entry → `payments.ledger.posted|failed` → payment completes/compensates.
- **Account balance saga**: account consumes `payments.transaction.completed` and `escrow.hold.*`,
  applying debit/credit exactly-once via the `accounts.processed_events` inbox.
- **Settlement auto-feed**: completed payments flow into the day's open settlement batch.
- **Audit aggregation**: audit-service is the platform's catch-all consumer + DLT monitor.

See [ENVIRONMENT.md](ENVIRONMENT.md), [SECURITY.md](SECURITY.md), [ONBOARDING.md](ONBOARDING.md),
the [ADRs](adr/), and the [runbooks](runbooks/).
