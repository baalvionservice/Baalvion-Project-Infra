# @baalvion/party

One identity for a human across every Baalvion property. Pure resolution logic — normalisation,
deterministic match keys and merge rules — with no I/O, so the rule is identical wherever it runs.

Without it, the same person buying on Amarisé and subscribing on Law Elite is two unrelated rows
joined by nothing but an email string, and "what has this customer paid us" is unanswerable.

## The governing rule

**Auto-merge only when unambiguous, and only on verified signals.**

A wrong merge is far worse than a missed one: it joins two people's payment history, entitlements
and support record, and it is very hard to unpick afterwards.

```js
resolveParty({ siteId: 'law', email: 'wade@x.com', emailVerified: true }, candidates)
// → MATCHED

resolveParty({ siteId: 'law', email: 'wade@x.com', emailVerified: false }, candidates)
// → UNVERIFIED — attached provisionally, flagged for review, never treated as proven
```

An unverified email is a string someone typed. Merging on one would let a person claim another's
payment history and entitlements simply by entering their address at checkout.

Where two **verified** signals disagree — the email says party A, the phone says party B — the
honest answer is `AMBIGUOUS`, for a human to settle. An unpicked bad merge costs far more than a
queue item.

## Normalisation is conservative on purpose

`normalizeEmail` lowercases and trims. Nothing else.

- **Dots are not stripped.** `a.b@gmail.com` → unchanged. Ignoring dots is a Gmail-only rule;
  applied everywhere it merges genuinely different mailboxes.
- **Plus-tags are not stripped.** `a+shop@x.com` → unchanged. The tag is how many people keep
  separate accounts deliberately.

`normalizePhone` returns `null` for a national-format number unless the caller supplies a calling
code: `9876543210` is a different person in India and the US.

Names are never a match key — only a display and review aid.

## Match keys

Readable rather than hashed, on purpose: they live in the same database that already holds the
email, so hashing would add no protection while making "why were these merged?" unanswerable.

`auth:<userId>` · `email:<normalised>` · `phone:<E.164>` · `site:<siteId>:<customerId>`

Only keys from verified signals are `STRONG`, and only strong keys may merge existing parties.

## Merging

`planMerge` keeps the **oldest** party, so the id referenced longest — by ledger lines, grants,
support tickets — stays valid, and the merged ids are recorded rather than lost.
