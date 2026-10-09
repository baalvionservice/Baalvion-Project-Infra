# 09 Risks

| Risk                                                                          | Status / mitigation                                                                 |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Irreversible launch mistakes (supply, decimals, destination, early revoke)    | Devnet rehearsal and independent review required before any mainnet step            |
| Vesting enforcement undecided (ADR-004, ADR-008)                              | OPEN; no provider verified; custody-based release is trust-based and not equivalent |
| Independent signer cannot veto in 3-of-5 with one independent slot (ADR-009)  | Recorded limitation; signer composition undecided                                   |
| Circulating supply misreported (unlocked treated as circulating, TBD as zero) | Supply model returns null for unknown; tests forbid it                              |
| Key loss/compromise; no freeze authority                                      | Hardware multisig, key policy; stolen tokens cannot be frozen                       |
| TGE circulation undetermined                                                  | Only founder/team schedule approved; do not publish a figure                        |
| Token naming/trademark conflicts                                              | Not yet checked                                                                     |
| Regulatory classification differs by jurisdiction                             | Legal review not done ([11-legal](../11-legal/README.md))                           |
| Impersonation/scam tokens and sites                                           | Verify page, official-channel policy, no wallet features on site                    |
| Concentration (founder 15%, treasury 20%)                                     | Disclosed; schedules and custody to be published                                    |
| Solana network risk (outage, bugs, congestion)                                | Inherent; documented to users                                                       |
| Supply-chain attack on dev dependencies                                       | Few dev-only deps, frozen lockfile, audit, no install scripts                       |
| Measuring "success" tempts fake activity                                      | Prohibited: no wash trading, fake users, volume or partners                         |
