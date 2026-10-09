# ADR-006: Founder/team vesting interpretation

**Status:** Accepted (Phase 2, founder-approved). **Date:** 2026-10-04.

## Context

Phase 0 approved "12-month cliff followed by 36-month linear vesting" for the 15% founder/team allocation (150,000,000 BAAL). The phrase has two common readings: a lump sum released at the cliff, or nothing at the cliff followed by linear release. It also leaves open how months are counted and how amounts round.

## Decision

Let `A` be the founder allocation in base units, `s` the TGE timestamp (UTC unix seconds), `c = s + 12 calendar months`, `e = s + 48 calendar months`. The vested (eligible) amount at time `t` is:

```
V(t) = 0                                  for t <= c
V(t) = floor( A * (t - c) / (e - c) )     for c < t < e
V(t) = A                                  for t >= e
```

- **0% is claimable before the cliff, and at exactly the cliff.** There is no lump-sum release at the cliff.
- Vesting is **continuous**, per second, from month 12 through month 48 (not monthly steps).
- TGE unlock is 0%.
- **Calendar months in UTC**, always counted from `s` (never from a previous boundary, so there is no drift). If the target month is shorter, the day is clamped to its last day (31 Jan + 1 month = 28/29 Feb). Time of day is preserved. Month lengths differ, so `e - c` is not exactly 3 x 365 days and 24 months after TGE is about, not exactly, one third vested.
- **Rounding:** floor, in base units, so `V(t)` never exceeds the ideal line and `V(e) = A` exactly with no dust.
- `V` is the **eligible** amount. It says nothing about what has been distributed or is circulating (see the supply model).

Encoded in `token/allocation.json` as `releaseShape: "zero-before-cliff-then-continuous-linear"` and `monthCounting: "calendar-months-utc-from-tge"`; the validator rejects any other value. Implemented in `token/src/vesting.ts` and tested in `tests/founder-vesting.test.ts`.

## Rationale

It is the reading that matches "0% claimable before the cliff" and "no lump-sum cliff release" exactly, is simple to state publicly, and can be verified independently by anyone with the formula. Per-second linear vesting maps directly onto on-chain vesting schedules that take a start time, an end time and a linear release, with absolute timestamps `c` and `e` computed offline from the calendar.

## Consequences

- Any enforcement mechanism must be configured with start `c` and end `e` as absolute timestamps, zero before `c`, linear after, and its rounding must be reconciled against `V(t)`; a mechanism that cannot do this does not implement the approved schedule.
- The calendar calculation is done offline, so on-chain behaviour does not depend on calendar logic.

## Unresolved questions

1. **What event is TGE?** The mint transaction, the funding of the vesting mechanism, or a separately announced time. This must be one fixed, publicly recorded timestamp.
2. On-chain clocks are validator-reported estimates and can differ slightly from wall-clock time. What tolerance is acceptable?
3. How will rounding differences between this formula and a provider's be reconciled and disclosed?
4. If the mechanism is funded after TGE, does the schedule start still use `s`?
5. Tax and legal treatment of vesting is for counsel.
