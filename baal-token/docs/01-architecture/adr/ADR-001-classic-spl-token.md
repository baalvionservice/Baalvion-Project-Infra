# ADR-001: Classic SPL Token vs Token-2022

**Status:** Accepted (Phase 0, founder-approved). **Date:** 2026-10-04.

## Context

Solana has two token programs: the original SPL Token program (`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`) and Token-2022, which adds optional extensions (transfer fees, transfer hooks, permanent delegate, confidential transfers and others). Extensions can only be chosen at mint creation and change what holders and integrators must trust.

## Decision

BAAL uses the classic SPL Token program. `allocation.json` and both network configs pin that program id, and validators reject any other.

## Consequences

- Smallest behavioural surface: no extension can silently tax, hook or seize transfers.
- Broadest wallet, exchange and tooling compatibility.
- Gives up extension features (e.g. on-chain metadata pointers, transfer fees). Metadata uses the separate metadata mechanism, to be designed in a later phase.
- Moving to Token-2022 later would mean a new mint and a migration; this must be treated as a new decision, not a config change.
