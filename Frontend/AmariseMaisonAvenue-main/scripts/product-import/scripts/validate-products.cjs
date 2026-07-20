#!/usr/bin/env node
'use strict';

/**
 * validate-products.cjs — dry-run validation of a product CSV. Creates nothing;
 * makes no writes at all. Safe to run repeatedly while you're still preparing data.
 *
 * Runs two modes depending on what credentials are configured:
 *   - OFFLINE (no STORE_ID/SUPERADMIN_PASSWORD): checks structure, required fields,
 *     duplicate SKUs/slugs within the file, numeric fields, and local image files.
 *     Cannot verify Category/Department against the real store or catch duplicates
 *     against products that already exist there.
 *   - LIVE (STORE_ID + SUPERADMIN_PASSWORD set): everything OFFLINE does, PLUS
 *     resolves every Category against the real store taxonomy and checks SKU/Slug
 *     uniqueness against products that already exist there.
 *
 * Usage:
 *   node scripts/validate-products.cjs <path/to/products.csv>
 *
 * Exit code: 0 if no rows have errors (warnings are fine), 1 if any row has an error.
 */

const path = require('node:path');
const { readCsvFile } = require('./_csv-utils.cjs');
const { validateRows, createContext } = require('./_validate.cjs');
const { login, fetchCategoryBySlugMap, fetchAllProducts } = require('./_admin-client.cjs');

async function buildLiveContext(storeId) {
  const token = await login();
  const [categoriesBySlug, products] = await Promise.all([
    fetchCategoryBySlugMap(storeId, token),
    fetchAllProducts(storeId, token),
  ]);
  const ctx = createContext();
  ctx.categoriesBySlug = categoriesBySlug;
  ctx.existingSkus = new Set(products.map((p) => p.sku).filter(Boolean));
  ctx.existingSlugs = new Set(products.map((p) => p.slug).filter(Boolean));
  return ctx;
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('usage: node validate-products.cjs <path/to/products.csv>');
    process.exit(1);
  }

  const rows = readCsvFile(csvPath);
  if (!rows.length) {
    console.error(`"${csvPath}" has no data rows (or failed to parse — check it's saved as CSV, not .xlsx).`);
    process.exit(1);
  }

  const storeId = process.env.STORE_ID;
  const hasCreds = Boolean(storeId && process.env.SUPERADMIN_PASSWORD);
  console.log(`Validating ${rows.length} row(s) from ${csvPath}`);
  console.log(hasCreds ? 'Mode: LIVE (checking against the real store)\n' : 'Mode: OFFLINE (set STORE_ID + SUPERADMIN_PASSWORD for full live checks)\n');

  const ctx = hasCreds ? await buildLiveContext(storeId) : createContext();
  const results = validateRows(rows, ctx, { imageBaseDir: path.dirname(csvPath) });

  let errorRows = 0;
  let warningRows = 0;
  for (const r of results) {
    if (r.errors.length) {
      errorRows++;
      console.log(`✗ line ${r.lineNumber} (${r.row.Title || r.row.SKU || 'untitled'}):`);
      for (const e of r.errors) console.log(`    ERROR: ${e}`);
      for (const w of r.warnings) console.log(`    warning: ${w}`);
    } else if (r.warnings.length) {
      warningRows++;
      console.log(`⚠ line ${r.lineNumber} (${r.row.Title || r.row.SKU || 'untitled'}):`);
      for (const w of r.warnings) console.log(`    warning: ${w}`);
    }
  }

  const clean = results.length - errorRows - warningRows;
  console.log('\n── Summary ──────────────────────────────────────');
  console.log(`  Total rows:    ${results.length}`);
  console.log(`  Clean:         ${clean}`);
  console.log(`  With warnings: ${warningRows}`);
  console.log(`  With errors:   ${errorRows}`);
  console.log(errorRows ? '\nResult: FAILED — fix the errors above before importing.' : '\nResult: OK — ready to import.');

  process.exit(errorRows ? 1 : 0);
}

main().catch((e) => {
  console.error('validation failed to run:', e.message);
  process.exit(1);
});
