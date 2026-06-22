# Data-Driven Workflow Engine — Phase 1 (Module 6)

> **Status:** ✅ Implemented & tested (template registry + pure evaluator; engine
> + registry tests green; full suite on real PostgreSQL). Admin UI delivered by
> the shared registry-driven console.
> **Principle:** *Configuration over code — replace hardcoded state machines.* A
> workflow is a **template record** (states + transitions + guards + approvals);
> the evaluator is pure and deterministic. Transition guards reuse the Rule
> Engine's condition language — one structured condition AST across the platform,
> no `eval`. Nothing is seeded.

The engine turns a workflow definition into runtime behaviour: which transitions
are available from a state, whether an event may fire (guard + approvals), the
resulting state, escalation/timeout behaviour, cancellation, rollback and
sub-workflows — all from data.

---

## 1. Architecture

| Layer | File | Responsibility |
|------|------|----------------|
| Template model | `src/server/workflow/workflow-types.ts` | Zod schemas + types for states, transitions, approvals, retries, sub-workflows. |
| Engine | `src/server/workflow/workflow-engine.ts` | Pure `validateWorkflowTemplate`, `availableTransitions`, `findTransition`, `fireTransition`, `cancellationTransition`, `timeoutTarget`, `isFinal/isTerminal`. |
| Template registry | `src/server/gckb/registries/workflow.ts` | The `workflow_template` GCKB entity (versioning, history, search, import, RLS). |
| Condition language (reused) | `src/server/rules/condition.ts` | Guards are Rule-Engine `Condition` ASTs — no second DSL. |
| Transition history (reused) | `src/server/repositories/workflow-repository.ts` | The append-only `workflow_events` log for running instances. |

The template **registry** rides the GCKB engine (no new migration). The
**evaluator** is a standalone pure module — identical inputs always yield
identical outcomes, fully unit-testable without a database.

### Replacing hardcoded state machines

Existing flows (trade lifecycle, settlement machine) are hardcoded TypeScript.
This engine is their **data-driven replacement**: the same lifecycle becomes a
`workflow_template` record, so changing states/approvals/SLAs is a config edit —
no code change, no redeploy. Migration is incremental and **backward-compatible**:
the engine is additive and does not modify the existing machines.

---

## 2. Template model

```
WorkflowTemplate {
  workflowType?  initialState  cancellable?
  states[]      { key, name?, kind(INITIAL|INTERMEDIATE|FINAL|CANCELLED), timeoutSeconds?, escalateTo?, onTimeoutState? }
  transitions[] { key, from, to, on(event),
                  guard?(Condition AST),                 // Rule-Engine condition — gates the transition
                  approvals?[{ role, minCount, delegable }],  // N-of-M sign-off, delegation
                  mode?(SEQUENTIAL|PARALLEL),             // fork/branch steps
                  autoAfterSeconds?,                      // timeout auto-fire
                  retry?{ max, backoffSeconds },          // retryable external actions
                  compensates?,                           // rollback edge (which transition it undoes)
                  isCancellation? }
  subWorkflows?[]{ key, templateKey, onState, blocking }  // nested workflows
}
```

Every concern in the brief is **data**: States, Transitions, Approvals,
Parallel/Sequential steps (`mode`), Conditions (`guard`), Escalations
(`escalateTo`), Retries (`retry`), Timeouts (`timeoutSeconds`/`autoAfterSeconds`),
Delegation (`approvals[].delegable`), Rollback (`compensates`), Cancellation
(`cancellable` + `isCancellation`), Sub-workflows (`subWorkflows`).

Natural key: `WORKFLOWTYPE:CODE`.

---

## 3. Evaluator API (pure)

| Function | Returns |
|----------|---------|
| `validateWorkflowTemplate(t)` | structural errors (states/initial/final exist, transitions reference real states, guards valid) |
| `availableTransitions(t, state, facts)` | transitions leaving `state` whose guard passes |
| `findTransition(t, state, event, facts)` | the transition fired by `event`, or null |
| `fireTransition(t, state, event, facts, {grantedApprovals})` | `{ ok, nextState }` / `{ requiresApproval, missingApprovals }` / `{ error }` |
| `cancellationTransition(t, state, facts)` | the any-state cancel transition (if cancellable) |
| `timeoutTarget(t, state)` | `{ state, escalateTo }` on SLA breach |
| `isFinal / isTerminal(t, state)` | lifecycle completion checks |

Validation at the registry boundary combines the zod shape **and**
`validateWorkflowTemplate`, so a malformed workflow (dangling target state, no
final state, invalid guard) is rejected on write.

---

## 4. Relationships (`WORKFLOW_RELATIONSHIP_TYPES`)

```
HAS_SUBWORKFLOW    workflow_template → workflow_template
USES_RULE          workflow_template → rule (a guard sourced from the Rule Engine)
PRODUCES_DOCUMENT  workflow_template → document_template (Module 5)
GOVERNS            workflow_template → any entity it drives (trade, certificate, …)
```

---

## 5. API

The `workflow_template` entity is served by the generic registry routes:

| Method & path | Purpose |
|---------------|---------|
| `GET /api/gckb/workflow_template?keyword=&page=` | Search templates |
| `POST /api/gckb/workflow_template` | Create a template (validated structurally) |
| `GET /api/gckb/workflow_template/{id}` · `/history` · `/versions` · `/relationships` | Read / history / edges |
| `POST …/validate` · `…/import` · `GET …/export` | Validate / import / export |

### OpenAPI (fragment)

```yaml
openapi: 3.0.3
info: { title: Data-Driven Workflow Engine, version: "1.0" }
paths:
  /api/gckb/workflow_template:
    post:
      summary: Create a workflow template
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [name, attributes]
              properties:
                name: { type: string }
                code: { type: string }
                attributes:
                  type: object
                  required: [initialState, states, transitions]
                  properties:
                    workflowType: { type: string }
                    initialState: { type: string }
                    cancellable: { type: boolean }
                    states: { type: array, items: { type: object, required: [key] } }
                    transitions: { type: array, items: { type: object, required: [key, from, to, on] } }
                    subWorkflows: { type: array, items: { type: object } }
      responses: { "201": { description: Created }, "400": { description: Structural validation error } }
```

---

## 6. Data dictionary / Events

`gckb_records` for `workflow_template`: `entityType`, `recordKey`
(`WFTYPE:CODE`), `name`, `attributes` (the full template), `version`, `status`,
`organizationId`. Running-instance transitions use the existing `workflow_events`
log. Events: `WORKFLOW_TEMPLATE_CREATED/UPDATED/ARCHIVED`.

---

## 7. Testing

```bash
npx vitest run src/server/workflow/__tests__/workflow-engine.test.ts \
               src/server/gckb/__tests__/workflow-registry.test.ts
```

- `workflow-engine.test.ts` — validation, guard-gated branching (low/high value),
  N-of-M approvals, board-approval routing, terminal/cancellation, timeouts/escalation.
- `workflow-registry.test.ts` — registration, key, combined zod + structural
  validation (dangling target / no-final / empty-states rejected), relationships.

---

## 8. Scope boundary

**In this module:** the template model, the pure evaluator, the `workflow_template`
registry entity, relationships, and tests; this doc.

**Reused, not duplicated:** the Rule-Engine condition language for guards; the
existing `workflow_events` log for instance history.

**Deliberately not here:** no rip-out of the existing hardcoded machines (the
engine is the additive, backward-compatible replacement to migrate to); no seeded
workflows.
