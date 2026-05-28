# Domain: ecosystem

Vertical/branded products and acquired sub-stacks. The widest domain — most new
verticals land here.

## Services
| Service | Bounded context | Notes |
|---|---|---|
| `mining-service` | mining vertical | |
| `ir-service` | investor relations | |
| `jobs-service` | jobs portal | |
| `real-estate-service` | real estate vertical | |
| `brand-connector-service` | brand connector | |
| `ctm-service` | control-the-market | |
| `about-service` | about / corporate site backend | |
| `insiders-service` | investors & founders circle | Supabase-compatible adapter |
| `elite-circle-service` | elite circle | byte-identical twin of `insiders-service` |
| `law-elite` | Law Elite Network | **acquired sub-stack**: own gateway + case/payment/user services |

## Domain rules
- New verticals default here. Reserved contexts: `reseller-service`,
  `affiliate-service`, `whitelabel-service`.
- `law-elite` keeps its internal gateway+services structure as an acquired
  sub-monorepo; it does not get flattened into the rest of `ecosystem`.

> Services migrate into this folder per `Backend/MIGRATION.md`.
