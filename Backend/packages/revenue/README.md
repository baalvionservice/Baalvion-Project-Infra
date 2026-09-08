# @baalvion/revenue

**Cash received is not revenue earned.**

An annual ₹12,000 plan does not earn ₹12,000 on the day it is billed. It creates an obligation to
deliver twelve months of service, and revenue is earned as that service is delivered. Reporting
the cash as revenue overstates this month and understates the next eleven — the error an auditor
finds first, and the reason every growth figure derived from cash is wrong.

```js
const ob = obligationForPeriod({
  id: 'sub_1', siteId: 'imperialpedia', amount: Money.fromDecimal('12000.00', 'INR'),
  periodStart: new Date('2026-01-01Z'), billingCycle: 'annual',
});

recognizedThrough(ob, new Date('2026-01-01Z'))  // 0.00      — nothing earned yet
deferredAt(ob,       new Date('2026-01-01Z'))  // 12000.00  — a liability
recognizedThrough(ob, new Date('2027-01-01Z'))  // 12000.00  — fully earned
monthlyRecurringRevenue({ ...ob })              // 1000.00   — MRR is a rate, not cash
```

## Guarantees

| | |
|---|---|
| **The schedule sums to the total** | Splitting across 365 days does not divide evenly. The remainder is distributed with `Money.allocate`, not rounded per day — round each day independently and the year is out by a few units, permanently. |
| **Recognition is monotonic** | Recognised revenue never decreases as time advances, so a restated period cannot move money backwards. |
| **The identity always holds** | `recognized + deferred + refundable === total`, at any instant. |

## Obligations, not subscriptions

One payment can create several obligations that earn differently — a plan (straight-line) plus a
setup fee (point-in-time). Modelling "a subscription" conflates them, which is exactly what naive
revenue reporting gets wrong.

## Termination

`FORFEIT` earns the remainder at cancellation — the customer walked away from it. `REFUND` moves
it to `refundableAt`: money **owed back**, never revenue.

## Period shapes

Accepts all three the platform records — `billing_cycle` (imperialpedia-service), `interval_days`
(law-service), explicit `current_period_start`/`end` (proxy-service) — so services do not have to
converge first. Given none, it throws rather than guessing: a guessed service period misstates
revenue silently. 31 Jan + 1 month clamps to 28/29 Feb, not 3 March.
