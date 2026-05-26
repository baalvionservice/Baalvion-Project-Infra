# @baalvion/contracts

The **single source of truth** for the integration surface between bounded
contexts. A service depends on these contracts, never on another service's
internals. Two kinds of contract live here:

| Kind | Path | Transport | Style |
|------|------|-----------|-------|
| **Synchronous** gRPC APIs | `proto/baalvion/<context>/v<n>/*.proto` | gRPC over mTLS | request/response |
| **Asynchronous** domain events | `events/<type>.v<n>.json` | NATS JetStream / Kafka | publish/subscribe |

## Governance (CI gates)

- **`buf lint`** — proto style (STANDARD ruleset, `Service` suffix, enum zero-value `_UNSPECIFIED`).
- **`buf breaking --against main`** — a breaking proto change is a **blocking** review gate. Backward-compatible evolution only (add fields, never renumber/remove).
- **`node scripts/validate-events.mjs`** — compiles every event schema with Ajv and validates a golden sample. Drift between schema and producer fails CI.
- **Codegen** — `buf generate` emits typed TS (connect-es) + Go stubs into `gen/`. No service hand-writes a wire client.

## Versioning

- Proto packages are versioned in the path (`v1`, `v2`). A new major version is a **new package**, served alongside the old until consumers migrate.
- Events are versioned in the filename (`.v1.json`). Producers may emit multiple versions during a migration window; consumers pin the version they understand.
- **Compatibility rule:** producers MAY add optional fields within a version; any required-field or semantic change is a new version.

## Ownership

Each `proto/baalvion/<context>` directory is owned by that context's team (see
root `CODEOWNERS`). A PR touching another context's contract requires that team's
review — this is how bounded-context boundaries are enforced in code review.

## Bounded contexts represented

- `identity` — the platform trust anchor (token verify, service tokens, RBAC principals).
- `billing` — shared billing platform (subscription, usage ingestion, quota).
- `proxy` — proxy division orchestration (allocate, outcome, provider state).

Add a context by creating `proto/baalvion/<context>/v1/` + its event schemas, then
wiring an entry in the service catalog (`catalog/`).
