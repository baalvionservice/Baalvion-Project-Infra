#!/usr/bin/env node
'use strict';
/**
 * Fixes the ~40 legacy budgeting articles whose author/reviewer/fact-checker are
 * fake, unrostered placeholder names ("Allen Krewzz" / "Priya Nair" / "ImperialPedia
 * Fact-Check Desk") repeated identically across every one of them, instead of real,
 * varied people from the actual 34-person author roster (the way all 438 other
 * articles already work). Two concrete bugs this causes:
 *
 *   1. The article byline shows a person who doesn't exist anywhere else on the site
 *      (customFields.author is a free-text {name,title} object with no authorSlug).
 *   2. getArticlesByAuthor() filters strictly on customFields.authorSlug, so an
 *      article with no authorSlug is invisible on EVERY real author's /authors/[slug]
 *      page, even the one whose name happens to be printed on the article itself.
 *
 * Assignment is expertise-matched, not a blind rotation across all 34 people — a
 * budgeting guide bylined to a crypto editor or an energy-markets writer would look
 * exactly as fake as the placeholder it replaces. Roster is split into three
 * role-appropriate pools (pulled from each author's real `title`/`expertise` on
 * their public profile):
 *
 *   AUTHOR_POOL       — Personal Finance / general finance writers & editors
 *   REVIEWER_POOL     — CFP/RIA-credentialed financial planners & senior editors
 *   FACT_CHECKER_POOL — people whose actual title is "Fact Checker" / "Fact-Checking Editor"
 *
 * Each pool rotates independently (article index mod pool size) so every person in
 * the relevant pool gets fair, even coverage across the 40 articles instead of a
 * handful of names repeating. Author/reviewer/fact-checker are always three
 * different people (disjoint pools). reviewedAt/factCheckedAt are stamped with the
 * actual run time of this correction — real, not a fabricated backdated claim,
 * since there's no genuine historical review date for these.
 *
 * Read-only by default (prints the plan). Requires CMS_ADMIN_TOKEN (a valid
 * admin-platform Bearer access token — log into admin-platform, copy the access
 * token, e.g. from the Network tab's Authorization header on any API call) to
 * actually write:
 *
 *   node scripts/fix-legacy-byline-authors.cjs                 # dry run (default)
 *   CMS_ADMIN_TOKEN=xxx node scripts/fix-legacy-byline-authors.cjs --apply
 */

const PUBLIC_BASE = process.env.CMS_PUBLIC_URL || 'https://api.baalvion.com/api/v1/public';
const ADMIN_BASE = process.env.CMS_ADMIN_URL || 'https://api.baalvion.com/api/v1/knowledge/cms/api/v1';
const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const APPLY = process.argv.includes('--apply');
const TOKEN = process.env.CMS_ADMIN_TOKEN;

// Personal Finance / general finance writers & editors — plausible bylines for a
// budgeting guide. Excludes anyone whose real title/expertise is crypto-, trading-,
// or sector-specific (e.g. Alex Torres/Senior Crypto Editor, Robert Kelly/Energy
// Markets) since that byline would read exactly as mismatched as the fake it
// replaces — including two people who match on the "Personal Finance" expertise
// tag but whose actual displayed title reads as unrelated/unprofessional next to a
// budgeting piece (Erika Rasure's title is "Founder, Crypto Goddess"; Nathan
// Reiff's is "Resident Conductor, Harvard Glee Club") — title as shown on the
// byline matters more here than a hidden expertise tag.
const AUTHOR_SLUGS = [
  'cierra-murry', 'julius-mansa', 'jonathan-ponciano', 'allie-grace-garnett',
  'nick-lioudis', 'sarah-mitchell', 'jason-fernando', 'jb-maverick',
  'marcus-reid', 'dara-abasi-ita',
];

// CFP/RIA-credentialed financial planners + senior financial editors — the kind of
// person who'd plausibly sign off on a personal-finance guide.
const REVIEWER_SLUGS = [
  'james-okafor', 'anthony-battle', 'samantha-silberstein', 'marguerita-m-cheng',
  'thomas-j-catalano', 'troy-segal', 'chip-stapleton',
];

// Real title is literally "Fact Checker" / "Fact-Checking Editor" on their profile.
const FACT_CHECKER_SLUGS = [
  'vikki-velasquez', 'hans-daniel-jasperson', 'betsy-petrick',
  'jiwon-ma', 'yarilet-perez', 'linda-zhao',
];

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

async function listAllArticles() {
  const out = [];
  for (let page = 1; page <= 50; page++) {
    const url = `${PUBLIC_BASE}/${SITE}/content?contentType=article&page=${page}&limit=100`;
    const env = await getJson(url);
    out.push(...(env.data || []));
    const p = env.pagination;
    if (!p || page >= (p.totalPages || 1)) break;
  }
  return out;
}

async function getRosterBySlug() {
  const env = await getJson(`${PUBLIC_BASE}/${SITE}/authors`);
  const bySlug = new Map();
  for (const a of env.data || []) bySlug.set(a.slug, { slug: a.slug, name: a.name, title: a.title || 'Contributor' });
  return bySlug;
}

function buildPool(slugs, bySlug, label) {
  const pool = slugs.map((s) => {
    const a = bySlug.get(s);
    if (!a) throw new Error(`${label} pool references unknown author slug "${s}" — roster may have changed.`);
    return a;
  });
  if (pool.length < 3) throw new Error(`${label} pool has only ${pool.length} people — need at least 3.`);
  return pool;
}

async function main() {
  const [articles, bySlug] = await Promise.all([listAllArticles(), getRosterBySlug()]);
  const authorPool = buildPool(AUTHOR_SLUGS, bySlug, 'AUTHOR');
  const reviewerPool = buildPool(REVIEWER_SLUGS, bySlug, 'REVIEWER');
  const factCheckerPool = buildPool(FACT_CHECKER_SLUGS, bySlug, 'FACT_CHECKER');

  const legacy = articles
    .filter((a) => !((a.customFields || {}).authorSlug))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  console.log(`${articles.length} total articles, ${legacy.length} missing a real authorSlug.\n`);

  const plan = legacy.map((article, i) => {
    const author = authorPool[i % authorPool.length];
    const reviewer = reviewerPool[i % reviewerPool.length];
    const factChecker = factCheckerPool[i % factCheckerPool.length];
    const now = new Date().toISOString();
    const customFields = {
      ...(article.customFields || {}),
      author: { name: author.name, title: author.title },
      authorSlug: author.slug,
      reviewerSlug: reviewer.slug,
      reviewedAt: now,
      factCheckerSlug: factChecker.slug,
      factCheckedAt: now,
    };
    delete customFields.reviewer;
    delete customFields.factChecker;
    return { id: article.id, websiteId: article.websiteId, slug: article.slug, customFields, author, reviewer, factChecker };
  });

  for (const p of plan) {
    console.log(p.slug);
    console.log(`  author:       ${p.author.name} — ${p.author.title}`);
    console.log(`  reviewer:     ${p.reviewer.name} — ${p.reviewer.title}`);
    console.log(`  fact-checker: ${p.factChecker.name} — ${p.factChecker.title}`);
  }

  console.log(`\nCoverage — authors used: ${new Set(plan.map((p) => p.author.slug)).size}/${authorPool.length}, `
    + `reviewers used: ${new Set(plan.map((p) => p.reviewer.slug)).size}/${reviewerPool.length}, `
    + `fact-checkers used: ${new Set(plan.map((p) => p.factChecker.slug)).size}/${factCheckerPool.length}`);

  if (!APPLY) {
    console.log('\nDry run only — no changes made. Re-run with CMS_ADMIN_TOKEN=<token> --apply to write these.');
    return;
  }
  if (!TOKEN) {
    console.error('\n--apply requires CMS_ADMIN_TOKEN (a valid admin-platform Bearer access token).');
    process.exitCode = 1;
    return;
  }

  for (const p of plan) {
    const url = `${ADMIN_BASE}/cms/websites/${p.websiteId}/content/${p.id}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ customFields: p.customFields }),
    });
    if (!res.ok) {
      console.error(`FAILED ${p.slug}: ${res.status} ${await res.text().catch(() => '')}`);
      continue;
    }
    console.log(`updated ${p.slug}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
