# ADR 0004 — Settlement file delivery behind a transport port

**Status:** Accepted

## Context
Generated settlement files must reach scheme endpoints over SFTP/email (design §5.4). The
delivery channel varies per scheme/environment and needs credentials/connectivity.

## Decision
Introduce a `SettlementFileTransport` port. `SettlementService.submit()` generates the file
(scheme-specific format + SHA-256), persists it, then calls `transport.deliver(...)`. The
default `LoggingSettlementFileTransport` records the delivery; an SFTP/email/S3 bean replaces
it (it wins via `@ConditionalOnMissingBean`) with no service change.

## Consequences
- The end-to-end flow (create → generate → submit → deliver) is complete without external
  connectivity.
- A real SFTP transport (e.g. using `sshj`) is added in the stabilization phase with its
  credentials sourced from the secret store (ADR 0006).
