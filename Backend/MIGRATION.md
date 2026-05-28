# Backend Restructure — Staged Migration Runbook

Goal: move every backend service from the flat `Backend/<service>` layout into the
domain-grouped `Backend/services/<domain>/<service>` layout from
[`ARCHITECTURE.md`](./ARCHITECTURE.md), **with no big-bang and no broken build**.

The structure (domain folders), the workspace globs, the catalog domains, and the
`baalctl` generator already point at the target. What remains is the **physical
`git mv` of each service**, done in small build-verified batches.

---

## Why this must be staged (the one mechanical hazard)

Services import shared code with **literal relative paths**, e.g. in
`Backend/auth-service/utils/jwtserver.js`:

```js
const { createAuthServer } = require('../../../packages/auth-node');
//                                     └ up to auth-service / Backend / repo-root, then packages/
```

Moving `auth-service` two levels deeper (`Backend/services/identity/auth-service/`)
makes that exact string resolve to the wrong place. **Every depth change breaks
these requires until rewritten.** That is the whole reason for staging.

### Two rewrite strategies (per service)

| | Strategy A — *mechanical* (default for the batch) | Strategy B — *clean* (follow-up hardening) |
|---|---|---|
| What | After `git mv`, add `../../` to each `../../../packages/...` import (depth grew by 2) | Replace deep relative imports with the workspace package name: `require('@baalvion/auth-node')` |
| Pro | Smallest behavioral change; trivially reviewable | Depth-independent forever; survives any future move |
| Con | Still depth-coupled | Needs the dep in the service `package.json` + `pnpm install` |

Use **A** to land the move with zero behavior change, then sweep **B** as a separate
hardening pass once a domain is fully migrated.

---

## Per-batch procedure (the loop)

For each service in a batch (`<svc>` → domain `<dom>`):

```bash
# 1. Move, preserving history
git mv Backend/<svc> Backend/services/<dom>/<svc>

# 2. Rewrite cross-package relative imports (Strategy A): depth +2 ⇒ add '../../'
#    Find them first:
#       grep -rn "\.\./\.\./\.\./packages" Backend/services/<dom>/<svc>
#    Then ../../../packages  →  ../../../../../packages   (and any other ../../../ to repo root)

# 3. Update references that hardcode the old path (see checklist below)

# 4. Verify — must all be green before the next service:
pnpm install                                  # re-link the workspace
npm run architecture:check                    # catalog validate + enforce
pnpm --filter <svc-package-name> run build    # build the moved service
#   + run the service's own smoke/test harness if it has one
```

### Reference-update checklist (per batch)

- [ ] `catalog/services/<svc>.yaml` → `path: Backend/services/<dom>/<svc>`
- [ ] root `package.json` scripts that name the path (`dev:identity`, `migrate:auth`, `generate:keys`, …)
- [ ] `turbo.json` / root filters — ensure `./Backend/services/*/*` is included where `./Backend/*` was
- [ ] `docker-compose.yml` + `docker-compose.baalvion-os.yml` build `context:` paths
- [ ] `pm2.config.js` `cwd` paths
- [ ] `CODEOWNERS` path globs
- [ ] service `Dockerfile` `COPY` paths **only if** the build context is the repo root (not the service dir)
- [ ] `.github/workflows/*` path filters / working-directory

> `pnpm-workspace.yaml` already lists **both** `Backend/*` and `Backend/services/*/*`,
> so moved and not-yet-moved services coexist during the migration.

---

## Batch plan (ordered low-risk → high-blast-radius)

| # | Batch | Services | Rationale |
|---|---|---|---|
| **0** | proof | `about-service` (ecosystem) | Self-contained leaf. Proves the loop end-to-end on one service. |
| **1** | ecosystem | brand-connector, ctm, insiders, elite-circle, ir, jobs, mining, real-estate, `law-elite` | Mostly self-contained verticals; widest domain. `law-elite` moves as a whole sub-stack. |
| **2** | knowledge | imperialpedia, cms, law, ml | Few inbound deps. |
| **3** | commerce | trade, order, inventory, fulfillment, commerce, market | Revenue path; moderate coupling. |
| **4** | infrastructure | realtime, notification, proxy (rename `backend-Proxy-BaalvionStack` → `proxy-service`) | Transport/edge; `gateway/` (Go) stays top-level in `Backend/`. |
| **5** | platform | admin, dashboard; move `baalvion-os` → `Backend/platform/baalvion-os`, `platform/cli` → `Backend/platform/cli` | Control plane + kernel relocation. |
| **6** | identity | auth, oauth, session | **tier-0** — depended on by everything; move last with the most verification. |
| **7** | shared roots | `packages/` → `Backend/packages`, `catalog/` → `Backend/catalog`, `infra/` → `Backend/infra`, `migrations/` → `Backend/database` | Highest blast radius (changes the import root). **Do Strategy B first** so imports are by package name and survive the root move. |

Batches 0–6 move *service* folders only; batch 7 relocates the shared roots that the
chosen "Backend/ as the monorepo root" layout calls for. Each batch is an independent,
revertible commit. Stop and fix on any red gate before continuing.

---

## Pre-migration cleanup (done outside the batch loop)

- [x] Retire the empty top-level `baalvion-platform/` skeleton (superseded by `Backend/`).
- [x] Remove the `Frontend/Global-Trade-Infrastructure-main/baalvion-platform@0.1.0/`
      junk npm-install artifact.
- [ ] Migrate backend/infra carried inside `Frontend/Global-Trade-Infrastructure-main`
      (`infrastructure/`, `libs/`, `prisma/`, `ai-runtime/`, its `docker-compose.yml`)
      out of the UI app. Tracked separately — it overlaps the existing `trade-service`
      and platform `infra/`; needs a reconciliation pass, not a blind move.
- [ ] Drop the `supabase/` dirs from the Vite UIs (`Proxy-BaalvionStack`,
      `For Invstors and Founders`, `baalvion-elite-circle-main`) — their real backends
      are `proxy-service`, `insiders-service`, `elite-circle-service`.

---

## Build model — RESOLVED: Option A, pnpm workspace ✅

The gating decision from Batch 0 is settled: the platform uses a **pnpm workspace**
build model. Services consume shared `@baalvion/*` libraries via the **workspace
protocol** and are built/shipped with **monorepo-aware** tooling. This is the template
for all 100+ services.

### The model
- **Package manager: pnpm 9.15.0, via corepack.** The repo pins `packageManager:
  pnpm@9.15.0` (root `package.json`). Run `corepack enable` once (or use `corepack pnpm`).
  > ⚠ A globally `npm i -g`'d pnpm may be a newer major (v10+) that requires Node ≥22 and
  > will crash on Node 20. Always use the corepack-pinned 9.15.0.
- **Workspace globs** (`pnpm-workspace.yaml`): `packages/*`, `Backend/*`,
  `Backend/services/*/*`, `Backend/platform/*`, `Frontend/*`, `platform/*`.
- **Shared deps by package name.** A service declares `"@baalvion/<pkg>": "workspace:*"`
  and imports `require('@baalvion/<pkg>')` — never a relative cross-boundary path. pnpm
  creates the `node_modules/@baalvion/<pkg> → packages/<pkg>` symlink
  (`link-workspace-packages=true`). `save-workspace-protocol=rolling` keeps it `workspace:*`.
- **`engine-strict=false`** (`.npmrc`): the repo mixes Node-20 backend services
  (`node:20-alpine` images) with frontend deps that demand Node ≥22. Strict engines
  makes the whole install fail on Node 20; we warn instead. (Effective full-install floor
  is Node 22 for the *frontends*; backend + architecture checks run on Node 20.)
- **turbo** orchestrates: `turbo run build/test/...` with `^build` so a service's build
  waits on its workspace deps (verified: `about-service#build` depends on
  `@baalvion/auth-node#build`). Root scripts filter both `./Backend/*` and `./Backend/services/*/*`.
- **Monorepo Docker** (`Backend/services/ecosystem/about-service/Dockerfile` = the template):
  build **context = repo root**; `turbo prune <svc> --docker` extracts the subgraph +
  pruned lockfile; `pnpm install --frozen-lockfile --filter <svc>...`; `pnpm deploy --prod`
  emits a self-contained image (workspace deps flattened in). Root `.dockerignore` keeps
  the context lean. `docker-compose.yml` builds about-service with `context: .`.
- **CI** (`.github/workflows/ci.yml` → `architecture-contract`, always-on / full mode):
  `pnpm install --frozen-lockfile` (full workspace) → `pnpm run architecture:check` →
  `turbo run build --filter=about-service...` → `pnpm --filter @baalvion/auth-node test`.
  The per-service `about-service` job (`domain-services.yml`) and the `push-images` /
  `deploy-staging` matrices are now workspace-aware at the new path (monorepo Docker context).

### Adding shared-package consumption to a service (the rule)
1. `"@baalvion/<pkg>": "workspace:*"` in the service `package.json`.
2. `require('@baalvion/<pkg>')` in code (no `../../../packages/...`).
3. `corepack pnpm install` at the repo root (links the symlink, updates `pnpm-lock.yaml`).
4. Service Docker build uses the monorepo template (context = repo root).

### Prerequisite fixed along the way
- **Duplicate workspace names** blocked turbo entirely: 10 frontends were named `nextn`
  and 3 `vite_react_shadcn_ts`. All 13 given unique names (`*-web`) so turbo can load the graph.

### Verified in this environment (Node 20)
- `corepack pnpm install --filter about-service...` → real `@baalvion/auth-node` symlink; resolves.
- `pnpm-lock.yaml` reconciled (old flat importer pruned; new path + `workspace:*` link recorded).
- `node --check` on all 33 about-service files; `turbo run build --filter=about-service` dry-run
  shows the correct `about-service → @baalvion/auth-node` build graph.
- `architecture:check` green (39 services, 0 violations).

### Not executed here (environment limits — validate in CI)
- A clean **full** `pnpm install` (frontends pull Node-22 deps; local pnpm store incomplete →
  needs network; CI on a fresh runner with `engine-strict=false` handles it).
- The **Docker image build** (no Docker in this env) — the Dockerfile follows the canonical
  turbo-prune + pnpm-deploy pattern; first CI Docker build validates it.
- End-to-end `turbo run build` *execution* locally (the machine's global pnpm is the broken
  Node-22 v10; `corepack enable` needs admin here). CI uses `pnpm/action-setup@v4`.

## Status

| Batch | State |
|---|---|
| Structure + globs + generator + docs | ✅ done |
| Pre-migration cleanup (skeleton + junk) | ✅ done |
| Build model (Option A — pnpm workspace) | ✅ RESOLVED & implemented (see section above) |
| 0 · proof (about-service) — **code migration** | ✅ done & verified (moved, imports `@baalvion/auth-node`, gate green 39/0, `/health` intact) |
| 0 · proof — **build/CI/deploy** | ✅ done — `workspace:*` + pnpm symlink, `pnpm-lock` reconciled, monorepo Dockerfile, `.dockerignore`, compose context, CI (`architecture-contract` full-mode + `domain-services` about job + `push-images`/`deploy-staging` matrices) all workspace-aware at the new path. |
| **1 · ecosystem** (brand-connector, ctm, insiders, elite-circle, ir, jobs, mining, real-estate, law-elite) | ✅ done — moved to `services/ecosystem/`; 8 Node svcs import `@baalvion/auth-node` (`workspace:*`) + resolve + `node --check`; catalog paths + enforce law-elite prefixes + pnpm-lock + monorepo Dockerfiles + docker-compose + deploy-staging + domain-services (filters/jobs/push-images) + pm2 + start.ps1 + install-all all updated; gate green 39/0. ⚠ old `Backend/insiders-service` + `Backend/elite-circle-service` linger (running process holds them) — excluded via pnpm-workspace negation; delete when stopped. Both twins are git-untracked (were before move). |
| **2 · knowledge** (imperialpedia, cms, law, ml-Python) | ✅ done — all 4 `git mv`'d to `services/knowledge/`; 3 Node svcs import `@baalvion/auth-node` + resolve + `node --check`; **ml-service kept on its Python lane** (own Dockerfile, no workspace dep); catalog paths + pnpm-lock + 3 monorepo Dockerfiles + docker-compose (cms/imperialpedia/law) + imperialpedia CI job/filters/push-images + deploy-staging + pm2 + start.ps1 + install-all updated; gate green 39/0. No leftovers (all were tracked → clean moves). |
| **3 · commerce** (trade, order, inventory, fulfillment, commerce, market) | ✅ done — all 6 `git mv`'d to `services/commerce/`; imports → `@baalvion/auth-node` + resolve + `node --check`; catalog paths + pnpm-lock + 6 monorepo Dockerfiles + docker-compose (6) + market CI job/filters/push + deploy-staging + pm2/start.ps1/install-all (5) updated; **also fixed `billing-platform.yaml`** (virtual descriptor pointed at `Backend/commerce-service`); gate green 39/0. trade-service moved (its GTI-frontend embedded-backend reconciliation is still a separate flagged task). |
| **4 · infrastructure** (realtime, notification, proxy-service) | ✅ done — `git mv`'d to `services/infrastructure/`; **`backend-Proxy-BaalvionStack` renamed → `proxy-service`** (dir + pkg name `backend`→`proxy-service`); varied auth imports fixed (realtime `../../packages` in index.js; notification `middleware/authMiddleware.js`; proxy `utils/jwtserver.js`) → `@baalvion/auth-node` + resolve + `node --check`; **7 catalog descriptors repointed** (realtime; notification-service + notification-platform; + 4 virtual on the proxy stack: abuse/analytics/audit/proxy-platform); 3 monorepo Dockerfiles + docker-compose (3) + deploy-staging (realtime) + pm2/start.ps1/install-all (proxy) updated; catalog-path audit clean; gate green 39/0. `Backend/gateway` (Go) stays top-level = sole ingress. None had domain-services CI jobs. |
| **5 · platform** (admin, dashboard; +kernel & CLI relocation) | ✅ done — admin, dashboard `git mv`'d to `services/platform/`; **`baalvion-os` kernel** (untracked → filesystem `mv`) → `Backend/platform/baalvion-os`; **`platform/cli` (baalctl)** → `Backend/platform/cli` (top-level `platform/` removed). enforce.mjs updated: **`KERNEL_PREFIXES` += `Backend/platform/baalvion-os/`** (C7), **admin JWT allowlist** → new path (C3). admin `utils/jwtVerify.js` + dashboard `utils/jwtserver.js` → `@baalvion/auth-node` + resolve + `node --check`. Root `package.json` baalctl scripts repointed; **baalctl verified working** from new home (findRepoRoot). `pnpm-workspace` `platform/*` glob dropped (now under `Backend/platform/*`). Catalog: admin, dashboard, baalvion-os + **virtual `organization-platform` (pointed at admin-service)** repointed via audit. 2 monorepo Dockerfiles (admin/dashboard; baalvion-os keeps its NestJS build); docker-compose (2) + dashboard CI + deploy-staging (admin, dashboard) + pm2/start.ps1/install-all (dashboard). Gate green 39/0. |
| **6 · identity** (auth, oauth, session) — **tier-0** | ✅ done — all 3 `git mv`'d to `services/identity/`; auth `jwtserver.js` + session `jwtVerify.js` → `@baalvion/auth-node` (resolve + `node --check`); oauth keeps its own JWT (C3-allowlisted, compiles). **2 enforce.mjs allowlist entries repointed** (`auth-service/utils/jwtRsa.js`, `oauth-service/` prefix). Catalog: auth/oauth/session + virtual `identity-platform` (→ auth-service). **ci.yml fully converted**: 4 changes-filters (auth/admin/session/oauth) + 4 jobs → pnpm-workspace + monorepo Docker (incl Batch-5's admin job in ci.yml). 3 monorepo Dockerfiles; docker-compose (3); deploy-staging (3); pm2/start.ps1/install-all (auth); root `migrate:auth`/`generate:keys` scripts repointed. Gate green 39/0, YAML clean. |
| **7 · shared roots** | ✅ done — `clickhouse`/`timeseries` → `Backend/infra/`; `migrations` → `Backend/database/migrations`; **top-level `infra/` → `Backend/infra/`**; **`packages/` → `Backend/packages/`**; **`catalog/` → `Backend/catalog/`**. Path rewrites: enforce.mjs (`ROOT=resolve(here,'..','..')`, allowlist→`Backend/packages/*`, contractsEvents, `SKIP_DIRS`+=catalog, `NON_SERVICE_DIRS`+=catalog/packages/platform/infra/database/services), baalctl (5 `REPO`-relative constants), root scripts (`node Backend/catalog/*`, `./Backend/packages/*`), `pnpm-workspace` glob, ci.yml, platform-cicd.yml, docker-compose, CODEOWNERS (shared roots). validate.mjs self-corrected (`here/../packages`). Gate green 39/0 from `Backend/catalog/`; `@baalvion/auth-node`→`Backend/packages/auth-node`; baalctl works. |

**✅ MIGRATION COMPLETE (Batches 0–7).** Repo top-level = `Frontend/` + `Backend/` + root tooling. `Backend/` = `services/<6 domains>/` · `gateway/` (Go, sole ingress) · `platform/` (baalvion-os kernel + baalctl) · `packages/` · `catalog/` · `infra/` · `database/`.

### Remaining tidy-ups (non-blocking; gate is green)
- Delete leftover dirs once their processes stop: empty `Backend/about-service/`; running+untracked `Backend/insiders-service/` + `Backend/elite-circle-service/` (then remove the two `!Backend/...` negation globs from `pnpm-workspace.yaml`).
- ~10 stale per-service paths in `CODEOWNERS` (e.g. `/Backend/auth-service/` → `/Backend/services/identity/auth-service/`) — review-routing only.
- The 9 virtual `*-platform` descriptors (several share one code path) — give each a code home or a `reserved` lifecycle flag.
- Not executed in this environment: Docker image builds + full CI run (validated via the architecture gate + workspace resolution, not actual container builds).
- Still flagged from earlier: GTI-frontend embedded backend vs `trade-service`; `law-elite` internal gateway/user/payment de-dup.

> **Per-batch addition (learned in Batch 3):** after moving a service, audit **all** catalog `path:` values for
> existence — *virtual `*-platform` descriptors may point at a moved service's path* (e.g. billing-platform → commerce-service).
> `for f in catalog/services/*.yaml; do grep path; test -e; done` — fix any MISSING before the gate.

### Batch-0 build-model residuals — all resolved
- ✅ `pnpm-lock.yaml` reconciled (`corepack pnpm install` + `--lockfile-only`); old flat importer pruned.
- ✅ `domain-services.yml`, `deploy-staging.yml`, `push-images`, `scripts/install-all.js`, the `Dockerfile`,
  and `docker-compose.yml` updated to the new path + pnpm/monorepo model.
- ✅ The temporary manual junction was replaced by the **real pnpm workspace symlink** from `pnpm install`.
- ⚠ Empty, untracked `Backend/about-service/` dir may still linger (held by a file watcher); delete once the
  watcher releases (`rm -rf Backend/about-service` / `git clean`). Invisible to git/CI/the gate.

### Per-service migration template (batches 1–7) — now that the build model is stable
For each service moved into `Backend/services/<domain>/<svc>`: (1) replace any
`require('../../../packages/<x>')` with `require('@baalvion/<x>')` + add `"@baalvion/<x>": "workspace:*"`;
(2) `corepack pnpm install` (links + updates lock); (3) swap its `Dockerfile` to the monorepo template
(context = repo root) + set `context: .` in compose; (4) point its CI path-filter/job/matrix entries at the
new path (workspace-aware); (5) `pnpm run architecture:check` green; (6) `node --check` / `turbo build --filter`.
