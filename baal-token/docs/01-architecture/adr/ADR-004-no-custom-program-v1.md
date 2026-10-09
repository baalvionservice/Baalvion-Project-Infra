# ADR-004: No custom program in v1

**Status:** Accepted (Phase 0, founder-approved). **Date:** 2026-10-04.

## Context

Custom on-chain programs (vesting, staking, sale) add audit cost, upgrade-authority risk and exploit surface. v1 has no sale, no staking and no governance requiring one.

## Decision

Version 1 uses only the standard SPL Token program. `contracts/` stays empty. The vesting calculator is a specification and test oracle only.

## Consequences

- Nothing bespoke to audit or exploit.
- **Vesting cannot be enforced on-chain by this project's own code.** Locked allocations would need a third-party on-chain mechanism or a custody arrangement. This is addressed by [ADR-008](ADR-008-vesting-enforcement-decision-framework.md): the decision is open, and custody-based release is not equivalent to on-chain vesting.
- Any later requirement for a program needs a new ADR, an independent audit, and a decision on upgrade authority.
