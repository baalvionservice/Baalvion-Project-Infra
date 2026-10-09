# 05 Treasury and custody

Treasury is 20% (200,000,000 BAAL). **Its release schedule is TBD.** Allocation wallets do not exist; `allocation.json` carries role placeholders with `address: null`, and the validator rejects any committed address.

## Approved initial design: 3-of-5 multisig ([ADR-009](../01-architecture/adr/ADR-009-treasury-multisig.md))

- Threshold 3 of 5 signers, at least one independent of the founding team.
- Signer roles and recovery requirements are recorded in [token/treasury-policy.json](../../token/treasury-policy.json). **No identities, no wallets, no keys.**
- Status: design only, not yet implemented. The multisig mechanism is not chosen.
- Known limitation: with one independent signer, the other four can reach the threshold without them (see ADR-009).

## Principles

- Hardware-wallet signing only; no keys on servers, in CI, or in the repository.
- Separate roles: launch/mint key (transient), treasury, founder vesting, liquidity, operations. No role shares a key with another.
- Every treasury movement is published ([13-transparency](../13-transparency/README.md)).

## Vesting enforcement

OPEN. See [vesting-provider-evaluation](vesting-provider-evaluation.md) and [ADR-008](../01-architecture/adr/ADR-008-vesting-enforcement-decision-framework.md). Multisig custody is not described as equivalent to on-chain vesting.

## Open decisions

1. Number of independent signers, and how signers are selected and vetted.
2. Multisig mechanism.
3. Release schedules for the six TBD allocations.
4. Whether any liquidity will be created, by whom, and under what disclosures. None in Phase 2.
