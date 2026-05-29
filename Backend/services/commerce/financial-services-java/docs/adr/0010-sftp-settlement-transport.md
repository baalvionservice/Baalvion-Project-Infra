# ADR 0010 — Production SFTP settlement-file transport (sshj)

**Status:** Accepted

## Context
ADR 0004 defined the `SettlementFileTransport` port with a logging default. Real scheme
delivery is over SFTP and must be secure and verifiable.

## Decision
Implement `SftpSettlementFileTransport` with **sshj**:
- **Mandatory host-key verification** — a configured `known-hosts` file or a fixed fingerprint;
  promiscuous verification is allowed only when `insecure-allow-any-host-key=true` (dev). With
  neither configured, the transport refuses to connect.
- Password **or** private-key auth; credentials come from the secret store (never in code).
- Uploads the file **and a `.sha256` checksum sidecar**, then validates by re-stat'ing the
  remote size; retries transient failures with backoff.
- Wired deterministically by `SettlementTransportConfig`: SFTP when
  `app.settlement.transport=sftp`, else the logging no-op (`@ConditionalOnMissingBean`).

## Consequences
- Production-grade, secure delivery with integrity verification; activated purely by config.
- Default/dev behaviour is unchanged (logging transport).
- Inbound advice ingestion (Apache Camel SFTP polling) is the complementary inbound flow; it
  reuses the same credentials/known-hosts config and is implemented when the SFTP endpoint is
  provisioned.
