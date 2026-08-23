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
  'Child Custody': ['sofia-almeida', 'rajesh-iyer', 'eleanor-whitfield', 'aman-thakur'],
  'Leasing': ['daniel-okafor', 'priya-nair', 'waki-malik'],
  'Trademarks': ['marcus-hale', 'eira-mishra', 'waki-malik'],
  'Contracts': ['elena-rossi', 'marcus-hale', 'priya-menon', 'maria-harizanova', 'waki-malik'],
  'DUI Defense': ['aisha-rahman', 'daniel-okafor'],
  // Deliberately NOT mapped: 'Visas' (work-visa/immigration law) -- no one on
  // the current 24-person roster has immigration expertise on file. Forcing a
  // match here would be exactly the fabricated-credential problem this whole
  // script exists to avoid, so that category is left to skip rather than
  // guess. Add a real mapping once an immigration-qualified contributor exists.
};

// 'Legal Guides' is a catch-all category holding many unrelated real topics
// (confirmed by reading each article's actual title/excerpt, not guessed
// from the category label) -- a single category-wide author rule would be
// wrong for most of them, so every one is assigned individually by article
// id instead of by category. Several are India-specific consumer/civic-law
// pieces (RTI, GST, cheque-bounce, FIR) matched to the two India-focused
// specialists already on the roster (Ritwika Sharma, Hemangi Bhuva) rather
// than forced onto a generalist whose real expertise doesn't cover them.
const ARTICLE_ID_OVERRIDES = {
  'a3662f0d-ebd9-4745-bf43-0b8a2ea4aced': 'aisha-rahman',     // Understanding Bail in India -- Criminal Law
  'b44e10fd-365d-4910-acc7-81e5672cf4ae': 'daniel-okafor',    // Tenant Rights in India -- Property & Real Estate
  'cc1c5d70-7e79-4814-ab9e-4efba32567ff': 'priya-nair',       // Property Registration in India -- Property & Real Estate
  'e8b08e17-c166-4b41-a400-d333e2198062': 'marcus-whitfield', // What Is a Legal Notice -- Dispute Resolution
  'f6c75fe5-8659-41c2-a885-c329a95e03ba': 'marcus-hale',      // How to Report Cybercrime in India -- Technology & IP
  '109514ac-0333-4610-ba29-4e3db61607a4': 'deepak-kumar-kuldeep', // How to Choose the Right Lawyer -- same generic-legal-help desk as "Do I Need a Lawyer?" etc.
  '2223e62e-d85a-4fb4-880a-8f14d462dc00': 'rajesh-iyer',      // How to Draft a Will in India -- Family & Personal
  '28e6f8ad-ca12-4bff-8f95-0db23c4f971c': 'marcus-whitfield', // Consumer Rights in India -- Dispute Resolution
  '2a7f931a-9dd5-4501-8696-3b23cb9da19a': 'eleanor-whitfield', // The Divorce Process in India -- Family & Personal
  '3bd98ccd-13c9-4761-928c-ef5279f66a45': 'maria-harizanova', // Employee Rights in India -- Employment & Labor
  '47e0098d-5336-40df-940d-f1afb6e4a005': 'ritwika-sharma',   // RTI Act: How to File an RTI Application -- Indian constitutional/administrative law
  '59446f8c-3a01-47d8-a8d4-de075a5285f0': 'hemangi-bhuva',    // GST Basics for Small Businesses -- Indian GST specialist
  '5c5a6417-74c6-4ae4-ad7b-aa6ad012b624': 'aisha-rahman',     // How to File an FIR in India -- Criminal Law
  '6a2f3d44-3b3c-4e96-b053-4d369d99ea95': 'daniel-okafor',    // Cheque Bounce (Section 138) -- Criminal Law
  '83fa1818-db2f-4a24-bbfe-f801d2177735': 'eira-mishra',      // IP Rights: Trademark, Copyright & Patent -- Technology & IP
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

// The admin content-list endpoint (used by allPublished) returns only a raw
// categoryId per article, not a populated category object -- unlike the public
// delivery API. Resolve names by walking the admin category tree instead.
async function categoryIdToName() {
  const tree = await api('GET', `/cms/websites/${encodeURIComponent(SITE)}/categories`);
  const map = new Map();
  const walk = (nodes) => {
    for (const n of nodes ?? []) {
      map.set(n.id, n.name);
      walk(n.children);
    }
  };
  walk(tree?.data ?? []);
  return map;
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
  for (const slug of Object.values(ARTICLE_ID_OVERRIDES)) {
    if (!authorsBySlug.has(slug)) missingRosterSlugs.add(slug);
  }
  if (missingRosterSlugs.size) {
    throw new Error(`Roster slug(s) not found on /authors: ${[...missingRosterSlugs].join(', ')}`);
  }

  const catNameById = await categoryIdToName();
  const articles = await allPublished();
  console.log(`  found  : ${articles.length} published article(s)\n`);

  // Round-robin cursor per category, so repeat categories cycle through every
  // qualified author instead of always landing on the first match.
  const cursor = {};
  let changed = 0, skippedNoCategory = 0, skippedNoMapping = 0;

  for (const article of articles) {
    const categoryName = article.category?.name || catNameById.get(article.categoryId);

    let chosenSlug = ARTICLE_ID_OVERRIDES[article.id];
    if (!chosenSlug) {
      if (!categoryName) { skippedNoCategory++; continue; }
      const candidates = CATEGORY_TO_AUTHORS[categoryName];
      if (!candidates || candidates.length === 0) { skippedNoMapping++; console.log(`  ! no mapping for category "${categoryName}" (article ${article.id})`); continue; }
      const i = (cursor[categoryName] ?? 0) % candidates.length;
      cursor[categoryName] = i + 1;
      chosenSlug = candidates[i];
    }
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
