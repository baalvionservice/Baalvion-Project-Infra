# ADR-007: Unspecified allocation release schedules

**Status:** Accepted (Phase 2, founder-approved). **Date:** 2026-10-04.

## Context

Only the founder/team release schedule is approved. Treasury (20%), community/ecosystem (30%), future development/contributors (12%), liquidity (10%), marketing/partnerships (8%) and operations/security/legal reserve (5%) have none. A zero, a placeholder percentage or a "reasonable guess" in the data would silently become a circulating-supply figure in code, on the website or in a listing.

## Decision

1. These six schedules are recorded as **TBD**: `{ "type": "unspecified", "status": "tbd", "tgeUnlockPercent": null }`. No numbers, dates or shapes are invented.
2. TBD is a distinct state, not zero. Every derived quantity for a TBD allocation (vested/eligible, locked, circulating) is `null`, and any total that includes one is `null`. The code cannot produce a circulating figure while any schedule is TBD (`token/src/supply.ts`, `requireCirculating`).
3. `circulation.status` is `tbd` and the validator refuses `approved` while any schedule is TBD.
4. "Allocated", "vested/eligible", "distributed" and "circulating" are separate quantities (see [supply-model](../../03-tokenomics/supply-model.md)). Allocated shares are published; circulating supply is not.
5. The website shows allocation, labels the six schedules TBD, and shows circulating supply as a placeholder.
6. States used across the project: **approved**, **TBD**, **not yet implemented**.

## Rationale

Unknown must look unknown. Making TBD structurally incapable of becoming a number is safer than relying on reviewers to notice.

## Consequences

- No circulating-supply schedule, forecast or chart may be produced for these allocations.
- Approving a schedule means changing its entry from `unspecified/tbd` to an approved type through a new ADR, with tests.
- Listings, market-data sites and marketing cannot be given a circulating figure until all schedules are approved.

## Unresolved questions

1. Who approves each schedule, and by what process?
2. Liquidity: if liquidity is ever created, tokens must be distributed at that moment, so its schedule has an early practical deadline. Whether liquidity is created at all is undecided.
3. Whether any of the six will be locked by an on-chain mechanism or only by policy.
4. Whether partial approval (some of the six) should allow publishing a partial figure. Current answer: no.
