# CLAUDE.md

Guidance for AI coding agents (and new engineers) working in this repository.

## What this is

Baalvion is a **pnpm + Turborepo monorepo**:

- `Backend/services/<domain>/<service>/` — backend services by bounded context
  (`identity`, `platform`, `commerce`, `knowledge`, `ecosystem`, `infrastructure`)
- `Backend/packages/` — shared libraries (`@baalvion/*`)
- `Frontend/<app>/` — Next.js / Vite applications
- `Backend/catalog/` — service catalog + enforced architecture contract
- `docs/` — architecture, ADRs, runbooks

## Commands

```bash
pnpm install                  # install the whole workspace
pnpm run dev                  # run everything (Turbo)
pnpm run dev:identity         # identity stack + admin platform
pnpm run build                # build all
pnpm run lint                 # lint all workspaces
pnpm run type-check           # type-check all workspaces
pnpm test                     # unit tests (Jest)
pnpm run test:e2e             # end-to-end (Playwright)
pnpm run architecture:check   # validate + enforce the service catalog
pnpm run infra:up             # Postgres + Redis (+ pgAdmin) via Docker
pnpm run migrate:auth         # identity migrations
pnpm run generate:keys        # local RS256 keypair
```

## Conventions

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/),
  enforced in CI. Scope = service/package name (e.g. `feat(auth-service): …`).
- **Branches:** trunk is `main` (protected — PR + green CI required). Work on
  `feat/<scope>-<desc>` or `fix/<scope>-<desc>`.
- **Never commit secrets.** `.env*`, keys, certs, and DB dumps are `.gitignore`d
  and injected at deploy time. Secret-scanning push protection is enabled.
- **Auth is centralized:** RS256 via `@baalvion/auth-node` — do not hand-roll
  JWT verification or introduce a second issuer.
- **Match surrounding code.** TypeScript-first; Prettier for formatting
  (`.prettierrc`).

## Boundaries

- Each domain owns an isolated PostgreSQL schema.
- Changes to another bounded context's contract require that context's review
  (see [CODEOWNERS](CODEOWNERS)).
- `Backend/packages/**` changes ripple platform-wide — change with extra care
  and run `pnpm run architecture:check`.

See [README.md](README.md), [CONTRIBUTING.md](CONTRIBUTING.md), and
[docs/](docs/) for full detail.

## AI Agent File Access Policy

### Primary Development Areas

Focus on these paths first:

- Backend/
- Frontend/
- scripts/
- docker/
- package.json
- pnpm-workspace.yaml
- turbo.json
- docker-compose.yml
- .env.example
- README.md

### Do Not Read Unless Explicitly Requested

The following files are archival, reporting, planning, compliance, or historical documentation and should be ignored during normal development tasks:

- RELEASE_NOTES.md
- CHANGELOG.md
- CODE_OF_CONDUCT.md
- SUPPORT.md

### Ignore These Folders Unless Specifically Required

- observability/
- warroom/
- .turbo/
- node_modules/

### Documentation Access Rules

Do not scan all Markdown files by default.

Only open documentation when directly relevant to the task.

Preferred order:

1. README.md
2. docs/
3. DEPLOYMENT_GUIDE.md
4. RUNBOOK.md

All other documentation should be treated as optional context.