# ADR-009: Treasury multisig threshold and signer requirements

**Status:** Accepted as an initial design; nothing implemented. **Date:** 2026-10-04.

## Context

The treasury holds 20% of supply. A single key is unacceptable. The founder approved an initial 3-of-5 multisig with at least one signer independent of the founding team, with no wallets or keys created and no signers named.

## Decision

- Threshold 3, signer count 5, **at least one independent signer**. Recorded in `token/treasury-policy.json` with five unnamed slots; identities and addresses must be `null` (validator-enforced).
- **Independent** means: not an employee, contractor, equity or token holder from the allocations, relative, or financially dependent party of the founding team, and able to refuse to sign without consequence. Counsel should refine this definition.
- Recovery requirements (recorded, not yet procedures): single-signer key loss, signer compromise, two signers unavailable, signer rotation, loss of quorum.
- Signer hardware: hardware wallets, no hot keys. The multisig mechanism (for example a native SPL Token multisig or a dedicated multisig program) is **not chosen**; any program involved needs the same verification as in ADR-008. VERIFY current capabilities before choosing.

## Rationale

3-of-5 tolerates two unavailable or lost signers and requires a majority to act. An independent signer adds a check beyond the team.

## Consequences

- **Known limitation, recorded in tests:** with exactly one independent slot, the other four can reach the threshold of 3 without the independent signer. In a plain k-of-n scheme the independent signer is therefore not a required approver and cannot veto. Making independents unable to be bypassed needs at least 3 of 5 to be independent (so non-independent signers cannot reach 3), which shifts control toward people outside the team; whether a specific signer can be made mandatory depends on the mechanism (VERIFY).
- No treasury movement can occur until signers exist, which is a launch dependency.

## Unresolved questions

1. How many signers are independent (1, 2, 3+), and what do the other slots represent?
2. Who selects and vets independent signers, and how is independence monitored over time?
3. Multisig mechanism, and whether timelocks or per-member permissions are available (VERIFY).
4. Geographic, organisational and device separation requirements.
5. Whether the launch/mint authority and other role keys use a separate structure.
6. Compensation or liability arrangements for signers (counsel).
