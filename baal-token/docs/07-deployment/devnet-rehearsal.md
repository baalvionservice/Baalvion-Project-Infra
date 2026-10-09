# Devnet rehearsal plan

> **This is a rehearsal plan. It contains NO executable deployment procedure.** It has no commands, no scripts and no addresses, and nothing in this repository can perform any of it. Nothing has been run, and Devnet has not been contacted. A later phase must explicitly approve each step before it is implemented or performed, and this plan will be revised then.

The rehearsal exists to find mistakes on a network where mistakes are free. A passed rehearsal is evidence about the procedure, not permission to launch.

## 1. Preconditions

- Vesting enforcement decided (ADR-008), or the rehearsal step 9 is marked blocked and the rehearsal cannot pass.
- Treasury signer structure's mechanism chosen (ADR-009).
- Schedules for TBD allocations either approved, or rehearsal covers only allocations with approved schedules and says so.
- Open questions in ADR-006 answered, especially what event is TGE.
- Metadata mechanism chosen (see 6).
- Repository verification passing; secret scan clean; nobody holds production keys.
- Written approval to start, from the founder.

## 2. Required accounts / wallet roles

Placeholder roles only, from `allocation.json` and the treasury policy: launch/mint authority (transient), deployer/fee payer, treasury multisig signers (5 slots), founder vesting beneficiary, and one account per allocation role. Rehearsal accounts are separate from any future production account and must never be reused.

## 3. Hardware-wallet assumptions

Rehearsal operators use hardware wallets so the signing flow itself is rehearsed. Devnet keys carry no value but are still generated and kept outside the repository, CI and cloud sync; they are discarded afterwards. The repository neither generates nor reads them.

## 4. Test network selection

Devnet is selected explicitly; the genesis hash seen by the operator's tooling is checked against the pinned devnet value before anything else. Mainnet is not selectable in the rehearsal. The rehearsal also confirms the guard refuses when an operator mistakenly points at the wrong cluster.

## 5. Mint creation

Create a classic SPL Token mint with 9 decimals and no freeze authority. Record the mint address in the evidence log.

## 6. Metadata creation

Create the metadata record from the approved draft. The mechanism is undecided: classic SPL mints have no built-in metadata, so a separate metadata standard/program is needed (VERIFY), which has its own authority to review and lock. Rehearse the chosen mechanism and review its authority.

## 7. Initial supply mint

Mint the full supply once, to one holding account: 1,000,000,000 BAAL, i.e. 10^18 base units. Reconcile immediately.

## 8. Allocation distribution

Distribute to the allocation role accounts in the amounts from `allocation.json`. Only allocations whose destination is approved are funded. Verify each transfer.

## 9. Vesting setup

Configure the chosen enforcement for the founder allocation per ADR-006 with absolute `c` and `e`. Blocked until ADR-008 is decided. Verify the on-chain schedule independently against `V(t)` at several times, including the second before and after the cliff.

## 10. Authority verification

Read mint authority, freeze authority and metadata authority from the chain and compare to expected.

## 11. Mint-authority revocation

Revoke the mint authority only after steps 7 to 9 are verified. Verify that further minting fails.

## 12. Freeze-authority verification

Confirm no freeze authority exists and that it cannot be added later.

## 13. Metadata-authority verification

Confirm who can still change metadata. Decide whether that authority is also revoked or held by the multisig, and record it.

## 14. Supply reconciliation

Raw supply equals 10^18; decimals equal 9; supply equals the sum of all balances.

## 15. Balance reconciliation

Each allocation balance equals its `allocation.json` baseUnits; allocated, vested, distributed and circulating are reported separately per the supply model, with circulating undetermined while schedules are TBD.

## 16. Negative tests

Each must fail as intended: mint after revocation; freeze attempt; transfer from an allocation account without the right signers; vesting claim before the cliff; claim over the vested amount; a transaction signed on the wrong cluster; deployment attempted from CI or with signing material in the environment (the guard must refuse); wrong confirmation phrase.

## 17. Failure handling

Define in advance: stop on any unexpected result; do not retry blindly; if a step partially succeeded, record the state and abandon the rehearsal mint rather than patch it; every deviation is written up. A failure of an irreversible step on Mainnet could not be repaired this way, which is the point of rehearsing.

## 18. Independent operator verification

A second operator, who did not run the steps, verifies steps 10 to 15 from chain data alone, using their own tools and no information supplied by the first operator beyond the mint address.

## 19. Evidence and log collection

Operators keep a timestamped log: step, operator, expected, observed, transaction signature, explorer link. Screenshots of device prompts. The log contains no secrets, and is reviewed for them (secret scan) before being stored in the repository.

## 20. Final sign-off

Both operators and the founder sign a record stating the plan version, results, deviations and unresolved issues. Sign-off covers the rehearsal only and is not approval to launch on Mainnet.
