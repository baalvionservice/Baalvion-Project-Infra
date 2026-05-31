# report-service

Platform **report builder** — define parameterized, read-only report queries and
render them to **CSV / Excel (xlsx) / PDF / JSON / HTML**, on demand or on a
schedule. This is the live Node implementation of Cluster 9's *Reporting*
capability (the Java `reporting-service`, port 3024 / schema `reporting`, remains
the finance-specific job scaffold).

- **Port:** `3041` · **Schema:** `reports` · **Domain:** infrastructure
- **Auth:** verify-only RS256/JWKS via `@baalvion/auth-node` (HS256 dev fallback). No second issuer.
- **Event bus:** emits `report.completed` / `report.failed` / `report.scheduled.delivered` on `baalvion:events`.

## Model

- **Report definition** — name, category, a parameterized `SELECT`/`WITH`
  `query_template` (or `source_type: inline`), a `params_schema`, `columns`
  (labels/order), a `datasource` key and a `default_format`.
- **Report run** — one execution: status, params, row count, the rendered
  artifact (inline for dev; offload to S3 in prod), timing, errors.
- **Report schedule** — interval cadence (`hourly|daily|weekly|monthly`) with a
  computed `next_run_at`; the scheduler tick fires due schedules and emits a
  delivery event.

## Safety

Queries run inside a **READ ONLY** transaction with a `statement_timeout` and a
hard **row cap**; only a *single* `SELECT`/`WITH` statement is accepted (no
`;`-chaining, no DDL/DML keywords); named `:params` are bound as positional
values — never string-interpolated. Point `REPORT_DEFAULT_DSN` at a **read
replica / analytics mirror** in production.

## API (`/v1`, all require a report role or `X-Internal-Key`)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/reports` | create a definition |
| `GET` | `/reports` | list definitions |
| `GET/PATCH/DELETE` | `/reports/:id` | read / update / delete |
| `POST` | `/reports/:id/run[?download=1]` | run → metadata (or stream the file) |
| `POST` | `/reports/:id/preview` | run without persisting → first 100 rows (JSON) |
| `GET` | `/reports/:id/runs` | run history |
| `GET` | `/runs/:runId` · `/runs/:runId/download` | run metadata / artifact |
| `POST/GET` | `/reports/:id/schedules` | create / list schedules |
| `GET/PATCH/DELETE` | `/schedules[/:id]` | list / update / delete schedules |
| `GET` | `/formats` · `/datasources` | supported formats / datasource keys |

## Run locally

```bash
pnpm install                 # installs exceljs + pdfkit (optional) for xlsx/pdf
node index.js                # boots on :3041 against Postgres 5432 / Redis 6379
node scripts/smoke.mjs       # exercises the full surface
```

Excel/PDF activate when `exceljs` / `pdfkit` are installed; otherwise those two
formats return a clean `501` with an install hint (CSV/JSON/HTML always work).
