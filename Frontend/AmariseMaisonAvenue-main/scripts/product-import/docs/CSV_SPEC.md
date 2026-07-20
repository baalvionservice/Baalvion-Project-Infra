# Product CSV Specification

The full column reference for `sample-data/products.csv` / your own product import
file. Every field maps to a real, verified commerce-service field — see the "Backend
field" column. Nothing here is a fabricated or aspirational API.

## File format

- **Encoding:** UTF-8 (a leading byte-order mark is fine — it's stripped automatically).
- **Delimiter:** comma. Fields containing a comma, quote, or newline must be wrapped in
  double quotes; a literal `"` inside a quoted field is escaped by doubling it (`""`).
- **Line endings:** LF or CRLF, either works.
- **Header row:** required, must match the column names below exactly (case-sensitive).
- **Column order:** does not matter. Unlisted/extra columns are ignored.

## Columns

| Column | Required | Type | Backend field | Notes |
|---|---|---|---|---|
| `SKU` | **yes** | text | `sku` | Must be unique across the store. Used for idempotency — a row whose SKU already exists is skipped, not duplicated. |
| `Title` | **yes** | text | `name` | The product's display name. |
| `Slug` | no | text | `slug` | URL slug. **Strongly recommended** — if omitted, commerce-service derives one from `Title`, which strips accented characters (e.g. "é") differently than you might expect. Set it explicitly for predictable URLs and for referencing this product from `collections.json`. Must match `^[a-z0-9-]+$`. |
| `Description` | no | text | `description` | Full product description. Plain text (not HTML). |
| `Department` | no | text | — (validation only) | Cross-checked against the department that `Category` actually belongs to; mismatches produce a **warning**, not an error — this column doesn't get sent to the API on its own. |
| `Category` | **yes** | text | `categoryId` (resolved) | The category **slug** (e.g. `hermes-birkin-handbags`), not its display name. See Commerce → Categories in admin-platform, or the taxonomy printed by `seed-amarise-commerce-catalog.cjs`. |
| `Brand` | no | text | `customFields.brandId` | Stored as a slugified custom field (e.g. "Van Cleef & Arpels" → `van-cleef-arpels`). |
| `Price` | **yes** | number | `price` (seeds the default variant) | Base currency amount (no currency symbol, no thousands separator — `28000` not `$28,000`). |
| `Sale Price` | no | number | variant `price` + `compareAtPrice` | If set, the product's active selling price becomes `Sale Price` and `Price` is preserved as `compareAtPrice`. **Note:** the current storefront UI does not yet render a "was/now" strikethrough price — this is captured faithfully in the backend for future use, not a promise it displays today. |
| `Currency` | no | 3-letter code | `currencyCode` | Defaults to `USD`. |
| `Inventory` | no | non-negative integer | `stockQuantity` | Defaults to unset (commerce-service's own default). |
| `Status` | no | text | `customFields.listingStatus` | **Informational/merchandising text only** (e.g. "New", "Featured", "Active") — does *not* control whether the product is live. See `Publish` for that. |
| `Tags` | no | semicolon-list | `tags` | e.g. `birkin;exotic;rare`. |
| `Materials` | no | semicolon-list | `materials` | e.g. `Togo Leather;Gold Hardware`. |
| `Condition` | no | enum | `condition` | One of `pristine \| excellent \| very_good \| good \| fair \| vintage`. Anything else is silently omitted (warned, not an error). |
| `Condition Notes` | no | text | `conditionNotes` | Free text, e.g. "light corner wear, no odor." |
| `Authenticity Status` | no | text | `authenticityStatus` | e.g. "verified", "pending". Set this deliberately — never leave a placeholder here on anything you actually publish. |
| `Authenticity Certificate Code` | no | text | `authenticityCertificateCode` | Your internal certificate reference, if you issue one. |
| `Serial Number` | no | text | `serialNumber` | The item's real serial/blind-stamp/date-code, if you record one. **Never fabricate this column** — an incorrect authenticity identifier on a real luxury listing is a genuine liability, not just a data-quality issue. Leave it blank (or an obvious placeholder like `TBD-...`) until you have the real value, and keep the row `Publish=false` until you do. |
| `One Of A Kind` | no | `true`/`false` | `isOneOfAKind` | Whether this is a single unique item vs. a restockable listing. |
| `Color` | no | semicolon-list | `customFields.colors` | Single value or list, e.g. `Rouge H` or `Black;Beige`. |
| `Size` | no | semicolon-list | `customFields.sizes` | e.g. `30cm` or `EU 38`. |
| `Images` | no (warns if empty) | semicolon-list | product media (uploaded) | Local file paths (resolved relative to the CSV's own directory) **or** `http(s)://` URLs. **The first image in the list becomes the featured/cover photo.** Products with no images fall back to the storefront's `BrandImage` monogram placeholder — that's a normal, supported state, not an error. |
| `SEO Title` | no | text | `seoMetadata.title` | Warns past ~70 characters (search engines typically truncate). |
| `SEO Description` | no | text | `seoMetadata.description` | Warns past ~160 characters. |
| `Collections` | no | semicolon-list | collection membership | Collection **names** (not slugs) — e.g. `New Arrivals;Best Sellers`. A collection that doesn't exist yet is created automatically. |
| `Publish` | no | `true`/`false`/`1`/`0`/`yes`/`no` | product `status` transition | Defaults to **false** — every imported product starts as `draft` (commerce-service's own default) and is invisible on the storefront until explicitly published, either via this column or later from admin-platform. |

## Validation rules

Run by both `validate-products.cjs` (dry run) and `import-products.cjs` (before
creating each row) — see `_validate.cjs`. A row with **errors** is never sent to the
API; a row with only **warnings** is still imported.

**Errors (row is skipped):**
- Missing `SKU`, `Title`, `Category`, or `Price`.
- `Price` / `Sale Price` not a non-negative number.
- `Inventory` not a non-negative integer.
- Duplicate `SKU` or `Slug` — either within the CSV file itself, or already present
  in the store (live check only, requires `STORE_ID`/credentials).
- `Category` doesn't match any real category slug in the store (live check only).
- An `Images` entry is a local path that doesn't exist, or a malformed URL.

**Warnings (row still imports):**
- No `Images` provided.
- `Department` doesn't match the department the resolved `Category` actually
  belongs to.
- `Sale Price` higher than `Price`.
- `Condition` set to something outside `pristine | excellent | very_good | good |
  fair | vintage` (the value is simply omitted, not treated as an error).
- `SEO Title` / `SEO Description` unusually long.
- Category/duplicate checks running in OFFLINE mode (no live store data available
  to check against).

## Example row

```csv
SKU,Title,Slug,Description,Department,Category,Brand,Price,Sale Price,Currency,Inventory,Status,Tags,Materials,Color,Size,Images,SEO Title,SEO Description,Collections,Publish
AM-HER-0001,"Hermès Birkin 30 Rouge H Togo Leather",hermes-birkin-30-rouge-h-togo-leather,"A quintessential Birkin 30...",Hermès,hermes-birkin-handbags,Hermès,28000,,USD,1,Featured,"birkin;exotic-hardware","Togo Leather;Gold Hardware","Rouge H","30cm","https://cdn.example.com/birkin-1.jpg;https://cdn.example.com/birkin-2.jpg","Hermès Birkin 30 Rouge H | Amarisé Maison Avenue","Authenticated Hermès Birkin 30...","Best Sellers;Luxury Essentials",true
```

See `sample-data/products.csv` for 32 complete, realistic (fictional) examples
spanning every department currently in the store.
