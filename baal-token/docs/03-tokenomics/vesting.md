# Vesting specification

Approved for founder/team: 15%, 12-month cliff, 0% claimable before the cliff, continuous linear vesting from month 12 through month 48, no lump sum at the cliff, calendar months in UTC. The exact mathematics is in [ADR-006](../01-architecture/adr/ADR-006-founder-vesting-interpretation.md):

```
V(t) = 0                                  t <= c      (c = TGE + 12 calendar months)
V(t) = floor( A * (t - c) / (e - c) )     c < t < e   (e = TGE + 48 calendar months)
V(t) = A                                  t >= e
```

`V` is the amount **eligible** for distribution. Eligible is not distributed and not circulating ([supply model](supply-model.md)).

Other allocations (treasury, community/ecosystem, future development, liquidity, marketing/partnerships, operations reserve): **schedule TBD**, not approved. Nothing is calculated for them ([ADR-007](../01-architecture/adr/ADR-007-unspecified-allocation-schedules.md)).

## Status

| Item                                              | State                                                                                                                        |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Founder/team schedule                             | approved                                                                                                                     |
| Other six schedules                               | TBD                                                                                                                          |
| Specification calculator (`token/src/vesting.ts`) | implemented, tested                                                                                                          |
| On-chain enforcement                              | **not yet implemented; decision OPEN** ([ADR-008](../01-architecture/adr/ADR-008-vesting-enforcement-decision-framework.md)) |

The calculator is a specification and test oracle. Multisig custody would be a different, trust-based mechanism and is not equivalent to on-chain vesting.

## Tested behaviour

Cliff boundary (before, at, one second after), continuous growth with no lump sum, final date and exact cap, floor rounding, monotonicity, calendar edge cases (31st, leap day, shorter months, no drift), impossible claim histories. Files: `tests/vesting.test.ts`, `tests/founder-vesting.test.ts`.
