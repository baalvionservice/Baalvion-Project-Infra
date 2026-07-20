/* One-off backfill: reconstruct `cms_seo_redirects` rows for content that was renamed
 * BEFORE contentService.updateContent started recording redirects on rename.
 *
 * Source of truth: `cms_content_revisions.snapshot.slug`. A revision is only saved on a
 * workflow state transition (see workflowService.js), not on every plain edit — so a
 * content item that was renamed and republished without an intervening state change has
 * NO recorded history and cannot be recovered by this script. Anything this script can't
 * find a slug-history trail for is printed under "UNRECOVERABLE" and needs a human to
 * either manually add a redirect or accept the URL is gone.
 *
 * Dry-run by default — prints what it would insert. Pass --apply to actually write.
 *
 * Usage:
 *   node scripts/backfillSlugRedirects.cjs [websiteSlug]              # dry run
 *   node scripts/backfillSlugRedirects.cjs [websiteSlug] --apply      # write
 */
'use strict';
const { CmsWebsite, CmsContent, CmsContentRevision, CmsSeoRedirect, sequelize } = require('../models');

const APPLY = process.argv.includes('--apply');
const websiteSlugArg = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;

async function slugHistoryFor(content) {
  const revisions = await CmsContentRevision.findAll({
    where: { contentId: content.id },
    order: [['revisionNumber', 'ASC']],
    attributes: ['snapshot'],
  });
  const historicalSlugs = [...new Set(
    revisions
      .map((r) => r.snapshot && r.snapshot.slug)
      .filter((slug) => slug && slug !== content.slug),
  )];
  return historicalSlugs;
}

async function main() {
  const websiteWhere = websiteSlugArg ? { slug: websiteSlugArg } : {};
  const websites = await CmsWebsite.findAll({ where: websiteWhere, attributes: ['id', 'slug'] });
  if (!websites.length) {
    console.error(websiteSlugArg ? `No website found for slug "${websiteSlugArg}"` : 'No websites found');
    process.exitCode = 1;
    return;
  }

  let recovered = 0;
  let alreadyPresent = 0;
  let unrecoverableContentCount = 0;

  for (const website of websites) {
    const contents = await CmsContent.findAll({
      where: { websiteId: website.id, status: 'published' },
      attributes: ['id', 'slug', 'title'],
    });

    for (const content of contents) {
      const historicalSlugs = await slugHistoryFor(content);
      if (!historicalSlugs.length) continue; // never renamed, or renamed with no revision trail

      for (const oldSlug of historicalSlugs) {
        const existing = await CmsSeoRedirect.findOne({
          where: { websiteId: website.id, sourceUrl: oldSlug },
        });
        if (existing) {
          alreadyPresent++;
          continue;
        }

        console.log(
          `[${website.slug}] ${APPLY ? 'CREATE' : 'WOULD CREATE'} redirect: "${oldSlug}" -> "${content.slug}" (${content.title})`,
        );
        if (APPLY) {
          await CmsSeoRedirect.create({
            websiteId: website.id,
            sourceUrl: oldSlug,
            targetUrl: content.slug,
            redirectType: '301',
            isActive: true,
          });
        }
        recovered++;
      }
    }
  }

  console.log('---');
  console.log(`${APPLY ? 'Created' : 'Would create'}: ${recovered}`);
  console.log(`Already present: ${alreadyPresent}`);
  console.log(
    'Content items with a currently-broken link but NO revision history to recover from ' +
    'cannot be detected by this script — they never show up here at all, since there is ' +
    'nothing in cms_content_revisions to walk. Cross-check the crawler\'s 4xx list against ' +
    'this output; anything not covered needs a manual redirect or is genuinely gone.',
  );
  if (!APPLY) console.log('\nDry run only — re-run with --apply to write these rows.');
}

main()
  .then(() => sequelize.close())
  .catch((err) => {
    console.error(err);
    return sequelize.close().finally(() => { process.exitCode = 1; });
  });
