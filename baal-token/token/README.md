# token

- `allocation.json`: single source of truth for supply, decimals, allocations, vesting parameters and wallet-role placeholders. Amounts are decimal strings (never JSON numbers).
- `metadata.json`: draft token metadata with `PLACEHOLDER_NOT_PUBLISHED` image and URL.
- `src/units.ts`: integer-only arithmetic. `src/allocation.ts`: validator. `src/vesting.ts`: vesting calculator. `src/metadata.ts`: metadata schema.

Changing an approved number means changing the Phase 0 decision: update an ADR first, then the JSON; the tests pin the approved values on purpose.
