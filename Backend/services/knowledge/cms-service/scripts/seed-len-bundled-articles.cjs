'use strict';
/*
 * Seed the Law Elite Network articles that only exist as bundled TypeScript
 * data (Frontend/lawelitenetwork.com/src/data/articles/*.ts) into the CMS, so
 * they show up in the admin console and can be edited / given photos there.
 *
 * Covers the six primary-nav categories: Stories on Screen, History & Heritage,
 * Language & Ideas, Technology & Innovation, Culture & Society, Law School Life.
 *
 * Items are created as DRAFTS by default -- several source files are marked
 * "template / pending research" and must not go live unreviewed. Pass
 * --publish to publish instead. Existing slugs are skipped unless --update.
 *
 * USAGE
 *   node scripts/seed-len-bundled-articles.cjs --export
 *   CMS_TOKEN=<bearer> node scripts/seed-len-bundled-articles.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/seed-len-bundled-articles.cjs
 *   TARGET_CMS_BASE=http://localhost:<port>/api/v1 CMS_TOKEN=... node scripts/seed-len-bundled-articles.cjs
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { slugify, createRunner } = require('./cms-seed-lib.cjs');

const SITE = process.env.WEBSITE_SLUG || 'law-elite-network';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';
const ARTICLES_DIR = process.env.LEN_ARTICLES_DIR
  || path.resolve(__dirname, '../../../../../Frontend/lawelitenetwork.com/src/data/articles');

const FILES = [
  ...fs.readdirSync(ARTICLES_DIR).filter((f) => /^lss-.*\.ts$/.test(f)).sort(),
  'law-and-popular-culture.ts',
  'law-and-popular-culture-extra.ts',
  'history-and-civilization.ts',
  'language-and-literature.ts',
  'technology-and-digital-culture.ts',
  'law-culture-and-society.ts',
  'law-school-success.ts',
];

const ARGS = process.argv.slice(2);
const FLAG = (n) => ARGS.includes(`--${n}`);
const flags = { export: FLAG('export'), dryRun: FLAG('dry-run'), update: FLAG('update'), draft: !FLAG('publish') };

// The category names LEN shows in its nav, keyed by the route slug the bundled
// data already uses.
const CATEGORY_NAMES = {
  'law-and-popular-culture': 'Stories on Screen',
  'history-and-civilization': 'History & Heritage',
  'language-and-literature': 'Language & Ideas',
  'technology-and-digital-culture': 'Technology & Innovation',
  'law-culture-and-society': 'Culture & Society',
  'law-school-success': 'Law School Life',
};

// The data files are plain object literals behind a type import and an
// `export const x: LawArticle[] =` header, so strip those and evaluate.
// Exports of already-loaded files are shared so `import { x } from './y'` lines
// (law-school-success pulls in the lss-* files) resolve as plain globals.
const shared = {};

function loadFile(file) {
  const src = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf8')
    .replace(/^import type .*$/gm, '')
    .replace(/^import \{[^}]*\} from .*$/gm, '')
    .replace(/export const (\w+)\s*:\s*[\w<>\[\]]+\s*=/g, 'exports.$1 =')
    .replace(/export const (\w+)\s*=/g, 'exports.$1 =');
  const sandbox = { exports: {}, ...shared };
  vm.runInNewContext(src, sandbox, { filename: file });
  Object.assign(shared, sandbox.exports);
  return Object.values(sandbox.exports).flat().filter((a) => a && a.slug && a.content);
}

function buildDoc(a) {
  const categorySlug = a.category?.slug;
  const words = String(a.content).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return {
    title: a.title,
    slug: slugify(a.slug),
    contentType: 'article',
    excerpt: a.summary,
    visibility: 'public',
    seoMetadata: { title: a.title, description: a.summary, keywords: [] },
    customFields: {
      author: { name: a.author || 'Law Elite Editorial Team' },
      wordCount: words,
      readingTime: `${a.readingTime || Math.max(1, Math.round(words / 200))} min read`,
      alphabet: a.alphabet || '#',
      category: CATEGORY_NAMES[categorySlug] || a.category?.name,
      schemaRecommendation: 'Article',
      ...(a.featuredImage ? { featuredImage: a.featuredImage } : {}),
    },
    categorySlug,
    categoryName: CATEGORY_NAMES[categorySlug] || a.category?.name,
    contentBlocks: [{ id: 'blk-0', type: 'html', order: 0, content: { html: a.content } }],
  };
}

async function main() {
  const seen = new Set();
  const docs = FILES.flatMap(loadFile).filter((a) => (seen.has(a.slug) ? false : seen.add(a.slug))).map(buildDoc);
  if (!docs.length) throw new Error(`no articles found in ${ARTICLES_DIR}`);
  console.log('Law Elite Network bundled-article seed');
  console.log(`  target : ${TARGET_BASE}`);
  console.log(`  mode   : ${flags.export ? 'EXPORT' : flags.dryRun ? 'DRY RUN' : flags.draft ? 'CREATE (DRAFT)' : 'CREATE + PUBLISH'}`);
  console.log(`  count  : ${docs.length} article(s)\n`);
  const runner = createRunner({
    base: TARGET_BASE, site: SITE, categorySlug: docs[0].categorySlug, categoryName: docs[0].categoryName,
    token: process.env.CMS_TOKEN || null, flags,
    outDir: process.env.OUT_DIR || path.join(process.env.TEMP || '/tmp', 'len-bundled-seed'),
  });
  await runner.run(docs);
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
