'use strict';
/*
 * Migrate CMS content from the LOCAL dev database into a TARGET cms-service
 * (production by default) via its authenticated management API.
 *
 * WHY: production RDS has the 4 sites registered but ZERO content, so the admin
 * console at admin.baalvion.com/cms/websites/<slug> shows nothing and the public
 * sites fall back to hardcoded content. The full content set lives only in the
 * local dev database. This script copies it up — slug-keyed and idempotent.
 *
 * Source  : local Postgres (cms schema) — READ ONLY.
 * Target  : cms-service management API (slug-addressed, auth required).
 *
 * The local IR slug is `ir.baalvion.com`; production registered it as
 * `baalvion-ir`, so the site map below remaps it. The other three slugs match.
 *
 * USAGE
 *   # 1. Export only — dumps JSON to the scratchpad, NO target creds needed:
 *   node scripts/migrate-content-local-to-prod.cjs --export
 *
 *   # 2. Dry run — shows exactly what WOULD be created on the target (needs a token):
 *   CMS_TOKEN=<prod-bearer> node scripts/migrate-content-local-to-prod.cjs --dry-run
 *
 *   # 3. Real migration:
 *   CMS_TOKEN=<prod-bearer> node scripts/migrate-content-local-to-prod.cjs
 *
 *   Limit to one site:  --site=imperialpedia
 *
 * AUTH (target): set CMS_TOKEN to a super_admin/owner/admin bearer token. Easiest
 * way to get one: log in to https://admin.baalvion.com, open DevTools → Network,
 * copy the `Authorization: Bearer ...` (or the access-token cookie value) from any
 * /cms/... request. Alternatively set SUPERADMIN_EMAIL + SUPERADMIN_PASSWORD +
 * AUTH_LOGIN_URL to log in programmatically.
 *
 * Idempotent: re-running skips categories and content that already exist on the
 * target (matched by slug). Safe to run repeatedly.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// ── config ───────────────────────────────────────────────────────────────────
const SITE_MAP = [
  { source: 'about-baalvion', target: 'about-baalvion' },
  { source: 'imperialpedia', target: 'imperialpedia' },
  { source: 'ir.baalvion.com', target: 'baalvion-ir' },
  { source: 'law-elite-network', target: 'law-elite-network' },
];

const SRC = {
  host: process.env.SRC_PG_HOST || '127.0.0.1',
  port: Number(process.env.SRC_PG_PORT || 5432),
  user: process.env.SRC_PG_USER || 'baalvion',
  password: process.env.SRC_PG_PASSWORD || 'baalvion_dev_pass',
  database: process.env.SRC_PG_DB || 'baalvion_db',
};

// Production CMS management base (gateway → cms-service → /api/v1). Endpoints are
// appended as `/cms/websites/<slug>/...`.
const TARGET_BASE = (process.env.TARGET_CMS_BASE
  || 'https://api.baalvion.com/api/v1/knowledge/cms/api/v1').replace(/\/+$/, '');

const ARGS = process.argv.slice(2);
const FLAG = (name) => ARGS.includes(`--${name}`);
const OPT = (name) => {
  const hit = ARGS.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : undefined;
};

const MODE_EXPORT_ONLY = FLAG('export');
const DRY_RUN = FLAG('dry-run');
const ONLY_SITE = OPT('site');
const OUT_DIR = process.env.OUT_DIR
  || path.join(process.env.TEMP || '/tmp', 'cms-migration');

let TOKEN = process.env.CMS_TOKEN || null;

// ── small utils ──────────────────────────────────────────────────────────────
const log = (...a) => console.log(...a);
const warn = (...a) => console.warn('  ⚠ ', ...a);

function isHttpUrl(s) {
  if (typeof s !== 'string' || !s) return false;
  try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch { return false; }
}

function safeSlug(s, fallback) {
  const base = String(s || fallback || 'item').toLowerCase().trim()
    .replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return base || `item-${Date.now()}`;
}

function clip(s, max) {
  if (typeof s !== 'string') return s;
  return s.length > max ? s.slice(0, max) : s;
}

// Coerce arbitrary local SEO json into the target's strict seoMetadata schema.
function sanitizeSeo(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  if (raw.title) out.title = clip(String(raw.title), 200);
  if (raw.description) out.description = clip(String(raw.description), 500);
  if (Array.isArray(raw.keywords)) out.keywords = raw.keywords.map(String).filter(Boolean);
  if (raw.ogTitle) out.ogTitle = clip(String(raw.ogTitle), 200);
  if (raw.ogDescription) out.ogDescription = clip(String(raw.ogDescription), 500);
  if (isHttpUrl(raw.ogImage)) out.ogImage = raw.ogImage;
  if (isHttpUrl(raw.canonicalUrl)) out.canonicalUrl = raw.canonicalUrl;
  if (typeof raw.noIndex === 'boolean') out.noIndex = raw.noIndex;
  if (typeof raw.noFollow === 'boolean') out.noFollow = raw.noFollow;
  return out;
}

// Ensure each content block matches the target schema (id/type/order/content).
const BLOCK_TYPES = new Set(['paragraph', 'heading', 'image', 'video', 'gallery', 'code',
  'quote', 'divider', 'html', 'callout', 'table', 'embed', 'button', 'columns']);
function sanitizeBlocks(raw, slug) {
  if (!Array.isArray(raw)) return [];
  return raw.map((b, i) => {
    const type = BLOCK_TYPES.has(b && b.type) ? b.type : 'paragraph';
    const content = b && typeof b.content === 'object' && b.content !== null ? b.content : {};
    return {
      id: String((b && b.id) || `${slug}-b${i}`),
      type,
      order: Number.isInteger(b && b.order) ? b.order : i,
      content,
    };
  });
}

// ── HTTP (target API) ────────────────────────────────────────────────────────
async function api(method, urlPath, body) {
  const url = `${TARGET_BASE}${urlPath}`;
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-json */ }
  if (!res.ok) {
    const msg = (json && (json.error?.message || json.message)) || text || res.statusText;
    const err = new Error(`${method} ${urlPath} → ${res.status} ${msg}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

async function loginIfNeeded() {
  if (TOKEN) return;
  const loginUrl = process.env.AUTH_LOGIN_URL;
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!loginUrl || !email || !password) {
    throw new Error('No CMS_TOKEN and no AUTH_LOGIN_URL/SUPERADMIN_EMAIL/SUPERADMIN_PASSWORD set. '
      + 'Provide CMS_TOKEN (a prod super_admin bearer) to write to the target.');
  }
  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const j = await res.json().catch(() => null);
  const tok = j && (j.data?.accessToken || j.accessToken || j.token);
  if (!res.ok || !tok) throw new Error(`Login failed (${res.status}). Could not obtain access token.`);
  TOKEN = tok;
  log('  ✓ logged in to target');
}

// ── read local DB ────────────────────────────────────────────────────────────
async function exportSite(client, sourceSlug) {
  const wq = await client.query(
    `SELECT id, slug FROM cms.cms_websites WHERE slug = $1`, [sourceSlug]);
  if (!wq.rows.length) { warn(`source website not found: ${sourceSlug}`); return null; }
  const websiteId = wq.rows[0].id;

  const cats = (await client.query(
    `SELECT c.id, c.slug, c.name, c.description, c.sort_order, c.depth, c.seo_metadata,
            p.slug AS parent_slug
     FROM cms.cms_categories c
     LEFT JOIN cms.cms_categories p ON p.id = c.parent_id
     WHERE c.website_id = $1
     ORDER BY c.depth ASC, c.sort_order ASC, c.name ASC`, [websiteId])).rows;

  const catSlugById = new Map(cats.map((c) => [c.id, c.slug]));

  const rows = (await client.query(
    `SELECT id, title, slug, excerpt, featured_image, content_type, content_blocks,
            seo_metadata, status, visibility, published_at, scheduled_at,
            custom_fields, category_id, category_ids
     FROM cms.cms_contents
     WHERE website_id = $1
     ORDER BY created_at ASC`, [websiteId])).rows;

  const contents = rows.map((r) => {
    const localCatIds = new Set();
    if (r.category_id) localCatIds.add(r.category_id);
    if (Array.isArray(r.category_ids)) r.category_ids.forEach((id) => id && localCatIds.add(id));
    const categorySlugs = [...localCatIds]
      .map((id) => catSlugById.get(id))
      .filter(Boolean);

    const slug = safeSlug(r.slug, r.title);
    const featuredImage = isHttpUrl(r.featured_image) ? r.featured_image : null;
    const customFields = (r.custom_fields && typeof r.custom_fields === 'object') ? { ...r.custom_fields } : {};
    if (r.featured_image && !featuredImage) customFields.originalFeaturedImage = r.featured_image;

    return {
      title: clip(r.title, 500),
      slug,
      excerpt: r.excerpt ? clip(r.excerpt, 2000) : null,
      featuredImage,
      contentType: r.content_type,
      contentBlocks: sanitizeBlocks(r.content_blocks, slug),
      seoMetadata: sanitizeSeo(r.seo_metadata),
      visibility: r.visibility || 'public',
      status: r.status,
      scheduledAt: r.scheduled_at ? new Date(r.scheduled_at).toISOString() : null,
      customFields,
      categorySlugs,
    };
  });

  return {
    sourceSlug,
    categories: cats.map((c) => ({
      slug: safeSlug(c.slug, c.name),
      name: clip(c.name, 200),
      description: c.description ? clip(c.description, 1000) : null,
      sortOrder: Number.isInteger(c.sort_order) ? c.sort_order : 0,
      depth: Number.isInteger(c.depth) ? c.depth : 0,
      parentSlug: c.parent_slug ? safeSlug(c.parent_slug) : null,
      seoMetadata: sanitizeSeo(c.seo_metadata),
    })),
    contents,
  };
}

// ── write to target API ──────────────────────────────────────────────────────
function flattenCategoryTree(payload) {
  // GET /categories returns a tree (top-level + nested `children`). Flatten to slug→id.
  const map = new Map();
  const walk = (nodes) => {
    if (!Array.isArray(nodes)) return;
    for (const n of nodes) {
      if (n && n.slug && n.id) map.set(n.slug, n.id);
      if (n && Array.isArray(n.children)) walk(n.children);
    }
  };
  walk(payload);
  return map;
}

async function importSite(site, data, report) {
  const target = site.target;
  log(`\n▶ ${site.source} → ${target}  (${data.contents.length} items, ${data.categories.length} categories)`);

  // Confirm the target website exists / is reachable.
  try {
    await api('GET', `/cms/websites/${encodeURIComponent(target)}`);
  } catch (e) {
    warn(`target website "${target}" not reachable (${e.message}). Skipping site.`);
    report.skippedSites.push(target);
    return;
  }

  // Categories: build slug→id, create the missing ones parent-first.
  const existingCats = await api('GET', `/cms/websites/${encodeURIComponent(target)}/categories`);
  const catId = flattenCategoryTree(existingCats?.data ?? existingCats);
  const byDepth = [...data.categories].sort((a, b) => a.depth - b.depth);
  for (const c of byDepth) {
    if (catId.has(c.slug)) continue;
    const body = {
      name: c.name, slug: c.slug, sortOrder: c.sortOrder,
      ...(c.description ? { description: c.description } : {}),
      ...(c.parentSlug && catId.has(c.parentSlug) ? { parentId: catId.get(c.parentSlug) } : {}),
      ...(c.seoMetadata && Object.keys(c.seoMetadata).length ? { seoMetadata: c.seoMetadata } : {}),
    };
    if (DRY_RUN) { log(`  + category ${c.slug}`); report.categories++; continue; }
    try {
      const created = await api('POST', `/cms/websites/${encodeURIComponent(target)}/categories`, body);
      const id = created?.data?.id ?? created?.id;
      if (id) catId.set(c.slug, id);
      report.categories++;
    } catch (e) { warn(`category ${c.slug}: ${e.message}`); report.errors++; }
  }

  // Existing content slugs (paginate) for idempotency.
  const existingSlugs = new Set();
  for (let page = 1; page <= 50; page++) {
    const res = await api('GET', `/cms/websites/${encodeURIComponent(target)}/content?page=${page}&limit=100`);
    const items = res?.data ?? [];
    items.forEach((it) => it.slug && existingSlugs.add(it.slug));
    const pg = res?.pagination;
    if (!pg || !pg.hasNext || items.length === 0) break;
  }

  // Content.
  for (const item of data.contents) {
    if (existingSlugs.has(item.slug)) { report.skipped++; continue; }
    const categoryIds = item.categorySlugs.map((s) => catId.get(s)).filter(Boolean);
    const body = {
      title: item.title,
      slug: item.slug,
      contentType: item.contentType,
      contentBlocks: item.contentBlocks,
      visibility: item.visibility,
      seoMetadata: item.seoMetadata,
      customFields: item.customFields,
      ...(item.excerpt ? { excerpt: item.excerpt } : {}),
      ...(item.featuredImage ? { featuredImage: item.featuredImage } : {}),
      ...(categoryIds.length ? { categoryIds } : {}),
    };

    if (DRY_RUN) {
      log(`  + ${item.status.padEnd(9)} ${item.contentType.padEnd(13)} ${item.slug}`);
      report.created++;
      continue;
    }

    try {
      const created = await api('POST', `/cms/websites/${encodeURIComponent(target)}/content`, body);
      const id = created?.data?.id ?? created?.id;
      report.created++;

      // Recreate the publish state. New content starts as draft.
      if (id && item.status === 'published') {
        await api('POST', `/cms/websites/${encodeURIComponent(target)}/content/${id}/workflow/transition`,
          { action: 'publish' });
        report.published++;
      } else if (id && item.status === 'scheduled' && item.scheduledAt) {
        try {
          await api('POST', `/cms/websites/${encodeURIComponent(target)}/content/${id}/workflow/transition`,
            { action: 'schedule', scheduledAt: item.scheduledAt });
          report.scheduled++;
        } catch (e) { warn(`schedule ${item.slug}: ${e.message} (left as draft)`); }
      }
    } catch (e) {
      warn(`content ${item.slug}: ${e.message}`);
      report.errors++;
    }
  }
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const sites = SITE_MAP.filter((s) => !ONLY_SITE || s.source === ONLY_SITE || s.target === ONLY_SITE);
  if (!sites.length) throw new Error(`--site=${ONLY_SITE} matched no configured site`);

  log(`CMS content migration`);
  log(`  source : postgres ${SRC.host}:${SRC.port}/${SRC.database}`);
  log(`  target : ${TARGET_BASE}`);
  log(`  mode   : ${MODE_EXPORT_ONLY ? 'EXPORT ONLY' : DRY_RUN ? 'DRY RUN' : 'LIVE IMPORT'}`);
  log(`  sites  : ${sites.map((s) => `${s.source}→${s.target}`).join(', ')}\n`);

  // 1. Export from local DB.
  const client = new Client(SRC);
  await client.connect();
  const exported = {};
  try {
    for (const s of sites) {
      const data = await exportSite(client, s.source);
      if (data) {
        exported[s.source] = data;
        log(`  exported ${s.source}: ${data.contents.length} items, ${data.categories.length} categories`);
      }
    }
  } finally {
    await client.end();
  }

  // Always write the export artifact for audit / out-of-band import.
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, 'cms-export-all.json');
  fs.writeFileSync(outFile, JSON.stringify(exported, null, 2));
  log(`\n  export written → ${outFile}`);

  if (MODE_EXPORT_ONLY) {
    log('\n✓ export-only complete (no target writes).');
    return;
  }

  // 2. Import to target.
  await loginIfNeeded();
  const report = { categories: 0, created: 0, published: 0, scheduled: 0, skipped: 0, errors: 0, skippedSites: [] };
  for (const s of sites) {
    const data = exported[s.source];
    if (data) await importSite(s, data, report);
  }

  log(`\n──────── ${DRY_RUN ? 'DRY RUN' : 'IMPORT'} SUMMARY ────────`);
  log(`  categories : ${report.categories}`);
  log(`  content    : ${report.created} created  (${report.published} published, ${report.scheduled} scheduled)`);
  log(`  skipped    : ${report.skipped} (already existed)`);
  log(`  errors     : ${report.errors}`);
  if (report.skippedSites.length) log(`  skipped sites: ${report.skippedSites.join(', ')}`);
  log(DRY_RUN ? '\n(dry run — nothing was written)' : '\n✓ migration complete.');
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
