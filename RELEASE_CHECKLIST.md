# Release Checklist — Baalvion MVP Production Release (v1.0.0-mvp)

> Release Engineer sign-off sheet. Generated from a live repository audit on 2026-06-20.
> Branch: `main` → `origin/main` (in sync). Repo: `baalvionservice/Baalvion-Project-Infra`.

## 1. Repository State (verified, not assumed)

| Category | Count | Detail |
|----------|-------|--------|
| Modified tracked files | 9 | Dockerfiles, `next.config.ts` (standalone output), `catalog/index.json`, ecosystem cfg |
| Untracked deployment artifacts | 11 | `deploy/mvp-production/*`, per-app `Dockerfile`/`.dockerignore`, `nginx.conf.template` |
| Untracked docs/reports | 7 | `*_GUIDE.md`, `*_MATRIX.md`, `FINAL_*.md`, `FRONTEND_*.md` |
| Transient generated artifacts | 2 | `build-report.txt`, `lint-report.txt` — **EXCLUDE** |
| Tracked node_modules/.next/dist | 0 | Clean |

## 2. Security Gate (MANDATORY — all must pass)

- [x] No real `.env` file present (only `deploy/mvp-production/.env.production.example`, all secret values blank)
- [x] No hardcoded Razorpay keys (`rzp_live_*` / key secrets) — env-templated only
- [x] No PayU keys / hashes committed
- [x] No AWS credentials (`AKIA…`, `aws_secret_access_key=…`) — uses IAM-role guidance + blank `S3_*`
- [x] No private keys (`-----BEGIN … PRIVATE KEY-----`) — `JWT_PRIVATE_KEY=` blank
- [x] No DB passwords literal — `init-roles.sql` uses psql `-v` variable binding; compose uses `${VAR}` (111 refs, 0 literals)
- [x] `.gitignore` covers `.env`, `*.pem`, `*.key`, `secrets/`, `node_modules`, `dist`, `.next`, `coverage`, `*.log`
- [x] GitHub secret-scanning push protection enabled on remote (per repo policy)

## 3. Files That MUST Be Excluded From the Release Commit

| File | Reason | Action |
|------|--------|--------|
| `build-report.txt` | Transient build output (27 lines), not gitignored | Add to `.gitignore`, do not `git add` |
| `lint-report.txt` | Transient lint output (2909 lines), not gitignored | Add to `.gitignore`, do not `git add` |
| `**/.env*` (non-example) | Secrets | Already gitignored — verify never staged |
| `**/*.pem`, `**/*.key` | Private keys | Already gitignored |
| `node_modules/`, `.next/`, `dist/`, `coverage/` | Build artifacts | Already gitignored |

Optional / reviewer's call (no secrets, but redundant status reports): `FINAL_GO_NO_GO_REPORT.md`,
`FINAL_MVP_DEPLOYMENT_READINESS_REPORT.md`, `FINAL_MVP_DEPLOYMENT_READY.md` — consider keeping
only one. Project `CLAUDE.md` treats reports as archival.

## 4. Build / Quality Gates (operator to run before tag)

- [ ] `pnpm install` clean
- [ ] `pnpm run type-check`
- [ ] `pnpm run lint`
- [ ] `pnpm run build`
- [ ] `pnpm run architecture:check` (catalog contract — `catalog/index.json` changed)
- [ ] CI green on `main` after push

## 5. Release Mechanics

- [ ] Stage only release-relevant files (see commands in `GITHUB_RELEASE.md` / task output)
- [ ] Conventional-commit message
- [ ] Annotated tag `v1.0.0-mvp` (no force, no history rewrite)
- [ ] `git push` then `git push origin v1.0.0-mvp`
- [ ] Create GitHub Release from tag using `GITHUB_RELEASE.md`

## Verdict

Security gate: **PASS** — no secrets detected in any candidate file.
Release: **READY** once transient reports are excluded and build gates are green.
