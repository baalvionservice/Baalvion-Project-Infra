'use strict';
/*
 * Deletes a single Imperialpedia article by slug:
 *   - bonds-how-they-work-and-how-to-invest (published 2026-07-14)
 *
 * USAGE
 *   node scripts/remove-imperialpedia-bonds-article.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/remove-imperialpedia-bonds-article.cjs
 *
 * AUTH : CMS_TOKEN = prod super_admin bearer from admin.baalvion.com (DevTools → any /cms/ request).
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff.
 */

const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';
const SLUGS_TO_REMOVE = ['bonds-how-they-work-and-how-to-invest'];

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const TOKEN = process.env.CMS_TOKEN || null;

async function api(method, urlPath, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`${TARGET_BASE.replace(/\/+$/, '')}${urlPath}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* */ }
  if (!res.ok) {
    const msg = (json && (json.error?.message || json.message)) || text || res.statusText;
    throw new Error(`${method} ${urlPath} → ${res.status} ${msg}`);
  }
  return json;
}

async function existingSlugMap() {
  const map = new Map();
  for (let page = 1; page <= 50; page++) {
    const res = await api('GET', `/cms/websites/${encodeURIComponent(SITE)}/content?page=${page}&limit=100`);
    const items = res?.data ?? [];
    items.forEach((it) => it.slug && map.set(it.slug, it.id));
    const pg = res?.pagination;
    if (!pg || !pg.hasNext || items.length === 0) break;
  }
  return map;
}

async function main() {
  console.log('Imperialpedia article removal');
  console.log(`  target : ${TARGET_BASE}`);
  console.log(`  site   : ${SITE}`);
  console.log(`  mode   : ${DRY_RUN ? 'DRY RUN' : 'DELETE'}`);
  console.log(`  slugs  : ${SLUGS_TO_REMOVE.join(', ')}\n`);

  if (!DRY_RUN && !TOKEN) throw new Error('No CMS_TOKEN set — provide a prod super_admin bearer to delete.');

  const existing = await existingSlugMap();
  for (const slug of SLUGS_TO_REMOVE) {
    const id = existing.get(slug);
    if (!id) { console.log(`  = not found (already gone?)  ${slug}`); continue; }
    if (DRY_RUN) { console.log(`  ~ would archive + delete  ${slug}  (${id})`); continue; }
    try {
      await api('POST', `/cms/websites/${encodeURIComponent(SITE)}/content/${id}/workflow/transition`, { action: 'archive' });
    } catch (e) { console.log(`    (archive step: ${e.message})`); }
    await api('DELETE', `/cms/websites/${encodeURIComponent(SITE)}/content/${id}`);
    console.log(`  ✓ archived + deleted  ${slug}  (${id})`);
  }
  console.log(DRY_RUN ? '\n(dry run — nothing was deleted)' : '\n✓ complete.');
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
