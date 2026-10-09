# ADR-005: No automated Mainnet deployment

**Status:** Accepted (Phase 0, founder-approved). **Date:** 2026-10-04.

## Context

CI systems hold secrets, run third-party code and are common attack targets. A Mainnet token launch is irreversible.

## Decision

No CI job, script or workflow may deploy, mint, sign or touch Mainnet. Production deployment is always a human-run ceremony with hardware-wallet signing outside CI. Enforced by: `ci/workflow-policy.ts` (fails on deploy/mint/signing/mainnet/secrets in workflows), the guard in `deployment/src/guard.ts` (refuses in CI and when signing material is in the environment), `ciExecutionAllowed: false` in configs, and the Phase 1 lock that refuses all deployment.

## Consequences

- A compromised CI cannot launch or alter the token.
- Launch is slower and manual by design.
- Mainnet needs explicit selection (`--network mainnet-beta`), genesis-hash verification and an exact typed confirmation, in addition to these controls.
