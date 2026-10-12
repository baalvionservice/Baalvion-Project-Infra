# Sanctions lists

The compliance engine screens parties against the official lists, not a sample.

| List | Publisher | Format | Loaded as |
|---|---|---|---|
| OFAC SDN | US Treasury | XML | `list_source = 'OFAC'` |
| UN Security Council consolidated | UN | XML | `'UN'` |
| EU consolidated financial sanctions | European Commission (FSF) | XML | `'EU'` |

On 2026-10-12 this was 19,416 + 1,010 + 6,233 records (about 77,000 names including aliases).

## Not covered yet — do not claim otherwise
- **UK (OFSI/HMT), Canada, Australia, Switzerland, Japan** lists.
- **Country lists that matter for specific corridors**: the UAE Local Terrorist List and India's
  UAPA/other designations. For an India–UAE corridor these need adding before relying on this
  for compliance sign-off.
- **Sanctioned countries, controlled goods and trade bans** (`compliance_sanctioned_parties` rows
  with `party_type='country'`, `compliance_controlled_goods`, `compliance_trade_bans`) are still
  the small hand-written dataset in `service/compliance/dataset.js`. They have not been checked
  against the regimes they describe and must be reviewed by someone qualified. The engine uses a
  component from the database when its table has rows, and the built-in dataset otherwise.
- Matching is name-based. It does not use date of birth, ID numbers or addresses to confirm a hit
  (they are stored in `metadata` for a reviewer). A name match is a lead, not a verdict.

## Operating it
- First load / manual refresh: `node scripts/import-sanctions-lists.js` (needs migration 088).
  `--force` accepts a shrink of more than 20%, only after confirming the publisher really removed
  those entries.
- Automatic: the `sanctions_list_refresh` queue job runs every 6 hours (`queue/workers.js`). It
  fails — and retries, then dead-letters — if any list failed or was refused. **Alert on that
  queue's failures**: a failing refresh means the list is going stale.
- Audit trail: every attempt writes a row to `tradeops.compliance_list_imports`
  (status `succeeded`, `unchanged`, `refused` or `failed`, with the file's sha256 and date).
  Each party row carries `source_id`, `source_list_date`, `last_seen_at` and `delisted_at`.
- A party the publisher removes is deactivated (`active=false`, `delisted_at` set), never deleted.
- Each service instance caches the loaded lists in memory for 5 minutes, so a fresh import reaches
  every instance within that time.

## What an importer refuses, by design
A file that parses to fewer records than that list's floor, a file whose record count does not
match what the publisher declares, and an update that would shrink the active list by more than
20%. Each is recorded as `refused` and changes nothing.

## How a hit is graded
`partyIndex.js` — block only on `exact` and `reordered`. `fuzzy`, `partial`, `weak`,
`short_exact`, `common_name`, `legal_form_differs` and `exact_other_country` produce a
*medium* violation, which the engine turns into a **review**, not a block.

## Tests
`node tests/compliance-lists.verify.js` (no network). Set `SANCTIONS_TEST_DB` to a throwaway
Postgres with migrations 014 and 088 applied to also run the import lifecycle for real.
