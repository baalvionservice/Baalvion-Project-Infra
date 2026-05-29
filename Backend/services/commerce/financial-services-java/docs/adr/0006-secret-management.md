# ADR 0006 — Secret management via K8s Secrets + External Secrets Operator

**Status:** Accepted

## Context
The design (§7.2) requires secrets to come from a managed store (Vault / AWS Secrets Manager),
never from code or plain env. Services need DB credentials and (in prod) the OAuth JWKS config.

## Decision
- Configuration is split: non-secret values in a ConfigMap (`financial-config`), secrets in a
  K8s `Secret` (`financial-secrets`) injected as env (`DB_PASSWORD`, etc.). No secret is
  committed to code; the manifest/`values.yaml` carry only non-prod placeholders.
- For real environments, the K8s `Secret` is **populated by the External Secrets Operator**
  from the backing store (AWS Secrets Manager / Vault) — the application contract (env vars)
  is unchanged.
- **Spring Cloud Vault** is an alternative for direct app-side fetch; it is intentionally not
  added to the classpath by default (it activates at bootstrap and needs Vault connectivity).
  Adopt per-environment via a `vault` profile if direct integration is preferred over ESO.

## Consequences
- Works today with plain K8s Secrets; hardens to ESO/Vault with no code change.
- Audit/PII protections (RLS, log masking) are independent of this and already in place.
