# Deploying the Frontend apps to Vercel

Every app under `Frontend/` deploys to Vercel **from this monorepo** — one Vercel
project per app, all connected to the same Git repo (`Baalvion-Project-Infra`),
each with its **Root Directory** set to the app's folder. The build is driven by
the `vercel.json` committed in each app folder; you do **not** set Install/Build
commands in the Vercel dashboard.

## The standard `vercel.json`

```jsonc
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "ignoreCommand": "npx turbo-ignore <workspace-package-name>",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand":   "cd ../.. && pnpm exec turbo run build --filter=<workspace-package-name>"
}
```

Why each line is the way it is:

- **`installCommand` runs from the repo root (`cd ../..`).** The apps depend on
  workspace packages (`@baalvion/auth-sdk`, `@baalvion/types`, …) that live in the
  parent workspace. Installing inside the app folder cannot resolve `workspace:*`
  deps. Root install links them in.
- **`--frozen-lockfile` (not `--no-frozen-lockfile`).** Deploys must be
  deterministic: Vercel installs exactly what `pnpm-lock.yaml` pins, and **fails
  fast** if a `package.json` drifts from the lockfile instead of silently
  resolving newer transitive versions that were never tested. This matches CI
  (`.github/workflows/ci.yml` also uses `--frozen-lockfile`). **Discipline:** if
  you change any `package.json`, run `pnpm install` at the repo root and commit
  the updated `pnpm-lock.yaml` in the same change.
- **`buildCommand` uses turbo with a `--filter`.** `@baalvion/*` packages ship
  from `dist/` which is gitignored and built by `tsup` (no `postinstall`). A bare
  `next build` / `vite build` can't resolve them cold. `turbo run build` walks the
  dependency graph (`^build`) so `@baalvion/types` → `@baalvion/auth-sdk` → app
  build in order. Works for Next (`.next`) and Vite (`dist`).
- **`ignoreCommand` (`turbo-ignore`)** skips a redeploy when the app and its
  workspace deps are unchanged for the pushed commit range.

`framework` is optional — Vercel auto-detects from the app's `package.json`. Set
it explicitly (`"nextjs"`) only when you want to remove ambiguity.

## Submodules — the rule that bites

All `Frontend/` apps (including `Global-Trade-Infrastructure-main`) are now plain
folders tracked directly in this repo. The only remaining submodule is
`Backend/services/commerce/trade-service`, which Vercel checks out **recursively**.

> **A submodule gitlink must always point at a commit that is pushed to the
> submodule's remote.** If the parent points at an unpushed commit, Vercel's
> recursive checkout fails entirely with `fatal: ... not our ref` — before
> install or build even start, with no useful build log. (`Global-Trade-Infrastructure`
> was a submodule and hit exactly this; it has since been vendored into the
> monorepo as a regular folder, which removes the whole class of problem.)

(CI checks out **non-recursively** and inits only `trade-service` directly — see
`ci.yml`. That's why a non-recursive frozen install also stays green: pnpm
tolerates absent workspace members.)

## Special cases

- **`Law-Elite-Network-main`** has no `@baalvion/*` workspace deps, so it builds
  standalone with Vercel defaults (only an `ignoreCommand`). Leave it as-is.
- **`For Invstors and Founders`** is a Vite app — its turbo build outputs `dist`,
  not `.next`. The standard `vercel.json` still applies.
- **`admin-platform`** builds its single workspace dep directly
  (`pnpm --filter @baalvion/auth-sdk build && pnpm --filter … build`) instead of
  `turbo run build`. Functionally equivalent; either form is fine.

## Adding a new app

1. Add `Frontend/<app>/vercel.json` using the standard pattern above; set
   `--filter` / `turbo-ignore` to the app's `name` from its `package.json`.
2. Create the Vercel project, connect this repo, set **Root Directory** to
   `Frontend/<app>`.
3. Verify locally with the exact command Vercel runs:
   `pnpm exec turbo run build --filter=<workspace-package-name>` (from repo root).
