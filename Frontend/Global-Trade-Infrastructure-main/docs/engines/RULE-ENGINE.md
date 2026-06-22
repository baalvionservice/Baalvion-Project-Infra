# Rule Engine (Phase 1)

> **Status:** ✅ Implemented & tested (33 unit + integration tests, real PostgreSQL).
> **Principle:** *Configuration over code.* No business rule lives in a TypeScript
> `if`/`switch`. Every rule is a row you can author, version, and evaluate at runtime.

The Rule Engine is the keystone of the configuration-driven GTI platform. It is a
generic, multi-tenant, version-controlled decision engine: country/product/role/HS
restrictions, sanctions, AML thresholds, licensing requirements and conditional
workflow routing are all expressed as **data**, evaluated by one pure engine.

It is **net-new and additive** — it does not modify any LIVE surface. It is the
explicit, data-driven replacement for the hardcoded logic in
`server/compliance/compliance-engine.ts` (sanctioned-country `Set`s, AML
thresholds) and `services/governance-service.ts` (string-match DSL, restricted
country codes, `"Defense"` category checks).

---

## 1. Architecture

```
HTTP (App Router)            Service (orchestration)        Pure engine (no I/O)
─────────────────            ───────────────────────        ────────────────────
/api/rules            ─┐
/api/rules/[id]        ├─►  ruleService  ─► withTransaction ─► repositories (Prisma)
/api/rules/[id]/items  │        │                              rule_sets / rules
/api/rules/.../[ruleId]│        │                              rule_revisions (append-only)
/api/rules/[id]/revs   │        │            audit_logs (immutable)
/api/rules/evaluate   ─┘        │            outbox_events ─► flushOutbox ─► event bus
                                ▼
                         evaluateRuleSet(set, facts)  ◄─ server/rules/rule-engine.ts
                                ▲                          server/rules/condition.ts
                         RuleSetDefinition (global ⊕ tenant merge)
```

| Layer | File | Responsibility |
|------|------|----------------|
| Condition AST + evaluator | `src/server/rules/condition.ts` | Safe, pure boolean evaluation. **No `eval`/`Function`.** |
| Engine types | `src/server/rules/types.ts` | Storage-agnostic contracts; effect→decision mapping. |
| Engine | `src/server/rules/rule-engine.ts` | Pre-filter → evaluate → conflict resolution → decision. Pure. |
| Validation | `src/server/rules/schemas.ts` | Zod request schemas (boundary validation). |
| Repositories | `src/server/repositories/rule-repository.ts` | Prisma access; global+tenant scoping. |
| Service | `src/server/services/rule-service.ts` | Transactional CRUD + versioning + audit + outbox + evaluate. |
| HTTP | `src/app/api/rules/**` | REST endpoints (auth, rate-limit, error mapping). |
| Seed | `scripts/seed-rules.cjs` | Provisions the platform-global baseline. |

The engine has **zero coupling to Prisma** — it operates on plain objects, so it
is fully deterministic and unit-testable. The same `(AST, facts)` always yields
the same decision, which makes evaluations replayable.

---

## 2. Data model

Three tables (see `prisma/schema.prisma`, migration `20260621120000_rule_engine`):

- **`rule_sets`** — a named, versioned, conflict-resolving collection of rules.
- **`rules`** — a condition + effect(s) with selector facets and a time window.
- **`rule_revisions`** — append-only history (DB-enforced immutable) for version
  comparison and forensic replay.

### Global baseline vs tenant override

`organizationId` is **nullable** on `rule_sets` and `rules`:

| `organizationId` | Meaning |
|------------------|---------|
| `NULL` | **Platform-global baseline** — inherited by every tenant. Seeded by privileged tooling. |
| a tenant UUID | **Tenant override/addition** — authored via the API under RLS. |

**Row-Level Security** (migration) lets every tenant **read** global (`NULL`) rows
plus its own, and **write** only its own. A tenant can never see or mutate another
tenant's rules, and cannot edit the global baseline through the API.

### Evaluation merge

`ruleService.evaluate(ctx, { ruleSetKey, facts })` loads the global set *and* the
caller's tenant set of the same `key`:

- If a tenant override exists, it **governs** `conflictStrategy` / `defaultDecision`.
- Active rules from **both** the global and tenant sets are merged and evaluated.
- Set-level status + effective window are applied before merging.

This gives "inherit the regulatory baseline, add stricter org-specific rules."

---

## 3. Condition language

Conditions are a JSON AST — discriminated union, evaluated by `evaluateCondition`:

```jsonc
// constant
{ "always": true }

// comparison: <fact> <op> <value>
{ "fact": "destinationCountry", "op": "in", "value": ["IR","KP","RU"], "caseInsensitive": true }

// logical composition
{ "all": [ <cond>, <cond> ] }      // AND (empty ⇒ true)
{ "any": [ <cond>, <cond> ] }      // OR  (empty ⇒ false)
{ "not": <cond> }
```

`fact` is a **dot-path** into the facts object (`"trade.amount"`), with safe
traversal (missing segments ⇒ `undefined`; prototype keys refused).

**Comparators:** `eq ne gt gte lt lte in nin contains ncontains startsWith
endsWith matches exists between`. Numeric/date/string ordering is inferred;
`matches` compiles a length-capped RegExp (trusted-author boundary).

The evaluator is **total** — it never throws; an unrecognised node is `false`
(fail-closed). `validateCondition()` rejects malformed ASTs at write time.

---

## 4. Effects, decisions & conflict resolution

A rule carries one or more **effects**: `{ type, message?, params? }`. `type` is
open-ended data. Three types are *decision-bearing* (everything else is a collected
**obligation**):

| Effect type(s) | Decision |
|----------------|----------|
| `ALLOW`, `PERMIT` | `ALLOW` |
| `REVIEW`, `REQUIRE_REVIEW`, `FLAG`, `HOLD` | `REVIEW` |
| `DENY`, `BLOCK`, `REJECT` | `DENY` |
| `REQUIRE_LICENSE`, `REQUIRE_DOCUMENT`, `ADD_TARIFF`, `NOTIFY`, … | *(obligation, non-decisional)* |

The set's **`conflictStrategy`** resolves multiple matches:

| Strategy | Behaviour |
|----------|-----------|
| `DENY_OVERRIDES` *(default)* | most severe wins: `DENY > REVIEW > ALLOW` |
| `ALLOW_OVERRIDES` | any `ALLOW` wins, else `DENY`, else `REVIEW` |
| `PRIORITY` | the highest-`priority` matching rule decides |
| `FIRST_MATCH` | only the first (priority-ordered) matching rule applies |
| `ALL_MATCH` | every match collected; most-severe decision wins |

If nothing matches, the set's **`defaultDecision`** is returned (`defaultApplied: true`).

`EvaluationResult` = `{ decision, defaultApplied, conflictStrategy, matches[],
obligations[], evaluated, evaluatedAt }`.

---

## 5. API

All routes are `runtime = 'nodejs'`, authenticated by the gateway-signed principal
(identity + tenant), rate-limited, and return the standard `{ success, data, error }`
envelope.

| Method & path | Purpose |
|---------------|---------|
| `GET /api/rules` | List/search rule sets (`?category=&status=&search=&page=&pageSize=`) |
| `POST /api/rules` | Create a tenant rule set |
| `GET /api/rules/{id}` | Get a set + its rules |
| `PATCH /api/rules/{id}` | Update a set (optional `expectedVersion` optimistic lock) |
| `DELETE /api/rules/{id}` | Archive a set (`?reason=`) |
| `GET /api/rules/{id}/items` | List rules in a set |
| `POST /api/rules/{id}/items` | Add a rule |
| `PATCH /api/rules/{id}/items/{ruleId}` | Update a rule |
| `DELETE /api/rules/{id}/items/{ruleId}` | Soft-delete a rule (`?reason=`) |
| `GET /api/rules/{id}/revisions` | Version history (newest first) |
| `POST /api/rules/evaluate` | Evaluate `{ ruleSetKey, facts, now? }` |

Example evaluate:

```http
POST /api/rules/evaluate
{ "ruleSetKey": "sanctions.screening",
  "facts": { "destinationCountry": "IR", "amount": 1500000, "counterpartyName": "Ivan Petrov" } }

→ { "success": true, "data": {
     "decision": "DENY",
     "matches": [{ "ruleKey": "sanctioned-destination", "decision": "DENY" }, …],
     "obligations": [], "defaultApplied": false } }
```

---

## 6. Audit, events & versioning

Every **mutation** runs in one transaction that writes, atomically:

1. the entity row (with `version` bumped),
2. an **immutable `audit_logs`** row (before/after/who/when/ip/correlation),
3. an **append-only `rule_revisions`** snapshot (DB trigger blocks UPDATE/DELETE),
4. a transactional-**outbox** event — then `flushOutbox()` relays it to the bus.

Emitted events: `RULE_SET_CREATED|UPDATED|ARCHIVED`, `RULE_CREATED|UPDATED|DELETED`,
and `RULE_EVALUATED` (every evaluation is also audited for forensic replay).

---

## 7. Replacing hardcoded logic

`scripts/seed-rules.cjs` provisions the global baseline that supersedes the
hardcoded TS:

| Was hardcoded in… | Now a global rule set |
|-------------------|------------------------|
| `compliance-engine.ts` `SANCTIONED_COUNTRIES` / `HIGH_RISK_COUNTRIES` / `SANCTIONED_ENTITIES` / `PEP_NAMES` | `sanctions.screening` |
| `compliance-engine.ts` `AML_THRESHOLD` / `HIGH_VALUE` | `aml.thresholds` |
| `governance-service.ts` restricted countries + `"Defense"` checks | `export.licensing` |

Run it (privileged DB role, RLS-bypassing — required to write `NULL`-org rows):

```bash
node scripts/seed-rules.cjs
```

**Migration path for callers:** the legacy compliance/governance code can be
re-pointed at `ruleService.evaluate(ctx, { ruleSetKey: 'sanctions.screening', facts })`
incrementally, behind a flag, asserting identical outcomes before the hardcoded
`Set`s are deleted. That swap is a follow-up slice (it touches a LIVE surface and
must be done with parity tests) and is intentionally **not** bundled here.

---

## 8. Testing

```bash
npx vitest run src/server/rules/__tests__
```

- `condition.test.ts` — operators, logical composition, validation, fail-closed.
- `rule-engine.test.ts` — selectors, time windows, all five strategies, obligations.
- `rule-service.test.ts` — real PostgreSQL: global eval, tenant merge, versioning,
  optimistic lock, append-only immutability, RLS global+tenant visibility.

The vitest global setup boots an embedded PostgreSQL and runs `prisma migrate
deploy`, so the suite also verifies the migration (RLS policies, partial-unique
indexes, append-only trigger) on real Postgres.

---

## 9. Next slices (Phase 1 roadmap)

The Rule Engine is the foundation the following consume:

1. **Country Knowledge Base** & **Product/HS Registry** — reference data the rule
   `facts` and selectors draw on; rules reference HS codes / country policies.
2. **Workflow Engine (data-driven definitions)** — conditional routing/approvals
   evaluated through this engine instead of the hardcoded `lifecycle.ts` map.
3. **Compliance/governance re-point** — swap the hardcoded `Set`s for
   `ruleService.evaluate`, behind parity tests (touches LIVE — careful slice).
