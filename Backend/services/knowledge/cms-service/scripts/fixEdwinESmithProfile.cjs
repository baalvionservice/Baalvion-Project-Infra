'use strict';
/*
 * One-off correction for a single Law Elite Network profile: edwin-e-smith.
 *
 * Two bugs found on the live /author/edwin-e-smith page:
 *
 * 1. His CMS `bio` field opens with a bullet-fragment block ("Has published
 *    20 articles for Law Elite Network.", "Partner at...", ...), then a
 *    stray standalone "Experience" line, then the *same* facts restated as
 *    full prose paragraphs -- including a second "Smith has published 20
 *    articles..." sentence. The public page renders every one of those as
 *    its own paragraph under a page-level "Experience" <h2>, so the profile
 *    visibly duplicates itself and repeats a false claim: zero articles are
 *    actually bylined to him (`customFields.author` on every published
 *    article), not 20. None of his ~80-author cohort has this pattern --
 *    checked ari-b-blaut, dennis-dunne, jeffrey-ross, mark-c-kanaly, all
 *    clean single-flow prose with no article-count claim at all -- so this
 *    replaces `bio` with just the real prose paragraphs, dropping the
 *    duplicate block and the count sentence (matching every peer bio, which
 *    doesn't state a count either -- safer than hand-updating "20" to
 *    whatever the real number is today, since that would drift out of sync
 *    the next time bylines are reassigned).
 *
 * 2. He has 0 real articles. There is no genuinely on-topic (banking/
 *    finance/bankruptcy/restructuring) article on the site to give him --
 *    confirmed by keyword sweep across all 162 published articles. Per
 *    explicit site-owner direction, the 5 closest available pieces (the more
 *    general finance/tax topics, not the home-sale-specific capital-gains
 *    ones) are reassigned to him, one each from the 5 authors who currently
 *    hold 2 Tax & Finance articles apiece -- leaves every one of them with 1,
 *    same "never take a category to zero" restraint rotate-law-elite-
 *    article-authors.cjs already applies elsewhere.
 *
 * Mirrors fixLawEliteAuthorCredentials.cjs / rotate-law-elite-article-authors.cjs's
 * auth/base/dry-run conventions exactly.
 *
 * USAGE
 *   node scripts/fixEdwinESmithProfile.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/fixEdwinESmithProfile.cjs
 *
 * AUTH : CMS_TOKEN = prod super_admin / cms_editor bearer from admin.baalvion.com
 *        (DevTools -> any /cms/ request -> copy the Authorization header value).
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff.
 */

const SITE = process.env.WEBSITE_SLUG || 'law-elite-network';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';
const PUBLIC_BASE = process.env.PUBLIC_CMS_BASE || 'https://api.baalvion.com/api/v1/public';

const AUTHOR_SLUG = 'edwin-e-smith';

const NEW_BIO = [
  "Edwin E. Smith is a partner at Morgan, Lewis & Bockius LLP in the firm’s New York and Boston offices, where he chairs the Finance Area. He is an experienced legal professional whose practice focuses on commercial law, debt and structured financings, workouts, bankruptcy, restructuring, and domestic and cross-border insolvency.",
  "Smith has extensive experience advising on complex financial transactions and major distressed situations. His notable engagements have included matters involving Refco, Lehman Brothers, the City of Detroit, and PG&E bankruptcies. His work encompasses banking and finance, debt and structured finance, creditor and debtor matters, financial restructurings, and sophisticated insolvency proceedings.",
  "Smith is a graduate of Yale University and Harvard Law School. He is a member of the American Law Institute and serves on the executive committee of the National Bankruptcy Conference. He has also served on the board of directors of the American College of Bankruptcy and chaired its Policy Committee.",
  "His experience across complex financing, restructuring, and insolvency matters provides Law Elite Network readers with an informed perspective on the legal and commercial issues affecting financial institutions, creditors, borrowers, and businesses navigating financial distress.",
].join('\n\n');

// One article moved off each of the 5 authors currently holding 2 Tax &
// Finance pieces -- the more general finance/tax-mechanics piece, leaving
// each author their home-sale-specific capital-gains piece.
const ARTICLES_TO_REASSIGN = [
  '8500d0b3-00b8-4aa3-8338-d5157d40aaa0', // "What Is Capital Gains Tax?" (was Elena Rossi)
  '1adaf752-7e57-454a-9f75-de2aafedec28', // "What Is a Tax Audit?" (was Priya Nair)
  '2ec309dd-8382-4872-872e-2a3db125218e', // "How Personal Income Tax Works" (was Daniel Okafor)
  '490d0639-e2f5-47be-b480-b7deaff2160b', // "VAT vs. Sales Tax" (was Claire Hannon)
  'e4267800-ef89-405c-819e-803e9d82a82e', // "Understanding Corporate Tax Basics" (was Hemangi Bhuva)
];

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

async function main() {
  if (!DRY_RUN && !TOKEN) throw new Error('CMS_TOKEN not set (or pass --dry-run)');

  const pub = await fetch(`${PUBLIC_BASE}/${encodeURIComponent(SITE)}/authors`).then((r) => r.json());
  const authors = Array.isArray(pub?.data) ? pub.data : [];
  const edwin = authors.find((a) => a.slug === AUTHOR_SLUG);
  if (!edwin) throw new Error(`author ${AUTHOR_SLUG} not found on live site`);

  // --- 1. bio fix ---
  if (edwin.bio === NEW_BIO) {
    console.log('bio: already correct, skipping');
  } else {
    console.log('bio: replacing duplicated/false-claim bio with clean prose');
    if (!DRY_RUN) {
      await api('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/authors/${encodeURIComponent(edwin.id)}`, { bio: NEW_BIO });
    }
  }

  // --- 2. article reassignment ---
  let reassigned = 0, skipped = 0, failed = 0;
  for (const articleId of ARTICLES_TO_REASSIGN) {
    // Admin content-get needed for the current customFields blob (public
    // delivery API doesn't expose unpublished/full fields consistently, and
    // content.update() replaces customFields wholesale -- see rotate script's
    // header note -- so fetch-then-merge rather than blind-overwrite).
    let current;
    try {
      current = await api('GET', `/cms/websites/${encodeURIComponent(SITE)}/content/${articleId}`);
    } catch (e) {
      failed++;
      console.error(`  ${articleId}: GET failed: ${e.message}`);
      continue;
    }
    const article = current?.data ?? current;
    const currentCustomFields = article.customFields || {};
    if (currentCustomFields.author === edwin.name) {
      skipped++;
      continue;
    }
    console.log(`  "${article.title}": ${currentCustomFields.author || '(none)'} → ${edwin.name}`);
    if (!DRY_RUN) {
      try {
        await api('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/content/${articleId}`, {
          customFields: { ...currentCustomFields, author: edwin.name, authorSlug: edwin.slug },
        });
        reassigned++;
      } catch (e) {
        failed++;
        console.error(`  ${articleId}: PATCH failed: ${e.message}`);
      }
    } else {
      reassigned++;
    }
  }

  console.log(JSON.stringify({ ok: failed === 0, dryRun: DRY_RUN, reassigned, skipped, failed }, null, 2));
}

main().catch((e) => { console.error('edwin-e-smith profile fix failed:', e.message); process.exit(1); });
