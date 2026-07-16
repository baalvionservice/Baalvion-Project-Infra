'use strict';
/*
 * Seed the 17 mega-menu category slugs that had no matching CmsCategory row on
 * imperialpedia (Investing/Markets/Banking/Personal Finance/Economy/Reviews).
 * A bug in publicService.js#listPublicContent silently dropped the category
 * filter for any unrecognized categorySlug and returned unfiltered site-wide
 * content instead — see the fix in the same PR. This seed creates the missing
 * categories and their pillar + 5-cluster-article content so those pages show
 * real, on-topic content instead of an empty "no articles yet" state.
 *
 * Content : 1 pillar + 5 cluster articles per category, in the sibling
 *           `*-pillars-*.data.cjs` files next to this script.
 * Engine  : ./cms-seed-lib.cjs
 *
 * USAGE (same contract as seed-new-pillars-2026-07.cjs)
 *   node scripts/seed-missing-categories-2026-07.cjs --export
 *   CMS_TOKEN=<bearer> node scripts/seed-missing-categories-2026-07.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/seed-missing-categories-2026-07.cjs                # create + publish (skips existing)
 *   CMS_TOKEN=<bearer> node scripts/seed-missing-categories-2026-07.cjs --update       # PATCH existing + create new
 *   ... --category=cryptocurrency|portfolio|brokers|live-market-news|calendar|checking|cd-rates|money-market|banking-reviews|planning|financial-independence|money-management|financial-calculators|global|loan-reviews|app-reviews|tax-software
 *   ... --only=<slug>
 */

const path = require('path');
const { markdownToBlocks, wordCount, slugify, createRunner } = require('./cms-seed-lib.cjs');

const CATEGORIES = [
  require('./investing-pillars-cryptocurrency.data.cjs'),
  require('./investing-pillars-portfolio.data.cjs'),
  require('./investing-pillars-brokers.data.cjs'),
  require('./markets-pillars-live-market-news.data.cjs'),
  require('./markets-pillars-calendar.data.cjs'),
  require('./banking-pillars-checking.data.cjs'),
  require('./banking-pillars-cd-rates.data.cjs'),
  require('./banking-pillars-money-market.data.cjs'),
  require('./banking-pillars-banking-reviews.data.cjs'),
  require('./personal-finance-pillars-planning.data.cjs'),
  require('./personal-finance-pillars-financial-independence.data.cjs'),
  require('./personal-finance-pillars-money-management.data.cjs'),
  require('./personal-finance-pillars-financial-calculators.data.cjs'),
  require('./economy-pillars-global.data.cjs'),
  require('./reviews-pillars-loan-reviews.data.cjs'),
  require('./reviews-pillars-app-reviews.data.cjs'),
  require('./reviews-pillars-tax-software.data.cjs'),
];

const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';

const ARGS = process.argv.slice(2);
const FLAG = (n) => ARGS.includes(`--${n}`);
const OPT = (n) => { const h = ARGS.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=').slice(1).join('=') : undefined; };
const ONLY = OPT('only');
const ONLY_CATEGORY = OPT('category');
const flags = { export: FLAG('export'), dryRun: FLAG('dry-run'), update: FLAG('update') };

const HOUSE_AUTHOR = { name: 'Allen Krewzz', title: 'Personal Finance Researcher & Business Analyst', site: 'ImperialPedia.com' };
const REVIEWER = { name: 'Priya Nair', title: 'Senior Financial Reviewer, CFA' };
const FACT_CHECKER = { name: 'ImperialPedia Fact-Check Desk' };
const EDITORIAL_TEAM = 'ImperialPedia Editorial Team';

const GENERAL_DISCLAIMER = 'This content is for educational purposes only and does not constitute financial, investment, tax, or legal advice. Financial decisions carry risk and vary by individual circumstance. Consider consulting a licensed financial advisor, tax professional, or attorney before acting on this information.';

function buildCta(categoryName) {
  return {
    newsletter: `Get weekly insights on ${categoryName.toLowerCase()} and smarter money decisions — subscribe to the ImperialPedia newsletter.`,
    disclaimer: GENERAL_DISCLAIMER,
    relatedReading: `Explore more in our ${categoryName} knowledge hub.`,
  };
}

function buildDoc(item, category, isPillar) {
  const contentBlocks = markdownToBlocks(item.markdown, { htmlOnly: false });
  const keywords = [item.focusKeyword, ...(item.secondaryKeywords || [])].filter(Boolean);
  const words = wordCount(item.markdown);
  return {
    title: item.title,
    slug: slugify(item.slug),
    contentType: 'article',
    excerpt: item.excerpt,
    visibility: 'public',
    categorySlug: category.categorySlug,
    categoryName: category.categoryName,
    seoMetadata: {
      title: item.metaTitle || `${item.title} | ImperialPedia`,
      description: item.metaDescription || item.excerpt,
      keywords,
      canonical: `/${slugify(item.slug)}`,
      robots: 'index, follow',
      openGraph: { title: item.metaTitle || item.title, description: item.metaDescription || item.excerpt, image: item.heroImagePrompt ? item.imageFileName : undefined },
      twitterCard: { card: 'summary_large_image', title: item.metaTitle || item.title, description: item.metaDescription || item.excerpt },
    },
    customFields: {
      isPillar: !!isPillar,
      subcategory: item.subcategory,
      tags: item.tags || [],
      audience: item.audience || [],
      faq: (item.faq || []).map((f) => ({ question: f.question, answer: f.answer })),
      author: HOUSE_AUTHOR,
      reviewer: REVIEWER,
      factChecker: FACT_CHECKER,
      editorialTeam: EDITORIAL_TEAM,
      wordCount: words,
      readingTimeMinutes: Math.max(1, Math.ceil(words / 200)),
      focusKeyword: item.focusKeyword,
      secondaryKeywords: item.secondaryKeywords || [],
      longTailKeywords: item.longTailKeywords || [],
      searchIntent: item.searchIntent || 'Informational',
      keyTakeaways: item.keyTakeaways || [],
      internalLinks: item.internalLinks || [],
      externalSources: category.sources || [],
      images: {
        heroImagePrompt: item.heroImagePrompt,
        socialImagePrompt: item.socialImagePrompt,
        coverImageAlt: item.coverImageAlt,
        thumbnailAlt: item.thumbnailAlt,
        imageFileName: item.imageFileName,
      },
      cta: buildCta(category.categoryName),
      schemaRecommendation: (item.faq && item.faq.length) ? 'Article + BreadcrumbList + FAQPage' : 'Article + BreadcrumbList',
      featured: !!isPillar,
      trending: false,
      editorsPick: !!isPillar,
      premium: false,
      featuredOrder: isPillar ? 0 : 10,
    },
    contentBlocks,
  };
}

function collectDocs() {
  const docs = [];
  for (const category of CATEGORIES) {
    if (ONLY_CATEGORY && category.categorySlug !== ONLY_CATEGORY) continue;
    if (category.pillar) docs.push(buildDoc(category.pillar, category, true));
    for (const article of category.articles) docs.push(buildDoc(article, category, false));
  }
  return docs.filter((d) => !ONLY || d.slug === slugify(ONLY));
}

async function main() {
  const docs = collectDocs();
  if (!docs.length) throw new Error(`No matching documents (category=${ONLY_CATEGORY || 'all'}, only=${ONLY || 'none'})`);

  console.log('Missing Categories (2026-07) content seed');
  console.log(`  target     : ${TARGET_BASE}`);
  console.log(`  site       : ${SITE}`);
  console.log(`  categories : ${CATEGORIES.map((c) => `${c.categorySlug}(${(c.pillar ? 1 : 0) + c.articles.length})`).join(', ')}`);
  console.log(`  mode       : ${flags.export ? 'EXPORT' : flags.dryRun ? 'DRY RUN' : flags.update ? 'UPDATE + CREATE' : 'CREATE + PUBLISH'}`);
  console.log(`  count      : ${docs.length} document(s)\n`);

  const runner = createRunner({
    base: TARGET_BASE, site: SITE, flags,
    token: process.env.CMS_TOKEN || null,
    outDir: process.env.OUT_DIR || path.join(process.env.TEMP || '/tmp', 'missing-categories-2026-07-seed'),
  });
  await runner.run(docs);
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
