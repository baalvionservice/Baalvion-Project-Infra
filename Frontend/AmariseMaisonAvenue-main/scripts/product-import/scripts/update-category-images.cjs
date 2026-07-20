#!/usr/bin/env node
'use strict';

/**
 * update-category-images.cjs — bulk-sets imageUrl (and optionally description) on
 * departments/categories once real photography exists. Until then, BrandImage
 * renders the Amarisé monogram placeholder everywhere on this storefront — never
 * fabricate a photo URL here; leave a category out of the input file if you don't
 * have a real image for it yet.
 *
 * Input: a JSON object mapping category SLUG -> { imageUrl, description? } (see
 * sample-data/category-images.json). Slugs are the ones visible in
 * Commerce -> Categories in admin-platform, or printed by whichever script created
 * your store's taxonomy.
 *
 *   {
 *     "dept-hermes": { "imageUrl": "https://cdn.example.com/hermes-hero.jpg" },
 *     "hermes-birkin-handbags": { "imageUrl": "https://cdn.example.com/birkin.jpg" }
 *   }
 *
 * imageUrl must already be a real, hosted URL (upload via the admin media library
 * or your CDN first) — commerce-service validates it's a well-formed URL and
 * rejects anything else.
 *
 * Usage:
 *   STORE_ID=<id> AUTH_URL=... COMMERCE_URL=... \
 *   SUPERADMIN_EMAIL=... SUPERADMIN_PASSWORD=*** \
 *   node scripts/update-category-images.cjs <path/to/category-images.json>
 */

const fs = require('node:fs');
const { login, requireStoreId, storeBase, fetchCategoryBySlugMap, jpatch } = require('./_admin-client.cjs');

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node update-category-images.cjs <path/to/category-images.json>');
    process.exit(1);
  }
  const map = JSON.parse(fs.readFileSync(file, 'utf8'));

  const storeId = requireStoreId();
  const token = await login();
  const bySlug = await fetchCategoryBySlugMap(storeId, token);

  let updated = 0, skipped = 0, failed = 0;
  for (const [slug, patch] of Object.entries(map)) {
    if (slug.startsWith('_')) continue; // metadata/comment keys (e.g. "_comment"), not a category
    const category = bySlug.get(slug);
    if (!category) {
      console.error(`✗ "${slug}" not found in store ${storeId} — skipping`);
      skipped++;
      continue;
    }
    const body = {};
    if (patch.imageUrl) body.imageUrl = patch.imageUrl;
    if (patch.description) body.description = patch.description;
    if (!Object.keys(body).length) {
      console.log(`- "${slug}" has no imageUrl/description to set — skipping`);
      skipped++;
      continue;
    }
    const res = await jpatch(`${storeBase(storeId)}/categories/${category.id}`, token, body);
    if (res.status === 200) {
      updated++;
      console.log(`✓ ${slug}`);
    } else {
      failed++;
      console.error(`✗ ${slug} -> HTTP ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`);
    }
  }

  console.log(JSON.stringify({ ok: failed === 0, updated, skipped, failed }, null, 2));
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('failed:', e.message);
  process.exit(1);
});
