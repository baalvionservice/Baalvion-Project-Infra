# @baalvion/ledger

Chart of accounts and double-entry posting rules. Pure — it decides *what lines a money event
produces*, and does no I/O, so the rules are testable in isolation and identical wherever they run.

```js
postingsForPayment({
  paymentId: 'pay_1', siteId: 'community', partyId: 'party_1', legalEntityId: null,
  amount: INR('10000.55'), fee: INR('236.00'), earnedOnReceipt: false, occurredAt,
});
// Dr Processor receivable  9,764.55   ← net of fees
// Dr Processor fees          236.00
// Cr Deferred revenue     10,000.55   ← gross; a liability, not revenue
```

## Two invariants, asserted rather than assumed

1. **It balances.** Debits equal credits exactly, in integer minor units. An unbalanced entry is
   refused, not posted — a ledger that can drift is not a ledger.
2. **Every line carries its dimensions** — legal entity, site, tenant, party, product.

Direction is `DEBIT`/`CREDIT`, never a negative amount. A negative line is rejected.

## On `legalEntityId`

It is on every line **from the first commit**, and nullable today because the entity structure is
not yet decided. That is deliberate: adding the column later means re-posting history, whereas
assigning a real entity to an existing line is an update.

## The accounts

Deliberately few. Product detail belongs in the dimensions on each line, not in a proliferation of
codes — a chart that models every product line is a chart nobody keeps accurate.

| | | |
|---|---|---|
| `1000` Bank | asset | Settled cash |
| `1100` Processor receivable | asset | Captured, not yet settled — real, and not yet cash |
| `2100` Deferred revenue | liability | Paid for, not yet delivered |
| `2200` Refunds payable | liability | Owed back after early termination |
| `4000` Revenue | revenue | Earned |
| `4900` Refunds | contra-revenue | Kept separate so gross and net are both visible |
| `5100` Processor fees | expense | Its own line, so per-property profit is answerable |

## Entries

`postingsForPayment` · `postingsForRecognition` · `postingsForRefund` · `postingsForSettlement` ·
`trialBalance`

`transactionRef` is derived and stable (`pay:<id>`, `rev:<id>:<period>`), so re-posting the same
event is idempotent in any store that keys on it.
