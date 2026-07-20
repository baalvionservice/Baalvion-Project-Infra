'use strict';

/**
 * @module _validate
 *
 * Row-level validation shared by validate-products.cjs (standalone dry run) and
 * import-products.cjs (validates each row immediately before creating it). Every
 * check here is a plain function of the row + a context object — no network calls
 * are made from this module itself, so the same logic works identically whether
 * or not live store data is available.
 *
 * See docs/CSV_SPEC.md for the full column reference.
 */

const fs = require('node:fs');
const { splitList } = require('./_csv-utils.cjs');

const REQUIRED_COLUMNS = ['SKU', 'Title', 'Category', 'Price'];

const VALID_CONDITIONS = new Set(['pristine', 'excellent', 'very_good', 'good', 'fair', 'vintage']);

/**
 * @typedef {object} ValidationContext
 * @property {Set<string>} seenSkus       SKUs seen so far in this file (mutated as rows are checked)
 * @property {Set<string>} seenSlugs      Slugs seen so far in this file (mutated as rows are checked)
 * @property {Map<string,object>|null} categoriesBySlug  Live category slug -> row, or null if unavailable
 * @property {Set<string>|null} existingSkus   SKUs already in the store, or null if unavailable
 * @property {Set<string>|null} existingSlugs  Slugs already in the store, or null if unavailable
 */

/**
 * @param {string} value
 * @returns {boolean}
 */
function isPlausibleUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Checks one image reference (local path or http(s) URL) is at least *plausibly* valid.
 * A remote URL is checked for well-formedness only (no network call here — that
 * happens at upload time in import-products.cjs, where a failed fetch is reported
 * per-image rather than failing row validation). A local path is checked for existence.
 * @param {string} imageRef
 * @param {string} [baseDir] directory local paths are resolved relative to
 * @returns {string|null} an error message, or null if OK
 */
function checkImageRef(imageRef, baseDir) {
  if (/^https?:\/\//i.test(imageRef)) {
    return isPlausibleUrl(imageRef) ? null : `not a valid http(s) URL: "${imageRef}"`;
  }
  const path = require('node:path');
  const resolved = baseDir ? path.resolve(baseDir, imageRef) : imageRef;
  return fs.existsSync(resolved) ? null : `local image file not found: "${imageRef}"`;
}

/**
 * Validates a single CSV row. Never throws — always returns a result object so one
 * bad row can never crash a batch run.
 * @param {Record<string,string>} row
 * @param {ValidationContext} ctx
 * @param {{imageBaseDir?: string}} [opts]
 * @returns {{errors: string[], warnings: string[]}}
 */
function validateRow(row, ctx, opts = {}) {
  const errors = [];
  const warnings = [];

  // ── Required fields ──────────────────────────────────────────────────────
  for (const col of REQUIRED_COLUMNS) {
    if (!row[col] || !row[col].trim()) errors.push(`missing required field "${col}"`);
  }

  // ── Price ────────────────────────────────────────────────────────────────
  if (row.Price) {
    const price = Number(row.Price);
    if (!Number.isFinite(price) || price < 0) errors.push(`invalid Price "${row.Price}" (must be a non-negative number)`);
  }
  if (row['Sale Price']) {
    const salePrice = Number(row['Sale Price']);
    const price = Number(row.Price);
    if (!Number.isFinite(salePrice) || salePrice < 0) {
      errors.push(`invalid Sale Price "${row['Sale Price']}" (must be a non-negative number)`);
    } else if (Number.isFinite(price) && salePrice > price) {
      warnings.push(`Sale Price (${salePrice}) is higher than Price (${price}) — check this is intentional`);
    }
  }

  // ── Inventory ────────────────────────────────────────────────────────────
  if (row.Inventory) {
    const qty = Number(row.Inventory);
    if (!Number.isInteger(qty) || qty < 0) errors.push(`invalid Inventory "${row.Inventory}" (must be a non-negative integer)`);
  }

  // ── SKU / Slug duplicates (within this file) ────────────────────────────
  if (row.SKU) {
    if (ctx.seenSkus.has(row.SKU)) errors.push(`duplicate SKU "${row.SKU}" (also used by an earlier row in this file)`);
    else ctx.seenSkus.add(row.SKU);
    if (ctx.existingSkus && ctx.existingSkus.has(row.SKU)) errors.push(`SKU "${row.SKU}" already exists in the store`);
  }
  const slug = row.Slug || undefined;
  if (slug) {
    if (ctx.seenSlugs.has(slug)) errors.push(`duplicate Slug "${slug}" (also used by an earlier row in this file)`);
    else ctx.seenSlugs.add(slug);
    if (ctx.existingSlugs && ctx.existingSlugs.has(slug)) errors.push(`Slug "${slug}" already exists in the store`);
  }

  // ── Category / Department ───────────────────────────────────────────────
  if (row.Category) {
    if (ctx.categoriesBySlug) {
      const category = ctx.categoriesBySlug.get(row.Category);
      if (!category) {
        errors.push(`unknown Category "${row.Category}" — no matching category slug in the store`);
      } else if (row.Department && category.departmentName) {
        if (category.departmentName.toLowerCase() !== row.Department.trim().toLowerCase()) {
          warnings.push(
            `Department "${row.Department}" does not match the department "${category.departmentName}" that Category "${row.Category}" actually belongs to`
          );
        }
      }
    } else {
      warnings.push('Category could not be verified against the store (no live category data available)');
    }
  }

  // ── Condition (optional, but if present must be a real enum value). Status is
  // informational/merchandising text, not a condition enum — intentionally not
  // validated against VALID_CONDITIONS; see docs/CSV_SPEC.md. ──────────────
  if (row.Condition && !VALID_CONDITIONS.has(row.Condition.trim())) {
    warnings.push(`Condition "${row.Condition}" is not one of: ${[...VALID_CONDITIONS].join(', ')} — will be omitted`);
  }

  // ── Images ───────────────────────────────────────────────────────────────
  const images = splitList(row.Images);
  if (!images.length) {
    warnings.push('no Images provided — product will show the placeholder monogram until photos are added');
  } else {
    for (const ref of images) {
      const err = checkImageRef(ref, opts.imageBaseDir);
      if (err) errors.push(`Images: ${err}`);
    }
  }

  // ── SEO ──────────────────────────────────────────────────────────────────
  if (row['SEO Title'] && row['SEO Title'].length > 70) {
    warnings.push(`SEO Title is ${row['SEO Title'].length} characters — search engines typically truncate past ~60-70`);
  }
  if (row['SEO Description'] && row['SEO Description'].length > 160) {
    warnings.push(`SEO Description is ${row['SEO Description'].length} characters — typically truncated past ~155-160`);
  }

  return { errors, warnings };
}

/**
 * Validates every row, tracking in-file duplicate SKUs/slugs as it goes.
 * @param {Array<Record<string,string>>} rows
 * @param {ValidationContext} ctx
 * @param {{imageBaseDir?: string}} [opts]
 * @returns {Array<{lineNumber: number, row: Record<string,string>, errors: string[], warnings: string[]}>}
 */
function validateRows(rows, ctx, opts = {}) {
  return rows.map((row, i) => {
    const { errors, warnings } = validateRow(row, ctx, opts);
    return { lineNumber: i + 2, row, errors, warnings }; // +1 header, +1 1-indexed
  });
}

/** @returns {ValidationContext} a fresh, empty (offline) validation context */
function createContext() {
  return { seenSkus: new Set(), seenSlugs: new Set(), categoriesBySlug: null, existingSkus: null, existingSlugs: null };
}

module.exports = { REQUIRED_COLUMNS, VALID_CONDITIONS, validateRow, validateRows, createContext, checkImageRef, isPlausibleUrl };
