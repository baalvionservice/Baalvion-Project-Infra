# Contributing to Baalvion

Thank you for contributing. This is a pnpm + Turborepo monorepo housing the
Baalvion backend services, shared packages, and frontend applications. This
guide describes how we work so that changes land safely and predictably.

> This repository is published publicly as a source-available reference under
> the proprietary Baalvion [LICENSE](./LICENSE) — public visibility grants **no**
> rights to use, copy, or modify the Software. Canonical development is performed
> by Baalvion's internal engineers; by contributing you agree that your
> contributions are made under the terms of your engagement with Baalvion and the
> repository LICENSE.

## Prerequisites

- **Node.js** `>= 20` (see [`.nvmrc`](./.nvmrc) — `nvm use`)
- **pnpm** `>= 9` (`corepack enable` then `corepack prepare pnpm@9 --activate`)
- **Docker Desktop** (Postgres, Redis, MinIO for local infra)

## Getting Started

```bash
pnpm install                 # install the whole workspace
pnpm run infra:up            # start Postgres + Redis (+ pgAdmin)
pnpm run migrate:auth        # run identity migrations
pnpm run dev:identity        # run the identity stack + admin platform
```

Secrets are never committed. Copy `.env.example` to `.env` and fill in local
values; the deployer provides real values via the environment / secrets manager.

## Repository Layout

```
Backend/
  services/<domain>/<service>/   # bounded-context services
    commerce/  ecosystem/  identity/  infrastructure/  knowledge/  platform/
  packages/                      # shared libraries (@baalvion/*)
  catalog/                       # service catalog + architecture contract
  gateway/  database/  infra/    # cross-cutting infra
Frontend/<app>/                  # Next.js / Vite applications
docs/                            # architecture, ADRs, runbooks
```

Architecture is governed by a **service catalog** and an enforced contract. Run
`pnpm run architecture:check` before opening a PR that adds or moves a service.

## Branching Model

- `main` — protected trunk; always releasable. No direct pushes.
- `feat/<scope>-<short-desc>` / `fix/<scope>-<short-desc>` — short-lived
  branches off `main`.
- `release/*` — release stabilization lines when required.

Keep branches small and rebase on `main` before requesting review.

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <summary>

[body]
[footer]
```

Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`,
`chore`, `revert`. Scope is the service or package (e.g. `auth-service`,
`imperialpedia`, `pkg/auth-node`). Example:

```
feat(imperialpedia): wire live entities API into structured pages
```

## Pull Requests

1. Ensure the relevant checks pass locally:
   ```bash
   pnpm run lint
   pnpm run type-check
   pnpm test
   pnpm run architecture:check
   ```
2. Open a PR against `main` using the PR template. Link the issue it closes.
3. PRs require code-owner review per [CODEOWNERS](./CODEOWNERS) and a green CI
   summary check (`ci-success`). Code-owner routing currently resolves to the
   maintainer; per-context **team** ownership becomes active once the repo
   migrates to a GitHub organization (see the CODEOWNERS header).
4. A change that touches another bounded context's contract requires that
   context's code-owner approval — this is how boundaries are enforced.
5. Squash-merge with a Conventional-Commit title.

## Security

Never commit secrets, keys, or database dumps. Report vulnerabilities privately
per [SECURITY.md](./SECURITY.md) — not via public issues.

## Code Style

- TypeScript-first; `prettier` for formatting; ESLint per workspace.
- Match the conventions of the surrounding code.
- Keep public package APIs typed and documented.

Questions? See [SUPPORT.md](./SUPPORT.md).
