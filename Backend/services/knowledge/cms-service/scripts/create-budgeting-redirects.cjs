/* Creates the confirmed 301 redirects for the retired legacy "budgeting" CMS category
 * (personal-finance-pillars-budgeting.data.cjs), whose articles have been consolidated
 * into the dedicated Budgeting Hub categories (budgeting-pillars-*.data.cjs).
 *
 * IMPORTANT — sourceUrl/targetUrl are BARE SLUGS, not paths. Confirmed by reading the
 * actual read/write sides of this mechanism:
 *   - write side:  contentService.js `_recordSlugRedirect(websiteId, oldSlug, newSlug)`
 *   - read side:   publicService.js  `CmsSeoRedirect.findOne({ where: { sourceUrl: slug } })`
 *   - resolution:  content-engine/render/article-detail.tsx `resolveArticleForDetail` —
 *                  looks up the target by its bare slug, then builds the final URL from
 *                  *that content's own live categorySlug* via canonicalService, so the
 *                  redirect keeps working even if a category is renamed later.
 * A full path (e.g. "/budgeting/old-slug") would never match this lookup and would
 * silently no-op — slugs are enforced unique per website (see `_uniqueSlug` in
 * contentService.js), so a bare slug is an unambiguous key on its own.
 *
 * Same pattern as backfillSlugRedirects.cjs: direct Sequelize write via `../models`,
 * dry-run by default, --apply to actually write. Idempotent — skips a mapping if an
 * active redirect for that sourceUrl already exists.
 *
 * Usage:
 *   node scripts/create-budgeting-redirects.cjs                    # dry run, imperialpedia
 *   node scripts/create-budgeting-redirects.cjs --apply             # write
 *   node scripts/create-budgeting-redirects.cjs someWebsiteSlug --apply
 *
 * NOTE: this writes directly to whatever Postgres `config/database.js` resolves via
 * this environment's DB_HOST/DB_NAME (see .env) — run it against the environment that
 * actually holds the live imperialpedia content, not a local/empty dev database. Also
 * unpublish/delete the source content row itself first — the read-side redirect check
 * only fires on a 404 lookup miss, so a still-published row at the old slug is served
 * directly and the redirect is never consulted.
 */
'use strict';
const { CmsWebsite, CmsSeoRedirect } = require('../models');

const APPLY = process.argv.includes('--apply');
const websiteSlugArg = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'imperialpedia';

// Confirmed mappings only — see the Budgeting cluster audit for the evidence behind each:
// the first four are near-verbatim duplicates of a dedicated Budgeting Hub article; the
// irregular-income mapping was confirmed by reading both full article bodies (the legacy
// piece has no content the newer, deeper freelancer guide doesn't already cover); the last
// is a recategorization, not a duplicate — the article itself is unique and was moved to
// budgeting-pillars-budgeting-basics.data.cjs's cluster. Paths shown in comments are the
// resulting URLs, for reference only — the table itself stores bare slugs.
// NOTE: 'budgeting-after-a-major-life-change' is deliberately NOT listed here. Its
// slug didn't change, only its category (budgeting -> budgeting-basics) — the catch-all
// route's existing category-mismatch canonicalization (`[...slug]/page.tsx`, the
// `permanentRedirect(trueCanonical)` path) already 301s a request for the old
// `/budgeting/budgeting-after-a-major-life-change` to the right category the moment the
// content's categoryId is updated in the CMS. No redirect row needed or created for it.
const REDIRECTS = [
  { from: 'budgeting-101-the-complete-overview', to: 'what-is-a-budget' }, // -> /budgeting-basics/what-is-a-budget
  { from: 'zero-based-budgeting-method', to: 'zero-based-budgeting' },     // -> /budget-rules/zero-based-budgeting
  { from: 'envelope-budgeting-system', to: 'envelope-budgeting' },        // -> /budget-rules/envelope-budgeting
  { from: 'budgeting-for-couples', to: 'couples-budgeting' },             // -> /family-budget/couples-budgeting
  { from: 'budgeting-with-irregular-income', to: 'budgeting-for-freelancers' }, // -> /advanced-budgeting/budgeting-for-freelancers
];

async function main() {
  const website = await CmsWebsite.findOne({ where: { slug: websiteSlugArg }, attributes: ['id', 'slug'] });
  if (!website) {
    console.error(`No website found for slug "${websiteSlugArg}"`);
    process.exitCode = 1;
    return;
  }

  let created = 0;
  let alreadyPresent = 0;

  for (const { from, to } of REDIRECTS) {
    const existing = await CmsSeoRedirect.findOne({ where: { websiteId: website.id, sourceUrl: from } });
    if (existing) {
      console.log(`[${website.slug}] SKIP (already exists): "${from}" -> "${existing.targetUrl}"`);
      alreadyPresent++;
      continue;
    }

    console.log(`[${website.slug}] ${APPLY ? 'CREATE' : 'WOULD CREATE'} redirect: "${from}" -> "${to}"`);
    if (APPLY) {
      await CmsSeoRedirect.create({
        websiteId: website.id,
        sourceUrl: from,
        targetUrl: to,
        redirectType: '301',
        isActive: true,
      });
    }
    created++;
  }

  console.log('---');
  console.log(`${APPLY ? 'Created' : 'Would create'}: ${created}`);
  console.log(`Already present: ${alreadyPresent}`);
  if (!APPLY) console.log('Dry run — pass --apply to write.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
