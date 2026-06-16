<div align="center">

<img src="assets/banner.svg" alt="Identity — Baalvion Platform" width="100%">

<br/>
<br/>

**The platform's trust anchor — authentication, sessions, OAuth/OIDC, authorization, and the browser-facing cookie gateway. Tier-0: the critical path every other domain depends on.**

<p>
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
  <img alt="Redis" src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white">
  <img alt="JSON Web Tokens" src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white">
</p>

<sub><a href="#architecture">Architecture</a> · <a href="#services">Services</a> · <a href="#domain-rules">Domain rules</a></sub>

</div>

---

## Architecture

The browser never holds a JWT: it talks to the **auth-gateway** over HttpOnly
cookies. The gateway verifies against the **auth-service** RS256 authority,
injects a server-side Bearer to domain backends, and every consumer verifies the
same RS256 tokens through `@baalvion/auth-node`. **rbac-service** answers
authorization questions; **session-service** and **oauth-service** extend the
identity surface.

```mermaid
flowchart LR
    BROWSER["Browser<br/><i>HttpOnly cookies</i>"] -->|"/auth · /api"| GW["auth-gateway<br/><i>:3026 BFF / trust boundary</i>"]
    GW -->|"login · refresh"| AUTH["auth-service<br/><i>:3001 RS256 issuer + JWKS</i>"]
    GW -->|"signed Bearer (server-side)"| SVC["Domain backends<br/><i>mining · trade · finance · …</i>"]
    AUTH -->|"publishes JWKS"| AN["@baalvion/auth-node<br/><i>RS256 verify · revocation</i>"]
    SVC --> AN
    GW --> AN
    SVC -->|"authorize / simulate"| RBAC["rbac-service<br/><i>:3055 RBAC + ABAC PDP</i>"]
    AUTH --> SESS["session-service<br/><i>:3022 lifecycle · risk</i>"]
    AUTH --> OAUTH["oauth-service<br/><i>:3023 OAuth2 / OIDC</i>"]
    GW -.->|"blacklist jti · sessions"| REDIS[("Redis")]
```

## Services

| Service | Port | Bounded context | Notes |
|---|---|---|---|
| [`auth-service`](auth-service) | `3001` | Login / token issuance | Central SSO; RS256 issuer + JWKS endpoint |
| [`session-service`](session-service) | `3022` | Session lifecycle | Geo enrichment, device fingerprinting, risk scoring |
| [`oauth-service`](oauth-service) | `3023` | OAuth2 / OIDC | Authorization server (`openid profile email offline_access`) |
| [`auth-gateway`](auth-gateway) | `3026` | BFF / trust boundary | HttpOnly cookie sessions; signed identity injection to backends |
| [`rbac-service`](rbac-service) | `3055` | Authorization | Multi-tenant hierarchical RBAC + ABAC policy decision point |

## Domain rules

- **One verification scheme.** Every service verifies tokens via
  `@baalvion/auth-node` (RS256) — never hand-rolls JWT logic and never introduces
  a second issuer (rule A1; enforced by `catalog/enforce.mjs` C3).
- **No JWT in the browser.** Browser-facing apps authenticate through the
  auth-gateway over HttpOnly cookies; raw tokens stay server-side.
- **Authorization is centralized.** Access decisions resolve through
  `rbac-service` (RBAC + ABAC PDP), not per-service ad-hoc role checks.
- **Schema isolation.** Identity services own isolated Postgres schemas
  (`rbac-service` → `rbac`); cross-context contract changes require this domain's
  review (see [`CODEOWNERS`](../../../CODEOWNERS)).

> Services migrate into this folder per `Backend/MIGRATION.md`. Until a service's
> batch lands, its code may still live at `Backend/<service>`.

---

<div align="center">
<sub>Part of the <a href="../../../README.md">Baalvion Platform</a> · centralized identity · domain-driven monorepo</sub>
</div>
