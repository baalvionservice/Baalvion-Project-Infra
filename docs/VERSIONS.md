# Runtime versions

This file, and `versions.json` at the repo root, are the only place a shared
runtime version (Node, pnpm, Turbo) should ever be typed. Everything else that
looks like a version — a service's `next` version, a specific npm library, a
Java/Go toolchain pin — belongs to that service alone and is expected to drift
independently across products. This file is *only* about the layer that is
supposed to be identical everywhere: the thing every Dockerfile, CI job, and
local dev machine builds on top of.

## Why this file exists

Across 143 Dockerfiles that build a Node image, an audit on 2026-09-26 found:

- **81 mismatched Node base images** — mostly the *floating* tag `node:26-alpine`
  (no patch version), alongside a handful already pinned to `26.8-alpine` /
  `26.9-alpine`. A floating tag means the image changes on every rebuild with no
  diff to review — the exact failure mode this file exists to prevent.
- **62 mismatched inline Turbo pins** (`pnpm dlx turbo@2.9.14`) against the root
  `package.json` devDependency (`^2.9.16`) — a silent second copy of the same
  version that Dependabot/manual bumps only ever update in one place.
- `.nvmrc` (`24`) not matching the newest Node major already running in
  production containers (`26`).

None of this was caught by CI, because nothing compared Dockerfiles, `.nvmrc`,
and `package.json` against each other before this check existed.

## Canonical versions

Declared in `versions.json`:

| Layer | Canonical value | Where it's declared today |
|---|---|---|
| Node (Docker base image) | `26.9-alpine` | `versions.json` → `node.canonical` |
| Node (engines floor) | `>=24` | `package.json` → `engines.node`, every service's `package.json` |
| pnpm | `9.15.0` | `package.json` → `packageManager` (do not bump the major — see below) |
| Turbo | `2.9.16` | `package.json` → `devDependencies.turbo`, and every Dockerfile's `pnpm dlx turbo@...` |

## The check

`scripts/check-version-drift.mjs` reads `versions.json` and compares it
against every Dockerfile under `Backend/` and `Frontend/`, `.nvmrc`, and the
root `package.json`.

```bash
node scripts/check-version-drift.mjs           # report drift, exit 0 (current CI mode)
node scripts/check-version-drift.mjs --strict  # same report, exit 1 on any drift
node scripts/check-version-drift.mjs --fix     # rewrite drifted files to match versions.json
```

CI currently runs it in **report-only** mode (`lockfile-integrity` job in
`ci.yml`) because 143 files already carry pre-existing drift — flipping to
`--strict` today would fail every build. The path to `--strict`:

1. Confirm `versions.json`'s `node.canonical` and `turbo` are actually the
   versions you want going forward (not just what happened to already be
   running in the most containers).
2. Run `node scripts/check-version-drift.mjs --fix` — this rewrites every
   Dockerfile's `FROM node:...` and `turbo@...` line, plus `.nvmrc`, in one
   pass.
3. Review the diff (it should be large but mechanical — every changed line is
   a version string, nothing else), open one PR, let CI build/scan it.
4. Once merged, switch the CI step from `check-version-drift.mjs` to
   `check-version-drift.mjs --strict` so new drift fails the build instead of
   accumulating for the next audit.

## How to bump a version going forward

Change the number **once**, in `versions.json`, then run `--fix`:

```bash
# e.g. bumping Node from 26.9 to 27.1
vim versions.json                              # edit node.canonical
node scripts/check-version-drift.mjs --fix     # rewrites every Dockerfile + .nvmrc
git diff --stat                                # should show only version-string changes
```

One PR, one number changed by hand, everything else generated and provable —
instead of hand-editing (or forgetting) some subset of 143+ files.

## pnpm major version — do not bump casually

Raising `packageManager` from `pnpm@9.x` to `pnpm@10.x` silently drops every
pin in `package.json`'s `pnpm.overrides` block (78 pins, most of them security
overrides) — pnpm 10 moved that config into `pnpm-workspace.yaml` and reads
only the new location, with no error on the old one. This is guarded
separately by `scripts/check-lockfile-overrides.mjs`, which fails CI if
`packageManager` is pnpm 10+ while pins still live in `package.json`. See that
script's header comment for the full mechanism before ever bumping the pnpm
major.

## Scope: what does *not* belong here

Do not add a product's own dependencies to `versions.json` — e.g. Next.js
version, a specific npm package, a Go/Java toolchain version for a single
service. Those are meant to move independently per product on their own
schedule; forcing them into a shared file recreates the exact coupling this
file is designed to avoid for everything *except* the Node/pnpm/Turbo runtime
layer.
