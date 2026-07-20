# Import Guide

End-to-end instructions for getting real inventory live on the Amarisé Maison Avenue
storefront using this system.

## 1. Installation

No dependencies to install — every script is dependency-free Node.js (`.cjs`, uses
only built-in `fetch`/`FormData`/`Blob`/`node:fs`). You need:

- Node.js 18 or later (for native `fetch`/`FormData`).
- Network access to your commerce-service deployment (local dev stack, or production
  at `api.baalvion.com`).
- A superadmin (or otherwise sufficiently-privileged) login for that environment.

```bash
cd scripts/product-import
node --version   # confirm >= 18
```

## 2. Setup

Copy the environment template and fill it in:

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Description |
|---|---|
| `AUTH_URL` | Auth service login endpoint, ending at `/v1/auth`. |
| `COMMERCE_URL` | Commerce service base, ending at `/api/v1`. |
| `SUPERADMIN_EMAIL` | Login identity used to call the admin API. |
| `SUPERADMIN_PASSWORD` | Password for that account. **Never commit this file.** |
| `STORE_ID` | The target commerce store's UUID (see below). |
| `IMPORT_MAX_RETRIES` | Optional, default `3`. |
| `IMPORT_RETRY_DELAY_MS` | Optional, default `500` (doubles on each retry). |

Then load it into your shell before running any script — this repo's other seed
scripts follow the same convention (no `.env` auto-loading, explicit env vars):

```bash
export $(grep -v '^#' .env | xargs)   # bash/zsh
# or prefix every command: STORE_ID=... AUTH_URL=... node scripts/...
```

Finding your `STORE_ID`: it's printed by `seed-amarise-commerce-catalog.cjs` (the
script that creates the store + department/category taxonomy) when it runs, and
visible in admin-platform under Commerce → Stores.

## 3. How imports work

```
CSV row  →  validate  →  create product (draft)  →  apply sale price (if any)
                                                  →  upload images (first = featured)
                                                  →  attach to collections
                                                  →  publish (only if Publish=true)
```

Every product is created as `draft` — commerce-service's own default — and is
**invisible on the storefront** until explicitly published. This is deliberate: you
can import a full catalog, review it in admin-platform, and publish only what's
ready, rather than everything going live the moment it's imported.

Run the full pipeline:

```bash
# 1. Validate first — makes no writes at all.
node scripts/validate-products.cjs sample-data/products.csv

# 2. Import.
node scripts/import-products.cjs sample-data/products.csv

# 3. (Optional) manage collections separately from product import.
node scripts/create-collections.cjs sample-data/collections.json

# 4. (Optional) once you have real photography for categories/departments.
node scripts/update-category-images.cjs sample-data/category-images.json
```

`import-products.cjs` writes a JSON report next to your CSV
(`import-report-<timestamp>.json`) with every created/skipped/failed row and every
warning — keep these for your own records; they're not read by anything else.

## 4. How to replace sample data with your own

1. **Products:** copy `sample-data/products.csv` somewhere (e.g. `my-products.csv`)
   and replace every row with real data, following `docs/CSV_SPEC.md`. Keep the
   header row exactly as-is.
2. **Images:** point the `Images` column at either:
   - local files — paths are resolved relative to wherever your CSV file lives, or
   - `https://` URLs — already-hosted photos (S3, CDN, admin media library).
3. **Collections:** if you want collections curated separately from the CSV's
   `Collections` column, copy `sample-data/collections.json` and replace the
   `productSlugs` arrays with your real product slugs (the `Slug` column value from
   your CSV).
4. **Category photos:** copy `sample-data/category-images.json`, replace every
   `imageUrl` with a real, already-hosted photo URL, and delete any category you
   don't have a photo for yet (an omitted category is left with the existing
   `BrandImage` placeholder — never invent a URL to fill the gap).
5. Run `validate-products.cjs` against your real file before importing. Fix every
   **error** it reports; warnings are your call.
6. Run `import-products.cjs`. Review the created drafts in admin-platform
   (Commerce → Products) before publishing anything you didn't mark `Publish=true`.

## 5. Rollback

Nothing here does bulk deletes — that's intentional (a bulk-delete script is a
foot-gun in a tool meant to be re-run repeatedly). To undo an import:

- **A single bad product:** delete it from admin-platform (Commerce → Products), or
  via the API: `DELETE /commerce/stores/:storeId/products/:productId`.
- **An entire import run:** open the `import-report-<timestamp>.json` this script
  wrote, take the `created[].productId` list, and delete those specific products
  from admin-platform. The report is the source of truth for exactly what a given
  run created.
- **A product with orders against it:** commerce-service will refuse to delete a
  product/category that already has real activity against it — that's a backend
  safety check, not something this tooling works around. Un-publish it instead
  (mark it archived/draft) rather than trying to delete it.

## 6. FAQ

**Can I re-run an import after fixing a few rows?**
Yes — SKU and Slug uniqueness checks mean already-imported rows are skipped, not
duplicated. Only the rows you fixed (previously errored, so never created) will be
newly created.

**What if I don't have real photos yet?**
Leave the `Images` column empty for that row. The product still imports; the
storefront shows the `BrandImage` monogram placeholder until you run
`import-products.cjs` again after updating the row, or add photos directly in
admin-platform.

**Does `Sale Price` show a strikethrough price on the site?**
Not yet — see the note in `docs/CSV_SPEC.md`. It's recorded correctly in the
backend (`compareAtPrice`) for when that UI exists.

**Can I import into a different store than the one these scripts were built for?**
Yes — just point `STORE_ID` at any commerce-service store you have admin access to.
Nothing here is hardcoded to a specific store.

**What happens if the network drops mid-import?**
Each network call (product create, image upload, collection attach) retries with
exponential backoff (`IMPORT_MAX_RETRIES` / `IMPORT_RETRY_DELAY_MS`) before giving
up and reporting that row/step as failed — the rest of the file keeps processing.

See `docs/TROUBLESHOOTING.md` for specific error messages and fixes.
