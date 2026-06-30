'use strict';
/*
 * Seed production-grade SEO articles into the Imperialpedia CMS (cms-service) and publish.
 * Content is centrally managed in the admin console; this script is the authoring pipeline
 * that converts authored markdown → the live CMS block shape and pushes it to cms-service.
 *
 * Content : ./imperialpedia-seo-articles.data.cjs   (authored markdown + metadata)
 * Engine  : ./cms-seed-lib.cjs                        (converter + API runner)
 *
 * USAGE
 *   node scripts/seed-imperialpedia-seo-articles.cjs --export          # build JSON, no creds
 *   CMS_TOKEN=<bearer> node scripts/seed-imperialpedia-seo-articles.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/seed-imperialpedia-seo-articles.cjs                # create + publish (skips existing)
 *   CMS_TOKEN=<bearer> node scripts/seed-imperialpedia-seo-articles.cjs --update       # PATCH existing + create new
 *   ... --only=what-is-compound-interest
 *
 * AUTH : CMS_TOKEN = prod super_admin bearer from admin.baalvion.com (DevTools → any /cms/ request).
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff (api.baalvion.com
 *        404s for management routes). Override with TARGET_CMS_BASE.
 */

const path = require('path');
const { markdownToBlocks, wordCount, slugify, createRunner } = require('./cms-seed-lib.cjs');
const ARTICLES = require('./imperialpedia-seo-articles.data.cjs');

const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const CATEGORY_SLUG = process.env.CATEGORY_SLUG || 'personal-finance';
const CATEGORY_NAME = 'Personal Finance';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';

const ARGS = process.argv.slice(2);
const FLAG = (n) => ARGS.includes(`--${n}`);
const OPT = (n) => { const h = ARGS.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=').slice(1).join('=') : undefined; };
const ONLY = OPT('only');
const flags = { export: FLAG('export'), dryRun: FLAG('dry-run'), update: FLAG('update') };

const HOUSE_AUTHOR = { name: 'Allen Krewzz', title: 'Personal Finance Researcher & Business Analyst', site: 'ImperialPedia.com' };

function buildDoc(a) {
  const contentBlocks = markdownToBlocks(a.markdown, { htmlOnly: false });
  const keywords = [a.focusKeyword, ...(a.secondaryKeywords || [])].filter(Boolean);
  return {
    title: a.title,
    slug: slugify(a.slug),
    contentType: 'article',
    excerpt: a.excerpt,
    visibility: 'public',
    seoMetadata: { title: a.metaTitle || `${a.title} | ImperialPedia`, description: a.metaDescription || a.excerpt, keywords },
    customFields: {
      faq: (a.faq || []).map((f) => ({ question: f.question, answer: f.answer })),
      author: HOUSE_AUTHOR,
      wordCount: wordCount(a.markdown),
      focusKeyword: a.focusKeyword,
      keyTakeaways: a.keyTakeaways || [],
      searchIntent: a.searchIntent || 'Informational',
      internalLinks: a.internalLinks || [],
      externalSources: a.externalSources || [],
      secondaryKeywords: a.secondaryKeywords || [],
      schemaRecommendation: (a.faq && a.faq.length) ? 'Article + FAQPage' : 'Article',
    },
    contentBlocks,
  };
}

async function main() {
  const selected = ARTICLES.filter((a) => !ONLY || slugify(a.slug) === ONLY);
  if (!selected.length) throw new Error(`--only=${ONLY} matched no article`);
  console.log('Imperialpedia SEO article seed');
  console.log(`  target : ${TARGET_BASE}`);
  console.log(`  site   : ${SITE}   category: ${CATEGORY_SLUG}`);
  console.log(`  mode   : ${flags.export ? 'EXPORT' : flags.dryRun ? 'DRY RUN' : flags.update ? 'UPDATE + CREATE' : 'CREATE + PUBLISH'}`);
  console.log(`  count  : ${selected.length} article(s)\n`);

  const docs = selected.map(buildDoc);
  const runner = createRunner({
    base: TARGET_BASE, site: SITE, categorySlug: CATEGORY_SLUG, categoryName: CATEGORY_NAME,
    token: process.env.CMS_TOKEN || null, flags,
    outDir: process.env.OUT_DIR || path.join(process.env.TEMP || '/tmp', 'imperialpedia-seed'),
  });
  await runner.run(docs);
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
