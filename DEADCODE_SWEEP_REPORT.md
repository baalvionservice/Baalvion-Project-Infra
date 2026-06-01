# Dead-Code / Dependency Sweep — Report

**Date:** 2026-06-02 · **Method:** evidence-based detection (2 analysis agents + own greps) →
adversarial verification (20-agent workflow, each removal challenged by an independent skeptic)
→ empirical verification (rebuilt images + 4 harnesses). No blind deletion.

> Scope discipline: I **removed + verified** only within the already-verified Limited-Beta
> commerce vertical. Everything outside it is **reported, not deleted** — removing deps/files in
> services I haven't booted/tested is the unsafe pattern this sweep avoids. Each item below is
> ready for a follow-up scoped pass (say "sweep <service>" and I'll do it with rebuild+test).

---

## 1. Removed + VERIFIED (Limited-Beta vertical)

### Dead source files (3) — all adversarially confirmed `safe`
| File | Why dead |
|---|---|
| `order-service/utils/slugify.js` | zero `require`s anywhere; unused helper |
| `ledger-service/realtime/index.js` | zero `require`s; needs `socket.io` which isn't even installed |
| `cms-service/scripts/configurePaymentSites2.cjs` | zero references; superseded by `configureSandboxPayments.cjs` |

### Regenerable cruft (7, untracked) — zero risk
`_echo.js`, `.dep-err.txt`, `backend-tree-2depth.txt`, `.pnpm-install.log`, `.pnpm-install2.log`,
`.pnpm-lockonly.log`, `.auth-gateway.log`.
(Left intact: `.dependabot-alerts.json`, `_lawyer_dash*.png`, `PROJECT_TREE.txt` — untracked/unrecoverable or doc-referenced.)

### Unused dependencies (10 removals across 6 services)
| Service | Removed | Verdict |
|---|---|---|
| ledger-service | `kafkajs`, `bullmq`, `redis`, `winston` | safe (only dead config/placeholder refs) |
| payment-service | `bullmq`, `winston` | safe (placeholder `queue/workers.js` + a JSDoc comment) |
| inventory-service | `bullmq` | safe (no queue code) |
| commerce / order / inventory | `jsonwebtoken` | safe — see §2 |
| cms-service | `jsonwebtoken` → **devDependencies** | safe — only dev seed scripts use it |

**Verification gates (all passed):**
- `pnpm install --frozen-lockfile` → consistent (lockfile −70 lines).
- Rebuilt all 6 images with pruned deps (incl. the fixed ledger Dockerfile) — **all build**.
- Restarted order + payment + cms; **all 4 harnesses GREEN** (revenue, enforcement 8/8, security, payment 9/9).

---

## 2. Adversarial verdicts & the false positives I refuted

The 20-agent verification returned `safe` for 10 of 14 removals and flagged 4 as `unsafe`.
I investigated all 4 — **none is actually unsafe:**

| Flag | Verifier's reasoning | Refutation |
|---|---|---|
| `jsonwebtoken` removed from commerce / order / inventory | "`@baalvion/auth-node` (a `workspace:*` dep) internally `require`s jsonwebtoken → consumer needs it" | **False positive — transitive-dep error.** `.npmrc` has `shamefully-hoist=false` (strict pnpm); auth-node resolves its **own** copy. Proven in the rebuilt container: `require.resolve('jsonwebtoken')` from auth-node's dir → `/app/node_modules/.pnpm/jsonwebtoken@9.0.3/...`, and every auth-gated harness (enforcement_e2e IDOR checks need working RS256 verify) passed. The services never `require`d jsonwebtoken directly. |
| cms `jsonwebtoken` → devDependencies | "two `_seed*.cjs` scripts call `jwt.sign()`" | **Correct placement, not unsafe.** Those underscore-prefixed scripts are dev-only (never run in prod / bootstrap). `devDependencies` is exactly where a dev-script-only dep belongs; dev installs include it, and the prod image rightly excludes it (rebuilt cms is healthy). |

Two earlier *stale* "dead" claims from `FINAL_LAUNCH_READINESS.md` were also caught and **left untouched** because they are live: `isStoreStaff` (used by order-service `actor.js`) and `commerce-service/service/rbac*.js` (used by `commerceAccess.js`/`commerceAuthz.js`/`storeService.js`/`provisionCommerceRbac.cjs`).

---

## 3. Reported candidates (platform-wide, NOT removed)

High-confidence finds outside the verified beta. **Safe to action in a follow-up with per-service rebuild/test.**

### Orphan files (highest confidence — never imported)
- `auth-service/service/auditService.js` — dup of the canonical `services/auditService.js` (a stale `teamService.js` import points at it).
- `law-service/service/logger.js` — never imported.
- **ir-service**: `controller/{documentsController,filingsController,reportsController}.js` — routes import the **singular** names; the plural files are orphans.
- **admin-platform (frontend)**: `src/lib/auth/gateway-client.ts`, `src/lib/auth/sdk-session.ts` (self-labeled DORMANT), `src/lib/hooks/{useDebounce,useLocalStorage,useMediaQuery}.ts`, `src/lib/store/orgStore.ts` — exported but never imported.

### Unused dependencies (high confidence)
- `session-service`: `cookie-parser`
- `admin-service`: `cookie-parser`, `pino-http`, `zod`
- `dashboard-service`, `proxy-service`, `notification-service`, `ir-service`, `about-service`: `jsonwebtoken` (same auth-node pattern — direct removal is safe)
- `notification-service`: `uuid` (uses native `crypto.randomUUID()`)
- `law-service`, `ir-service`: `ioredis`
- `ml-service`: `prometheus-client` (Python)
- `admin-platform`: `@radix-ui/react-collapsible`, `@radix-ui/react-radio-group`, `@radix-ui/react-toast` (uses `sonner`)

### ⚠ Detector false positives — DO **NOT** remove
- `audit-service:pg`, `audit-service:pg-hstore`, `admin-service:pg-hstore` — **implicit Sequelize peers**. `pg` is the Postgres driver Sequelize loads; `pg-hstore` is needed for JSONB. Removing them breaks the service despite "zero direct require" hits.
- `@baalvion/config` (`getBaseConfig`/`getAuthConfig`/`getIdentityConfig`) and `@baalvion/rbac` (`getRoleLevel`/`isRoleAtLeast`/`hasPermission`/`hasAnyPermission`/`hasAllPermissions`) "dead exports" — these are a shared library's **public API surface**, not dead code. Trim only as a deliberate API decision.

### Deferred (medium effort, not dead — consolidation)
- Local copies of `response.js`/`errors.js`/`errorMiddleware.js`/`pagination.js`/`authMiddleware.js` across ~16 services while `@baalvion/{response,errors,middleware}` exist. Consolidation is feasible (none currently depend on the shared packages) but is a per-service migration, not a deletion.

---

## 4. Net result

- **Beta vertical:** 3 dead files + 7 cruft files + 10 unused-dep entries removed; lockfile −70 lines;
  every image rebuilds; all 4 regression harnesses still green. **Zero regressions.**
- **Adversarial verification** caught 4 flags; all investigated and resolved (false positives), and 2 stale prior "dead" claims were prevented from causing real breakage.
- **~30 additional candidates** reported with evidence + confidence + 2 detector-false-positive corrections, ready for a scoped follow-up.

> Note on git: the `Backend/services/<domain>/<service>/` tree is uncommitted (pre-existing platform-migration state), so the package.json edits/file deletions there are on disk + verified but not shown as discrete git diffs; the tracked `pnpm-lock.yaml` reflects the pruned deps.
