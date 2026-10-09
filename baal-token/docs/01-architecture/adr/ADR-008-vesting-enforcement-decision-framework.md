# ADR-008: Vesting enforcement decision framework

**Status:** Accepted as a framework; the implementation decision is **OPEN**. **Date:** 2026-10-04.

## Context

ADR-004 rules out a custom on-chain program. That leaves vesting for locked allocations unenforced by the chain. The founder prefers an audited third-party on-chain vesting solution, will not select one by reputation, and does not accept multisig custody being described as equivalent to on-chain vesting.

## Decision

1. **No provider is selected.** `allocation.json` records `enforcement.status: "open"`; the validator rejects any other value until a verified decision is recorded here.
2. A provider may be selected only after it passes every gate in [vesting-provider-evaluation](../../05-treasury/vesting-provider-evaluation.md), with each external fact independently verified and dated. Reputation, popularity and marketing are not evidence.
3. Using a third-party program is not a "custom program", but it does change ADR-004's consequences and needs its own recorded amendment.
4. **Multisig custody is a different mechanism.** If the founder ever accepts it, it must be recorded as "custody-based release (trust-based)", never as on-chain vesting or equivalent to it, and disclosed that way on the website and in documentation.
5. If no solution is verified, the decision stays open and blocks launch of any allocation that depends on enforcement.
6. Research and design only in this phase. No integration code, no provider SDKs, no network access.

## Rationale

Vesting is only a promise if something other than people enforces it. The honest options are verified on-chain enforcement, openly trust-based custody, or not launching; the framework prevents drifting into the second while calling it the first.

## Consequences

- Phase 3 cannot proceed to any launch rehearsal step involving vesting without this decision.
- The data model has no "decided" value yet; adding one requires updating the validator and tests together.
- Whatever is chosen must be able to implement ADR-006's `V(t)` using absolute timestamps `c` and `e`.

## Unresolved questions

1. Which solution, if any, passes the gates? (Needs verification work this repository cannot do offline.)
2. If a provider holds tokens in escrow, who can recover tokens if the provider is exploited or paused?
3. Who controls the beneficiary key, and what happens if it is lost?
4. Can the schedule be made non-revocable, and is non-revocability desired for founder tokens?
5. Does the same mechanism serve the other allocations once they are approved?
