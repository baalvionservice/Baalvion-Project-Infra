'use strict';

/**
 * @module _admin-client
 *
 * Shared HTTP client for the Amarisé product-import system. Wraps the REAL
 * commerce-service admin API (Backend/services/commerce/commerce-service) — every
 * endpoint used here is verified against that service's actual routes/validators,
 * nothing is invented:
 *
 *   POST   /commerce/stores/:storeId/products
 *   GET    /commerce/stores/:storeId/products
 *   POST   /commerce/stores/:storeId/products/:productId/publish
 *   POST   /commerce/stores/:storeId/products/:productId/media   (multipart, field "file")
 *   GET    /commerce/stores/:storeId/categories
 *   PATCH  /commerce/stores/:storeId/categories/:categoryId
 *   GET    /commerce/stores/:storeId/collections
 *   POST   /commerce/stores/:storeId/collections
 *   POST   /commerce/stores/:storeId/collections/:collectionId/products/:productId
 *
 * This module is not run directly — it's `require()`d by the runnable scripts
 * (import-products.cjs, validate-products.cjs, create-collections.cjs,
 * update-category-images.cjs).
 *
 * Configuration is entirely via environment variables (see ../.env.example):
 *   AUTH_URL              Auth service login endpoint base (…/v1/auth)
 *   COMMERCE_URL          Commerce service base, ending at /api/v1
 *   SUPERADMIN_EMAIL      Login identity used to call the admin API
 *   SUPERADMIN_PASSWORD   Password for SUPERADMIN_EMAIL (required, never hardcode)
 *   STORE_ID              Target commerce store's UUID
 *   IMPORT_MAX_RETRIES    Optional, default 3 — retry attempts for transient failures
 *   IMPORT_RETRY_DELAY_MS Optional, default 500 — base backoff delay (doubles each retry)
 */

const fs = require('node:fs/promises');
const path = require('node:path');

const AUTH_URL = process.env.AUTH_URL || 'http://localhost:4000/v1/auth';
const COMMERCE_URL = process.env.COMMERCE_URL || 'http://localhost:3012/api/v1';
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || '';
const STORE_ID = process.env.STORE_ID || '';
const MAX_RETRIES = Number(process.env.IMPORT_MAX_RETRIES ?? 3);
const RETRY_DELAY_MS = Number(process.env.IMPORT_RETRY_DELAY_MS ?? 500);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A network or server-side condition worth retrying: connection resets, timeouts,
 * and 5xx responses. Anything else (4xx validation errors, auth failures) is a real
 * problem with the request itself and retrying it would just fail identically.
 * @param {{status?: number}|Error} outcome
 * @returns {boolean}
 */
function isRetryable(outcome) {
  if (outcome instanceof Error) return true; // fetch threw: DNS/connection/timeout
  return typeof outcome.status === 'number' && outcome.status >= 500;
}

/**
 * Runs `fn` with exponential-backoff retry. `fn` must return `{ status, data }` on a
 * completed HTTP exchange (even for error status codes) or throw for transport failures.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{label?: string}} [opts]
 * @returns {Promise<T>}
 */
async function withRetry(fn, opts = {}) {
  const label = opts.label || 'request';
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) return result; // succeeded after a retry — still return normally
      if (!isRetryable(result)) return result;
      if (attempt === MAX_RETRIES) return result; // out of retries, hand back the failure
      lastErr = result;
    } catch (err) {
      lastErr = err;
      if (attempt === MAX_RETRIES) throw err;
    }
    const delay = RETRY_DELAY_MS * 2 ** attempt;
    console.warn(`  … ${label} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay}ms`);
    await sleep(delay);
  }
  // Unreachable in practice (every branch above returns or throws), kept for safety.
  throw lastErr;
}

/**
 * @param {'GET'|'POST'|'PATCH'|'DELETE'} method
 * @param {string} url
 * @param {string|null} token
 * @param {object} [body]
 * @returns {Promise<{status: number, data: any}>}
 */
async function req(method, url, token, body) {
  return withRetry(
    async () => {
      const r = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const data = await r.json().catch(() => ({}));
      return { status: r.status, data };
    },
    { label: `${method} ${url}` }
  );
}

const jget = (url, token) => req('GET', url, token);
const jpost = (url, token, body) => req('POST', url, token, body ?? {});
const jpatch = (url, token, body) => req('PATCH', url, token, body ?? {});
const jdelete = (url, token) => req('DELETE', url, token);

/**
 * Logs in as SUPERADMIN_EMAIL and returns a bearer access token.
 * @returns {Promise<string>}
 * @throws {Error} if SUPERADMIN_PASSWORD is unset or login fails
 */
async function login() {
  if (!SUPERADMIN_PASSWORD) {
    throw new Error(
      'SUPERADMIN_PASSWORD is required (set it in the environment — never commit it). ' +
        'See .env.example.'
    );
  }
  const res = await jpost(`${AUTH_URL}/login`, null, {
    email: SUPERADMIN_EMAIL,
    password: SUPERADMIN_PASSWORD,
  });
  const token =
    res.data?.data?.token || res.data?.data?.accessToken || res.data?.token || res.data?.accessToken;
  if (!token) {
    throw new Error(
      `Login failed (status ${res.status}). Check SUPERADMIN_EMAIL/SUPERADMIN_PASSWORD and AUTH_URL.`
    );
  }
  return token;
}

/**
 * @returns {string} the configured STORE_ID
 * @throws {Error} if STORE_ID is unset
 */
function requireStoreId() {
  if (!STORE_ID) {
    throw new Error(
      'STORE_ID is required — set it to the target commerce store UUID (see .env.example).'
    );
  }
  return STORE_ID;
}

/** @param {string} storeId @returns {string} */
function storeBase(storeId) {
  return `${COMMERCE_URL}/commerce/stores/${storeId}`;
}

/**
 * Flattens commerce-service's nested category tree (GET /categories returns
 * departments with a `children` array) into a single list.
 * @param {Array<object>} [nodes]
 * @returns {Array<object>}
 */
function flattenCategoryTree(nodes = []) {
  const out = [];
  for (const n of nodes) {
    out.push(n);
    if (Array.isArray(n.children) && n.children.length) out.push(...flattenCategoryTree(n.children));
  }
  return out;
}

/**
 * @param {string} storeId
 * @param {string} token
 * @returns {Promise<Map<string, object>>} category slug -> category row, each row
 *   enriched with `departmentName`/`departmentSlug` (the root category it belongs to;
 *   both equal the row's own name/slug for a root/department row itself)
 */
async function fetchCategoryBySlugMap(storeId, token) {
  const res = await jget(`${storeBase(storeId)}/categories`, token);
  if (res.status !== 200) {
    throw new Error(`Failed to load categories (status ${res.status}): ${JSON.stringify(res.data).slice(0, 200)}`);
  }
  const flat = flattenCategoryTree(res.data?.data || []);
  const byId = new Map(flat.map((c) => [c.id, c]));

  const departmentOf = (c) => {
    let node = c;
    while (node.parentId && byId.has(node.parentId)) node = byId.get(node.parentId);
    return node;
  };

  const enriched = flat.map((c) => {
    const dept = departmentOf(c);
    return { ...c, departmentName: dept.name, departmentSlug: dept.slug };
  });
  return new Map(enriched.map((c) => [c.slug, c]));
}

/**
 * @param {string} storeId
 * @param {string} token
 * @param {number} [limit]
 * @returns {Promise<Array<object>>} all products (up to `limit`)
 */
async function fetchAllProducts(storeId, token, limit = 500) {
  const res = await jget(`${storeBase(storeId)}/products?limit=${limit}`, token);
  if (res.status !== 200) {
    throw new Error(`Failed to load products (status ${res.status}): ${JSON.stringify(res.data).slice(0, 200)}`);
  }
  return res.data?.data || [];
}

/**
 * Resolves an image reference (local file path OR http(s) URL) to raw bytes + a
 * best-guess content type + filename, ready to attach to a multipart upload.
 * @param {string} imageRef
 * @returns {Promise<{bytes: Buffer, filename: string, contentType: string}>}
 */
async function resolveImageBytes(imageRef) {
  if (/^https?:\/\//i.test(imageRef)) {
    const r = await fetch(imageRef);
    if (!r.ok) throw new Error(`image fetch failed (HTTP ${r.status}): ${imageRef}`);
    const bytes = Buffer.from(await r.arrayBuffer());
    const contentType = r.headers.get('content-type') || 'image/jpeg';
    let filename;
    try {
      filename = path.basename(new URL(imageRef).pathname) || 'image.jpg';
    } catch {
      filename = 'image.jpg';
    }
    return { bytes, filename, contentType };
  }
  const bytes = await fs.readFile(imageRef);
  const filename = path.basename(imageRef);
  const ext = path.extname(imageRef).toLowerCase();
  const contentType =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
  return { bytes, filename, contentType };
}

/**
 * Uploads one product photo. Retries transient failures (image fetch + the upload
 * request itself are each retried independently by `withRetry`).
 * @param {string} storeId
 * @param {string} productId
 * @param {string} token
 * @param {string} imageRef local file path or http(s) URL
 * @param {{isFeatured?: boolean, altText?: string}} [opts]
 * @returns {Promise<{status: number, data: any}>}
 */
async function uploadProductMedia(storeId, productId, token, imageRef, opts = {}) {
  return withRetry(
    async () => {
      const { bytes, filename, contentType } = await resolveImageBytes(imageRef);
      const form = new FormData();
      form.append('file', new Blob([bytes], { type: contentType }), filename);
      form.append('mediaType', 'image');
      form.append('isFeatured', String(Boolean(opts.isFeatured)));
      if (opts.altText) form.append('altText', opts.altText);

      const r = await fetch(`${storeBase(storeId)}/products/${productId}/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await r.json().catch(() => ({}));
      return { status: r.status, data };
    },
    { label: `upload image ${imageRef}` }
  );
}

module.exports = {
  AUTH_URL,
  COMMERCE_URL,
  SUPERADMIN_EMAIL,
  STORE_ID,
  req,
  jget,
  jpost,
  jpatch,
  jdelete,
  login,
  requireStoreId,
  storeBase,
  flattenCategoryTree,
  fetchCategoryBySlugMap,
  fetchAllProducts,
  resolveImageBytes,
  uploadProductMedia,
  withRetry,
  isRetryable,
};
