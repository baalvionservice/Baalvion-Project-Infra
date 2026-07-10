#!/usr/bin/env node
'use strict';
/**
 * Bake editorial content packs into one static snapshot committed to the repo:
 *   content/<pack>/**.json  →  src/generated/personal-finance-content.json
 *
 * The snapshot is an array of CMS-public-shaped documents (the exact shape the CMS
 * public delivery API returns), so the frontend's existing converters
 * (cmsContentToArticle / cmsContentToNews / blocksToHtml) render it identically to
 * live CMS content. This is the always-on source that lets Vercel serve the content
 * with no external CMS; a reachable CMS still takes precedence at request time.
 *
 * Re-run whenever the content specs change:  node scripts/generate-static-content.cjs
 */

const fs = require('fs');
const path = require('path');
const { buildContentDoc } = require('./lib/content-builder.cjs');

const CONTENT_ROOT = path.resolve(__dirname, '..', 'content');
const OUT = path.resolve(__dirname, '..', 'src', 'generated', 'personal-finance-content.json');
const ARTWORK_OUT_DIR = path.resolve(__dirname, '..', 'public', 'images', 'articles');

// One entry per editorial content pack (topic-config.ts category slug). Add a new
// pack here + a matching `content/<dir>/articles/*.json` folder to bake a new
// category — everything else (artwork, static-content.ts lookup) is generic.
const PACKS = [
  { dir: 'personal-finance', category: { id: 'pf-personal-finance', name: 'Personal Finance', slug: 'personal-finance' } },
  { dir: 'investing', category: { id: 'inv-investing', name: 'Investing', slug: 'investing' } },
  { dir: 'economy', category: { id: 'econ-economy', name: 'Economy', slug: 'economy' } },
];

// Fixed timestamp keeps the generated file stable across runs (no spurious git diffs).
const PUBLISHED = '2026-06-20T00:00:00.000Z';

function readSpecs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const spec = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      if (!spec.slug) spec.slug = path.basename(f, '.json');
      return spec;
    })
    .sort((a, b) => (a.topicNumber || 0) - (b.topicNumber || 0));
}

function toCmsContent(spec, contentType, category) {
  const artwork = contentType === 'article'
    ? { outDir: ARTWORK_OUT_DIR, category: category.name, publicPrefix: '/images/articles' }
    : undefined;
  const doc = buildContentDoc(spec, {
    contentType,
    appendAuthor: contentType === 'article',
    artwork,
  });
  return {
    id: `static-${spec.slug}`,
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt,
    featuredImage: doc.featuredImage || null,
    contentType,
    contentBlocks: doc.contentBlocks,
    tagIds: [],
    seoMetadata: doc.seoMetadata,
    status: 'published',
    visibility: 'public',
    authorId: 'imperialpedia',
    publishedAt: PUBLISHED,
    updatedAt: PUBLISHED,
    viewCount: 0,
    category: contentType === 'article' ? category : null,
    customFields: doc.customFields,
  };
}

function main() {
  const bySlug = (a, b) => a.slug.localeCompare(b.slug);
  let totalArticles = 0;
  let totalPages = 0;
  const all = [];
  const summary = [];

  for (const pack of PACKS) {
    const root = path.join(CONTENT_ROOT, pack.dir);
    const articles = readSpecs(path.join(root, 'articles'))
      .map((s) => toCmsContent(s, 'article', pack.category))
      .sort(bySlug);
    const pages = readSpecs(path.join(root, 'pages'))
      .map((s) => toCmsContent(s, 'page', pack.category))
      .sort(bySlug);
    all.push(...articles, ...pages);
    totalArticles += articles.length;
    totalPages += pages.length;
    summary.push(`${pack.dir}: ${articles.length} articles, ${pages.length} pages`);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(all));
  const bytes = fs.statSync(OUT).size;
  console.log(
    `Wrote ${all.length} docs (${totalArticles} articles, ${totalPages} pages) → ` +
      `${path.relative(process.cwd(), OUT)} (${(bytes / 1024).toFixed(0)} KB)\n  ${summary.join('\n  ')}`,
  );
}

main();
