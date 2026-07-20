#!/usr/bin/env node
'use strict';

/**
 * import-products.cjs — bulk product import from a CSV into the real commerce-service
 * store. This is the drop-in point for real inventory: replace sample-data/products.csv
 * with your own file (same columns, see docs/CSV_SPEC.md) and run this script.
 *
 * For every row: validates it (reusing _validate.cjs — the SAME checks
 * validate-products.cjs runs), skips it with a clear reason if invalid, otherwise:
 *   1. creates the product as `draft` (commerce-service's own default — never
 *      visible on the storefront until published),
 *   2. applies Sale Price via the variant pricing fields if provided,
 *   3. uploads every image in the Images column (local path or URL; first = featured),
 *   4. finds-or-creates every collection listed and attaches the product to it,
 *   5. publishes the product ONLY if the Publish column is true.
 *
 * Idempotent: a row whose SKU or Slug already exists in the store is skipped, not
 * duplicated or overwritten — re-running an import after fixing a few rows is safe.
 *
 * Network calls (product create, media upload, collection attach) each retry with
 * exponential backoff on transient failures (see _admin-client.cjs withRetry).
 *
 * At the end, writes a JSON report (created/skipped/failed/warnings, per row) next
 * to the input CSV, named import-report-<timestamp>.json, in addition to the
 * console summary.
 *
 * Usage:
 *   STORE_ID=<id> AUTH_URL=... COMMERCE_URL=... \
 *   SUPERADMIN_EMAIL=... SUPERADMIN_PASSWORD=*** \
 *   node scripts/import-products.cjs <path/to/products.csv>
 */

const fs = require('node:fs');
const path = require('node:path');
const { readCsvFile, splitList, truthy, slugify } = require('./_csv-utils.cjs');
const { validateRow, createContext } = require('./_validate.cjs');
const {
  login,
  requireStoreId,
  storeBase,
  fetchCategoryBySlugMap,
  fetchAllProducts,
  jget,
  jpost,
  jpatch,
  uploadProductMedia,
} = require('./_admin-client.cjs');

/**
 * Maps one validated CSV row onto commerce-service's createProductSchema body.
 * Every field here is a REAL schema field (Backend/services/commerce/commerce-service/
 * validators/productSchemas.js) — nothing invented. Color/Size/brand have no
 * first-class columns on the product table, so they travel in `customFields`,
 * exactly like the rest of this storefront's luxury-specific attributes
 * (see utils/storefrontSerializer.js).
 * @param {Record<string,string>} row
 * @param {string} categoryId
 * @returns {object}
 */
function buildProductBody(row, categoryId) {
  const body = {
    categoryId,
    name: row.Title,
    price: Number(row.Price),
    currencyCode: row.Currency || 'USD',
  };
  if (row.Slug) body.slug = slugify(row.Slug);
  if (row.SKU) body.sku = row.SKU;
  if (row.Description) body.description = row.Description;
  if (row.Inventory) body.stockQuantity = parseInt(row.Inventory, 10);

  const materials = splitList(row.Materials);
  if (materials.length) body.materials = materials;

  const tags = splitList(row.Tags);
  if (tags.length) body.tags = tags;

  if (row['SEO Title'] || row['SEO Description']) {
    body.seoMetadata = {
      ...(row['SEO Title'] ? { title: row['SEO Title'] } : {}),
      ...(row['SEO Description'] ? { description: row['SEO Description'] } : {}),
    };
  }

  const customFields = {};
  if (row.Brand) customFields.brandId = slugify(row.Brand);
  const colors = splitList(row.Color);
  if (colors.length) customFields.colors = colors;
  const sizes = splitList(row.Size);
  if (sizes.length) customFields.sizes = sizes;
  // Status is merchandising/informational text (e.g. "New", "Featured") — distinct from
  // Publish, which is the actual draft/published lifecycle gate. See docs/CSV_SPEC.md.
  if (row.Status) customFields.listingStatus = row.Status;
  if (Object.keys(customFields).length) body.customFields = customFields;

  return body;
}

/**
 * Applies Sale Price to the product's default variant via the real pricing update
 * endpoint (PATCH /:productId/variants/:variantId), setting price = Sale Price and
 * compareAtPrice = the original Price. Note: the current storefront UI does not yet
 * render compareAtPrice (no "was $X now $Y" display) — this is recorded faithfully
 * in the backend for future use / admin visibility, not a promise it renders today.
 * @param {string} storeId @param {string} token @param {string} productId
 * @param {number} originalPrice @param {number} salePrice @param {string} currencyCode
 */
async function applySalePrice(storeId, token, productId, originalPrice, salePrice, currencyCode) {
  const detail = await jget(`${storeBase(storeId)}/products/${productId}`, token);
  const variant = (detail.data?.data?.variants || []).find((v) => v.isDefault);
  if (!variant) return { status: 404, data: { error: { message: 'default variant not found' } } };
  return jpatch(`${storeBase(storeId)}/products/${productId}/variants/${variant.id}`, token, {
    price: salePrice,
    compareAtPrice: originalPrice,
    currencyCode,
  });
}

/**
 * Finds a collection by slug, creating it if it doesn't exist yet, then attaches
 * the product to it.
 * @param {string} storeId @param {string} token @param {Map<string,object>} collectionsBySlug
 * @param {string} collectionName @param {string} productId
 */
async function attachToCollection(storeId, token, collectionsBySlug, collectionName, productId) {
  const slug = slugify(collectionName);
  let collection = collectionsBySlug.get(slug);
  if (!collection) {
    const res = await jpost(`${storeBase(storeId)}/collections`, token, { name: collectionName, slug });
    if (res.status !== 201) return { status: res.status, data: res.data, created: false };
    collection = res.data.data;
    collectionsBySlug.set(slug, collection);
  }
  const attach = await jpost(`${storeBase(storeId)}/collections/${collection.id}/products/${productId}`, token, {});
  return { status: attach.status, data: attach.data, created: true };
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('usage: node import-products.cjs <path/to/products.csv>');
    process.exit(1);
  }

  const rows = readCsvFile(csvPath);
  if (!rows.length) throw new Error(`"${csvPath}" has no data rows`);

  const storeId = requireStoreId();
  const token = await login();

  console.log(`Loading store taxonomy + existing products for store ${storeId}...`);
  const [categoriesBySlug, existingProducts, existingCollectionsRes] = await Promise.all([
    fetchCategoryBySlugMap(storeId, token),
    fetchAllProducts(storeId, token),
    jget(`${storeBase(storeId)}/collections`, token),
  ]);
  const collectionsBySlug = new Map((existingCollectionsRes.data?.data || []).map((c) => [c.slug, c]));

  const ctx = createContext();
  ctx.categoriesBySlug = categoriesBySlug;
  ctx.existingSkus = new Set(existingProducts.map((p) => p.sku).filter(Boolean));
  ctx.existingSlugs = new Set(existingProducts.map((p) => p.slug).filter(Boolean));

  const report = { createdAt: new Date().toISOString(), csvPath, created: [], skipped: [], failed: [], warnings: [] };
  let created = 0, skipped = 0, failed = 0, imagesUploaded = 0, imagesFailed = 0, published = 0, collectionsAttached = 0;

  for (const [i, row] of rows.entries()) {
    const lineNumber = i + 2;
    const label = row.Title || row.SKU || `row ${lineNumber}`;

    const { errors, warnings } = validateRow(row, ctx, { imageBaseDir: path.dirname(csvPath) });
    if (warnings.length) report.warnings.push({ lineNumber, label, warnings });
    if (errors.length) {
      console.error(`✗ line ${lineNumber} "${label}": ${errors.join('; ')}`);
      report.skipped.push({ lineNumber, label, reasons: errors });
      skipped++;
      continue;
    }

    const category = categoriesBySlug.get(row.Category);
    const body = buildProductBody(row, category.id);
    const res = await jpost(`${storeBase(storeId)}/products`, token, body);
    if (res.status !== 201) {
      console.error(`✗ line ${lineNumber} "${label}" -> HTTP ${res.status}: ${JSON.stringify(res.data).slice(0, 240)}`);
      report.failed.push({ lineNumber, label, status: res.status, error: res.data });
      failed++;
      continue;
    }
    const product = res.data.data;
    ctx.existingSkus.add(product.sku);
    ctx.existingSlugs.add(product.slug);
    created++;
    console.log(`✓ line ${lineNumber}: created "${label}" (${product.id}, slug: ${product.slug})`);

    // Sale price -> real variant pricing fields.
    if (row['Sale Price']) {
      const salePrice = Number(row['Sale Price']);
      const originalPrice = Number(row.Price);
      const priceRes = await applySalePrice(storeId, token, product.id, originalPrice, salePrice, row.Currency || 'USD');
      if (priceRes.status !== 200) {
        console.error(`    ✗ sale price -> HTTP ${priceRes.status}: ${JSON.stringify(priceRes.data).slice(0, 200)}`);
      }
    }

    // Images.
    const images = splitList(row.Images);
    for (const [idx, imageRef] of images.entries()) {
      try {
        const resolvedRef = /^https?:\/\//i.test(imageRef) ? imageRef : path.resolve(path.dirname(csvPath), imageRef);
        const up = await uploadProductMedia(storeId, product.id, token, resolvedRef, { isFeatured: idx === 0, altText: label });
        if (up.status === 201) imagesUploaded++;
        else {
          imagesFailed++;
          console.error(`    ✗ image "${imageRef}" -> HTTP ${up.status}: ${JSON.stringify(up.data).slice(0, 200)}`);
        }
      } catch (err) {
        imagesFailed++;
        console.error(`    ✗ image "${imageRef}" -> ${err.message}`);
      }
    }

    // Collections.
    for (const collectionName of splitList(row.Collections)) {
      const res2 = await attachToCollection(storeId, token, collectionsBySlug, collectionName, product.id);
      if (res2.status === 200 || res2.status === 201) collectionsAttached++;
      else console.error(`    ✗ collection "${collectionName}" -> HTTP ${res2.status}: ${JSON.stringify(res2.data).slice(0, 200)}`);
    }

    // Publish.
    if (truthy(row.Publish)) {
      const pub = await jpost(`${storeBase(storeId)}/products/${product.id}/publish`, token, {});
      if (pub.status === 200) { published++; console.log('    ✓ published'); }
      else console.error(`    ✗ publish -> HTTP ${pub.status}: ${JSON.stringify(pub.data).slice(0, 200)}`);
    }

    report.created.push({ lineNumber, label, productId: product.id, slug: product.slug });
  }

  const summary = {
    ok: failed === 0,
    rows: { total: rows.length, created, skipped, failed },
    images: { uploaded: imagesUploaded, failed: imagesFailed },
    collectionsAttached,
    published,
    warningRows: report.warnings.length,
  };
  report.summary = summary;

  const reportPath = path.join(
    path.dirname(csvPath),
    `import-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  );
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n── Summary ──────────────────────────────────────');
  console.log(`  Created:  ${created}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Failed:   ${failed}`);
  console.log(`  Warnings: ${report.warnings.length} row(s)`);
  console.log(`  Images uploaded: ${imagesUploaded}, failed: ${imagesFailed}`);
  console.log(`  Collections attached: ${collectionsAttached}`);
  console.log(`  Published: ${published}`);
  console.log(`\nFull report written to: ${reportPath}`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('import failed to run:', e.message);
  process.exit(1);
});
