# ADR 0002 — Secure-by-default RS256 resource server; tenant from the JWT

**Status:** Accepted

## Context
Services previously trusted a client-supplied `X-Tenant-ID` header (an IDOR risk) and security
was opt-in. The design (§7) requires zero-trust: JWT validation on all protected endpoints,
RBAC, and tenant isolation.

## Decision
`common-security` auto-configures an RS256 OAuth2 **resource server that is ON by default**
(`app.security.enabled` defaults true; set `false` only for local/dev). When authenticated:
- the **tenant is taken from the JWT** (`org_id`/`tenant_id` claim) via `TenantContext`; the
  `X-Tenant-ID` header is ignored, closing the IDOR hole;
- `roles`/`permissions` claims map to authorities (RBAC); `AbacPolicy` adds attribute rules
  (e.g. only the initiator or an admin may reverse a payment);
- cross-cutting filters run for every request: correlation-id, Bucket4j rate limiting,
  IP allowlisting (sensitive paths), and TOTP/MFA (when an `MfaSecretStore` is wired).

The issuer is configured via `OAUTH_ISSUER_URI` / `OAUTH_JWK_SET_URI` (bridged to the Spring
properties by an `EnvironmentPostProcessor`). Startup fails fast if security is enabled with no
issuer.

## Consequences
- Production is zero-trust by default; dev opts out explicitly.
- MFA enrolment/secret storage lives in the Identity service; here it is a wired-but-inert
  scaffold (`MfaSecretStore.NotEnrolled`) until that store is provided.
