# 03 Tokenomics

Source of truth: [token/allocation.json](../../token/allocation.json). Validated on every change: percentages total exactly 100%, quantities total exactly 1,000,000,000, percentages correspond exactly to quantities, no duplicates, no negatives.

| Allocation                            | %   | BAAL        |
| ------------------------------------- | --- | ----------- |
| Founder / team                        | 15  | 150,000,000 |
| Treasury                              | 20  | 200,000,000 |
| Community / ecosystem                 | 30  | 300,000,000 |
| Future development / contributors     | 12  | 120,000,000 |
| Liquidity                             | 10  | 100,000,000 |
| Marketing / partnerships              | 8   | 80,000,000  |
| Operations / security / legal reserve | 5   | 50,000,000  |

No public token sale in the initial version.

## Release schedules

Founder/team: **approved** (ADR-006). The other six allocations: **TBD**, not approved, nothing invented (ADR-007). `allocation.json` records them as `unspecified`/`tbd` and `circulation.status: "tbd"`.

## Allocated, vested, circulating

These differ. See [supply-model.md](supply-model.md). Circulating supply is **undetermined** while any schedule is TBD, the code cannot produce a figure, and none may be published.

## Vesting

See [vesting.md](vesting.md).
