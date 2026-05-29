# ADR 0012 — Inbound settlement-advice ingestion (scheduled poller, not Apache Camel)

**Status:** Accepted

## Context
Phase 4 requires inbound settlement-advice file ingestion: SFTP/file polling, parsing, routing
to the reconciliation engine, archival, poison-message handling, retries, idempotency, and
observability (design §5.4). The PDF names Apache Camel for these flows.

## Decision
Implement ingestion in **reconciliation-service** (its bounded context) with a scheduled poller
over a pluggable `AdviceSource`:
- `LocalDirectoryAdviceSource` (default) — NIO directory polling, with a quiet-period to skip
  partially-written files; archive/ and error/ subdirectories.
- `SftpAdviceSource` — sshj-based remote polling with **mandatory host-key verification**,
  key/password auth, download + remote archive/error rename.
- `AdviceFileParser` — parses the pipe-delimited advice format (`RECON|runRef|tenantId|source`,
  `INT|ref|amount`, `EXT|ref|amount`) into a `ReconcileRequest`.
- `InboundAdviceIngestionService` (`@Scheduled`) drains the source, submits a reconciliation run
  per file (**idempotent** on runRef), archives on success, quarantines poison files to error/,
  and exports `reconciliation.advice.ingested|failed` counters. Failures are isolated per file.
- `InboundIngestionConfig` is `@ConditionalOnProperty(app.reconciliation.inbound.enabled=true)`,
  so the poller is **off by default** (no SFTP connection at startup).

**Why not Apache Camel here:** Camel auto-starts a version-coupled `CamelContext` and its
route DSL/auto-configuration could not be compiled or run in this build-less environment —
adding it blind risks the service's startup. The scheduled poller + `AdviceSource` delivers the
same EIP value (poll, parse, route, archive, dead-letter, retry/backoff via the next poll,
idempotency, metrics) using verifiable Spring/JDK/sshj primitives. Migrating these flows to Camel
routes is a clean follow-up once the integration can be built and verified.

## Consequences
- Real, complete, off-by-default inbound ingestion with SFTP or local-directory sources.
- Idempotent + poison-isolated + observable; reuses the existing reconciliation engine.
- The advice file carries `tenantId` (per-tenant file drops); multi-file scheme formats are added
  to `AdviceFileParser` as needed.
