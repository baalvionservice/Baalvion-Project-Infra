'use strict';
/*
 * Seed the 5 new Imperialpedia pillar categories (Credit Scores, Cryptocurrency &
 * Digital Assets, Earnings, The Federal Reserve, Debt Management supplement) into
 * cms-service and publish. Each of credit/crypto/earnings/fed = 1 pillar + 15 cluster
 * articles (split across "-a"/"-b" data files by the parallel authoring agents that
 * wrote them). Debt = existing pillar + 2 articles (budgeting-pillars-debt.data.cjs,
 * already committed from PR #201) plus 13 new supplemental cluster articles.
 *
 * Content : ./credit-pillars-scores-{a,b}.data.cjs
 *           ./crypto-pillars-digital-assets-{a,b}.data.cjs
 *           ./earnings-pillars-reports-{a,b}.data.cjs
 *           ./fed-pillars-federal-reserve-{a,b}.data.cjs
 *           ./debt-pillars-supplement-{a,b}.data.cjs (+ existing budgeting-pillars-debt.data.cjs)
 * Engine  : ./cms-seed-lib.cjs
 *
 * USAGE (same contract as seed-investing-pillars.cjs)
 *   node scripts/seed-new-pillars-2026-07.cjs --export
 *   CMS_TOKEN=<bearer> node scripts/seed-new-pillars-2026-07.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/seed-new-pillars-2026-07.cjs                # create + publish (skips existing)
 *   CMS_TOKEN=<bearer> node scripts/seed-new-pillars-2026-07.cjs --update       # PATCH existing + create new
 *   ... --category=credit|crypto|earnings|fed|debt
 *   ... --only=<slug>
 */

const path = require('path');
const { markdownToBlocks, wordCount, slugify, createRunner } = require('./cms-seed-lib.cjs');

function mergeCategory(a, b, extra) {
  const parts = [a, b, ...(extra || [])].filter(Boolean);
  const base = parts.find((p) => p.pillar) || parts[0];
  const articles = [];
  const seen = new Set();
  for (const p of parts) {
    for (const art of p.articles || []) {
      if (seen.has(art.slug)) continue;
      seen.add(art.slug);
      articles.push(art);
    }
  }
  return {
    categorySlug: base.categorySlug,
    categoryName: base.categoryName,
    sources: base.sources,
    pillar: parts.find((p) => p.pillar)?.pillar,
    articles,
  };
}

const CATEGORIES = [
  mergeCategory(
    require('./credit-pillars-scores-a.data.cjs'),
    require('./credit-pillars-scores-b.data.cjs'),
  ),
  mergeCategory(
    require('./crypto-pillars-digital-assets-a.data.cjs'),
    require('./crypto-pillars-digital-assets-b.data.cjs'),
  ),
  mergeCategory(
    require('./earnings-pillars-reports-a.data.cjs'),
    require('./earnings-pillars-reports-b.data.cjs'),
  ),
  mergeCategory(
    require('./fed-pillars-federal-reserve-a.data.cjs'),
    require('./fed-pillars-federal-reserve-b.data.cjs'),
  ),
  mergeCategory(
    require('./budgeting-pillars-debt.data.cjs'),
    require('./debt-pillars-supplement-a.data.cjs'),
    [require('./debt-pillars-supplement-b.data.cjs')],
  ),
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

  console.log('New Pillars (2026-07) content seed');
  console.log(`  target     : ${TARGET_BASE}`);
  console.log(`  site       : ${SITE}`);
  console.log(`  categories : ${CATEGORIES.map((c) => `${c.categorySlug}(${(c.pillar ? 1 : 0) + c.articles.length})`).join(', ')}`);
  console.log(`  mode       : ${flags.export ? 'EXPORT' : flags.dryRun ? 'DRY RUN' : flags.update ? 'UPDATE + CREATE' : 'CREATE + PUBLISH'}`);
  console.log(`  count      : ${docs.length} document(s)\n`);

  const runner = createRunner({
    base: TARGET_BASE, site: SITE, flags,
    token: process.env.CMS_TOKEN || null,
    outDir: process.env.OUT_DIR || path.join(process.env.TEMP || '/tmp', 'new-pillars-2026-07-seed'),
  });
  await runner.run(docs);
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
