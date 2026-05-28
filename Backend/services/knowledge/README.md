# Domain: knowledge

Content, encyclopedic data, legal knowledge, and ML/analytics.

## Services
| Service | Bounded context | Notes |
|---|---|---|
| `imperialpedia-service` | encyclopedic knowledge base | |
| `cms-service` | content management | |
| `law-service` | legal knowledge | distinct from `law-elite` (ecosystem sub-stack) |
| `ml-service` | ML / analytics serving | reads projections (ClickHouse/Timescale) |

## Domain rules
- `analytics-platform` is the reserved bounded context for cross-domain analytics.
- ML/analytics read from **projections**, never from another service's primary DB
  (rule D1).

> Services migrate into this folder per `Backend/MIGRATION.md`.
