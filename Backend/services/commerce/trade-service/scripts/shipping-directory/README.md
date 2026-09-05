# World Shipping Directory — ingest

Fills `tradeops.carriers`, `tradeops.vessels` and `tradeops.carrier_fleet_history` with
reference data about shipping companies and the merchant fleet, for the public directory
served from `/v1/public/shipping/*`.

```bash
node scripts/shipping-directory/ingest.js          # run every stage, reusing caches
node scripts/shipping-directory/ingest.js --force  # refetch from source
node scripts/shipping-directory/load.js            # reload the DB from existing caches
```

Stages cache into `.cache/` (git-ignored) and are individually re-runnable — a failed
fetch is repaired on its own (`fetch-vessels.js --only=93,94`) rather than by restarting.

## Sources

| Source | Provides | Licence |
| --- | --- | --- |
| Wikidata SPARQL (`P458` IMO ship number) | ~96k vessels: name, type, tonnage, dimensions, build year, flag, builder, operator | CC0 |
| Wikidata (`P31/P279* Q1807108` shipping line) | ~714 shipping lines, plus every entity operating a vessel above | CC0 |
| Alphaliner Top 100, via Wikipedia's *List of largest container shipping companies* | Published fleet size, TEU capacity, market share and alliance for the top 30 container lines, with an as-of date | CC BY-SA |

Alphaliner's own page renders its table in JavaScript and returns no rows to a plain
fetch, so the Wikipedia mirror is the machine-readable route to those figures.

## The two fleet numbers

The single most important thing about this dataset:

- **`registry_vessel_count`** — ships we hold an individual, IMO-keyed record for.
  Verifiable, and always an undercount.
- **`reported_fleet_size`** — the fleet size the company or industry publishes, stored
  with `reported_source`, `reported_source_url` and `reported_as_of`.

Wikidata links an operator to only ~6.3k of its ~96k vessels, so for MSC these read 36 and
1,000. They are different measurements, not a discrepancy. **Never `COALESCE` them** — the
API returns them as separate fields and every page labels which one it is showing.

## Guards worth keeping

The Wikidata endpoint fails quietly, so each of these exists because it caught something:

- **Prefix bucketing, not `LIMIT/OFFSET`.** Deep offsets time out and an offset walk
  shifts under a run. A bucket that returns truncated JSON is split into finer prefixes.
- **No labels inside aggregates.** `SERVICE wikibase:label` does not bind under `GROUP BY`,
  so it silently yields empty strings. QIDs are collected raw and resolved by
  `fetch-labels.js`.
- **Counting what did not arrive.** Every stage reports unresolved entities rather than
  trusting that a loop ran.
- **`load.js` refuses to finish** if any row of the published ranking failed to attach to
  a carrier — three top-30 lines (Wan Hai, SITC, Sinotrans) were being dropped silently
  because Wikidata types them as plain businesses.
- **Two-level vessel de-duplication** — by QID (items carrying several IMO values) and by
  IMO (distinct items claiming one IMO, 614 of them).
- **IMO check digits are validated** and the result stored per vessel; 409 fail.
- **The reference-vessel delete skips rows a tenant's voyages reference.** `imo_number` is
  globally unique, so a tenant's operational vessel and the reference record for the same
  ship are the same row.
