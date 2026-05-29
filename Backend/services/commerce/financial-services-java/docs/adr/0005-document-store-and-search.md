# ADR 0005 — MongoDB (documents) & Elasticsearch (search): seams now, adopt with infra

**Status:** Accepted (partially deferred)

## Context
The design (§6.4) specifies MongoDB for KYC documents / scheme configuration and Elasticsearch
for audit search & analytics. Bolting these on without their running infrastructure would add
auto-configuration that fails at startup and could not be verified here.

## Decision
- **Audit search (IMPLEMENTED, property-gated)**: `AuditService` indexes every entry through the
  `AuditSearchPort`. `AuditSearchConfig` selects the implementation: `ElasticsearchAuditSearchPort`
  when `app.audit.search=elasticsearch` (uses `ElasticsearchOperations.save` into the
  `app.audit.es-index` index; document id = audit id ⇒ idempotent/replay-safe; **fail-open** so
  an ES outage never blocks the audit write path), otherwise `NoOpAuditSearchPort` (PostgreSQL
  JSONB + GIN remains the search store and system of record). `spring-boot-starter-data-elasticsearch`
  is on the classpath but the ES health indicator is disabled by default and the ES client
  connects lazily, so the default (`postgres`) build boots without any ES. Index retention/ILM
  (rollover write-alias + policy) is applied on the ES cluster, not in app code.
- **MongoDB (still deferred)**: no consumer yet (KYC-document storage isn't implemented in
  account-service). Adopt by adding a `DocumentStore` port to account-service mirroring this
  pattern, gated on `app.kyc.store=mongodb`. Not built yet to avoid an unused, unverifiable
  persistence runtime on the default classpath.

## Consequences
- Elasticsearch audit search is real and a pure config switch (`AUDIT_SEARCH=elasticsearch` +
  `spring.elasticsearch.uris`); Postgres GIN remains the correct default and source of record.
- MongoDB remains a documented seam pending the KYC-document feature + a running cluster.
