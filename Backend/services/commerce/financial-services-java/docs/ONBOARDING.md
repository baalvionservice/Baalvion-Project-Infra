# Developer Onboarding — Local Development

How to get the financial-services module building and running on your machine.

## Prerequisites

- **JDK 17** (`java -version` should report 17.x). The build is pinned to Java 17.
- **Maven 3.9+** (or use the IDE's bundled Maven).
- **Docker** (for PostgreSQL + Kafka + Redis via `docker-compose`).
- Optional: an IDE with Lombok support enabled (annotation processing on).

## Layout

```
financial-services-java/
├── pom.xml                 # parent (forces JPA+Postgres+Flyway+Kafka on every module)
├── common-security/        # shared security/observability library (auto-configured)
├── ledger-service/         # 3014   double-entry bookkeeping
├── payment-service/        # 3015   payments, fees, idempotency, ISO 8583, outbox, saga
├── account-service/        # 3016   accounts, balances, KYC vault
├── escrow-service/         # 3017   conditional holds
├── settlement-service/     # 3018   T+0/T+1 batches, scheme files, SFTP out
├── reconciliation-service/ # 3019   matching, exceptions, inbound advice ingestion
├── audit-service/          # 3020   append-only audit, Kafka aggregator, DLT, webhooks
├── reporting-service/      # 3024   async CSV/JSON/XLSX exports
├── risk-service/           # 3025   transaction risk scoring
├── deploy/                 # helm, k8s, ci, observability
└── docs/                   # this set + ADRs + runbooks
```

## 1. Start infrastructure

```bash
cd Backend/services/commerce/financial-services-java
docker compose up -d postgres kafka zookeeper redis
```

The schemas are created by Flyway on first boot; the services share one database (`baalvion`) with
one schema each.

## 2. Build

```bash
mvn clean install            # builds common-security first, then all services + runs tests
mvn -pl payment-service -am install   # build one service and its deps
```

> `common-security` is a library (no `main`) — its Spring Boot repackage is skipped; it is consumed
> as a normal jar dependency by the services.

## 3. Run a service (security off for local)

The fastest local loop disables the resource server so you don't need a running issuer:

```bash
APP_SECURITY_ENABLED=false \
  java -jar payment-service/target/payment-service-1.0.0-SNAPSHOT.jar
```

With security **on**, point it at the platform issuer:

```bash
APP_SECURITY_ENABLED=true \
OAUTH_ISSUER_URI=http://localhost:3023 \
OAUTH_JWK_SET_URI=http://localhost:3023/.well-known/jwks.json \
  java -jar payment-service/target/payment-service-1.0.0-SNAPSHOT.jar
```

## 4. Explore the API

With springdoc enabled (default in dev), each service serves:

- Swagger UI: `http://localhost:<port>/swagger-ui.html`
- OpenAPI JSON: `http://localhost:<port>/v3/api-docs`

Click **Authorize** and paste a bearer JWT to call secured endpoints.

## 5. Smoke test (security off)

```bash
# Post a journal entry
curl -X POST http://localhost:3014/api/v1/ledger/entries \
  -H 'Content-Type: application/json' \
  -d '{"transactionRef":"TXN-001","debitAccountId":"...","creditAccountId":"...","amount":100.00,"currency":"USD","entryType":"PAYMENT"}'

# Initiate a payment
curl -X POST http://localhost:3015/api/v1/payments/initiate \
  -H 'Content-Type: application/json' \
  -H 'X-Idempotency-Key: PAY-001' \
  -d '{"sourceAccountId":"...","destinationAccountId":"...","amount":100.00,"currency":"USD","paymentScheme":"VISA"}'
```

## Tests

```bash
mvn test                                   # unit + Testcontainers integration tests
mvn -pl payment-service test               # one module
```

- **Pure unit tests** (no infra): `FeeEngineTest`, `TotpServiceTest`, `KycEncryptionServiceTest`,
  `WebhookSignerTest`, `Iso8583CodecTest`.
- **Integration tests** (Testcontainers PostgreSQL): account, ledger, escrow, reconciliation, risk.
  These set `app.security.enabled=false` so they boot without an issuer.

## Common pitfalls

- **Service won't start with "requires issuer-uri".** Security is on by default — set
  `APP_SECURITY_ENABLED=false` for local, or provide an issuer/JWK.
- **`ddl-auto` is `validate`.** The schema must match the entities; let Flyway run (don't hand-edit
  tables).
- **Lombok.** Enable annotation processing in your IDE or you'll see "cannot find symbol" for
  generated getters/builders.

See [ENVIRONMENT.md](ENVIRONMENT.md), [SECURITY.md](SECURITY.md),
[SERVICE-CATALOG.md](SERVICE-CATALOG.md), and the runbooks in [docs/runbooks/](runbooks/).
