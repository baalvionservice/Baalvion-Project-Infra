# Imperialpedia Service

Baalvion Imperialpedia — financial education, market intelligence & community.
Express 5 + Sequelize (PostgreSQL) service in the `knowledge` bounded context.
Auth is centralized via `@baalvion/auth-node` (RS256 / JWKS) — this service
verifies tokens, it never issues them.

## Surface

Mounted under both `/v1/*` and `/api/v1/*`.

| Prefix              | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `/articles`         | Financial education articles                         |
| `/glossary`         | Glossary terms, examples and typed term relations    |
| `/entities`         | Reference entities (people, firms, instruments)      |
| `/assets`           | Market assets + AI/analyst/community summaries        |
| `/search`           | Public unified search across entities/creators/assets |
| `/community`        | Posts, comments, votes, debates                      |
| `/creators`         | Creator profiles                                     |
| `/leaderboard`      | Leaderboard entries                                  |
| `/calculators`      | Compound-interest, retirement, loan and SIP calculators |
| `/portfolio`        | Watchlist + portfolio holdings                       |
| `/analytics`        | Analytics endpoints                                  |
| `/ai`               | Provider-agnostic, key-gated AI generation           |
| `/world-config`     | World/UI configuration                               |

Operational endpoints: `GET /` (banner), `GET /health`, `GET /metrics`
(Prometheus). All requests pass through Helmet, CORS, request-context, metrics
and per-IP rate limiting.

Read surfaces (glossary, search, articles) are public; write surfaces require a
valid bearer with an admin-class role.

## Required environment variables

| Variable                          | Required | Default            | Notes                                            |
| --------------------------------- | -------- | ------------------ | ------------------------------------------------ |
| `JWT_PUBLIC_KEY`                  | yes      | —                  | RS256 public key (`\n`-escaped) for token verify |
| `DB_HOST` / `DB_PORT`             | no       | `localhost` / `5432` |                                                |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` | no   | `baalvion_db` / `baalvion` / `` | PostgreSQL credentials              |
| `PORT`                            | no       | `3004`             |                                                  |
| `NODE_ENV`                        | no       | `development`      |                                                  |
| `CORS_ORIGINS`                    | no       | `http://localhost:3000` | comma-separated allowlist                   |
| `JWT_ISSUER` / `JWT_AUDIENCE`     | no       | `baalvion-auth` / `baalvion-platform` |                              |
| `BAALVION_JWKS_URI` / `JWKS_URI`  | no       | `null`             | optional JWKS endpoint                           |
| `RATE_LIMIT_IP_MAX`               | no       | `120`              | per-IP request budget                            |
| `AI_API_KEY`                      | no       | —                  | when absent, AI features fall back to templates  |
| `AI_PROVIDER` / `AI_MODEL`        | no       | `anthropic` / per-provider | LLM provider + model                     |

Secrets are injected at deploy time. Never commit `.env*`. See `.env.example`.

## Run

```bash
pnpm install            # from the monorepo root
pnpm --filter imperialpedia-service dev    # nodemon
pnpm --filter imperialpedia-service start  # node index.js
```

## Migrate / schema

This service has no standalone migration runner. On startup it ensures the
`imperialpedia` schema exists and runs `sequelize.sync({ alter: false })` to
create missing tables. Reference/demo data is loaded with the idempotent seed
scripts under `scripts/` (e.g. `node scripts/_seedGlossary.cjs`).

## Test

```bash
pnpm --filter imperialpedia-service test   # node --test
```

Unit tests use the built-in Node test runner (`node:test` + `node:assert`) and
cover pure validation/schema logic with no live database or network.
