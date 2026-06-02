# agent-service

**Agent Management** — sales/partner agents, a commission tracker, leaderboards,
and training/certification (Cluster 9, *Agent Management*, the one 🔴 item).

- **Port:** `3044` · **Schema:** `agent` · **Domain:** ecosystem
- **Auth:** verify-only RS256/JWKS via `@baalvion/auth-node` (HS256 dev fallback). No second issuer.
- **Events:** emits `commission.accrued`, `agent.payout`, `agent.certified`.

## Model

- **Agent** — a sales/partner agent with a unique `code`, a `tier`, an optional
  `parent_agent_id` (override hierarchy), and a `commission_plan_id`.
- **Commission plan** — `flat` | `percent` | `tiered` rate, `recurring_pct`, and
  `override_pcts` (decreasing % paid up the agent chain).
- **Sale** — a deal attributed to an agent (amount, currency, `new`/`recurring`,
  period bucket).
- **Commission** — the accrual ledger: one row per earner per sale (the direct
  agent + override ancestors), moving `accrued → approved → paid`.
- **Training** — courses → ordered modules → agent enrollments with progress and
  a certificate on passing.

## Key flows

- **Commission tracker** — `POST /v1/sales` attributes a sale and accrues
  commissions via the pure `commissionEngine`: the selling agent's direct
  commission **plus** decreasing overrides up the hierarchy. `commissionSummary`
  gives per-agent totals by status; `payoutAgent` batches a period to `paid`.
- **Leaderboard** — `GET /v1/leaderboard?metric=sales|commission|deals&period=YYYY-MM`
  ranks agents; `GET /v1/agents/:id/rank` returns one agent's standing.
- **Training** — create a course + modules, enrol an agent, track module
  completion, submit a score; passing issues a certificate.

## API (`/v1`)

| Area | Routes |
|---|---|
| Plans | `POST/GET /plans` |
| Agents | `POST/GET /agents`, `GET/PATCH /agents/:id`, `GET /agents/:id/rank`, `POST /agents/:id/payout`, `GET /agents/:id/certifications` |
| Sales | `POST/GET /sales` |
| Commissions | `GET /commissions`, `GET /commissions/summary`, `POST /commissions/transition` |
| Leaderboard | `GET /leaderboard` |
| Training | `POST/GET /courses`, `GET /courses/:id`, `POST /courses/:id/modules`, `.../enroll`, `.../progress`, `.../score`, `.../enrollments` |

## Run locally

```bash
node index.js               # :3044 against Postgres 5432 / Redis 6379
node scripts/smoke.mjs      # commissions + override chain + payout + leaderboard + certification
```
