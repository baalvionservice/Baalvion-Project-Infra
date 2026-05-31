# RBAC + ABAC — model, condition grammar, and decision algorithm

## Why hybrid (and why no conflict)

`@baalvion/rbac` / `@baalvion/auth-node` define the **platform token hierarchy**
(`viewer < member < editor < manager < admin < owner < super_admin`) used by
in-process Express guards. That stays as-is. rbac-service is a **separate authority**
that owns a *different, richer* model in its own `rbac` schema:

- a **tenant tree** (platform → country → organization),
- **per-tenant** hierarchical roles (`super_admin > country_admin >
  organization_admin > end_user` + custom roles),
- a **permission registry** and **ABAC policies**.

The two never collide: token verification is delegated to `@baalvion/auth-node`
(no second issuer), and the only bridge is that a token `super_admin` is honored as
a platform super_admin here. Everything else is resolved from this service's DB.

## Data model

| Table | Role |
|---|---|
| `rbac.tenants` | multi-tenant tree (`type`, `parent_id`, `external_ref`) |
| `rbac.roles` | per-tenant roles (`level`, `parent_role_id`, `is_system`) |
| `rbac.role_assignments` | user ⇄ role grant within a `(scope_type, scope_id)` |
| `rbac.permissions` | global `resource:action` registry |
| `rbac.role_permissions` | role ⇄ permission (`effect`, ABAC `constraints`) |
| `rbac.policies` | ABAC rules (`target`, `condition`, `effect`, `obligations`) |
| `rbac.subject_attributes` | declared subject attributes for ABAC |
| `rbac.decision_logs` | audit of every PDP decision |

## Condition grammar (ABAC)

Conditions are a JSON AST evaluated against a flat context:

```
{ subject:{id,roles,level,orgId,...attrs}, resource:{type,id,...attrs},
  action, env:{time,hour,dayOfWeek,...}, tenant:{id,type,...attrs} }
```

| Category | Operators |
|---|---|
| Logical | `and` `or` `not` |
| Compare | `==` `!=` `>` `>=` `<` `<=` |
| Sets    | `in` `nin` `contains` |
| String  | `startsWith` `endsWith` `regex` |
| Presence| `exists` `empty` |
| Value   | `{"var":"subject.orgId"}` · `{"var":["path","fallback"]}` |

An empty/absent condition (`{}`/`null`) is **always true**. Malformed conditions
evaluate to **false** via `matches()` (they never crash a decision).

Example — *"only within the subject's own org, for engineering, weekdays"*:
```json
{ "and": [
  { "==": [ {"var":"resource.orgId"}, {"var":"subject.orgId"} ] },
  { "==": [ {"var":"subject.department"}, "eng" ] },
  { "<":  [ {"var":"env.dayOfWeek"}, 6 ] }
]}
```

## Decision algorithm (PDP)

For `authorize({subject, action, resource, scopeId, tenantId, context})`:

1. **RBAC** — load the subject's effective permissions for the scope (own +
   inherited from parent roles; deny-overrides within the chain). Match the request
   against candidate keys `resource:action`, `resource:*`, `*:action`, `*:*`; a
   matching grant's ABAC `constraints` must also hold. `super_admin` gives a baseline
   allow.
2. **ABAC** — gather active policies (global + tenant), check each policy's `target`
   (actions/resources/roles/scopes) and `condition`. Collect matches and merge
   `obligations`.
3. **Combine (deny-overrides):**
   - any explicit **deny** (RBAC `effect=deny` grant, or a matching `deny` policy) → **deny**;
   - else any **allow** (RBAC grant, super_admin baseline, or `allow` policy) → **allow**;
   - else **default deny**.
4. Return `{ decision, allow, obligations, reasons, matched }` and write a
   `decision_log` (skipped for `/simulate`).

**Obligations** are how *limit* is expressed: an allow can carry e.g.
`{"limit":{"maxRows":5000}}` or `{"require_mfa":true}` that the calling PEP enforces.

## Phasing

- **Phase 1 (done):** tenants, roles, hierarchy, assignments + APIs.
- **Phase 2 (done):** permission registry, role↔permission mapping, effective perms.
- **Phase 3 (done):** ABAC policies, subject attributes, the PDP `/authorize`.

All three ship together here; the migrations are additive (`001`→`003`) so each
layer was introduced without altering the previous one.
