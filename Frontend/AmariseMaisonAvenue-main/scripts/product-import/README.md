# Amarisé Product Import System

A production-ready bulk product import pipeline for the Amarisé Maison Avenue
commerce store: drop in a CSV of real inventory (with photos) and it creates
products, uploads images, attaches collections, and optionally publishes — all
against the real commerce-service admin API, nothing simulated.

Every sample file in `sample-data/` is placeholder content clearly meant to be
replaced. Every script defaults to the safest behavior (draft, not published;
skip, not overwrite) so nothing goes live by accident.

## Folder structure

```
scripts/product-import/
├── scripts/
│   ├── _admin-client.cjs           # shared HTTP client (auth, retry, uploads) — not run directly
│   ├── _csv-utils.cjs              # shared CSV parsing — not run directly
│   ├── _validate.cjs               # shared row validation — not run directly
│   ├── validate-products.cjs       # dry-run validation, no writes
│   ├── import-products.cjs         # the main importer
│   ├── create-collections.cjs      # create/curate collections + attach products
│   └── update-category-images.cjs  # bulk-set department/category photos
├── sample-data/
│   ├── products.csv                # 32 realistic (fictional) sample products
│   ├── collections.json            # 8 sample collections referencing the sample products
│   └── category-images.json        # sample category->photo mapping (placeholder URLs)
├── docs/
│   ├── IMPORT_GUIDE.md              # installation, setup, workflow, rollback, FAQ
│   ├── CSV_SPEC.md                  # full column reference + validation rules
│   └── TROUBLESHOOTING.md           # real errors we've hit, and their fixes
├── .env.example
└── README.md                        # you are here
```

## Quick start

```bash
cd scripts/product-import
cp .env.example .env
# edit .env: AUTH_URL, COMMERCE_URL, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, STORE_ID
export $(grep -v '^#' .env | xargs)

# 1. Try it against the bundled sample data first (safe — everything defaults to draft).
node scripts/validate-products.cjs sample-data/products.csv
node scripts/import-products.cjs sample-data/products.csv
node scripts/create-collections.cjs sample-data/collections.json

# 2. When your real inventory is ready, replace the sample-data/ files with your
#    own (same structure — see docs/CSV_SPEC.md) and re-run against those instead.
node scripts/validate-products.cjs my-real-products.csv
node scripts/import-products.cjs my-real-products.csv
```

Full instructions: **[docs/IMPORT_GUIDE.md](docs/IMPORT_GUIDE.md)**.

## What makes this "production-ready"

- **Real API only** — every endpoint called here is a verified route in
  `Backend/services/commerce/commerce-service` (see the header comment in
  `scripts/_admin-client.cjs` for the full list). Nothing is invented.
- **Draft by default** — a product is only visible on the storefront after an
  explicit `Publish=true` or a manual publish in admin-platform.
- **Idempotent** — re-running an import after fixing a few bad rows only creates
  the rows that previously failed; existing SKUs/slugs are detected and skipped.
- **Validates before writing** — every row is checked (required fields, numeric
  fields, duplicate SKU/slug, real category, image reachability) before any
  create/upload call is made. One bad row is reported and skipped, never crashes
  the batch.
- **Retries transient failures** — network drops and 5xx responses are retried
  with exponential backoff; genuine 4xx errors (bad data) are not retried, since
  retrying an invalid request just fails the same way again.
- **Full audit trail** — every import run writes a timestamped JSON report
  (created/skipped/failed/warnings, per row) next to the input file.
- **No fabricated business data** — sample images are non-functional
  `example.com` placeholders (IANA-reserved for documentation, never real
  content), never a stock-photo service. Sample products are clearly-fictional
  but realistic luxury items, meant to demonstrate the CSV format — replace them
  before this ever reaches real customers.

## Configuration

Everything is environment-variable driven — see **[.env.example](.env.example)**.
No secrets, URLs, or store IDs are hardcoded in any script.

## Documentation index

| Document | Covers |
|---|---|
| [docs/IMPORT_GUIDE.md](docs/IMPORT_GUIDE.md) | Installation, setup, how imports work, replacing sample data, rollback, FAQ |
| [docs/CSV_SPEC.md](docs/CSV_SPEC.md) | Every CSV column, its backend field, and every validation rule |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Specific error messages and their fixes |
