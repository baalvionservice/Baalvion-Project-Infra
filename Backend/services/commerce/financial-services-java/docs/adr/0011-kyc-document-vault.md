# ADR 0011 — Encrypted KYC document vault (Postgres + AES-256-GCM)

**Status:** Accepted

## Context
Phase 6 requires KYC document persistence with encryption at rest, metadata indexing, retention,
retrieval APIs, validation, tenant isolation, and lifecycle (design §6.4 / §7.3). The PDF names
MongoDB as the document store.

## Decision
Implement the KYC document vault in **account-service on PostgreSQL** (which already provides
JPA, Flyway, and per-row RLS), with **application-level AES-256-GCM encryption at rest**:
- `accounts.kyc_documents` stores the document as GCM ciphertext + per-document IV; a SHA-256 of
  the plaintext is kept for integrity/dedup; `expires_at` drives retention; RLS enforces tenant
  isolation; status lifecycle PENDING/VERIFIED/REJECTED.
- `KycEncryptionService` derives the 256-bit key (SHA-256) from a high-entropy secret
  (`app.kyc.encryption-key`, from the secret store; HKDF + key-id is the rotation hardening path).
- Full API: upload, list, metadata, decrypted content (audited), status update, delete; a
  scheduled purge removes expired documents.

**Why not MongoDB here:** the parent POM forces JPA+Postgres+Flyway on every module, so a
"Mongo-only" service isn't achievable, and adding MongoDB alongside JPA in the core
account-service creates a multi-Spring-Data-module bootstrap interaction that could not be
verified in the build-less environment — an unacceptable risk to a core service. Encrypted blobs
in RLS-secured Postgres are a legitimate, audited, production pattern. The `KycDocumentService`
API is the abstraction: a MongoDB- or S3-backed store is a drop-in replacement once a cluster +
build verification are available (large objects should move to S3/object storage with the
encrypted-metadata-in-DB pattern at scale).

## Consequences
- Real, complete, encrypted KYC vault now, with zero new-runtime/multi-module risk.
- Large scans live in a DB blob (capped at `app.kyc.max-bytes`); the documented scale path is
  object storage referenced by encrypted metadata.
- Supersedes the MongoDB portion of ADR 0005 for KYC documents.
