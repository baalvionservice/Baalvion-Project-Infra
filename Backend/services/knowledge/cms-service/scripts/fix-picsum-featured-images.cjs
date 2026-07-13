'use strict';
/*
 * One-off cleanup: clears the featuredImage field on any content row still
 * carrying a picsum.photos placeholder URL (seeded before cms-service's
 * "always generate real artwork" policy was enforced). Clearing it (rather
 * than leaving the dead external URL) makes the public delivery API's
 * safeImageUrl() fallback render the site's own generated SVG artwork
 * instead, matching every other article on the site.
 *
 * USAGE
 *   CMS_TOKEN=<bearer> node scripts/fix-picsum-featured-images.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/fix-picsum-featured-images.cjs
 *   ... --website=<slug>       # defaults to imperialpedia
 *
 * AUTH: CMS_TOKEN = prod super_admin bearer from admin.baalvion.com (DevTools -> any /cms/ request).
 * BASE: defaults to the prod management ingress; override with TARGET_CMS_BASE.
 */

const ARGS = process.argv.slice(2);
const FLAG = (n) => ARGS.includes(`--${n}`);
const OPT = (n) => { const h = ARGS.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=').slice(1).join('=') : undefined; };
const DRY_RUN = FLAG('dry-run');

const TOKEN = process.env.CMS_TOKEN;
const BASE = (process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1').replace(/\/+$/, '');
const SITE = OPT('website') || process.env.WEBSITE_SLUG || 'imperialpedia';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, urlPath, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`${BASE}${urlPath}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* */ }
  if (!res.ok) {
    const msg = (json && (json.error?.message || json.message)) || text || res.statusText;
    throw new Error(`${method} ${urlPath} -> ${res.status} ${msg}`);
  }
  return json;
}

async function findWebsiteId() {
  const res = await fetch(`https://api.baalvion.com/api/v1/public/${encodeURIComponent(SITE)}`);
  const json = await res.json();
  if (!json?.data?.id) throw new Error(`Could not resolve websiteId for site "${SITE}"`);
  return json.data.id;
}

async function listAllContent(websiteId) {
  const items = [];
  for (let page = 1; page <= 100; page++) {
    const res = await api('GET', `/cms/websites/${encodeURIComponent(websiteId)}/content?page=${page}&limit=100`);
    const pageItems = res?.data ?? [];
    items.push(...pageItems);
    const pg = res?.pagination;
    if (!pg || !pg.hasNext || pageItems.length === 0) break;
  }
  return items;
}

async function main() {
  if (!TOKEN) throw new Error('No CMS_TOKEN set — provide a prod super_admin bearer to write (see file header for how).');

  const websiteId = await findWebsiteId();
  console.log(`Site: ${SITE} (${websiteId})`);
  console.log('Fetching all content…');
  const all = await listAllContent(websiteId);
  const tainted = all.filter((c) => typeof c.featuredImage === 'string' && c.featuredImage.includes('picsum.photos'));

  console.log(`Found ${all.length} content rows, ${tainted.length} with a picsum.photos featuredImage.`);
  if (tainted.length === 0) return;

  for (const item of tainted) {
    console.log(`  - ${item.slug}  (${item.contentType})  ${item.featuredImage}`);
  }

  if (DRY_RUN) {
    console.log('\n--dry-run: no changes written.');
    return;
  }

  let cleared = 0;
  for (const item of tainted) {
    try {
      await api('PATCH', `/cms/websites/${encodeURIComponent(websiteId)}/content/${item.id}`, { featuredImage: null });
      cleared++;
      console.log(`  ✓ cleared  ${item.slug}`);
    } catch (err) {
      console.error(`  ✗ failed   ${item.slug}: ${err.message}`);
    }
    await sleep(300);
  }
  console.log(`\nDone. Cleared ${cleared}/${tainted.length}.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
