#!/usr/bin/env node
'use strict';
/**
 * Bake the Personal Finance content into a static snapshot committed to the repo:
 *   content/personal-finance/**.json  →  src/generated/personal-finance-content.json
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

const ROOT = path.resolve(__dirname, '..', 'content', 'personal-finance');
const ARTICLES_DIR = path.join(ROOT, 'articles');
const PAGES_DIR = path.join(ROOT, 'pages');
const OUT = path.resolve(__dirname, '..', 'src', 'generated', 'personal-finance-content.json');

// Fixed timestamp keeps the generated file stable across runs (no spurious git diffs).
const PUBLISHED = '2026-06-20T00:00:00.000Z';
const CATEGORY = { id: 'pf-personal-finance', name: 'Personal Finance', slug: 'personal-finance' };

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

function toCmsContent(spec, contentType) {
  const doc = buildContentDoc(spec, { contentType, appendAuthor: contentType === 'article' });
  return {
    id: `static-${spec.slug}`,
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt,
    featuredImage: null,
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
    category: contentType === 'article' ? CATEGORY : null,
    customFields: doc.customFields,
  };
}

function main() {
  const articles = readSpecs(ARTICLES_DIR).map((s) => toCmsContent(s, 'article'));
  const pages = readSpecs(PAGES_DIR).map((s) => toCmsContent(s, 'page'));
  const all = [...articles, ...pages];
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(all));
  const bytes = fs.statSync(OUT).size;
  console.log(
    `Wrote ${all.length} docs (${articles.length} articles, ${pages.length} pages) → ` +
      `${path.relative(process.cwd(), OUT)} (${(bytes / 1024).toFixed(0)} KB)`,
  );
}

main();
