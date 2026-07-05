'use strict';
/*
 * Seed the "Investing Pillars" content program into the Imperialpedia CMS (cms-service)
 * and publish. Covers 7 categories (Bonds, ETFs, Mutual Funds, Options, Commodities,
 * Real Estate, Retirement), each with 1 pillar page + 5 supporting cluster articles.
 *
 * Content : ./investing-pillars-<category>.data.cjs   (authored markdown + full SEO/CMS metadata)
 * Engine  : ./cms-seed-lib.cjs                          (converter + multi-category API runner)
 *
 * USAGE
 *   node scripts/seed-investing-pillars.cjs --export          # build JSON, no creds
 *   CMS_TOKEN=<bearer> node scripts/seed-investing-pillars.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/seed-investing-pillars.cjs                # create + publish (skips existing)
 *   CMS_TOKEN=<bearer> node scripts/seed-investing-pillars.cjs --update       # PATCH existing + create new
 *   ... --category=bonds            # limit to one category (bonds|etfs|mutual-funds|options|commodities|real-estate|retirement)
 *   ... --only=government-bonds-vs-corporate-bonds   # limit to one slug
 *
 * AUTH : CMS_TOKEN = prod super_admin bearer from admin.baalvion.com (DevTools → any /cms/ request).
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff (api.baalvion.com
 *        404s for management routes). Override with TARGET_CMS_BASE.
 */

const path = require('path');
const { markdownToBlocks, wordCount, slugify, createRunner } = require('./cms-seed-lib.cjs');

const CATEGORIES = [
  require('./investing-pillars-bonds.data.cjs'),
  require('./investing-pillars-etfs.data.cjs'),
  require('./investing-pillars-mutual-funds.data.cjs'),
  require('./investing-pillars-options.data.cjs'),
  require('./investing-pillars-commodities.data.cjs'),
  require('./investing-pillars-real-estate.data.cjs'),
  require('./investing-pillars-retirement.data.cjs'),
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

const INVESTMENT_DISCLAIMER = 'This content is for educational purposes only and does not constitute financial, investment, tax, or legal advice. Investing carries risk, including possible loss of principal. Past performance does not guarantee future results. Consider consulting a licensed financial advisor before making investment decisions.';

function buildCta(categoryName) {
  return {
    newsletter: `Get weekly insights on ${categoryName.toLowerCase()} and smarter investing — subscribe to the ImperialPedia newsletter.`,
    disclaimer: INVESTMENT_DISCLAIMER,
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
    docs.push(buildDoc(category.pillar, category, true));
    for (const article of category.articles) docs.push(buildDoc(article, category, false));
  }
  return docs.filter((d) => !ONLY || d.slug === slugify(ONLY));
}

async function main() {
  const docs = collectDocs();
  if (!docs.length) throw new Error(`No matching documents (category=${ONLY_CATEGORY || 'all'}, only=${ONLY || 'none'})`);

  console.log('Investing Pillars content seed');
  console.log(`  target     : ${TARGET_BASE}`);
  console.log(`  site       : ${SITE}`);
  console.log(`  categories : ${CATEGORIES.map((c) => c.categorySlug).join(', ')}`);
  console.log(`  mode       : ${flags.export ? 'EXPORT' : flags.dryRun ? 'DRY RUN' : flags.update ? 'UPDATE + CREATE' : 'CREATE + PUBLISH'}`);
  console.log(`  count      : ${docs.length} document(s)\n`);

  const runner = createRunner({
    base: TARGET_BASE, site: SITE, flags,
    token: process.env.CMS_TOKEN || null,
    outDir: process.env.OUT_DIR || path.join(process.env.TEMP || '/tmp', 'investing-pillars-seed'),
  });
  await runner.run(docs);
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
