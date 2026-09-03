'use strict';
/**
 * AdSense-readiness retirement (Law Elite Network): archives every published
 * article whose category is one of the 11 practice areas retired from the
 * live site (see Frontend/Law-Elite-Network-main/src/lib/category-slugs.ts's
 * CURRENT_CATEGORY_SLUGS comment) or one of 2 orphan CMS categories that were
 * never a real category-page route to begin with, and separately deactivates
 * the 80 international author profiles whose bios carry the fabricated
 * "[Name] Has published 20 articles for Law Elite Network" claim that
 * triggered the AdSense rejection in the first place.
 *
 * The frontend retirement (category-slugs.ts shrink + next.config.ts 301s +
 * sitemap/nav/feed filters) already stops the live site from linking or
 * submitting this content to Google. This script is the CMS-side follow-up:
 * once run, /article/{slug} for a retired-category article and each
 * deactivated author's public profile actually stop resolving/showing the
 * fabricated bio, closing the gap the frontend-only fix can't close on its
 * own. NOT run as part of this pass -- prep only, for whoever has a
 * production CMS_TOKEN.
 *
 * MECHANISM (verified against real schema/routes, not guessed):
 *   - Content has no directly-PATCHable `status` field (see
 *     validators/contentSchemas.js -- updateContentSchema has no `status`
 *     key). Status only moves through service/workflowService.js's state
 *     machine via POST .../content/:id/workflow/transition {action}. The
 *     'archive' action accepts content in
 *     ['published','draft','changes_requested','approved','scheduled','compliance_review']
 *     and requires role level >= 80 (cms_editor+, or a platform
 *     super_admin/owner/admin bearer, which is what CMS_TOKEN should be).
 *     'archived' itself is NOT a valid `from` state for 'archive' -- so this
 *     script checks each item's current status first and skips it if it's
 *     already 'archived', rather than re-issuing a transition that would 400.
 *   - CmsAuthor.status is a plain ENUM('active','inactive') directly
 *     PATCHable via PATCH .../authors/:authorId {status} -- same call
 *     seedLawEliteInternationalAuthors.cjs already makes for these same 80
 *     profiles (it seeds them 'inactive'; this script is a standalone way to
 *     re-apply that, or to flip real, later-activated ones back off, without
 *     re-running the full seed).
 *   - The admin content-list endpoint (GET .../content) does not resolve
 *     categoryId to a slug (that resolution only happens in the public
 *     delivery API) -- this script fetches GET .../categories separately and
 *     flattens its parent/child tree into an id->slug map to do that
 *     matching itself.
 *
 * USAGE
 *   # Preview what would be archived, no network writes:
 *   node scripts/archive-law-elite-retired-categories.cjs --dry-run
 *
 *   # Local dev CMS (login flow):
 *   AUTH_URL=http://localhost:3001/v1/auth CMS_URL=http://localhost:3011/api/v1 \
 *   SUPERADMIN_EMAIL=superadmin@baalvion.com SUPERADMIN_PASSWORD=*** \
 *   node scripts/archive-law-elite-retired-categories.cjs
 *
 *   # Production (bearer token, e.g. copied from a DevTools /cms/ request
 *   # while logged into admin.baalvion.com as super_admin):
 *   TARGET_CMS_BASE=https://admin.baalvion.com/api-bff/knowledge/cms/api/v1 \
 *   CMS_TOKEN=<bearer> node scripts/archive-law-elite-retired-categories.cjs
 *
 *   # Stopgap: pull the fabricated "Has published 20 articles..." bios off
 *   # the public site immediately by deactivating all 80 international
 *   # authors, independent of whether/when the bio text itself gets fixed:
 *   CMS_TOKEN=<bearer> node scripts/archive-law-elite-retired-categories.cjs --deactivate-authors [--dry-run]
 *
 * Idempotent / safe to re-run in either mode: an already-archived article or
 * already-inactive author is reported and skipped, never re-transitioned.
 * Does NOT execute anything against production on its own -- this file is
 * prep only.
 */

const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS = process.env.CMS_URL || 'http://localhost:3011/api/v1';
const TARGET_CMS_BASE = process.env.TARGET_CMS_BASE || null;
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW = process.env.SUPERADMIN_PASSWORD;
const CMS_TOKEN = process.env.CMS_TOKEN || null;
const SITE = process.env.WEBSITE_SLUG || 'law-elite-network';

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const DEACTIVATE_AUTHORS = ARGS.includes('--deactivate-authors');

const CMS_BASE = TARGET_CMS_BASE || CMS;
const BASE = `${CMS_BASE.replace(/\/+$/, '')}/cms/websites/${encodeURIComponent(SITE)}`;

/**
 * Old slug -> new slug, exact 6-entry copy of
 * Frontend/Law-Elite-Network-main/src/lib/category-slugs.ts's
 * CATEGORY_SLUG_RENAME -- hardcoded rather than imported since this is a
 * standalone Node script in a different package with no shared build step.
 * Keep the two in sync by hand if either ever changes.
 */
const CATEGORY_SLUG_RENAME = {
  'business-corporate': 'business',
  'family-personal': 'family-law',
  'property-real-estate': 'real-estate-law',
  'employment-labor': 'employment-law',
  'technology-ip': 'tech-ip',
  'dispute-resolution': 'disputes',
};
function toNewCategorySlug(oldSlug) {
  return CATEGORY_SLUG_RENAME[oldSlug] || oldSlug;
}

// The 11 categories retired from the live site (see category-slugs.ts's
// CURRENT_CATEGORY_SLUGS comment) plus the 2 orphan CMS categories that were
// never wired to a category-page route at all (legal-guides, 15 articles;
// immigration-law-visas, 1 article) -- both already only ever reachable via
// the /article/{slug} fallback, and treated as retired the same way.
const RETIRED_CATEGORY_SLUGS = new Set([
  'business',
  'criminal-law',
  'family-law',
  'real-estate-law',
  'tax-finance',
  'employment-law',
  'tech-ip',
  'disputes',
  'us-law-and-constitution',
  'religion-law-and-weird-laws',
  'legal-education-and-history',
  'legal-guides',
  'immigration-law-visas',
]);

// Same 80 slugs as scripts/seedLawEliteInternationalAuthors.cjs's RAW array
// (col 0 of each row there) -- kept as a flat list here since this script
// only ever needs the slug, not the full seed payload.
const INTERNATIONAL_AUTHOR_SLUGS = [
  'ari-b-blaut', 'mark-c-kanaly', 'edwin-e-smith', 'eric-dittmann', 'dennis-dunne',
  'richard-m-pachulski', 'jeffrey-ross', 'robin-l-cohen', 'keith-moskowitz', 'jeffrey-nagle',
  'edward-barnett', 'claire-wills', 'keith-syson', 'david-kendall', 'robert-buckley',
  'simon-clark', 'mark-shillito', 'anthea-christie', 'giles-pratt', 'kathleen-healy',
  'guy-alexander', 'tom-story', 'costas-condoleon', 'karen-evans-cullen', 'vijay-cugati',
  'christopher-blane', 'ross-mcinnes', 'colin-loveday', 'damian-grave', 'andrew-maynes',
  'steve-j-tenai', 'iris-antonios', 'alan-d-silva', 'angus-m-gunn-kc', 'stephen-drymer',
  'rachel-howie', 'craig-chiasson', 'robert-wisner', 'ari-n-kaplan', 'scott-kugler',
  'ajay-bahl', 'amar-gupta', 'rajendra-barot', 'rajat-taimni', 'ruby-singh-ahuja',
  'ritu-bhalla', 'saikrishna-rajagopal', 'aseem-chawla', 'rohit-jain', 'shailendra-bhandare',
  'sandy-foo', 'perry-yuen', 'terence-foo', 'andrew-m-lim', 'eng-leng-ng',
  'daryl-chew', 'lawrence-boo', 'daryll-ng', 'daniel-gaw', 'oommen-mathew',
  'pervez-akhtar', 'lynn-ammar', 'naji-hawayek', 'zeid-hanania', 'abeer-jarrar',
  'sherif-hikal', 'keith-hutchison', 'nicholas-sharratt', 'zarghona-fazal', 'hasan-el-shafiey',
  'norbert-rieger', 'rainer-traugott', 'stephan-waldhausen', 'christoph-seibt', 'sonja-ruttmann',
  'annika-clauss', 'stephanie-hundertmark', 'dirk-besse', 'constantin-lauterwein', 'markus-adick',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function req(method, url, token, body, attempts = 5) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await r.json().catch(() => ({}));
      if (r.status >= 500 && i < attempts - 1) { await sleep(400 * (i + 1)); continue; }
      return { status: r.status, data };
    } catch (e) {
      lastErr = e;
      await sleep(400 * (i + 1));
    }
  }
  throw lastErr || new Error('request failed after retries');
}

async function getToken() {
  if (CMS_TOKEN) return CMS_TOKEN;
  if (!PW) throw new Error('Set CMS_TOKEN (prod bearer) or SUPERADMIN_PASSWORD (local login) — see script header for usage.');
  const login = await req('POST', `${AUTH}/login`, null, { email: EMAIL, password: PW });
  const token = login.data?.data?.accessToken;
  if (!token) throw new Error('login failed: ' + JSON.stringify(login.data).slice(0, 200));
  return token;
}

/** Flattens the parent/child category tree GET .../categories returns into a flat id -> slug map. */
function flattenCategoryTree(nodes, out = new Map()) {
  for (const node of nodes || []) {
    if (node?.id && node?.slug) out.set(node.id, node.slug);
    if (Array.isArray(node.children) && node.children.length) flattenCategoryTree(node.children, out);
  }
  return out;
}

/** Pages through GET .../content?contentType=article&status=published, same loop shape as remove-imperialpedia-offtopic-content.cjs's existingSlugMap(). */
async function listPublishedArticles(token) {
  const items = [];
  for (let page = 1; page <= 50; page++) {
    const res = await req('GET', `${BASE}/content?contentType=article&status=published&page=${page}&limit=100`, token);
    if (res.status !== 200) throw new Error(`content list page ${page} -> ${res.status} ${JSON.stringify(res.data).slice(0, 200)}`);
    const pageItems = res.data?.data ?? [];
    items.push(...pageItems);
    const pg = res.data?.pagination;
    if (!pg || !pg.hasNext || pageItems.length === 0) break;
  }
  return items;
}

async function archiveArticles(token) {
  const [articles, categoriesTree] = await Promise.all([
    listPublishedArticles(token),
    req('GET', `${BASE}/categories`, token).then((r) => {
      if (r.status !== 200) throw new Error(`categories list -> ${r.status} ${JSON.stringify(r.data).slice(0, 200)}`);
      return r.data?.data ?? [];
    }),
  ]);
  const categorySlugById = flattenCategoryTree(categoriesTree);

  const toArchive = articles.filter((a) => {
    const rawSlug = a.categoryId ? categorySlugById.get(a.categoryId) : null;
    if (!rawSlug) return false; // uncategorized -- never one of the retired categories, leave alone
    return RETIRED_CATEGORY_SLUGS.has(toNewCategorySlug(rawSlug));
  });

  console.log(JSON.stringify({
    mode: 'archive-articles',
    dryRun: DRY_RUN,
    site: SITE,
    base: BASE,
    totalPublishedArticles: articles.length,
    matchedForArchive: toArchive.length,
  }, null, 2));

  if (DRY_RUN) {
    console.log(JSON.stringify({
      wouldArchive: toArchive.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        categorySlug: toNewCategorySlug(categorySlugById.get(a.categoryId) || ''),
      })),
    }, null, 2));
    return;
  }

  let archived = 0, alreadyArchived = 0, failed = 0;
  for (const a of toArchive) {
    // Re-check current status immediately before transitioning -- 'archive'
    // is not a valid transition FROM 'archived' (see workflowService.js's
    // TRANSITIONS table), so a stale/duplicate list result or a second run
    // must not blindly re-issue it.
    const current = await req('GET', `${BASE}/content/${a.id}`, token);
    const currentStatus = current.data?.data?.status;
    if (currentStatus === 'archived') { alreadyArchived++; continue; }
    const res = await req('POST', `${BASE}/content/${a.id}/workflow/transition`, token, { action: 'archive' });
    if (res.status === 200) {
      archived++;
    } else {
      failed++;
      console.error(`archive ${a.slug} (${a.id}) -> ${res.status}`, JSON.stringify(res.data).slice(0, 300));
    }
    await sleep(150);
  }

  console.log(JSON.stringify({ ok: true, mode: 'archive-articles', site: SITE, base: BASE, archived, alreadyArchived, failed, total: toArchive.length }, null, 2));
}

async function deactivateAuthors(token) {
  const existingRes = await req('GET', `${BASE}/authors`, token);
  if (existingRes.status !== 200) throw new Error(`authors list -> ${existingRes.status} ${JSON.stringify(existingRes.data).slice(0, 200)}`);
  const existingList = existingRes.data?.data || [];
  const bySlug = new Map(existingList.map((a) => [a.slug, a]));

  const targets = INTERNATIONAL_AUTHOR_SLUGS
    .map((slug) => bySlug.get(slug))
    .filter(Boolean);
  const missing = INTERNATIONAL_AUTHOR_SLUGS.filter((slug) => !bySlug.has(slug));

  console.log(JSON.stringify({
    mode: 'deactivate-authors',
    dryRun: DRY_RUN,
    site: SITE,
    base: BASE,
    totalTargeted: INTERNATIONAL_AUTHOR_SLUGS.length,
    foundInCms: targets.length,
    missingFromCms: missing.length,
  }, null, 2));

  if (missing.length) console.log('missing slugs (never created, or already renamed/removed):', JSON.stringify(missing));

  if (DRY_RUN) {
    console.log(JSON.stringify({
      wouldDeactivate: targets
        .filter((a) => a.status !== 'inactive')
        .map((a) => ({ id: a.id, slug: a.slug, name: a.name, currentStatus: a.status })),
      alreadyInactive: targets.filter((a) => a.status === 'inactive').map((a) => a.slug),
    }, null, 2));
    return;
  }

  let deactivated = 0, alreadyInactive = 0, failed = 0;
  for (const a of targets) {
    if (a.status === 'inactive') { alreadyInactive++; continue; }
    const res = await req('PATCH', `${BASE}/authors/${a.id}`, token, { status: 'inactive' });
    if (res.status === 200) deactivated++;
    else { failed++; console.error(`deactivate ${a.slug} (${a.id}) -> ${res.status}`, JSON.stringify(res.data).slice(0, 300)); }
    await sleep(100);
  }

  console.log(JSON.stringify({ ok: true, mode: 'deactivate-authors', site: SITE, base: BASE, deactivated, alreadyInactive, failed, total: targets.length }, null, 2));
}

async function main() {
  if (DRY_RUN && !CMS_TOKEN && !PW) {
    // --dry-run still needs to READ real content/category/author data to
    // report something meaningful (unlike seedLawEliteInternationalAuthors.cjs's
    // dry-run, which only prints locally-known payloads) -- so it needs a
    // token/login the same as a real run, it just skips every write.
    throw new Error('Even --dry-run needs read access: set CMS_TOKEN or SUPERADMIN_PASSWORD — see script header for usage.');
  }
  const token = await getToken();
  if (DEACTIVATE_AUTHORS) await deactivateAuthors(token);
  else await archiveArticles(token);
}

main().catch((e) => { console.error('law elite retirement script failed:', e.message); process.exit(1); });
