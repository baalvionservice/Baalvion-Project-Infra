# marketplace-service (Baalvion Invest)

Net-new domain service for the investment marketplace — companies, investors,
opportunities, deals, due diligence, term sheets and cap table. Cross-cutting concerns
(auth, RBAC, KYC/AML, payments/escrow, notifications, audit, search, CMS) are **reused**
from the existing platform services (see `INVESTMENT_PLATFORM_ARCHITECTURE.md` at repo root).

- Stack: Node + Express 5 + Sequelize + PostgreSQL (schema `marketplace`).
- Port: `3060` (default).
- DB: tables created by `migrations/001_init.sql` (28 tables). Run `npm run migrate`.
- Auth: RS256 via `@baalvion/auth-node` (lazy — boots in dev without a key).

## Modules
| Path | Status |
|---|---|
| `/api/v1/companies` | implemented (CRUD → Postgres) |
| `/api/v1/investors` | implemented |
| `/api/v1/opportunities` | implemented (public discovery + publish) |
| `/api/v1/deals` | implemented (open, list, stage transitions) |
| `/api/v1/matches` | scaffolded (phase 2 — AI matching) |
| `/api/v1/deal-rooms` | scaffolded (phase 3 — realtime via deal-room-service) |
| `/api/v1/due-diligence` | scaffolded (phase 4) |
| `/api/v1/term-sheets`, `/signatures` | scaffolded (phase 5) |
| `/api/v1/escrow`, `/cap-table` | scaffolded (phase 6) |

## Run
```
npm install            # via pnpm workspace at repo root
npm run migrate        # apply SQL schema
PORT=3060 npm start
```
