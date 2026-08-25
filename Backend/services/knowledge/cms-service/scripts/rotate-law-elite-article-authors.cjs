'use strict';
/*
 * Assigns a real, topically-matched author to every published Law Elite Network
 * article. Right now (2026-08) every one of the 150 published articles shows
 * the generic "Law Elite Editorial" byline on the public site regardless of
 * topic. This assigns each article to a contributor whose real expertise (see
 * CATEGORY_TO_AUTHORS below, matched against the Law Elite author roster at
 * /public/law-elite-network/authors) actually covers that article's category
 * -- never an arbitrary or invented match. Where more than one contributor
 * covers a category, articles are round-robined across them (stable order by
 * article id) so the byline isn't monotonously the same person for an entire
 * practice area.
 *
 * IMPORTANT: the public byline is NOT driven by CmsContent.authorId -- that
 * column is a BIGINT reference to the platform *user* account that created
 * the row (every article here shows "1", the seeding superadmin), unrelated
 * to the CmsAuthor contributor-profile table. The frontend's toArticle()
 * (Frontend/Law-Elite-Network-main/src/lib/cms.ts) instead reads the byline
 * name from `customFields.author`, a plain string inside the content's JSON
 * customFields blob -- the same extension point ReviewerPanel/FactCheckerPanel
 * already use for reviewerSlug/factCheckerSlug/seriesSlug etc. Sequelize's
 * content.update() replaces that JSON column wholesale, not a deep merge, so
 * this script merges `author` onto each article's existing customFields
 * (already present on the list response -- listContent only excludes
 * contentBlocks) before writing, to avoid wiping out any reviewer/
 * fact-checker/series data already on file for that article.
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
 * only skips the per-article PATCH write at the end, not the initial read.
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
//
// 2026-08-25: the roster grew from 20 to 83 profiles with the addition of 63
// international "Legal Professional" contributors (real named practitioners
// at real firms, seeded by seedLawEliteInternationalAuthors.cjs and activated
// per site-owner decision). Each new name is folded into a category here only
// where their own `title`/`expertise` on /authors is a genuine, on-file match
// -- e.g. the 25 "Legal Professional — Mergers & Acquisitions" contributors
// into Business & Corporate, the 11 "— Arbitration" + 7 "— Commercial
// Litigation" contributors into Dispute Resolution. None of the 63 has any
// family-law, real-estate, or personal-injury/maritime expertise on file, so
// those categories are untouched -- still routed to the existing desk. Where
// a category now has more qualified candidates than articles (e.g. 30+
// dispute-resolution specialists for 14 articles), the round-robin below
// simply uses as many as there are articles -- it does not force every
// specialist onto a byline just to use their name.
const CATEGORY_TO_AUTHORS = {
  'Maritime & Offshore Injury Law': ['deepak-kumar-kuldeep'],
  'Cruise Ship & Passenger Vessel Accidents': ['deepak-kumar-kuldeep'],
  'Boating Accidents': ['deepak-kumar-kuldeep'],
  'Car Accidents': ['deepak-kumar-kuldeep'],
  'Personal Injury Lawyer': ['deepak-kumar-kuldeep'],
  'Religion, Law & Weird Laws': ['deepak-kumar-kuldeep'],
  'U.S. Law & Constitution': ['yessica-ruiz', 'ritwika-sharma'],
  'Legal Education & History': ['yessica-ruiz'],
  'Dispute Resolution': [
    'marcus-whitfield', 'waki-malik',
    // Arbitration desk
    'iris-antonios', 'angus-m-gunn-kc', 'stephen-drymer', 'rachel-howie', 'craig-chiasson',
    'robert-wisner', 'rajendra-barot', 'daryl-chew', 'lawrence-boo', 'daniel-gaw', 'nicholas-sharratt',
    // Commercial litigation desk
    'ross-mcinnes', 'damian-grave', 'steve-j-tenai', 'scott-kugler', 'amar-gupta', 'sherif-hikal', 'keith-hutchison',
    // Dispute resolution (explicit title)
    'rajat-taimni', 'ritu-bhalla', 'daryll-ng', 'oommen-mathew', 'zarghona-fazal',
    // Insurance, mediation, professional-negligence, constitutional/human-rights,
    // construction, and personal-injury/clinical-negligence disputes desks
    'robin-l-cohen', 'keith-moskowitz', 'ari-n-kaplan', 'alan-d-silva', 'ruby-singh-ahuja',
    'hasan-el-shafiey', 'colin-loveday',
  ],
  'Family & Personal': ['sofia-almeida', 'rajesh-iyer', 'eleanor-whitfield', 'aman-thakur'],
  'Family Law': ['sofia-almeida', 'rajesh-iyer', 'eleanor-whitfield', 'aman-thakur'],
  'Tax & Finance': [
    'elena-rossi', 'priya-nair', 'daniel-okafor', 'claire-hannon', 'hemangi-bhuva',
    // Banking & finance / financial-services-regulation desk
    'ari-b-blaut', 'edwin-e-smith', 'jeffrey-ross', 'jeffrey-nagle', 'andrew-maynes', 'mark-c-kanaly',
    // Tax desk
    'ajay-bahl', 'aseem-chawla', 'rohit-jain',
    // Insolvency & restructuring desk
    'dennis-dunne', 'richard-m-pachulski',
  ],
  'Employment & Labor': ['daniel-okoro', 'priya-nair', 'maria-harizanova', 'waki-malik', 'anthea-christie', 'kathleen-healy'],
  'Criminal Law': ['aisha-rahman', 'daniel-okafor', 'constantin-lauterwein', 'markus-adick'],
  'Business & Corporate': [
    'elena-rossi', 'marcus-hale', 'priya-menon', 'maria-harizanova', 'waki-malik',
    // Mergers & Acquisitions desk
    'edward-barnett', 'claire-wills', 'keith-syson', 'david-kendall', 'robert-buckley', 'guy-alexander',
    'tom-story', 'costas-condoleon', 'karen-evans-cullen', 'vijay-cugati', 'sandy-foo', 'perry-yuen',
    'terence-foo', 'andrew-m-lim', 'eng-leng-ng', 'lynn-ammar', 'naji-hawayek', 'zeid-hanania',
    'norbert-rieger', 'rainer-traugott', 'stephan-waldhausen', 'christoph-seibt', 'sonja-ruttmann',
    'annika-clauss', 'stephanie-hundertmark',
    // Corporate & commercial desk
    'christopher-blane', 'abeer-jarrar', 'dirk-besse',
  ],
  'Technology & IP': ['marcus-hale', 'eira-mishra', 'waki-malik', 'eric-dittmann', 'simon-clark', 'saikrishna-rajagopal', 'shailendra-bhandare', 'mark-shillito', 'giles-pratt'],
  'Property & Real Estate': ['daniel-okafor', 'priya-nair', 'waki-malik'],
  'Child Custody': ['sofia-almeida', 'rajesh-iyer', 'eleanor-whitfield', 'aman-thakur'],
  'Leasing': ['daniel-okafor', 'priya-nair', 'waki-malik'],
  'Trademarks': ['marcus-hale', 'eira-mishra', 'waki-malik', 'eric-dittmann', 'simon-clark', 'saikrishna-rajagopal', 'shailendra-bhandare'],
  'Contracts': ['elena-rossi', 'marcus-hale', 'priya-menon', 'maria-harizanova', 'waki-malik'],
  'DUI Defense': ['aisha-rahman', 'daniel-okafor'],
  // 'Visas' (work-visa/immigration law): no one on the roster has immigration
  // expertise on file -- explicitly confirmed with the site owner, who chose
  // to route it to the broadest-coverage generalist (Waki Malik already spans
  // 5 other practice areas) rather than leave it unassigned. Replace with a
  // real immigration-qualified contributor if one joins the roster.
  'Visas': ['waki-malik'],
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

// Six articles carry categoryId: null outright (confirmed via the admin content
// list, not the public delivery API's category resolution which can also hide
// a real-but-inactive category -- these are genuinely empty). All six were
// created within the same ~8 seconds on 2026-06-28T19:43 -- one bulk-seed run
// that never set a category for this batch, not an ongoing mystery. Each is
// assigned a real existing category based on its actual excerpt, not the
// title alone: [category name, author slug].
const UNCATEGORIZED_ARTICLE_FIXES = {
  '0ddac16a-24ab-4a4c-a545-15cfad441efc': ['Property & Real Estate', 'daniel-okafor'],  // Resolving Property Boundary Disputes
  '0fe363c2-4b17-4c14-90e1-2cd83a36b65e': ['Business & Corporate', 'waki-malik'],       // Corporate Compliance: A Practical Framework
  '38472413-192c-4173-a9eb-dc5508f0ce34': ['Dispute Resolution', 'marcus-whitfield'],   // Mediation: A Practical Guide
  '4d36e739-e7be-4f1c-92eb-334208b30356': ['Criminal Law', 'aisha-rahman'],             // White-Collar Investigations: What to Expect
  '8b31d2bf-3fce-4c88-927a-d2c97a5ca3ad': ['Family & Personal', 'aman-thakur'],         // Navigating the Divorce Process
  'e97a782f-8451-430e-bfa8-830d6781fd4b': ['Technology & IP', 'eira-mishra'],           // Patent Protection for Startups
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

// The original ~20 "desk" contributors (Deepak Kumar Kuldeep, Waki Malik, Elena
// Rossi, ...) were never created as `cms_authors` rows -- they live only in the
// frontend's bundled fallback (Frontend/Law-Elite-Network-main/src/data/authors.ts)
// and the live site's getMergedAuthors() unions that file with the CMS table (CMS
// wins by slug). The public /authors endpoint below is CMS-only, so without this
// fallback map roster() silently drops all 20 and the missing-roster-slug check
// throws. Name only -- that's all `chosen.name` needs (see main()).
const BUNDLED_AUTHOR_NAMES = {
  'elena-rossi': 'Elena Rossi',
  'marcus-hale': 'Marcus Hale',
  'priya-menon': 'Priya Menon',
  'sofia-almeida': 'Sofia Almeida',
  'rajesh-iyer': 'Rajesh Iyer',
  'eleanor-whitfield': 'Eleanor Whitfield',
  'priya-nair': 'Priya Nair',
  'daniel-okafor': 'Daniel Okafor',
  'daniel-okoro': 'Daniel Okoro',
  'aisha-rahman': 'Aisha Rahman',
  'marcus-whitfield': 'Marcus Whitfield',
  'deepak-kumar-kuldeep': 'Deepak Kumar Kuldeep',
  'waki-malik': 'Waki Malik',
  'aman-thakur': 'Aman Thakur',
  'maria-harizanova': 'Maria Harizanova',
  'claire-hannon': 'Claire Hannon',
  'yessica-ruiz': 'Yessica Ruiz',
  'abinesh-raj': 'Abinesh Raj',
  'aishwarya-gorak': 'Aishwarya Gorak',
  'diksha-singhal': 'Diksha Singhal',
  'anna-solovieva': 'Anna Solovieva',
};

async function roster() {
  // Public endpoint -- no auth needed. Gives the real display name written into
  // customFields.author (see file header) for each roster slug. CMS-managed
  // profiles win over the bundled fallback by slug, mirroring getMergedAuthors().
  const res = await fetch(`${PUBLIC_BASE.replace(/\/+$/, '')}/${encodeURIComponent(SITE)}/authors`);
  const json = await res.json();
  const bySlug = new Map();
  for (const [slug, name] of Object.entries(BUNDLED_AUTHOR_NAMES)) bySlug.set(slug, { slug, name });
  for (const a of json?.data ?? []) bySlug.set(a.slug, a);
  return bySlug;
}

// The admin content-list endpoint (used by allPublished) returns only a raw
// categoryId per article, not a populated category object -- unlike the public
// delivery API. Resolve names (both directions) by walking the admin category
// tree instead. The reverse (name -> id) map is what lets
// UNCATEGORIZED_ARTICLE_FIXES assign a real existing category by its plain name.
async function fetchCategoryMaps() {
  const tree = await api('GET', `/cms/websites/${encodeURIComponent(SITE)}/categories`);
  const idToName = new Map();
  const nameToId = new Map();
  const walk = (nodes) => {
    for (const n of nodes ?? []) {
      idToName.set(n.id, n.name);
      nameToId.set(n.name, n.id);
      walk(n.children);
    }
  };
  walk(tree?.data ?? []);
  return { idToName, nameToId };
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
  for (const [, authorSlug] of Object.values(UNCATEGORIZED_ARTICLE_FIXES)) {
    if (!authorsBySlug.has(authorSlug)) missingRosterSlugs.add(authorSlug);
  }
  if (missingRosterSlugs.size) {
    throw new Error(`Roster slug(s) not found on /authors: ${[...missingRosterSlugs].join(', ')}`);
  }

  const { idToName: catNameById, nameToId: catIdByName } = await fetchCategoryMaps();
  const missingCategoryNames = Object.values(UNCATEGORIZED_ARTICLE_FIXES)
    .map(([catName]) => catName)
    .filter((catName) => !catIdByName.has(catName));
  if (missingCategoryNames.length) {
    throw new Error(`Category name(s) not found on /categories: ${missingCategoryNames.join(', ')}`);
  }

  const articles = await allPublished();
  console.log(`  found  : ${articles.length} published article(s)\n`);

  // Round-robin cursor per category, so repeat categories cycle through every
  // qualified author instead of always landing on the first match.
  const cursor = {};
  let changed = 0, skippedNoCategory = 0, skippedNoMapping = 0;

  for (const article of articles) {
    let categoryName = article.category?.name || catNameById.get(article.categoryId);
    let newCategoryId; // only set when this run is also fixing a null categoryId

    const uncatFix = UNCATEGORIZED_ARTICLE_FIXES[article.id];
    let chosenSlug = ARTICLE_ID_OVERRIDES[article.id];

    if (uncatFix) {
      const [fixCategoryName, fixAuthorSlug] = uncatFix;
      categoryName = fixCategoryName;
      newCategoryId = catIdByName.get(fixCategoryName);
      chosenSlug = fixAuthorSlug;
    } else if (!chosenSlug) {
      if (!categoryName) {
        skippedNoCategory++;
        console.log(`  ! no category on file: "${article.title}" (article ${article.id}, categoryId=${article.categoryId ?? 'null'})`);
        continue;
      }
      const candidates = CATEGORY_TO_AUTHORS[categoryName];
      if (!candidates || candidates.length === 0) { skippedNoMapping++; console.log(`  ! no mapping for category "${categoryName}" (article ${article.id})`); continue; }
      const i = (cursor[categoryName] ?? 0) % candidates.length;
      cursor[categoryName] = i + 1;
      chosenSlug = candidates[i];
    }
    const chosen = authorsBySlug.get(chosenSlug);

    // The public byline reads customFields.author (a plain string) -- see the
    // file-header note. `article` here already carries the full customFields
    // blob from the list fetch (listContent only excludes contentBlocks), so
    // merge onto that directly rather than issuing a second GET per article.
    const currentCustomFields = article.customFields || {};
    const authorAlreadyCorrect = currentCustomFields.author === chosen.name;
    const categoryAlreadyCorrect = !newCategoryId || article.categoryId === newCategoryId;
    if (authorAlreadyCorrect && categoryAlreadyCorrect) continue; // idempotent re-run

    const label = newCategoryId ? `${categoryName} (was uncategorized)` : categoryName;
    console.log(`  ${DRY_RUN ? '[dry-run] would set' : 'setting'} "${article.title}" [${label}] -> ${chosen.name}`);
    if (!DRY_RUN) {
      await api('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/content/${article.id}`, {
        ...(newCategoryId ? { categoryId: newCategoryId } : {}),
        customFields: { ...currentCustomFields, author: chosen.name },
      });
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
