# Runbook — enabling the payment spine on a live site

Every Baalvion property reports its payments into one place: exact integer money, a permitted
rail, a durable outbox, one canonical `payment.recorded` event, one identity graph, one
`admin.payment_records` table behind the console.

Everything is flag-gated and off by default. This runbook is how a site is switched on against
**real gateway traffic** for the first time, and what to do when it goes wrong.

> No site has yet processed real gateway traffic through this path. Every webhook exercised so
> far was signed locally. Treat the first live site as the real test.

---

## Before you enable anything

1. **The site must be in the registry with its rails.** `@baalvion/sites` refuses a rail the
   property was never granted, so a missing entry fails closed rather than mis-filing money.
2. **PCL migrations must have run against that service's own database.**
   ```bash
   node <pcl>/scripts/migrate.mjs          # run twice; the second must print "up to date"
   ```
   The tables are per-service — one service, one database, one `pcl` schema. A service whose
   migrations have not run records nothing and says nothing.
3. **Decide the legal entity, or accept null deliberately.** Set `LEGAL_ENTITY_DEFAULT` (or
   `LEGAL_ENTITY_<SITE_ID>`). Declaring `LEGAL_ENTITIES_JSON` as well turns the id into a checked
   reference, so a typo cannot open a second set of books. Books can close only once this is set;
   payments do not need it.

## Enable one site — never two

Order matters. The relay is what makes a payment visible, so turn on recording and delivery
together, and the consumer before either.

| Step | Where | Flag |
|------|-------|------|
| 1 | admin-service | `PAYMENT_RECORDS_CONSUMER=true` |
| 2 | the site's service | `PAYMENT_SPINE=true` (order-service: `PCL_SHADOW=true`) |

Take **one** site per change window. The recurring finding across this whole programme is that
every site that looked wired was quietly dropping data its own webhook already carried — and only
running it showed that.

## Watch these four things, in this order

1. **The outbox drains.** This is the single most useful signal: payments recording but not
   arriving is the failure mode that looks like nothing at all.
   ```js
   const { readOutboxHealth } = require('@baalvion/payment-consistency');
   await readOutboxHealth(pool);   // { pending, failed, oldestPendingAgeSeconds, stalled }
   ```
   The relay checks this itself every 60s and logs once on the transition:
   `payment outbox is stalled — payments are recording but not reaching the panel`.
   Alert on that line. `pending` alone is normal; **old** pending is not.

2. **Attribution is complete.** Every previous site lost something here.
   ```sql
   SELECT site_id, rail,
          count(*)                                        AS n,
          count(*) FILTER (WHERE tenant_id IS NULL)       AS no_tenant,
          count(*) FILTER (WHERE party_id  IS NULL)       AS no_party,
          count(*) FILTER (WHERE fee_minor IS NULL)       AS no_fee
     FROM admin.payment_records
    WHERE site_id = :site AND recorded_at > now() - interval '1 hour'
    GROUP BY 1, 2;
   ```
   `no_party > 0` means the customer signal is not being forwarded — the payment is recorded but
   the person behind it is invisible and will never join up across properties.
   `no_fee > 0` is only correct where the gateway genuinely reports no fee. Null means "we were
   not told"; zero would be a claim that the payment cost nothing.

3. **Amounts match the gateway.** Compare gross for the window against the gateway's own
   dashboard. A 100× difference means minor units met a major-unit field somewhere.

4. **Nothing dead-lettered.** `pcl.payment_outbox` rows in `failed` are payments the relay gave
   up on, usually unattributable ones. Read `last_error`; they are a wiring bug, not a retry.

## Rolling back

Setting the flag to anything but `true` stops recording immediately, and the service returns to
its previous behaviour — the spine is additive and never on the payment's critical path.

**Nothing is lost by rolling back.** The outbox is durable: rows already written drain whenever
the relay next runs. Roll back the flag, fix the wiring, roll forward; the payments recorded in
between are still there.

## Backfilling history

Once a site is healthy, historical rows can be attributed:
```bash
node <pcl>/scripts/backfill-site.mjs --site-id=<site> --dry-run   # always first
node <pcl>/scripts/backfill-site.mjs --site-id=<site>
```
It never overwrites a value already present — the first writer to attribute a payment wins, and a
backfill is not a writer. It refuses outright if the schema already holds a different site.

## Retention

`admin.payment_records` is a read model and can be rebuilt from events, so old rows are safe to
archive. The sweep is **off** unless `PAYMENT_RECORDS_RETENTION_DAYS` is set, refuses any window
under 365 days, and holds a Postgres advisory lock so only one console instance sweeps.

## Known gaps

- **The Java `ledger-service` has no caller.** The posting rules (`@baalvion/ledger`) and the
  adapter to its two-legged model are built and tested; the consumer is not written.
- **`order-service` is the only service that mirrors into that ledger**, and it does so
  fail-open — a ledger outage never blocks a payment, and the reconciliation report surfaces the
  gap afterwards.
