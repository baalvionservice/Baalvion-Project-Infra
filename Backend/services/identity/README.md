# Domain: identity

Authentication, sessions, OAuth, directory & tenancy. **tier-0** — the critical
path; everything else depends on it.

## Services
| Service | Bounded context | Notes |
|---|---|---|
| `auth-service` | login / token issuance | legacy HS256 issuer; delegates to `@baalvion/auth-node` |
| `oauth-service` | OAuth2 provider | external IdP / client credentials |
| `session-service` | session lifecycle | RS256 verify |

## Domain rules
- This domain owns identity. Every other service verifies tokens via
  `@baalvion/auth-node` — never re-implements JWT logic (rule A1).
- `identity-platform` / `organization-platform` / `directory-service` /
  `tenancy-service` are reserved bounded contexts for future expansion.

> Services migrate into this folder per `Backend/MIGRATION.md`. Until a service's
> batch lands, its code still lives at `Backend/<service>`.
