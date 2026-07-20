#!/usr/bin/env node
'use strict';

/**
 * create-collections.cjs — creates curated Collections (the /collections and
 * /collection/[id] storefront pages) and attaches products to them by slug.
 *
 * Run this AFTER products exist — import-products.cjs's own `Collections` CSV
 * column already handles the common case of "attach this product to these
 * collections" inline during import. Use this script instead when you want to
 * manage collections as their own file (e.g. seasonal collections curated after
 * the fact, or re-running collection membership without re-importing products).
 *
 * Input: a JSON array of collection definitions (see sample-data/collections.json):
 *   [
 *     {
 *       "name": "New Arrivals",
 *       "slug": "new-arrivals",              // optional — derived from name if omitted
 *       "description": "The latest acquisitions",
 *       "imageUrl": "https://cdn.../hero.jpg", // optional, real URL only
 *       "productSlugs": ["hermes-birkin-30-rouge-h"]
 *     }
 *   ]
 *
 * productSlugs are matched against existing product slugs in the store (see
 * `Slug` column in your products CSV, or the auto-generated slug commerce-service
 * assigns from the product name). Unmatched slugs are reported and skipped —
 * never fail the whole run over one bad reference.
 *
 * Usage:
 *   STORE_ID=<id> AUTH_URL=... COMMERCE_URL=... \
 *   SUPERADMIN_EMAIL=... SUPERADMIN_PASSWORD=*** \
 *   node scripts/create-collections.cjs <path/to/collections.json>
 */

const fs = require('node:fs');
const { login, requireStoreId, storeBase, jget, jpost, fetchAllProducts } = require('./_admin-client.cjs');

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node create-collections.cjs <path/to/collections.json>');
    process.exit(1);
  }
  const defs = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(defs)) throw new Error(`"${file}" must contain a JSON array of collection definitions`);

  const storeId = requireStoreId();
  const token = await login();

  const [existingCollectionsRes, products] = await Promise.all([
    jget(`${storeBase(storeId)}/collections`, token),
    fetchAllProducts(storeId, token),
  ]);
  const collectionsBySlug = new Map((existingCollectionsRes.data?.data || []).map((c) => [c.slug, c]));
  const productsBySlug = new Map(products.map((p) => [p.slug, p]));

  let createdCollections = 0, skippedCollections = 0, attached = 0, alreadyAttached = 0, missingProducts = 0, failed = 0;

  for (const def of defs) {
    if (!def.name) {
      console.error('✗ collection definition missing "name" — skipping');
      failed++;
      continue;
    }
    let collection = def.slug ? collectionsBySlug.get(def.slug) : undefined;
    if (!collection) {
      // Build the body conditionally: commerce-service's imageUrl validator requires a
      // well-formed URL when the key is present at all, so an empty/undefined imageUrl
      // must be omitted entirely rather than sent as "".
      const body = { name: def.name };
      if (def.slug) body.slug = def.slug;
      if (def.description) body.description = def.description;
      if (def.imageUrl) body.imageUrl = def.imageUrl;
      const res = await jpost(`${storeBase(storeId)}/collections`, token, body);
      if (res.status !== 201) {
        console.error(`✗ collection "${def.name}" -> HTTP ${res.status}: ${JSON.stringify(res.data).slice(0, 240)}`);
        failed++;
        continue;
      }
      collection = res.data.data;
      collectionsBySlug.set(collection.slug, collection);
      createdCollections++;
      console.log(`✓ created collection "${def.name}" (${collection.id})`);
    } else {
      skippedCollections++;
      console.log(`- collection "${def.name}" already exists, reusing it`);
    }

    for (const productSlug of def.productSlugs || []) {
      const product = productsBySlug.get(productSlug);
      if (!product) {
        console.error(`    ! product "${productSlug}" not found in the store — skipping`);
        missingProducts++;
        continue;
      }
      const res = await jpost(`${storeBase(storeId)}/collections/${collection.id}/products/${product.id}`, token, {});
      if (res.status === 200 || res.status === 201) attached++;
      else if (res.status === 409) alreadyAttached++;
      else console.error(`    ✗ attach "${productSlug}" -> HTTP ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: failed === 0,
        collections: { created: createdCollections, reused: skippedCollections, failed },
        products: { attached, alreadyAttached, missing: missingProducts },
      },
      null,
      2
    )
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('failed:', e.message);
  process.exit(1);
});
