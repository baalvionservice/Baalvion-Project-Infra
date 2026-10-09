# Vesting provider evaluation (framework, no selection)

**Status: no provider has been evaluated or selected. The decision is OPEN ([ADR-008](../01-architecture/adr/ADR-008-vesting-enforcement-decision-framework.md)).** This document defines how a decision must be made. It contains no verified external facts.

**VERIFY** marks anything about an external party or on-chain state that must be independently confirmed, with source and date, immediately before it is relied on. Offline knowledge, vendor claims and reputation are not verification. This repository performs no network access, so nothing here has been checked against the chain.

## Required schedule (from ADR-006)

Start at absolute timestamp `c`, end at absolute timestamp `e`, nothing releasable before `c`, no lump sum, continuous linear release between, full allocation exactly at `e`. The schedule must be representable without calendar logic on-chain. Granularity and rounding must reconcile with `V(t)`.

## Gates (all must pass; failing any one disqualifies)

| #   | Gate                                                                                                                     | What counts as verification                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | Works with the classic SPL Token program on Solana today                                                                 | Mainnet usage with classic SPL mints; current docs; tested on devnet (VERIFY)                                                                   |
| G2  | Independent security audit exists and covers the **deployed** program version                                            | Audit report obtained from the auditor (not the vendor), commit/hash matched to the on-chain program via a reproducible/verified build (VERIFY) |
| G3  | Upgrade authority is revoked, or held by a multisig with a timelock and a published signer policy                        | Read the program's upgrade authority on-chain (VERIFY)                                                                                          |
| G4  | Our exact schedule is expressible, and the program's maths reconciles with `V(t)` to the base unit or a documented bound | Test with the program's own tooling on devnet and compare                                                                                       |
| G5  | No party can seize, redirect or cancel founder vesting unless that behaviour is explicitly chosen and disclosed          | Read the code and accounts model (VERIFY)                                                                                                       |
| G6  | Anyone can verify the schedule and balances publicly from on-chain accounts without trusting the vendor's website        | Demonstrate with a block explorer or RPC                                                                                                        |
| G7  | No unresolved critical incident or exploit in its history, and incident handling is documented                           | Search incident databases and audit follow-ups (VERIFY)                                                                                         |

## Scored criteria (after gates)

Record the evidence, source and date for each. Do not score from memory.

| Criterion                       | Questions                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| Current Solana compatibility    | Maintained against current Solana versions? Deprecation notices? Last deployment/update date?     |
| Audited security                | Number and independence of auditors; scope; findings and whether all critical/high were fixed     |
| Audit recency                   | Date of last audit versus date of last program change; are post-audit changes covered?            |
| Program upgrade authority       | Who, what threshold, timelock, history of upgrades                                                |
| Custody model                   | Are tokens escrowed in a program-owned account? Who can move them? Can the vendor?                |
| Beneficiary control             | Who can change the recipient? What happens if the beneficiary key is lost or compromised?         |
| Revocation behaviour            | Can the creator cancel? Partially? What happens to unvested tokens?                               |
| Emergency behaviour             | Pause, freeze or admin override functions? Who holds them? Failure modes if the vendor disappears |
| Token compatibility             | Classic SPL; decimals 9; mint with no freeze authority; behaviour with wallets and explorers      |
| Transparency                    | Open-source code, verifiable build, public docs of the account layout                             |
| Historical incidents            | Exploits, outages, disputed claims, response quality                                              |
| Operational reliability         | Uptime of any off-chain components needed to claim; works if the vendor's site is down?           |
| Documentation                   | Complete, current, consistent with the code                                                       |
| Fees                            | Creation, claim and any percentage fees; who pays; changeable by the vendor?                      |
| Public verifiability of vesting | Third parties can recompute vested amounts from chain data alone                                  |

## Candidates

None selected, none evaluated. Candidates should be found by fresh research at decision time, not from this document. If a candidate fails a gate it is dropped; if none pass, the decision stays OPEN and the options in ADR-008 apply (openly trust-based custody, which is **not equivalent**, or delaying launch).

| Candidate  | G1     | G2     | G3     | G4     | G5     | G6     | G7     | Evidence/date |
| ---------- | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------------- |
| (none yet) | VERIFY | VERIFY | VERIFY | VERIFY | VERIFY | VERIFY | VERIFY |               |

## Process

1. Build a candidate list from independent sources; record how each was found.
2. For each, fill the gate table with evidence and dates. Another person re-verifies the audit link, program address and upgrade authority independently.
3. Rehearse the winning option on devnet (see [devnet-rehearsal](../07-deployment/devnet-rehearsal.md)) and reconcile against `V(t)`.
4. Record the decision as an amendment to ADR-008 before any data-model change.
5. Re-verify immediately before Mainnet; the facts above change over time.
