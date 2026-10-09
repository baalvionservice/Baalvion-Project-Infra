# Supply model

Six quantities, never to be conflated. Implemented in `token/src/supply.ts`, tested in `tests/supply.test.ts`.

| Quantity              | Meaning                                                                                                        | When unknown                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **Total supply**      | The fixed 1,000,000,000 BAAL (10^18 base units). A design value until a token exists.                          | never                            |
| **Allocated**         | Part of total assigned to each allocation. Sums to total.                                                      | never                            |
| **Locked**            | Allocated minus vested/eligible, per approved schedule.                                                        | `null` where the schedule is TBD |
| **Vested / eligible** | Released by an approved schedule and so allowed to be distributed.                                             | `null` where the schedule is TBD |
| **Distributed**       | Observed as actually sent to a holder outside the allocation's own custody. An observation, not a calculation. | n/a                              |
| **Circulating**       | Distributed **and** eligible.                                                                                  | `null` while any schedule is TBD |

## Rules

- **Unlocked is not circulating.** Vested tokens that are still in a project wallet are eligible but not circulating.
- **Allocated is not vested.** 100% of the founder allocation is allocated from day one and 0% is vested until the cliff has passed.
- **TBD is not zero.** A TBD allocation yields `null` for vested, locked and circulating; tokens distributed from it are recorded under distributed but never counted as circulating. Any total including a TBD allocation is `null`.
- Distribution beyond the vested amount of an approved schedule, distribution before launch, unknown allocation ids and negative amounts are errors.
- `requireCirculating()` is the only route to a publishable circulating figure and throws while any schedule is TBD.
- Before launch, `tge` is undefined: nothing is vested or distributed.

Today six of seven schedules are TBD, so **circulating supply is undetermined** and no figure or forecast may be published.
