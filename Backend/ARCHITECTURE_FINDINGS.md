# Baalvion — Architecture Findings

> **Purpose:** the architectural assessment derived from [`SYSTEM_MAP.md`](./SYSTEM_MAP.md).
> What is sound, what is risky, what violates the locked invariants, and what to do
> about it. This is the bridge between the *inventory* (System Map) and the *backlog*
> ([`GAP_ANALYSIS.md`](./GAP_ANALYSIS.md), [`PENDING_WORK.md`](./PENDING_WORK.md)).
>
> **Generated:** 2026-05-31 · **Basis:** catalog (61 services, gate green), `ARCHITECTURE.md` invariants, on-disk truth.
>
> **Severity:** 🔴 Critical (blocks go-live / breaks an invariant) · 🟠 High (material risk) · 🟡 Medium (should fix) · 🟢 Low / informational.

---

## 1. Executive summary

The platform is in **strong architectural shape for its scale**: a federated
monorepo on a *locked* 6-domain axis, a real governance gate (`enforce.mjs`)
keeping 61 services honest against six invariants, a single RS256 identity
authority, and a clean schema-per-service data model. The **P0 cross-cutting
foundation is complete** (auth, gateway, notifications, audit, tenancy mechanism,
search, cache).

The risk has shifted from *architecture* to **execution & operational
readiness**: a large Java finance suite that has never been compiled here, a
mass of uncommitted work, two structural anomalies (a duplicated service, a stray
dir), and a long tail of product features still mock-backed. None of these break
the architecture; all of them block "done."

**Headline numbers:** 6 invariants enforced · 61 catalog descriptors · 0 gate
violations · 15 Java services uncompiled · 2 structural anomalies · 1 duplicated
service.

---

## 2. Strengths (keep doing this)

- 🟢 **Enforced architecture contract.** `catalog/enforce.mjs` mechanically enforces D1/A1/X1/I1/K1/C1 on every PR. Six invariants with a green gate at 61 services is the single biggest reason this hasn't become a distributed monolith.
- 🟢 **One identity authority.** RS256 + JWKS via `@baalvion/auth-node`; HS256 issuer islands decommissioned; BFF (`auth-gateway`) holds browser sessions. No second issuer (CLAUDE.md A1 holds in practice).
- 🟢 **Clean domain axis.** Every service maps to exactly one of six domains; domain decides folder/deploy, division decides reviewers. This is what makes "the next 100 services" tractable.
- 🟢 **Schema-per-service discipline.** Postgres-per-service with Redis/OpenSearch/ClickHouse strictly as projections (rule D1). No shared-DB coupling found.
- 🟢 **Foundation is genuinely done, not claimed.** The 7 P0 items (notifications, audit WORM+hash-chain, tenancy RLS, search, cache, gateway, auth) each have live verification evidence, not just code.
- 🟢 **Shared-library hygiene.** 21 `@baalvion/*` packages; cross-cutting concerns (auth, tenancy, cache, events, response) are libraries imported once — not copy-pasted. `@baalvion/cache` correctly chose library-over-service (avoided the HTTP-in-front-of-Redis anti-pattern).

---

## 3. Findings

### 🔴 Critical

**F-1 — Java finance suite has never been compiled.**
15 Spring services (`financial-services-java`) are the system of record for money,
KYC and risk, yet were authored against Java 1.7 with no Maven in this environment.
Nothing in Trade Finance / Payments / Settlement / Compliance can go live until
this compiles, runs migrations (Flyway), and passes its Testcontainers tests.
*Impact:* blocks Clusters 4/5/7 of the Trade platform.
*Action:* stand up a JDK 17 + Maven CI lane (the `.github/workflows/financial-services.yml` is a start), compile, run Flyway + tests, then wire each service behind the gateway. **Single highest-leverage unblock on the board.**

**F-2 — Large body of uncommitted work.**
Nearly all 2026-05-29..31 work (foundation packages, 4 new platform services,
finance suite, multiple frontend conversions) is uncommitted on feature branches.
*Impact:* unreviewed, unbacked-up, and invisible to CI; merge risk compounds daily.
*Action:* land in reviewed, conventional-commit batches per bounded context; get the gate running in CI on each.

### 🟠 High

**F-3 — Duplicate `realtime-service`.**
A socket.io variant exists under **both** `services/platform/realtime-service`
(collectors/wsServer) and `services/infrastructure/realtime-service`
(Dockerfile/RBAC.md/config/metrics). Two homes for one capability violates the
"one service, one home" principle and will confuse deploy + the dep graph.
*Action:* canonicalize to **`infrastructure/`** (per ARCHITECTURE.md §2), fold the platform-variant collectors in, delete the duplicate, reconcile the single catalog descriptor.

**F-4 — Tenancy enforcement is built but not rolled out.**
`@baalvion/tenancy` (RLS) is proven live, but RLS is *ignored for superusers* and
most services still connect as a superuser/owner role. Until each service switches
to a `NOSUPERUSER baalvion_app` role + per-table `enableRlsSql` policies +
`tenantMiddleware`, **multi-tenant isolation is not actually enforced at the data layer** for those services.
*Impact:* a correctness/security gap masquerading as "done."
*Action:* per-bounded-context rollout playbook (`packages/tenancy/README.md`): role+grants, per-table policy migration, middleware wrap. Track per service.

**F-5 — `gateway` is not yet the *complete* front door.**
REST routing + rate-limit + API keys exist, but **GraphQL federation** and a
**unified WebSocket pass-through** (today `realtime-service` is a separate WS path)
are missing. The "sole ingress" invariant (I1) holds for REST but WS bypasses it.
*Action:* add WS pass-through to the gateway; decide GraphQL federation scope.

### 🟡 Medium

**F-6 — Status drift between docs and disk.**
`PENDING_WORK.md` lists Deal Room and Smart Contract as 🔴 not-built, but both now
exist as Java scaffolds (`deal-room-service`, `smart-contract-service`). Docs lag
reality. *Action:* this reconciliation pass fixes it; keep SYSTEM_MAP as the
inventory source going forward.

**F-7 — Notification & search "done" but not production-real.**
Notification channels run on *log* providers (no Twilio/FCM/VAPID creds, optional
deps un-installed; delivery receipts absent). Search has no real OpenSearch cluster
and the 50M-docs/<50ms target is unproven; per-domain indexers unwired.
*Action:* install optional deps + inject creds; stand up a real OpenSearch cluster + wire indexers. (Config/ops, not architecture.)

**F-8 — Frontend auth shim still live in `brand-connector-main`.**
A real Firebase shim (`src/firebase/*`, `src/lib/fb-compat/*`) is still wired.
*Action:* migrate to `@baalvion/auth-sdk` *then* delete (do not blind-delete — it's load-bearing).

**F-9 — Provider keys deferred platform-wide (demo mode).**
Payments (mock intent→captured), SMS (log), and AI (curated fallback) all run
keyless by design. This is a deliberate, well-documented posture (flip-to-live =
1 env var each), **not** a defect — but it means "works in demo" ≠ "works in prod"
for every money/comms/AI path. *Action:* maintain the env-var flip matrix; verify each live path before go-live.

### 🟢 Low / informational

**F-10 — Stray `financial-services-java;C` directory.** Empty shell artifact; remove.
**F-11 — ml-service is a host without models.** Python FastAPI shell exists; the actual ML pipelines (matching, demand, supplier-risk, fraud, credit scoring) are pending — tracked as product gaps, not an architecture issue.
**F-12 — Decks vs reality drift (Typesense/Firebase/Kafka).** Already reconciled in PENDING_WORK; keep decks aligned to the authoritative stack table.

---

## 4. Invariant compliance scorecard

| # | Invariant | State | Note |
|---|---|---|---|
| D1 | One service = one database | ✅ | schema-per-service held; projections only |
| A1 | Identity only via `auth-node` | ✅ | HS256 islands decommissioned; no 2nd issuer |
| X1 | No cross-service `require` | ✅ | gate green; comms via contracts/events |
| I1 | Gateway is sole ingress | 🟡 | holds for REST; **WS bypasses** (F-5) |
| K1 | Prisma only in `baalvion-os` | ✅ | enforced |
| C1 | Every service has a descriptor | ✅ | 61/61; gate green |

> Net: 5 of 6 invariants fully held; I1 partially (WebSocket path). No violations reported by `architecture:check`.

---

## 5. Recommended order of attack (architecture lens)

1. **F-1** Compile + run the Java finance suite (unblocks the most product surface).
2. **F-2** Commit the uncommitted foundation/services in reviewed batches.
3. **F-3** Dedupe `realtime-service`; **F-10** remove the stray dir (cheap hygiene).
4. **F-4** Roll out tenancy RLS per bounded context (closes a real isolation gap).
5. **F-5** Finish the gateway (WS pass-through, GraphQL decision).
6. **F-7 / F-9** Wire real providers + OpenSearch cluster ahead of go-live.

See [`GAP_ANALYSIS.md`](./GAP_ANALYSIS.md) for the feature-level missing list and
[`EXECUTION_BACKLOG.md`](./EXECUTION_BACKLOG.md) for the sequenced task list.
