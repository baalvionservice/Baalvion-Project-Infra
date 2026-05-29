# Environment & Configuration Reference

Every service is a Spring Boot 3.2 app and follows 12-factor config: defaults live in each
service's `application.yml`, and every value is overridable by an environment variable (Spring
relaxed binding — `app.security.enabled` ⇄ `APP_SECURITY_ENABLED`). This file is the canonical
list of what each variable does, its default, and where it matters.

> Secrets (`DB_PASSWORD`, `KYC_ENCRYPTION_KEY`, SFTP keys, scheme credentials) must come from the
> secret store (K8s Secret + External Secrets Operator, ADR 0006) — never commit real values.

## Core (all services)

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | per-service (see [SERVICE-CATALOG.md](SERVICE-CATALOG.md)) | HTTP listen port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `baalvion` | Database name (one DB, schema-per-service) |
| `DB_USER` | `postgres` | DB user |
| `DB_PASSWORD` | `postgres` (dev only) | DB password — **secret in non-dev** |
| `KAFKA_BROKERS` | `localhost:9092` | Kafka bootstrap servers (comma-separated) |
| `SPRING_PROFILES_ACTIVE` | _(none)_ | `prod`/`json` ⇒ structured JSON logging + PII masking (`logback-spring.xml`) |

`ddl-auto` is `validate` everywhere; **Flyway** owns schema (per-service history table
`flyway_history_<svc>`).

## Security (`common-security`, all services)

| Variable | Default | Purpose |
|----------|---------|---------|
| `APP_SECURITY_ENABLED` | `true` | Master switch. `true` ⇒ RS256 resource server enforced on `/api/**`; **requires an issuer/jwk** or startup fails. Set `false` only for local/dev. |
| `OAUTH_ISSUER_URI` | _(none)_ | RS256 issuer (bridged to `spring.security.oauth2.resourceserver.jwt.issuer-uri` by the env post-processor) |
| `OAUTH_JWK_SET_URI` | _(none)_ | JWKS endpoint (alternative/addition to issuer-uri) |
| `APP_SECURITY_RATE_LIMIT_ENABLED` | `true` | Toggle Bucket4j rate limiting |
| `APP_SECURITY_RATE_LIMIT_BACKEND` | `memory` | `memory` (per-instance) or `redis` (cluster-wide fixed window) |
| `APP_SECURITY_RATE_LIMIT_CAPACITY` | `200` | Burst capacity |
| `APP_SECURITY_RATE_LIMIT_REFILL_TOKENS` | `200` | Tokens per refill period |
| `APP_SECURITY_RATE_LIMIT_REFILL_PERIOD_SECONDS` | `60` | Refill period |
| `APP_SECURITY_IP_ALLOWLIST` | _(empty ⇒ allow all)_ | CIDRs/IPs permitted on `app.security.ip.protected-paths` |
| `APP_SECURITY_IP_PROTECTED_PATHS` | _(empty)_ | Path prefixes the IP allowlist guards (e.g. `/api/v1/audit/dlt`) |
| `APP_SECURITY_MFA_PROTECTED_PATHS` | _(empty)_ | Path prefixes requiring a valid TOTP when the caller is MFA-enrolled |
| `APP_SECURITY_MFA_HEADER` | `X-MFA-Code` | Header carrying the TOTP code |

Claim mapping (gateway-contract aligned, override only if the token contract changes):
`app.security.claims.tenant` (default candidates `org_id,orgId,tenant_id,tenantId`),
`.user` (`sub`), `.roles` (`roles`), `.permissions` (`permissions`).

### Redis (only when `APP_SECURITY_RATE_LIMIT_BACKEND=redis`, and payment-service idempotency)

| Variable | Default | Purpose |
|----------|---------|---------|
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | _(empty)_ | Redis auth |

Redis health probe is disabled by default, so a `redis` backend is a zero-impact opt-in.

## Observability

| Variable | Default | Purpose |
|----------|---------|---------|
| `MANAGEMENT_TRACING_SAMPLING_PROBABILITY` | `0.0` | OTel trace sampling (e.g. `0.1` in prod) |
| `MANAGEMENT_OTLP_TRACING_ENDPOINT` | _(none)_ | OTLP collector endpoint for traces |

Metrics are always at `/actuator/prometheus`; health at `/actuator/health` (+ `liveness`/`readiness`).

## API docs (springdoc, all services)

| Variable | Default | Purpose |
|----------|---------|---------|
| `SPRINGDOC_API_DOCS_ENABLED` | `true` | Serve OpenAPI JSON at `/v3/api-docs` — **set `false` in prod** |
| `SPRINGDOC_SWAGGER_UI_ENABLED` | `true` | Serve Swagger UI at `/swagger-ui.html` — **set `false` in prod** |

## Payment service

| Variable / property | Default | Purpose |
|----------|---------|---------|
| `app.vat-rate` | `0.075` | VAT applied on fees |
| `app.daily-limit` | `1000000` | Max daily outflow per source account |
| `app.transaction-min-limit` | `100` | Min transaction amount |
| `app.transaction-max-limit` | `500000` | Max transaction amount |
| `app.idempotency-ttl` | `86400` | Idempotency cache TTL (seconds) |
| `app.reversal-window-hours` | _(code default)_ | Max age of a payment that may be reversed |

### Scheme adapters (ISO 8583) — inert until a host is set

Set `app.scheme.interswitch.host` / `app.scheme.nip.host` to activate the real ISO 8583 adapter
for that scheme; otherwise the simulated fallback is used. Per scheme (`interswitch`/`nip`):
`host`, `port`, `processing-code`, `terminal-id`, `merchant-id`, `connect-timeout-ms`,
`read-timeout-ms`, plus `institution-code` (NIP) / `acquirer-id` (Interswitch).
Card schemes (Visa/MC) and PIN/MAC/HSM are certification-gated and not enabled here.

## Account service

| Variable | Default | Purpose |
|----------|---------|---------|
| `KYC_ENCRYPTION_KEY` | dev passphrase | High-entropy secret; a 256-bit AES-GCM key is derived from it (SHA-256). **Secret in non-dev.** |

## Audit service

| Variable / property | Default | Purpose |
|----------|---------|---------|
| `AUDIT_SEARCH` | `postgres` | `postgres` (JSONB+GIN, source of record) or `elasticsearch` (`ElasticsearchAuditSearchPort`) |
| `AUDIT_ES_INDEX` | `baalvion-audit` | Elasticsearch index name |
| `app.audit.topic-pattern` | `(payments\|ledger\|settlement\|escrow\|account)\..*` | Topics the aggregator consumes |

## Reconciliation service (inbound advice ingestion — off by default)

| Variable | Default | Purpose |
|----------|---------|---------|
| `RECON_INBOUND_ENABLED` | `false` | Enable the scheduled advice-file poller |
| `RECON_INBOUND_SOURCE` | `local` | `local` (directory) or `sftp` |
| `RECON_INBOUND_DIR` | `./inbound/reconciliation` | Local poll directory |
| `RECON_SFTP_HOST` / `_PORT` / `_USERNAME` / `_PASSWORD` | / `22` / / | SFTP connection |
| `RECON_SFTP_KEY_PATH` | _(empty)_ | Private key for key auth |
| `RECON_SFTP_KNOWN_HOSTS` / `RECON_SFTP_FINGERPRINT` | _(empty)_ | **Mandatory host-key verification** material |
| `RECON_SFTP_INSECURE` | `false` | Disable host-key check (**never in prod**) |
| `RECON_SFTP_INBOUND_DIR` / `_ARCHIVE_DIR` / `_ERROR_DIR` | `/inbound` / `/inbound/archive` / `/inbound/error` | Remote dirs |

## Settlement service (file transport)

| Property | Default | Purpose |
|----------|---------|---------|
| `app.settlement.transport` | `logging` | `logging` (dev) or `sftp` |
| `app.settlement.sftp.host` / `.port` / `.username` / `.password` | / `22` / / | SFTP connection |
| `app.settlement.sftp.private-key-path` | _(empty)_ | Key auth |
| `app.settlement.sftp.known-hosts-path` / `.host-key-fingerprint` | _(empty)_ | **Mandatory host-key verification** |
| `app.settlement.sftp.insecure-allow-any-host-key` | `false` | Disable host-key check (**never in prod**) |
| `app.settlement.sftp.remote-dir` | _(set)_ | Upload directory |
| `app.settlement.sftp.max-attempts` / `.connect-timeout-ms` | retry tuning | |

See [SECURITY.md](SECURITY.md) for the trust model and [SERVICE-CATALOG.md](SERVICE-CATALOG.md)
for ports/schemas/topics.
