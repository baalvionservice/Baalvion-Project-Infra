# Domain: platform

The cross-cutting control plane: admin surfaces, dashboards, and the kernel.

## Services
| Service | Bounded context | Notes |
|---|---|---|
| `admin-service` | platform administration | RS256 verify; impersonation issuer (allowlisted) |
| `dashboard-service` | unified dashboards | |

> The **`baalvion-os`** kernel (NestJS + Prisma) lives at `Backend/platform/baalvion-os/`.
> It is the **only** place Prisma is permitted (rule K1) and owns the relational
> schema lifecycle. `baalctl` (the developer CLI) lives at `Backend/platform/cli/`.

## Domain rules
- `abuse-platform` / `audit-platform` / `notification-platform` are reserved
  bounded contexts for trust/safety, audit, and notification orchestration.

> Services migrate into this folder per `Backend/MIGRATION.md`.
