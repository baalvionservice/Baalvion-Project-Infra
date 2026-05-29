# Security Model

This document describes the security posture of the financial-services module. It implements
design §7 and is delivered almost entirely by the shared **`common-security`** library, which is
auto-configured into every service simply by being on the classpath.

## Principles

1. **Secure by default.** With `app.security.enabled=true` (the default) every `/api/**` endpoint
   requires a valid RS256 JWT. If no issuer/JWK is configured the service **fails to start** —
   there is no silent "open" mode in a deployed environment. `app.security.enabled=false` exists
   only for local/dev.
2. **Never trust client-supplied tenant identity.** When authenticated, the tenant/org is taken
   from the JWT (`TenantContext`, claim candidates `org_id,orgId,tenant_id,tenantId`). A
   client-supplied `X-Tenant-ID` header is **ignored** while authenticated — this closes the IDOR
   class. PostgreSQL Row-Level Security (`app.current_tenant_id` session var) enforces isolation
   at the database, so even a logic bug cannot cross tenants.
3. **Defense in depth.** AuthN (JWT) → AuthZ (RBAC + ABAC) → rate limiting → IP allowlist → MFA →
   RLS. Each layer is independent and config-driven.

## Authentication (RS256 resource server)

- `OAUTH_ISSUER_URI` / `OAUTH_JWK_SET_URI` point at the platform `oauth-service`. Tokens are
  validated against the published JWKS; only RS256 is accepted.
- Stateless sessions (`SessionCreationPolicy.STATELESS`), CSRF disabled (token-based API).
- The MFA filter runs **after** bearer authentication so the authenticated principal is available.

## Authorization

- **RBAC.** The `roles` claim maps to `ROLE_*` authorities; the `permissions` claim maps to bare
  authorities. Actuator (beyond health/info/prometheus) requires `ROLE_OPERATOR`.
- **ABAC.** `AbacPolicy` (`"abac"` bean) makes attribute-based decisions — e.g. a payment reversal
  is permitted only to the initiator or an admin.
- **Maker-checker (4-eyes).** High-value payment reversals require a separate approver via
  `payments.approval_requests` and `/api/v1/payments/approvals`.

## MFA (RFC 6238 TOTP)

`TotpService` is a pure-JDK HMAC-SHA1 TOTP (6 digits, 30s step, ±1 step drift). Enrollment/secret
storage is delegated to `MfaSecretStore` (ultimately Identity-backed). `MfaVerificationFilter`
enforces a valid `X-MFA-Code` on `app.security.mfa.protected-paths` **for enrolled callers** — it
is inert until a secret store is wired, so it never blocks a non-enrolled caller.

## Rate limiting & IP allowlisting

- **Bucket4j** token bucket keyed by JWT subject or client IP. `memory` backend per instance, or
  `redis` fixed-window for cluster-wide limits (fail-open: a Redis outage does not block traffic).
- **IP allowlist** guards sensitive path prefixes (`app.security.ip.protected-paths`); empty
  allowlist means no restriction.

## Data protection

- **KYC documents** are stored AES-256-GCM-encrypted at rest (per-document IV, plaintext SHA-256
  for integrity, RLS, retention purge). The 256-bit key is derived (SHA-256) from
  `KYC_ENCRYPTION_KEY`. GCM gives authenticated encryption — tampering fails on decrypt. [ADR 0011]
- **Webhooks** are signed HMAC-SHA256 (`X-Webhook-Signature: sha256=<hex>`); subscribers verify
  against the shared secret. [ADR 0007]
- **PII masking** in logs: 10+ digit runs, `accountNumber`, `email`, `phone` are masked under the
  JSON/prod logging profile.

## Transport & secrets

- TLS terminates at the gateway/mesh; service-to-service mTLS (Istio) is an infra concern (ADR 0006).
- Secrets come from K8s Secret + External Secrets Operator; nothing sensitive is baked into images
  or committed. Dev defaults (`postgres`/dev passphrases) are clearly marked and must be overridden.
- SFTP transports (settlement out, reconciliation in) require **host-key verification**
  (known-hosts or fingerprint); the `insecure-allow-any-host-key` escape hatch must never be used
  in production.

## Production hardening checklist

- [ ] `APP_SECURITY_ENABLED=true` and a real `OAUTH_ISSUER_URI`/`OAUTH_JWK_SET_URI`.
- [ ] `SPRINGDOC_API_DOCS_ENABLED=false` + `SPRINGDOC_SWAGGER_UI_ENABLED=false` (set in
      `values-prod.yaml`).
- [ ] `APP_SECURITY_RATE_LIMIT_BACKEND=redis` for multi-replica deployments.
- [ ] `KYC_ENCRYPTION_KEY`, `DB_PASSWORD`, SFTP keys, scheme creds sourced from the secret store.
- [ ] IP allowlist configured for DLT/admin paths; MFA paths configured once enrollment is live.
- [ ] No `*_INSECURE*` host-key flags enabled.

See [ENVIRONMENT.md](ENVIRONMENT.md) for variable details and [docs/adr/](adr/) for the rationale
behind each decision.
