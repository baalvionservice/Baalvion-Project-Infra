# ADR-002: Fixed supply and revoked mint authority

**Status:** Accepted (Phase 0, founder-approved). **Date:** 2026-10-04.

## Context

A token whose mint authority remains set can have its supply increased at will, so holders must trust the authority holder indefinitely. Total supply of 1,000,000,000 at 9 decimals is 10^18 base units, which fits within the SPL Token program's u64 limit (about 1.8 x 10^19); the validator checks this.

## Decision

The full supply is minted once, and the mint authority is then permanently revoked (set to none) before any distribution. Supply is therefore exactly 1,000,000,000 BAAL forever.

## Consequences

- Holders do not need to trust anyone with supply.
- Irreversible: a mistake in the minted amount, decimals or destination cannot be corrected by changing supply. Mainnet launch needs a rehearsed, reviewed ceremony (devnet first) before the revoke step.
- The mint authority exists only transiently during launch and is held only by the hardware-wallet-controlled launch key; it is never in CI or the repository.
