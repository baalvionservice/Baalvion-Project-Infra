'use strict';
/*
 * Refresh thin/skeleton Imperialpedia "news" content (contentType: news) that
 * existed only as ~50-word stubs. Mirrors seed-imperialpedia-seo-articles.cjs but
 * targets contentType 'news' and files everything under the 'markets' category
 * instead of 'personal-finance'.
 *
 * Content : ./imperialpedia-news-refresh.data.cjs
 * Engine  : ./cms-seed-lib.cjs
 *
 * USAGE
 *   node scripts/seed-imperialpedia-news-refresh.cjs --export
 *   CMS_TOKEN=<bearer> node scripts/seed-imperialpedia-news-refresh.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/seed-imperialpedia-news-refresh.cjs --update
 *   ... --only=gold-record-high-2400
 *
 * AUTH : CMS_TOKEN = prod super_admin bearer from admin.baalvion.com (DevTools → any /cms/ request).
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff.
 */

const path = require('path');
const { markdownToBlocks, wordCount, slugify, createRunner } = require('./cms-seed-lib.cjs');
const ITEMS = require('./imperialpedia-news-refresh.data.cjs');

const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const CATEGORY_SLUG = process.env.CATEGORY_SLUG || 'markets';
const CATEGORY_NAME = 'Markets';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';

const ARGS = process.argv.slice(2);
const FLAG = (n) => ARGS.includes(`--${n}`);
const OPT = (n) => { const h = ARGS.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=').slice(1).join('=') : undefined; };
const ONLY = OPT('only');
const flags = { export: FLAG('export'), dryRun: FLAG('dry-run'), update: FLAG('update') };

const HOUSE_AUTHOR = { name: 'Allen Krewzz', title: 'Markets Desk', site: 'ImperialPedia.com' };

function buildDoc(a) {
  const contentBlocks = markdownToBlocks(a.markdown, { htmlOnly: false });
  const keywords = [a.focusKeyword, ...(a.secondaryKeywords || [])].filter(Boolean);
  return {
    title: a.title,
    slug: slugify(a.slug),
    contentType: 'news',
    excerpt: a.excerpt,
    visibility: 'public',
    seoMetadata: { title: a.metaTitle || `${a.title} | ImperialPedia`, description: a.metaDescription || a.excerpt, keywords },
    customFields: {
      author: HOUSE_AUTHOR,
      wordCount: wordCount(a.markdown),
      focusKeyword: a.focusKeyword,
      keyTakeaways: a.keyTakeaways || [],
      secondaryKeywords: a.secondaryKeywords || [],
      schemaRecommendation: 'NewsArticle',
    },
    contentBlocks,
  };
}

async function main() {
  const selected = ITEMS.filter((a) => !ONLY || slugify(a.slug) === ONLY);
  if (!selected.length) throw new Error(`--only=${ONLY} matched no item`);
  console.log('Imperialpedia news content refresh');
  console.log(`  target : ${TARGET_BASE}`);
  console.log(`  site   : ${SITE}   category: ${CATEGORY_SLUG}`);
  console.log(`  mode   : ${flags.export ? 'EXPORT' : flags.dryRun ? 'DRY RUN' : flags.update ? 'UPDATE + CREATE' : 'CREATE + PUBLISH'}`);
  console.log(`  count  : ${selected.length} item(s)\n`);

  const docs = selected.map(buildDoc);
  const runner = createRunner({
    base: TARGET_BASE, site: SITE, categorySlug: CATEGORY_SLUG, categoryName: CATEGORY_NAME,
    token: process.env.CMS_TOKEN || null, flags,
    outDir: process.env.OUT_DIR || path.join(process.env.TEMP || '/tmp', 'imperialpedia-news-seed'),
  });
  await runner.run(docs);
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
