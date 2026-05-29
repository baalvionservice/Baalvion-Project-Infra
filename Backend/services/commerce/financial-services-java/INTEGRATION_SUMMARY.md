# Financial Services Integration - Java/Spring Boot Implementation

## Overview

This document describes the complete financial microservices implementation for Baalvion Global Trade Infrastructure. The services implement double-entry bookkeeping, payment processing with tiered fees, and multi-tenant isolation via Row-Level Security (RLS).

## Architecture

```
Global Trade Infrastructure (Frontend)
    ↓
API Gateway / BFF
    ↓
    ├─→ Account Service (Port 3016)
    │   └─→ PostgreSQL accounts schema (RLS)
    │   └─→ KYC state machine, pessimistic-locked balances
    │   └─→ Kafka: account.created, account.kyc.updated
    │
    ├─→ Ledger Service (Port 3014)
    │   └─→ PostgreSQL ledger schema (RLS)
    │   └─→ Kafka: ledger.entry.*
    │
    ├─→ Payment Service (Port 3015)
    │   └─→ PostgreSQL payments schema (RLS)
    │   └─→ Redis: Idempotency cache (24h TTL)
    │   └─→ Kafka: payments.transaction.*
    │
    ├─→ Escrow Service (Port 3017)
    │   └─→ PostgreSQL escrow schema (RLS)
    │   └─→ Hold / release / refund / dispute + scheduled auto-expiry
    │   └─→ Kafka: escrow.hold.{created,released,refunded,disputed}
    │
    ├─→ Settlement Service (Port 3018)
    │   └─→ PostgreSQL settlement schema (RLS)
    │   └─→ T+0/T+1 batches, scheme file generation (Visa/MC/Interswitch)
    │   └─→ Kafka: settlement.batch.{created,submitted}
    │
    ├─→ Reconciliation Service (Port 3019)
    │   └─→ PostgreSQL reconciliation schema (RLS)
    │   └─→ Inbound matching, exception queue, resolve workflow
    │   └─→ Kafka: settlement.batch.reconciled
    │
    ├─→ Audit Service (Port 3020)
    │   └─→ PostgreSQL audit schema (RLS, JSONB + GIN, append-only)
    │   └─→ REST ingest + Kafka aggregator (consumes all domain events)
    │
    └─→ Reporting Service (Port 3024)
        └─→ PostgreSQL reporting schema (RLS)
        └─→ Async CSV / JSON / XLSX export jobs (Apache POI), downloadable
```

> Identity / Auth / API-Gateway concerns are provided by the platform-level
> services (auth-gateway BFF, oauth-service, session-service) and are intentionally
> **not** re-implemented here. Notification & Admin also exist at the platform level.

## Services Implemented

### 1. Ledger Service

**Purpose:** Double-entry bookkeeping with immutable journal entries

**Port:** 3014

**Technology Stack:**
- Spring Boot 3.2.0
- Spring Data JPA
- PostgreSQL (schema: `ledger`)
- Kafka (topics: `ledger.entry.posted`, `ledger.entry.reversed`)
- Micrometer Prometheus

**Key Files:**
```
ledger-service/
├── src/main/java/com/baalvion/ledger/
│   ├── LedgerServiceApplication.java      # Spring Boot entry point
│   ├── controller/
│   │   └── EntryController.java            # REST endpoints
│   ├── service/
│   │   └── LedgerService.java              # Business logic
│   ├── repository/
│   │   └── JournalEntryRepository.java     # Data access layer
│   ├── domain/
│   │   └── JournalEntry.java               # JPA entity
│   ├── dto/
│   │   ├── EntryResponse.java
│   │   ├── PostEntryRequest.java
│   │   ├── AccountStatementResponse.java
│   │   └── AccountBalanceResponse.java
│   └── exception/
│       └── GlobalExceptionHandler.java
├── src/main/resources/
│   ├── application.yml                     # Spring configuration
│   └── db/migration/
│       └── V001__create_journal_entries_table.sql
└── pom.xml
```

**Database Schema:**
```sql
CREATE TABLE ledger.journal_entries (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  transaction_ref varchar(64) NOT NULL,
  debit_account_id uuid NOT NULL,
  credit_account_id uuid NOT NULL,
  amount numeric(19, 4) NOT NULL,
  currency char(3) NOT NULL,
  entry_type varchar(32),                   -- PAYMENT, FEE, REVERSAL, SETTLEMENT, ESCROW, REFUND, ADJUSTMENT
  status varchar(32),                       -- PENDING, POSTED, REVERSED
  description text,
  related_transaction_id uuid,
  posted_at timestamp,
  reversed_at timestamp,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  version bigint,
  CONSTRAINT uk_transaction_ref UNIQUE (transaction_ref, tenant_id),
  CONSTRAINT check_amount CHECK (amount > 0)
);

-- Indexes for query performance
CREATE INDEX idx_tenant_status_date ON ledger.journal_entries(tenant_id, status, posted_at DESC);
CREATE INDEX idx_debit_account ON ledger.journal_entries(debit_account_id, tenant_id);
CREATE INDEX idx_credit_account ON ledger.journal_entries(credit_account_id, tenant_id);
CREATE INDEX idx_tenant_date ON ledger.journal_entries(tenant_id, posted_at DESC);

-- Row-Level Security for multi-tenancy
ALTER TABLE ledger.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY journal_entries_tenant_isolation ON ledger.journal_entries
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

**REST Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/ledger/entries` | Post journal entry (double-entry debit/credit) |
| GET | `/api/v1/ledger/entries/{id}` | Retrieve specific entry |
| GET | `/api/v1/ledger/entries` | List entries with filters (accountId, entryType, status) |
| POST | `/api/v1/ledger/entries/{id}/reverse` | Create compensating entry (swap debit/credit) |
| GET | `/api/v1/ledger/accounts/{accountId}/statement` | Account statement (debits, credits, entries) |
| GET | `/api/v1/ledger/accounts/{accountId}/balance` | Account balance (debits - credits) |

**Business Logic:**
- **Idempotency:** transactionRef must be unique per tenant (prevents duplicate entries)
- **Double-Entry:** Every transaction posts two entries (debit account = credit account)
- **Audit Trail:** Immutable entries with createdAt, updatedAt, version fields
- **Reversal:** Creates compensating entry with REVERSAL type, swapped debit/credit
- **Multi-Tenancy:** All queries scoped to tenant_id via Spring Security context

**Kafka Events:**
```
ledger.entry.posted: { id, tenantId, transactionRef, debitAccountId, creditAccountId, amount, currency, entryType, status, ... }
ledger.entry.reversed: { id, tenantId, transactionRef, relatedTransactionId, ... }
```

---

### 2. Payment Service

**Purpose:** Payment processing with scheme-specific fees and idempotency

**Port:** 3015

**Technology Stack:**
- Spring Boot 3.2.0
- Spring Data JPA
- Spring Data Redis (for idempotency cache)
- PostgreSQL (schema: `payments`)
- Redis (24-hour TTL idempotency key cache)
- Kafka (topics: `payments.transaction.initiated`, `payments.transaction.completed`, `payments.transaction.failed`)
- Micrometer Prometheus

**Key Files:**
```
payment-service/
├── src/main/java/com/baalvion/payment/
│   ├── PaymentServiceApplication.java      # Spring Boot entry point
│   ├── controller/
│   │   └── PaymentController.java           # REST endpoints
│   ├── service/
│   │   ├── PaymentService.java              # Business logic
│   │   ├── FeeEngine.java                   # Tiered fee calculation
│   │   └── IdempotencyService.java          # Duplicate prevention
│   ├── repository/
│   │   └── TransactionRepository.java       # Data access layer
│   ├── domain/
│   │   └── Transaction.java                 # JPA entity
│   ├── dto/
│   │   ├── TransactionResponse.java
│   │   ├── InitiatePaymentRequest.java
│   │   └── FeeBreakdown.java
│   └── exception/
│       └── GlobalExceptionHandler.java
├── src/main/resources/
│   ├── application.yml                     # Spring configuration
│   └── db/migration/
│       └── V001__create_transactions_table.sql
└── pom.xml
```

**Database Schema:**
```sql
CREATE TABLE payments.transactions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  idempotency_key varchar(128) NOT NULL,
  source_account_id uuid NOT NULL,
  destination_account_id uuid NOT NULL,
  amount numeric(19, 2) NOT NULL,
  fee numeric(19, 4) NOT NULL DEFAULT 0,
  vat numeric(19, 4) NOT NULL DEFAULT 0,
  currency char(3) NOT NULL,
  payment_scheme varchar(32) NOT NULL,           -- NIP, VISA, MASTERCARD, INTERSWITCH, WALLET, INTERNAL, ESCROW
  status varchar(32) NOT NULL,                   -- INITIATED, COMPLETED, FAILED, REVERSED
  ledger_journal_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  failure_reason text,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  version bigint,
  CONSTRAINT uk_idempotency_key UNIQUE (idempotency_key, tenant_id),
  CONSTRAINT check_amount CHECK (amount > 0)
);

-- Indexes for query performance
CREATE INDEX idx_tenant_status_date ON payments.transactions(tenant_id, status, created_at DESC);
CREATE INDEX idx_source_account ON payments.transactions(source_account_id, tenant_id);
CREATE INDEX idx_destination_account ON payments.transactions(destination_account_id, tenant_id);
CREATE INDEX idx_idempotency_key ON payments.transactions(idempotency_key, tenant_id);
CREATE INDEX idx_payment_scheme ON payments.transactions(payment_scheme, status);

-- Row-Level Security for multi-tenancy
ALTER TABLE payments.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY transactions_tenant_isolation ON payments.transactions
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

**REST Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/payments/initiate` | Initiate payment with fee calculation + idempotency check |
| GET | `/api/v1/payments/{id}` | Retrieve payment |
| GET | `/api/v1/payments` | List payments with filters (sourceAccountId, scheme, status) |
| POST | `/api/v1/payments/{id}/complete` | Mark payment as COMPLETED |
| POST | `/api/v1/payments/{id}/fail` | Mark payment as FAILED with reason |
| POST | `/api/v1/payments/{id}/reverse` | Mark payment as REVERSED |
| GET | `/api/v1/payments/{id}/fee-breakdown` | Informational: calculate fees for amount + scheme |

**Business Logic:**

#### Fee Engine (Scheme-Specific)
```
VISA:        amount × 2.00% + $1.00 flat + VAT(7.5% on fees)
MASTERCARD:  amount × 2.00% + $1.00 flat + VAT
NIP:         amount × 0.50% + $0.50 flat + VAT
INTERSWITCH: amount × 1.50% + $0.75 flat + VAT
WALLET:      amount × 1.00% + $0.00 flat + VAT
INTERNAL:    amount × 0.00% + $0.00 flat + $0.00 VAT
ESCROW:      amount × 2.00% + $2.00 flat + VAT
```

#### Idempotency
- idempotencyKey: Client-provided unique identifier (max 128 chars)
- Storage: Redis with 24-hour TTL (configurable)
- Lookup: Before processing, check Redis for existing transaction
- If found: Return cached response (exact same transaction)
- If not found: Process and store result

#### Validation
- Amount: min 100, max 500,000
- Daily Limit: 1,000,000 per source account per day (configurable)
- Currency: ISO 4217 3-letter codes only
- Account validation: sourceAccountId ≠ destinationAccountId

#### Workflow
1. **INITIATED:** POST /payments/initiate → fee calc → idempotency check → INSERT transaction
2. **COMPLETED:** POST /payments/{id}/complete → status = COMPLETED
3. **FAILED:** POST /payments/{id}/fail → status = FAILED + failure_reason
4. **REVERSED:** POST /payments/{id}/reverse → status = REVERSED

**Kafka Events:**
```
payments.transaction.initiated: { id, tenantId, idempotencyKey, sourceAccountId, destinationAccountId, amount, fee, vat, paymentScheme, status, ... }
payments.transaction.completed: { id, tenantId, idempotencyKey, ..., status: COMPLETED, ledgerJournalId, ... }
payments.transaction.failed: { id, tenantId, idempotencyKey, ..., status: FAILED, failureReason, ... }
payments.transaction.reversed: { id, tenantId, idempotencyKey, ..., status: REVERSED, ... }
```

---

### 3. Account Service

**Purpose:** Multi-tenant account management, balance tracking and KYC state machine
**Port:** 3016 · **Schema:** `accounts` · **Package:** `com.baalvion.account`

**REST Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/accounts` | Create account (NUBAN-style number auto-assigned) |
| GET | `/api/v1/accounts/{id}` | Account details + balances |
| GET | `/api/v1/accounts` | List accounts (filter: type, kycStatus) |
| PATCH | `/api/v1/accounts/{id}/kyc` | Advance KYC state (state-machine validated) |
| GET | `/api/v1/accounts/{id}/limits` | Daily limit, available balance, transactable flag |
| POST | `/api/v1/accounts/{id}/credit` | Internal balance credit (pessimistic lock) |
| POST | `/api/v1/accounts/{id}/debit` | Internal balance debit (overdraft-guarded) |

- **KYC state machine:** `PENDING → APPROVED/REJECTED`, `APPROVED → SUSPENDED/REJECTED`, `SUSPENDED → APPROVED/REJECTED`; illegal transitions return `409`.
- **Balances:** `balance` (available) + `ledgerBalance`; mutated under `SELECT … FOR UPDATE` (pessimistic locking, per §9.3 of the design).
- **Kafka:** `account.created`, `account.kyc.updated` (`previousState`, `newState`, `updatedBy`).

---

### 4. Escrow Service

**Purpose:** Conditional fund holds with release/refund triggers and dispute management
**Port:** 3017 · **Schema:** `escrow` · **Package:** `com.baalvion.escrow`

**REST Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/escrow` | Create hold (idempotent on `escrowRef`) |
| GET | `/api/v1/escrow/{id}` | Status + timeline |
| GET | `/api/v1/escrow` | List (filter: status) |
| POST | `/api/v1/escrow/{id}/release` | Release to beneficiary |
| POST | `/api/v1/escrow/{id}/refund` | Refund to originator |
| POST | `/api/v1/escrow/{id}/dispute` | Raise a dispute |

- **Release conditions:** `TIME_BASED` (auto-resolves at `releaseAt`), `EVENT_BASED`, `MANUAL`.
- **Scheduled sweep** (`@Scheduled`, every 5 min) auto-releases or auto-refunds expired `TIME_BASED` holds per `autoReleaseOnExpiry`.
- **Kafka:** `escrow.hold.created`, `escrow.hold.released`, `escrow.hold.refunded`, `escrow.hold.disputed`.

---

### 5. Settlement Service

**Purpose:** T+0/T+1 net settlement and scheme file generation
**Port:** 3018 · **Schema:** `settlement` · **Package:** `com.baalvion.settlement`

**REST Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/settlement/batches` | Create batch from items (gross/fee/net computed) |
| GET | `/api/v1/settlement/batches/{id}` | Batch detail |
| GET | `/api/v1/settlement/batches` | List (filter: scheme, status) |
| GET | `/api/v1/settlement/batches/{id}/items` | Batch line items |
| POST | `/api/v1/settlement/batches/{id}/generate` | Generate scheme file + SHA-256 checksum |
| GET | `/api/v1/settlement/batches/{id}/file` | Download generated file (text/plain) |
| POST | `/api/v1/settlement/batches/{id}/submit` | Mark submitted to scheme |

- **Scheme file formats:** Visa EP745-style, Mastercard T112/T140-style, Interswitch ISO 8583-style positional, generic pipe-delimited (NIP/Wallet). Header/detail/trailer + checksum.
- **Lifecycle:** `PENDING → GENERATED → SUBMITTED → RECONCILED` (or `FAILED`).
- **Kafka:** `settlement.batch.created`, `settlement.batch.submitted`.

---

### 6. Reconciliation Service

**Purpose:** Inbound settlement matching, exception detection and resolution workflow
**Port:** 3019 · **Schema:** `reconciliation` · **Package:** `com.baalvion.reconciliation`

**REST Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/reconciliation/runs` | Reconcile internal vs external records |
| GET | `/api/v1/reconciliation/runs/{id}` | Run summary |
| GET | `/api/v1/reconciliation/runs` | List runs |
| GET | `/api/v1/reconciliation/runs/{id}/items` | All items for a run |
| GET | `/api/v1/reconciliation/items` | List items (filter: status, e.g. `EXCEPTION`) |
| POST | `/api/v1/reconciliation/items/{id}/resolve` | Resolve an exception/unmatched item |

- **Matching** (keyed by `transactionRef`): both sides equal → `MATCHED`; both sides differ → `EXCEPTION`; one side only → `UNMATCHED`.
- **Exception workflow:** non-matched items routed to a queue, resolved manually (`resolvedBy`, note).
- **Kafka:** `settlement.batch.reconciled` (`matchedCount`, `exceptionCount`).

---

### 7. Audit Service

**Purpose:** Immutable audit trail and compliance log aggregation
**Port:** 3020 · **Schema:** `audit` · **Package:** `com.baalvion.audit`

**REST Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/audit/events` | Record an audit entry (services/gateway) |
| GET | `/api/v1/audit/events/{id}` | Fetch one entry |
| GET | `/api/v1/audit/events` | Query (filter: eventType, aggregateId, actor) |

- **Append-only:** entries have no `updatedAt`/`@Version`; `UPDATE`/`DELETE` revoked from `PUBLIC`. Payload stored as **JSONB with a GIN index** (design §6.3).
- **Kafka aggregator:** `AuditEventListener` subscribes by topic pattern `(payments|ledger|settlement|escrow|account)\..*` (configurable) and records every domain event it sees — the platform's first Kafka **consumer**. Tenant/aggregate extracted best-effort from the event body.
- `X-Trace-Id` correlation captured for distributed-trace stitching.

---

### 8. Reporting Service

**Purpose:** Async CSV/JSON/XLSX report generation, export and archival
**Port:** 3024 · **Schema:** `reporting` · **Package:** `com.baalvion.reporting`

**REST Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/reports` | Queue a report job → `202 ACCEPTED` (PENDING) |
| GET | `/api/v1/reports/{id}` | Job status |
| GET | `/api/v1/reports` | List jobs (filter: status) |
| GET | `/api/v1/reports/{id}/download` | Download finished artifact (attachment) |

- **Async pipeline:** `PENDING → PROCESSING → COMPLETED/FAILED`; generation runs on a `@Async` worker pool, kicked off via an `afterCommit` hook so the worker always sees the committed job.
- **Formats:** CSV (native, RFC-escaped), JSON (Jackson), **XLSX (Apache POI)** stored Base64. Caller supplies `columns` + `rows` (keeps the service self-contained).
- Idempotent on `reportRef`.

---

## Payment Processing Saga (choreographed) + Outbox + DLT

Implements the §4.2 saga and §4.3 / §9.3 reliability patterns across **Payment ↔ Ledger**:

```
POST /payments/initiate
  Payment: persist INITIATED  +  outbox row  (one DB tx → publish iff commit)
        └─ outbox publisher → payments.transaction.initiated
                                   │
                  Ledger @KafkaListener (group ledger-service-group)
                    ├─ post double-entry journal (debit source / credit dest)
                    ├─ success → payments.ledger.posted
                    └─ business reject → payments.ledger.failed     (terminal, no retry)
                                   │
                  Payment @KafkaListener (group payment-service-group)
                    ├─ on posted  → completePayment → payments.transaction.completed
                    └─ on failed  → failPayment (compensation) → payments.transaction.failed
```

**Transactional outbox (§9.3):** `payments.outbox_events` table; `PaymentService` writes the
event in the same transaction as the state change, `OutboxPublisher` (`@Scheduled`, 2s)
drains PENDING → Kafka → SENT (attempts/backoff, FAILED after `max-attempts`). Guarantees
publish-iff-commit. *(Single-publisher; for multi-replica switch to `FOR UPDATE SKIP LOCKED`.)*

**DLT + retry (§4.3):** both consumers use a `DefaultErrorHandler` with
`ExponentialBackOffWithMaxRetries(3)` at **1s / 5s / 25s**; exhausted records go to
`<topic>.DLT` via `DeadLetterPublishingRecoverer`. Business rejections are reported as
compensating events (not retried); only transient/infra exceptions retry then dead-letter.

**Idempotency:** saga listeners treat already-processed payments as a no-op on redelivery,
so duplicates don't churn into the DLT.

**Wire format:** all events are JSON **strings** (StringSerializer/StringDeserializer) — this
also fixed a latent ledger producer bug (bootstrap-servers placeholder was never resolved).

> Ledger entries still post as `PENDING` (no auto-`POSTED` transition yet) — pre-existing,
> tracked separately.

---

## Cross-Cutting Platform Capabilities

These span all services (most via the shared **`common-security`** library, auto-configured).

**Account balance integration (saga extension).** `account-service` consumes
`payments.transaction.completed` (debit source / credit destination) and `escrow.hold.*`
(debit on hold, credit on release, credit source on refund). An **inbox table**
(`accounts.processed_events`) makes every balance move exactly-once on redelivery; the
debit, paired credit, and inbox marker commit in one transaction. DLT + retry on the consumer.

**Resilience4j (design §9.1).** Payment's external scheme boundary (`SchemeRouter`) is wrapped
with `@CircuitBreaker` + `@Retry` + `@Bulkhead`; on failure it degrades to deferred routing
rather than failing the request. Tuned in `resilience4j.*` config. Transactions now carry a
`schemeRef`.

**DLT monitor + replay tool (design §4.3).** `audit-service` runs a `*.DLT` topic-pattern
consumer (its own group) that records dead-lettered messages to `audit.dlt_messages`, and
exposes `GET /api/v1/audit/dlt`, `POST /{id}/replay` (re-publishes to the original topic),
and `POST /{id}/discard`.

**Security (design §7).** `common-security` auto-configures an **opt-in RS256 resource server**:
with `app.security.enabled=true` + `spring.security.oauth2.resourceserver.jwt.issuer-uri`,
`/api/**` requires a valid JWT and `roles`/`permissions` claims map to authorities (RBAC);
default is permit-all (gateway-trusted) so nothing breaks until an issuer is configured.

**Risk service (port 3025, schema `risk`).** Consumes `payments.transaction.initiated`, scores
value + velocity rules → `APPROVE / REVIEW / DECLINE`, records `risk.risk_assessments`
(idempotent per txn), publishes `risk.assessment.completed`. Advisory/monitoring (not a blocking
gate yet). Endpoints: `GET /api/v1/risk/assessments`, `.../assessments/{id}`,
`.../transactions/{txnId}/assessment`.

**API contract (design §3).** Standard error envelope `{ code, message, traceId, timestamp }`
across all services; `X-Idempotency-Key` honoured on payment initiate; `POST /payments/bulk`
(per-item independent disbursement); reversal accepts a `reasonCode`.

**Observability (design §10).** `CorrelationIdFilter` propagates/mints `X-Trace-Id` into the MDC
+ response header. Shared `logback-spring.xml`: human-readable in dev, **structured JSON**
(Logstash encoder) under the `json`/`prod` profile, with **PII masking** (10+ digit runs +
accountNumber/email/phone). Prometheus metrics exposed. **OpenTelemetry/OTLP** is on the
classpath, sampling defaulted to 0 (enable via `MANAGEMENT_TRACING_SAMPLING_PROBABILITY` +
`MANAGEMENT_OTLP_TRACING_ENDPOINT`).

**Deployability (design §8).** Parametrized multi-stage `Dockerfile` (build arg `SERVICE`),
`docker-compose.yml` (Postgres + Kafka/Zookeeper + Redis + all 9 services), and
`deploy/k8s/financial-services.yaml` (namespace, config, secret, Deployment/Service for all 9
+ HPA 70% CPU, 2→10 replicas). Each service uses its own Flyway history table
(`flyway_history_<svc>`) since they share one database.

**Tests (design §8.3).** Testcontainers PostgreSQL integration tests for the account KYC state
machine + balance guards and the ledger double-entry/idempotency/reversal flow.

---

## Multi-Tenancy & Authorization

### Tenant Isolation Strategy

All services implement multi-tenancy via:

1. **Database Layer:**
   - Every entity has `tenant_id` UUID field
   - All queries filter by tenant_id (via Spring Security context)
   - PostgreSQL Row-Level Security (RLS) enforces tenant isolation at DB level
   - Setting: `app.current_tenant_id` via session variable

2. **API Layer:**
   - All requests include `X-Tenant-ID` header
   - Spring Security context extracted in controllers
   - All service methods receive tenantId parameter
   - Repositories filter all queries by tenant_id

3. **Example Flow:**
   ```
   POST /api/v1/ledger/entries
   X-Tenant-ID: 550e8400-e29b-41d4-a716-446655440000
   
   → EntryController.postEntry(tenantIdHeader)
   → LedgerService.postEntry(UUID tenantId, request)
   → repository.findByTenantAndTransactionRef(tenantId, ref)
   → Hibernate generates: SELECT * FROM ledger.journal_entries
                           WHERE tenant_id = $1 AND transaction_ref = $2
   ```

---

## Configuration

### Ledger Service (application.yml)

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate  # Flyway manages migrations
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQL10Dialect
        jdbc.batch_size: 25
        order_inserts: true

  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:baalvion}
    username: ${DB_USER:postgres}
    password: ${DB_PASSWORD:postgres}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 2

  kafka:
    bootstrap-servers: ${KAFKA_BROKERS:localhost:9092}
    producer:
      acks: all
      retries: 3
      compression-type: snappy

server:
  port: 3014
  compression.enabled: true

management:
  endpoints.web.exposure.include: health,info,metrics,prometheus
  metrics.export.prometheus.enabled: true
```

### Payment Service (application.yml)

```yaml
spring:
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD:}
    timeout: 2000
    database: 0

app:
  vat-rate: 0.075                    # 7.5% VAT on fees
  daily-limit: 1000000               # Max daily outflow per account
  transaction-min-limit: 100         # Min transaction amount
  transaction-max-limit: 500000      # Max transaction amount
  idempotency-ttl: 86400             # 24 hours
```

---

## Build & Deployment

### Local Build

```bash
cd Backend/services/commerce/financial-services-java

# Build both services
mvn clean install

# Run Ledger Service
java -jar ledger-service/target/ledger-service-1.0.0-SNAPSHOT.jar

# Run Payment Service
java -jar payment-service/target/payment-service-1.0.0-SNAPSHOT.jar
```

### Docker Compose

Add to `docker-compose.yml`:

```yaml
services:
  ledger-service:
    build:
      context: ./Backend/services/commerce/financial-services-java/ledger-service
      dockerfile: Dockerfile
    ports:
      - "3014:3014"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: baalvion
      KAFKA_BROKERS: kafka:9092
    depends_on:
      - postgres
      - kafka

  payment-service:
    build:
      context: ./Backend/services/commerce/financial-services-java/payment-service
      dockerfile: Dockerfile
    ports:
      - "3015:3015"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: baalvion
      KAFKA_BROKERS: kafka:9092
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      - postgres
      - kafka
      - redis
```

---

## Observability

### Metrics (Prometheus)

All services expose metrics at `/actuator/prometheus`:
- JVM metrics (heap, GC, threads)
- Database connection pool metrics
- Kafka producer/consumer metrics
- Business metrics: journal entries posted, payments initiated, fees collected

### Logging

Structured logging to stdout:
```
2026-05-29 10:15:23 - com.baalvion.ledger.service.LedgerService - Journal entry posted: id=550e8400..., tenant=..., ref=TXN-001, amount=100.00
```

### Health Checks

- `/actuator/health` - Overall health
- `/actuator/health/liveness` - Readiness
- `/actuator/health/readiness` - Startup

---

## Pending Work

**Done**: Account ✅ · Escrow ✅ · Settlement ✅ · Reconciliation ✅ · Audit ✅ (incl. first Kafka **consumer**) · Reporting ✅

This completes the bounded-context roster from the architecture PDF that belongs to this module
(Identity/Auth/Gateway/Notification/Admin are platform-owned and intentionally out of scope here).

Also done: **Payment↔Ledger saga** ✅ · **transactional outbox** (§9.3) ✅ · **DLT + 3× exp-backoff retry** (§4.3) ✅ ·
**Account balance saga + exactly-once inbox** ✅ · **Resilience4j scheme router** (§9.1) ✅ ·
**DLT monitor + replay tool** ✅ · **opt-in RS256/RBAC security** (§7) ✅ · **Risk service** ✅ ·
**standard error envelope + X-Idempotency-Key + /payments/bulk + reversal reason** (§3) ✅ ·
**JSON logging + PII masking + correlation-id + OTel deps** (§10) ✅ ·
**Dockerfile + docker-compose + K8s/HPA + per-service Flyway history** (§8) ✅ ·
**Testcontainers tests** (account, ledger) (§8.3) ✅. See *Cross-Cutting Platform Capabilities* above.

### Production Hardening (Phases 1–4) — done in this iteration

Architecture decisions are recorded in [docs/adr/](docs/adr/).

- **Security (§7) — secure by default.** `common-security` now enforces an RS256 resource
  server unless `app.security.enabled=false` (dev). Tenant is derived from the JWT
  (`TenantContext`), never the `X-Tenant-ID` header (IDOR closed). RBAC via roles/permissions
  claims; **ABAC** (`AbacPolicy` — initiator-or-admin reversal); **Bucket4j rate limiting**;
  **IP allowlisting** for sensitive paths; **TOTP/MFA** scaffolding (RFC 6238 `TotpService` +
  `MfaSecretStore` + filter); **maker-checker (4-eyes)** for high-value reversals
  (`payments.approval_requests` + `/api/v1/payments/approvals`). [ADR 0002]
- **Financial correctness.** Ledger entries now post as **POSTED** (balances reflect them);
  **escrow posts real double-entry journals** to a per-tenant suspense account (ledger
  `EscrowEventListener`); **reversal time-window** enforced (`app.reversal-window-hours`);
  **settlement auto-feeds** from `payments.transaction.completed` into the day's open batch.
- **Platform/infra.** **Helm chart** ([deploy/helm](deploy/helm)) templating all 9 services
  + HPA; **CI/CD with Trivy** staged at [deploy/ci/financial-services.yml](deploy/ci/financial-services.yml)
  (copy to repo-root `.github/workflows` to activate); **multi-replica-safe outbox**
  (`FOR UPDATE SKIP LOCKED`); **`@TimeLimiter`** completes the resilience set;
  **Prometheus alert rules** ([deploy/observability](deploy/observability)) + `outbox_pending`
  / `dlt_messages_dead` gauges.
- **Webhook delivery (§7.2).** audit-service now does **HMAC-SHA256-signed outbound webhooks**:
  subscriptions (`/api/v1/audit/webhooks`), fan-out on the aggregation path, `WebhookDispatcher`
  (`@Scheduled`, `FOR UPDATE SKIP LOCKED`) with exponential-backoff retry, DLQ (FAILED), and
  `X-Webhook-Id` idempotency. [ADR 0007]
- **Distributed rate limiting (§7.2).** `RateLimiterBackend` SPI — in-memory Bucket4j (default)
  or **Redis fixed-window** (`app.security.rate-limit.backend=redis`, fail-open, cluster-wide).
  Redis health probe disabled by default so it's a zero-impact opt-in. [ADR 0008]
- **ISO 8583 scheme integration (§3).** Real `Iso8583Codec` (ASCII, primary/secondary bitmap,
  FIXED/LLVAR/LLLVAR, unit-tested) + length-prefixed TCP `Iso8583Client` + Interswitch/NIP
  adapters building a 0200 / parsing a 0210, config-gated on endpoint (simulated fallback
  otherwise). Card schemes + PIN/MAC/HSM are certification-gated. [ADR 0009]
- **SFTP settlement delivery (§5.4).** `SftpSettlementFileTransport` (sshj) — mandatory
  host-key verification, key/password auth, `.sha256` sidecar, upload validation, retry;
  selected by `app.settlement.transport=sftp`. [ADR 0010]
- **Ops & observability (§9–§14).** Grafana dashboard
  ([deploy/observability/grafana-financial-overview.json](deploy/observability/grafana-financial-overview.json)),
  Helm **env overlays** (`values-staging.yaml`, `values-prod.yaml` — multi-AZ DB / 3-broker
  Kafka / Redis HA / OTel sampling / JSON logging), and **operational runbooks**
  ([docs/runbooks/](docs/runbooks/): deployment+rollback, incident response, DLQ replay,
  backup/restore+PITR, failover/DR).
- **Elasticsearch audit search (§6.4).** `ElasticsearchAuditSearchPort` (real, property-gated by
  `app.audit.search=elasticsearch`) indexes audit entries via `ElasticsearchOperations` —
  fail-open and idempotent (doc id = audit id). Postgres JSONB+GIN remains the default + source
  of record. [ADR 0005]
- **Encrypted KYC document vault (§6.4/§7.3).** account-service stores KYC documents
  **AES-256-GCM-encrypted at rest** (`accounts.kyc_documents`: per-doc IV, plaintext SHA-256,
  RLS, status lifecycle, scheduled retention purge); upload/list/metadata/content/status/delete
  API. Postgres-backed; Mongo/S3 are drop-in stores behind the service API. [ADR 0011]
- **Inbound advice ingestion (§5.4).** reconciliation-service `@Scheduled` poller over an
  `AdviceSource` (local-directory default, **sshj SFTP** option) parses pipe-delimited advice
  files (`RECON|runRef|tenantId`, `INT|…`, `EXT|…`) and submits idempotent reconciliation runs;
  poison files quarantined, success archived, `reconciliation.advice.*` counters exported.
  Off by default (`app.reconciliation.inbound.enabled`). Camel evaluated/deferred. [ADR 0012]
- **Advanced seams.** Pluggable **`SchemeAdapter`** registry [ADR 0003];
  **`SettlementFileTransport`** (SFTP/email drop-in) [ADR 0004]; **`AuditSearchPort`**
  (Elasticsearch drop-in) [ADR 0005]; Kafka EOS via outbox+inbox+idempotent producer [ADR 0001];
  secrets via K8s Secret + External Secrets Operator [ADR 0006].
- **API documentation (§14).** springdoc-openapi on every web module; a shared OpenAPI bean in
  `common-security` declares the HTTP-bearer (JWT) scheme so Swagger UI offers "Authorize". Docs
  paths (`/v3/api-docs/**`, `/swagger-ui/**`) are permitted in the secured chain and **disabled in
  prod** (`SPRINGDOC_*_ENABLED=false` in `values-prod.yaml`).
- **Verifiable unit tests (§8.3).** Pure JUnit (JDK17, no infra) for the security/financial
  primitives: `FeeEngineTest` (per-scheme fee + VAT + limit math), `TotpServiceTest` (RFC 6238
  round-trip + drift), `KycEncryptionServiceTest` (AES-256-GCM round-trip + GCM tamper detection +
  missing-key guard), `WebhookSignerTest` (HMAC-SHA256 known-answer vector), and `AbacPolicyTest`
  (owner-or-role authZ via a stubbed Spring SecurityContext), alongside the existing
  `Iso8583CodecTest`.
- **Documentation set (§14).** [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) (full env-var reference),
  [docs/SECURITY.md](docs/SECURITY.md) (trust model + prod hardening checklist),
  [docs/ONBOARDING.md](docs/ONBOARDING.md) (local dev), and
  [docs/SERVICE-CATALOG.md](docs/SERVICE-CATALOG.md) (ports/schemas/packages/group-ids, the full
  Kafka produce/consume topology, and primary endpoints).

Remaining (needs running external infra to implement + verify — stabilization phase):

1. **Concrete external integrations:** real Visa/MC/NIP/Interswitch `SchemeAdapter`s, an SFTP
   `SettlementFileTransport`, an Elasticsearch `AuditSearchPort`, MongoDB KYC-document store
   (no consumer yet — see ADR 0005), and Apache Camel routes for inbound scheme-advice parsing.
2. **Enforce risk `DECLINE`** in payment (currently advisory) and connect MFA enrolment to Identity.
3. **Grafana dashboards**, Istio mTLS/NetworkPolicy, External Secrets Operator wiring, and
   activating the CI workflow at the repo root.
4. **Stabilization/testing phase:** full `mvn verify` on JDK 17, broaden Testcontainers coverage
   to the remaining services, and an end-to-end saga test with the identity stack.

---

## Testing

### Integration Tests (JUnit 5 + Testcontainers)

```java
@Testcontainers
class LedgerServiceIntegrationTest {
  
  @Container
  static PostgreSQLContainer<?> postgres = 
    new PostgreSQLContainer<>("postgres:15")
      .withDatabaseName("baalvion")
      .withUsername("postgres")
      .withPassword("postgres");

  @Test
  void testPostEntry() {
    // Create entry, verify idempotency, retrieve, reverse
  }
}
```

### Manual Testing (cURL)

```bash
# Create journal entry
curl -X POST http://localhost:3014/api/v1/ledger/entries \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "transactionRef": "TXN-001",
    "debitAccountId": "...",
    "creditAccountId": "...",
    "amount": 100.00,
    "currency": "USD",
    "entryType": "PAYMENT"
  }'

# Initiate payment
curl -X POST http://localhost:3015/api/v1/payments/initiate \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "idempotencyKey": "PAY-001",
    "sourceAccountId": "...",
    "destinationAccountId": "...",
    "amount": 100.00,
    "currency": "USD",
    "paymentScheme": "VISA"
  }'
```

---

## References

- [Spring Boot 3.2 Documentation](https://spring.io/projects/spring-boot)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Flyway Migrations](https://flywaydb.org/)
- [Apache Kafka](https://kafka.apache.org/)
- [Micrometer Prometheus](https://micrometer.io/docs/registry/prometheus)
- [Resilience4j](https://resilience4j.readme.io/)
