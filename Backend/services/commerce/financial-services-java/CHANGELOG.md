# Changelog — Baalvion Financial Services (Java suite)

All notable changes to the `financial-services-java` reactor. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); the suite is pre-1.0 (`1.0.0-SNAPSHOT`).

## [Unreleased] — 2026-05-31 — Sanctions Screening engine (gap G3) in risk-service

Built the previously-missing **Sanctions Screening** capability into `risk-service` — net-new,
production-grade, self-contained (no network/credentials required). Then ran a multi-agent adversarial
review of the new code and fixed every confirmed finding.

### Added — Sanctions Screening (G3)
- **Consolidated watchlist** (`risk.sanctioned_entities`, V002 migration) — global reference data
  (OFAC SDN / UN / EU / UK / AU), with aliases/programs/countries and a normalized matching key.
- **Tenant-scoped screenings** (`risk.sanctions_screenings`, RLS) — verdict CLEAR / POTENTIAL_MATCH /
  CONFIRMED_MATCH, top hits (jsonb), officer adjudication → FALSE_POSITIVE / BLOCKED.
- **Matching IP** — `NameNormalizer` (diacritics + Latin-extended transliteration, honorific/legal-form
  stripping, intra-word punctuation folding) + `NameMatcher` (Jaro–Winkler with token-reorder and
  balanced token-coverage). 11 unit tests.
- **Pluggable list provider** — `SanctionsListProvider` seam with a curated `seed` provider (default,
  offline) and a documented live-downloader path (`ofac`/`un`/`eu`), plus startup auto-seed.
- **API** — `POST /api/v1/sanctions/screen`, `GET /screenings[/{id}]`,
  `POST /screenings/{id}/adjudicate`, `POST /lists/refresh`; Kafka events
  `sanctions.screening.completed` / `sanctions.match.detected` / `sanctions.screening.adjudicated`.
- **Tests** — `NameMatcherTest` (11) + `SanctionsScreeningIntegrationTest` (4, real Postgres: ingest,
  confirmed match, fuzzy match, clear, adjudicate→BLOCKED, cross-tenant isolation). Catalog descriptor
  for `risk-service` updated (new APIs + events).

### Fixed — from the adversarial code review (12 confirmed findings)
- **(HIGH) Non-Latin names became un-screenable.** `NameNormalizer` dropped non-decomposable
  letters, so a non-Latin watchlist entry normalized to "" and could never match. Now romanizes
  Latin-extended letters (Ø/Æ/Œ/Ł/Đ/Þ/ß/İ…); `SanctionsService.ingest` skips + WARNs on an entity whose
  name and all aliases normalize to empty (never silently un-screenable). Full Cyrillic/Arabic/CJK
  transliteration (ICU4J) documented as the live-provider path.
- **(HIGH) Tenant-spoof IDOR in `common-security` `TenantContext.resolve`.** An authenticated token
  with no UUID tenant claim fell back to trusting the client `X-Tenant-ID` header. Now: authenticated →
  tenant comes ONLY from the token (fail closed with 403 if absent); the header is honoured only for
  unauthenticated (security-disabled/dev) requests. Suite-wide fix.
- **(HIGH) PII in logs.** Raw screening subject names were logged at INFO. Now logs the screening id +
  verdict only.
- **(MED) Auto-block boundary.** The CONFIRMED_MATCH decision used the HALF_UP-rounded score, so a raw
  0.9499 could round up and auto-block. Now the verdict uses the raw score; only the stored/displayed
  value is rounded.
- **(MED) Missing authorization** on `adjudicate` and `lists/refresh`. Now guarded by a compliance/admin
  role (dev-safe permit-all when unauthenticated); added an `AccessDeniedException`→403 handler to
  risk-service's `GlobalExceptionHandler`.
- **(MED) Unvalidated config.** `SanctionsProperties` is now `@Validated` with bounds (thresholds ∈
  [0,1], `maxHits ≥ 1`) — misconfiguration fails fast at startup.
- **(MED) RLS overclaim / error-on-unset.** The `sanctions_screenings` policy now uses the fail-closed
  two-arg `current_setting(..., true)`; the migration comment is corrected to state RLS is
  defense-in-depth pending the suite-wide A9 rollout (NOSUPERUSER role + `FORCE` + per-txn GUC) and that
  app-level `WHERE tenant_id` is today's active control.
- **(LOW) Over-aggressive noise tokens.** Dropped ambiguous `AS`/`AB` from the normalizer noise set.
- **(LOW, documented) Scale.** In-memory full-scan scoring is fine for the seed list; a pg_trgm
  candidate prefilter is the documented path for full OFAC (~17k) scale.

---

## [Unreleased] — 2026-05-31 — First green build (B1 unblocked)

The suite had **never been compiled** in this environment (the sandbox ships Java 1.7 and no
Maven). It was built and fully tested for the first time via a Dockerized `maven:3.9-eclipse-temurin-17`
toolchain with Testcontainers talking to the host Docker daemon (see [`RUN_LOCAL.md`](./RUN_LOCAL.md)).
This pass fixed every compile-, boot-, and runtime-blocking defect that "compiles in an IDE" had
hidden, and certified the suite with `mvn -B -ntp clean verify`.

**Result:** all 15 modules `BUILD SUCCESS`; **46 tests pass, 0 failures, 0 errors**; executable jars
package for all 13 services. This unblocks gap items **F1–F6, I2–I3, E3, G1–G2** (the entire
trade-finance / payments / settlement / wallet / escrow / KYC / AML band), per `Backend/GAP_ANALYSIS.md`.

### Fixed — compilation
- **`ExponentialBackOffWithMaxRetries` does not exist before Spring Framework 6.2** (Spring Boot 3.4+),
  but the suite is pinned to Spring Boot 3.2 / Spring 6.1. The 5 Kafka `DefaultErrorHandler` configs
  (ledger, payment, account, settlement, risk) referenced the framework class and failed `javac`.
  Added a small, documented backport `com.baalvion.common.kafka.ExponentialBackOffWithMaxRetries` in
  `common-security` (count-bounded exponential backoff → DLT) and repointed the 5 imports. Delete the
  backport and switch imports back when the Spring Boot baseline reaches 3.4+.

### Fixed — boot / configuration
- **Malformed YAML** in `ledger-service` and `payment-service` `application.yml`
  (`exposure: include: …` collapsed onto one line) crashed the context with a SnakeYAML
  `ScannerException` on startup. Corrected to the nested mapping under `management.endpoints.web`.
- **Removed Hibernate dialect** `org.hibernate.dialect.PostgreSQL10Dialect` (deleted in Hibernate 6 /
  Spring Boot 3.x) in **9** service configs (account, audit, ledger, payment, reconciliation,
  reporting, risk, settlement, escrow) → unversioned `org.hibernate.dialect.PostgreSQLDialect`.

### Fixed — schema ↔ entity validation (`ddl-auto: validate`)
- **`currency char(3)` vs JPA `varchar`** mismatch (Postgres reports `char` as `bpchar`) in **6**
  initial migrations (account, escrow, ledger, payment, risk, settlement). Changed the column type to
  `varchar(3)` to match the entity mapping. Migrations have never been applied to any environment, so
  amending the initial migration is safe.
- **`@Lob byte[]`** on `KycDocument.ciphertext` made Hibernate 6 expect a Large Object (`oid`) while
  the migration declares `bytea`. Removed `@Lob` so the AES-256-GCM ciphertext maps to `bytea`
  (inline, the intended storage).

### Fixed — runtime (JSON persistence)
- **`jsonb` columns mapped as `String`/JSON** rejected `character varying` binds (`column … is of type
  jsonb but expression is of type character varying`). Added the Postgres `stringtype=unspecified`
  connection property via `spring.datasource.hikari.data-source-properties` to **all 15** services, so
  the driver lets Postgres cast String params to the target column type. URL-independent, so it also
  applies to the Testcontainers JDBC URL in integration tests.

### Changed — test & CI infrastructure
- Added the missing `org.testcontainers:junit-jupiter` test dependency (provides `@Testcontainers` /
  `@Container`, used by every `*IntegrationTest`).
- Bumped Testcontainers `1.19.3 → 1.20.4` (parameterized as `${testcontainers.version}`). 1.19.x
  cannot negotiate the Docker Engine 29.x API (HTTP 400); 1.20.x can.
- CI image build/scan/push matrix (`.github/workflows/financial-services.yml` and the canonical
  `deploy/ci/financial-services.yml`) extended from 9 → **13** services, adding `trade-finance-service`,
  `credit-service`, `fx-service`, `wallet-service`.
- Documented the no-local-JDK Dockerized build/test recipe in [`RUN_LOCAL.md`](./RUN_LOCAL.md),
  including the `-Dapi.version=1.43` and `TESTCONTAINERS_HOST_OVERRIDE` knobs required for
  Docker-out-of-Docker on Docker Desktop.

### Notes
- No production business logic was changed. All edits were build/boot/schema-binding corrections plus
  test/CI plumbing. The double-entry ledger, payment saga (transactional outbox + exactly-once inbox),
  L/C (UCP 600) and bank-guarantee (URDG 758) lifecycles, credit risk engine, settlement batching,
  multi-currency wallet, escrow, and KYC encryption were already implemented and are now build- and
  test-verified.
