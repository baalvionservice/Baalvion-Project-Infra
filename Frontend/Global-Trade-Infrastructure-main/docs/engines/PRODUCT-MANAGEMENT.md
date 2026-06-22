# Product Management — Categories · Variants · Images · Inventory · MOQ · HS Codes · Certifications

> **Status:** ✅ Implemented & tested (backend config + unit tests; full GCKB suite
> green on real PostgreSQL, `tsc` clean).
> **Principle:** *Configuration over code.* Every capability below is **registry
> configuration on the GCKB engine** — no new table, migration, service or route.
> Nothing is seeded; real catalogues/stock are loaded through the import API.

This is the complete product-management surface of the platform. It builds on the
Universal Product Registry ([PRODUCT-REGISTRY.md](PRODUCT-REGISTRY.md), Module 1)
and closes the gaps for **variants, images, inventory and MOQ**, while reusing the
HS ([Module 2](HS-CODE-REGISTRY.md)) and Certificate ([Module 3]) registries.

---

## 1. Capability coverage

| Capability | How it is modelled | Where |
|------------|--------------------|-------|
| **Categories** | `product_category` entity — a configurable taxonomy (no hardcoded tree), self-referencing via `SUBCATEGORY_OF`; products link via `CLASSIFIED_AS`. | `registries/product.ts` |
| **Variants** | First-class `product_variant` entity (SKU-level): option values, barcode, media, price, per-variant MOQ override; `VARIANT_OF` edge to the parent. Product declares its `variantOptions` axes. | `registries/product.ts` |
| **Images** | `media[]` on both `product` and `product_variant` — URL + presentation metadata (role, alt, sortOrder, dimensions). Metadata only; binaries live in object storage / CDN. | `registries/product.ts` |
| **Inventory** | `inventory_item` entity — a versioned stock position (on-hand / reserved / incoming) per item per location, with reorder thresholds and lot/expiry. | `registries/inventory.ts` |
| **MOQ** | `commercialTerms` block on `product` (and overridable per `product_variant`): minimum order quantity, order increment, packaging multiple, lead time, sampling, tiered `priceBreaks`. | `registries/product.ts` |
| **HS Codes** | `hs_code` registry (full HS2–HS10 hierarchy + national extensions); products carry `hsClassifications[]` and a promoted `hsCode` facet + a `CLASSIFIED_UNDER_HS` edge. | `registries/hs-code.ts` |
| **Certifications** | `certificate_type` (catalogue) + `certificate` (issued instance) registries; products carry `certificates[]` + a `REQUIRES_CERTIFICATE` edge. | `registries/certificate.ts` |

Because every entity is registered with the generic GCKB engine, all seven inherit
versioning, append-only history, version compare, faceted + temporal (`asOf`)
search, CSV/JSON import (dry-run + rollback), export, immutable audit, domain
events (transactional outbox) and Row-Level-Security tenant isolation — and the
registry-driven Admin UI renders create/edit forms from the declared `formFields`.

---

## 2. New entity definitions

### `product_variant` (domain `product`)

| Aspect | Value |
|--------|-------|
| Natural key | `sku` › `gtin` › `code` › `parentKey:option=value/…` (sorted) › `slug(name)` |
| Events | `PRODUCT_VARIANT_CREATED / UPDATED / ARCHIVED` |
| Key attributes | `parentProductKey` (req), `optionValues{}`, `gtin`, `barcode`, `media[]`, `weight`, `volume`, `packaging`, `price{currency,amount}`, `commercialTerms{}`, `position`, `isDefault`, `variantStatus` |
| Edges | `VARIANT_OF`→product, `CLASSIFIED_UNDER_HS`→hs_code, `REQUIRES_CERTIFICATE`→certificate, `SUBSTITUTE_FOR`→product |

### `inventory_item` (domain `inventory`)

| Aspect | Value |
|--------|-------|
| Natural key | `(variantKey › sku › productKey › code › slug)@locationCode` (uppercased) |
| Events | `INVENTORY_ITEM_CREATED / UPDATED / ARCHIVED` |
| Key attributes | one of `productKey`/`variantKey`/`sku` (req), `locationCode` (req), `warehouseName`, `binLocation`, `quantityOnHand` (req), `quantityReserved`, `quantityIncoming`, `quantityAvailable`, `reorderPoint`, `reorderQuantity`, `safetyStock`, `unitOfMeasure`, `lotNumber`, `serialNumbers[]`, `expiryDate`, `stockStatus` |
| Edges | `STOCK_OF`→product, `STOCK_OF_VARIANT`→product_variant, `STORED_AT`→point_of_entry, `SUPPLIED_BY`→organization |

> **Stock-position, not a movement ledger.** Each write is a versioned snapshot;
> a stock change is a new version (full history preserved by `gckb_revisions`).
> This matches the GCKB "metadata, not integration" boundary.

---

## 3. New attribute fragments on `product`

```
media:           [{ url, type, role, alt, title, sortOrder, width, height, mimeType, variantKey, checksum }]
commercialTerms: { minimumOrderQuantity, orderIncrement, maximumOrderQuantity, packagingMultiple,
                   unitOfMeasure, leadTimeDays, sampleAvailable, sampleLeadTimeDays,
                   currency, unitPrice, priceBreaks:[{minQuantity, unitPrice, currency}], incoterms[] }
variantOptions:  [{ name, values[], displayName }]      // the axes variants vary on
```

`product_variant` reuses `media`, `commercialTerms`, `weight`, `volume` and
`packaging`, so a variant can override the parent's commercial terms.

---

## 4. API (served by the generic registry routes)

The new entity types are served automatically by `/api/gckb/[entity]/**`:

| Path | Purpose |
|------|---------|
| `GET/POST /api/gckb/product_variant` | Search / create variants (`code`, `tag`, `keyword`, `asOf`, …) |
| `GET/PATCH/DELETE /api/gckb/product_variant/{id}` | Read / update / archive |
| `GET/POST /api/gckb/product_variant/{id}/relationships` | Typed edges (incl. `VARIANT_OF`) |
| `POST /api/gckb/product_variant/import` · `GET …/export` | Bulk import / export |
| `GET/POST /api/gckb/inventory_item` … | Same lifecycle for stock positions |
| `GET /api/gckb/entities` | Catalog incl. the new `formFields` + `relationshipTypes` (drives the Admin UI) |

---

## 5. Testing

```bash
npx vitest run src/server/gckb/__tests__/product-management.test.ts \
               src/server/gckb/__tests__/product-registry.test.ts \
               src/server/gckb/__tests__/registry-metadata.test.ts
```

`product-management.test.ts` covers: product media / MOQ / variant-option
validation; the `product_variant` entity (registration, key precedence incl. the
sorted option composite, parent-required rule, full payload, events + `VARIANT_OF`
edge); and the `inventory_item` entity (key `item@location`, the
item/location/quantity required rules, negative-quantity rejection, full payload,
and `STOCK_OF` / `STOCK_OF_VARIANT` / `STORED_AT` edges).

---

## 6. Scope boundary

**In this slice:** the `product_variant` and `inventory_item` entity definitions;
the `media`, `commercialTerms` and `variantOptions` fragments on `product`; their
validation schemas, natural keys, events, typed relationships and form metadata;
unit tests; this documentation. No new migration (reuses the GCKB tables).

**Delivered by shared infrastructure:** REST API, import/export, search,
versioning/history, audit, events, RLS, and the registry-driven Admin UI.

**Deliberately not here:** no seeded data; image binaries / uploads (URLs only);
an inventory *movement ledger* (the financial settlement ledger and treasury are
separate engines) — `inventory_item` is the stock-position master.
