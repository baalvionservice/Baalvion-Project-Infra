# Governance policies — what exists, what is missing, and a plan

Written 2026-10-13 after testing the GTI admin panels signed in as a super admin.
Everything under "What I found" was checked against the code or run against a local stack.

## What I found

1. **Governance policies do not govern anything.** `governanceService.evaluateAction()` — the
   function that is supposed to enforce policies — has **no callers**. Nothing in the frontend
   calls it, and the backend has no enforcement. The "Policy Registry" is a list screen.
   Creating a `block` policy has no effect on any order, payment or shipment.
2. **The condition engine is five hard-coded string checks**, not an expression engine
   (`amount > 1000000`, `isHighRiskJurisdiction == true`, `requiresDocumentRef`,
   `isIdentityDriftDetected`, `productCategory == "Defense"`). Any other condition silently
   evaluates to false, so an administrator who writes a different rule gets no error and no effect.
3. **There are two policy screens and one is broken.** `/governance/policies` reads
   `/governance_policies`; `/oversight/governance/policies` reads `/policies`, which the backend
   deliberately rejects (404) because that name was an alias for insurance policies. It shows
   "No records found" forever.
4. **Any signed-in user can write policies.** `governance_policies` is not a real resource: it is
   the generic JSON document bucket, whose writes require only a login. Tested locally: an
   ordinary *buyer* account created a global-scope, priority-999 "allow" policy, read it back and
   deleted it. It is tenant-isolated (a seller in another organisation could not see it) and
   production requires a login even to read, so this is not an outsider exposure — but a buyer
   organisation can author the rules that are meant to govern it, with no role check, no schema
   check and no audit record. This becomes a live hole the moment enforcement is wired up.
5. **Sanctions and export controls are a separate, real system.** The compliance engine
   (`service/compliance`) already screens on the server against real lists. Governance policies
   should be *business rules* (value thresholds, jurisdictions, required documents), not a second
   sanctions mechanism.

## What I would not do
Wire enforcement to the existing store as it is. That would turn finding 4 into a privilege
escalation, and finding 2 would make most policies inert while looking active.

## Plan

**Phase 0 — close the hole and stop misleading people (about half a day).**
- Deny writes to `governance_policies` unless the caller is a platform administrator
  (a deny-by-role rule on the generic collection, with a test).
- Point both screens at the same endpoint, and show a visible "Not enforced yet" banner on the
  registry until Phase 2 ships, so nobody believes a `block` policy is protecting them.
- Remove the dead `evaluateAction` path or mark it unused.

**Phase 1 — a real policy resource (2–3 days).**
- Table `trade.governance_policies`: id, tenant_id (null = platform-wide), name, scope, action
  (allow | flag | block), priority, is_active, **structured condition** (JSON predicates over a
  whitelisted set of fields — not free text), effective_from/to, version, created_by,
  updated_by. Row-level security like the other trade tables.
- Typed routes with schema validation; platform administrators write, others read their own.
- Every create/update/delete written to the audit trail, and versions kept so a past decision
  can be explained against the policy as it was then.

**Phase 2 — server-side enforcement (3–4 days).**
- `service/governance/policyEngine.js`: pure, tested, deterministic. Evaluates the structured
  conditions; an unknown field or operator is a validation error, never a silent false.
- Called from the trade-service where decisions are actually made: order creation, payment
  initiation, shipment booking, customs submission. Server-side only — a browser cannot be the
  enforcement point.
- `block` rejects with the policy named in the error; `flag` creates an approval request
  (the approvals system already exists); every decision is logged in a `policy_decisions` table.

**Phase 3 — administration (about 2 days).**
- Create/edit in the registry for platform administrators, with a dry-run ("what would this
  policy do to order X?") and a decision log view. Reuse the existing admin console; no new panel.

## Decisions I need from you
1. Which actions are policy-gated first? (I suggest order value thresholds and
   destination-country rules.)
2. Who may author policies: platform administrators only, or also organisation administrators
   for their own organisation?
3. Are policies platform-wide only, or can an organisation have its own?
4. Should an organisation's policy be allowed to *relax* a platform policy? (I recommend no:
   a tenant can only add stricter rules.)

## Not in scope
Sanctions screening, export controls and KYC. Those stay in the compliance engine.
