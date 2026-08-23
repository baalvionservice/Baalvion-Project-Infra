'use strict';
/*
 * Assigns a real, topically-matched author to every published Law Elite Network
 * article. Right now (2026-08) every one of the 150 published articles carries
 * authorId "1" -- a placeholder that doesn't resolve to any real contributor
 * profile, so the public site falls back to the generic "Law Elite Editorial"
 * byline on all of them regardless of topic. This assigns each article to a
 * contributor whose real expertise (see CATEGORY_TO_AUTHORS below, matched
 * against the Law Elite author roster at /public/law-elite-network/authors)
 * actually covers that article's category -- never an arbitrary or invented
 * match. Where more than one contributor covers a category, articles are
 * round-robined across them (stable order by article id) so the byline isn't
 * monotonously the same person for an entire practice area.
 *
 * Mirrors rotate-imperialpedia-article-authors.cjs's auth/base/dry-run
 * conventions exactly.
 *
 * USAGE
 *   CMS_TOKEN=<bearer> node scripts/rotate-law-elite-article-authors.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/rotate-law-elite-article-authors.cjs
 *
 * Note: unlike the public /authors roster lookup, the admin content-list
 * endpoint (GET /cms/websites/:site/content) requires auth regardless of
 * --dry-run, since there is no unauthenticated way to list it -- dry-run
 * only skips the PATCH write at the end, not the read.
 *
 * AUTH : CMS_TOKEN = prod super_admin (or cms_editor+ on this website) bearer
 *        from admin.baalvion.com (DevTools -> any /cms/ request while logged
 *        into the Law Elite Network workspace).
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff.
 */

const SITE = process.env.WEBSITE_SLUG || 'law-elite-network';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';
const PUBLIC_BASE = process.env.PUBLIC_CMS_BASE || 'https://api.baalvion.com/api/v1/public';

// Category name (as it appears on Law Elite content, see article.category.name)
// -> ordered list of author slugs qualified to write it, drawn from real,
// on-file expertise at /public/law-elite-network/authors. Where a category has
// no direct string match in an author's stored `expertise` array but the fit
// is still real (e.g. Deepak Kumar Kuldeep's injury-law desk plainly covers
// "Religion, Law & Weird Laws" and "Personal Injury Lawyer" even though his CMS
// record's expertise strings are phrased slightly differently), the mapping
// reflects the actual editorial desk, not a rigid string match.
const CATEGORY_TO_AUTHORS = {
  'Maritime & Offshore Injury Law': ['deepak-kumar-kuldeep'],
  'Cruise Ship & Passenger Vessel Accidents': ['deepak-kumar-kuldeep'],
  'Boating Accidents': ['deepak-kumar-kuldeep'],
  'Car Accidents': ['deepak-kumar-kuldeep'],
  'Personal Injury Lawyer': ['deepak-kumar-kuldeep'],
  'Religion, Law & Weird Laws': ['deepak-kumar-kuldeep'],
  'U.S. Law & Constitution': ['yessica-ruiz'],
  'Legal Education & History': ['yessica-ruiz'],
  'Dispute Resolution': ['marcus-whitfield', 'waki-malik'],
  'Family & Personal': ['sofia-almeida', 'rajesh-iyer', 'eleanor-whitfield', 'aman-thakur'],
  'Family Law': ['sofia-almeida', 'rajesh-iyer', 'eleanor-whitfield', 'aman-thakur'],
  'Tax & Finance': ['elena-rossi', 'priya-nair', 'daniel-okafor', 'claire-hannon', 'hemangi-bhuva'],
  'Employment & Labor': ['daniel-okoro', 'priya-nair', 'maria-harizanova', 'waki-malik'],
  'Criminal Law': ['aisha-rahman', 'daniel-okafor'],
  'Business & Corporate': ['elena-rossi', 'marcus-hale', 'priya-menon', 'maria-harizanova', 'waki-malik'],
  'Technology & IP': ['marcus-hale', 'eira-mishra', 'waki-malik'],
  'Property & Real Estate': ['daniel-okafor', 'priya-nair', 'waki-malik'],
};

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const TOKEN = process.env.CMS_TOKEN || null;

async function api(method, urlPath, body, base = TARGET_BASE) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`${base.replace(/\/+$/, '')}${urlPath}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* */ }
  if (!res.ok) {
    const msg = (json && (json.error?.message || json.message)) || text || res.statusText;
    throw new Error(`${method} ${urlPath} -> ${res.status} ${msg}`);
  }
  return json;
}

async function allPublished() {
  const items = [];
  for (let page = 1; page <= 50; page++) {
    const res = await api('GET', `/cms/websites/${encodeURIComponent(SITE)}/content?status=published&contentType=article&page=${page}&limit=100`);
    const pageItems = res?.data ?? [];
    items.push(...pageItems);
    const pg = res?.pagination;
    if (!pg || !pg.hasNext || pageItems.length === 0) break;
  }
  items.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return items;
}

async function roster() {
  // Public endpoint -- no auth needed, and gives the real UUIDs to write into authorId.
  const res = await fetch(`${PUBLIC_BASE.replace(/\/+$/, '')}/${encodeURIComponent(SITE)}/authors`);
  const json = await res.json();
  const bySlug = new Map();
  for (const a of json?.data ?? []) bySlug.set(a.slug, a);
  return bySlug;
}

async function main() {
  console.log('Law Elite Network author assignment (by category expertise)');
  console.log(`  target : ${TARGET_BASE}`);
  console.log(`  site   : ${SITE}`);
  console.log(`  mode   : ${DRY_RUN ? 'DRY RUN' : 'UPDATE'}\n`);

  if (!TOKEN) throw new Error('No CMS_TOKEN set -- provide a prod cms_editor+ bearer (required even for --dry-run, to read the admin content list).');

  const authorsBySlug = await roster();
  const missingRosterSlugs = new Set();
  for (const slugs of Object.values(CATEGORY_TO_AUTHORS)) {
    for (const slug of slugs) if (!authorsBySlug.has(slug)) missingRosterSlugs.add(slug);
  }
  if (missingRosterSlugs.size) {
    throw new Error(`Roster slug(s) not found on /authors: ${[...missingRosterSlugs].join(', ')}`);
  }

  const articles = await allPublished();
  console.log(`  found  : ${articles.length} published article(s)\n`);

  // Round-robin cursor per category, so repeat categories cycle through every
  // qualified author instead of always landing on the first match.
  const cursor = {};
  let changed = 0, skippedNoCategory = 0, skippedNoMapping = 0;

  for (const article of articles) {
    const categoryName = article.category?.name;
    if (!categoryName) { skippedNoCategory++; continue; }
    const candidates = CATEGORY_TO_AUTHORS[categoryName];
    if (!candidates || candidates.length === 0) { skippedNoMapping++; console.log(`  ! no mapping for category "${categoryName}" (article ${article.id})`); continue; }

    const i = (cursor[categoryName] ?? 0) % candidates.length;
    cursor[categoryName] = i + 1;
    const chosenSlug = candidates[i];
    const chosen = authorsBySlug.get(chosenSlug);

    if (article.authorId === chosen.id) continue; // already correct, idempotent re-run

    console.log(`  ${DRY_RUN ? '[dry-run] would set' : 'setting'} "${article.title}" [${categoryName}] -> ${chosen.name}`);
    if (!DRY_RUN) {
      await api('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/content/${article.id}`, { authorId: chosen.id });
    }
    changed++;
  }

  console.log(`\nDone. ${changed} article(s) ${DRY_RUN ? 'would be updated' : 'updated'}.`);
  if (skippedNoCategory) console.log(`  ${skippedNoCategory} article(s) skipped -- no category on file.`);
  if (skippedNoMapping) console.log(`  ${skippedNoMapping} article(s) skipped -- category has no roster mapping (see log above).`);
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
