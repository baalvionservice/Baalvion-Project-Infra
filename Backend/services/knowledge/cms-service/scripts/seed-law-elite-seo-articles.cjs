'use strict';
/*
 * Seed production-grade legal guide articles into the Law Elite Network CMS and publish.
 * All Law Elite editorial content is centrally managed in the admin console (cms-service);
 * this pipeline pushes the authored articles up as CMS content so they render at /article/<slug>.
 *
 * Source : ../../../../../content/seo-articles/law-elite-network/*.md   (frontmatter + markdown)
 *          override with LAW_CONTENT_DIR
 * Engine : ./cms-seed-lib.cjs
 *
 * Law Elite's reader (Frontend/.../src/lib/cms.ts → blocksToHtml) only special-cases
 * `heading` + `html` blocks, so we convert with { htmlOnly: true } — callouts, quotes,
 * tables, dividers all become html blocks that render correctly.
 *
 * USAGE (identical flags to the Imperialpedia seeder)
 *   node scripts/seed-law-elite-seo-articles.cjs --export
 *   CMS_TOKEN=<bearer> node scripts/seed-law-elite-seo-articles.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/seed-law-elite-seo-articles.cjs            # create + publish
 *   CMS_TOKEN=<bearer> node scripts/seed-law-elite-seo-articles.cjs --update   # PATCH existing + create new
 */

const fs = require('fs');
const path = require('path');
const { markdownToBlocks, wordCount, slugify, createRunner } = require('./cms-seed-lib.cjs');

const SITE = process.env.WEBSITE_SLUG || 'law-elite-network';
const CATEGORY_SLUG = process.env.CATEGORY_SLUG || 'legal-guides';
const CATEGORY_NAME = 'Legal Guides';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';
const CONTENT_DIR = process.env.LAW_CONTENT_DIR
  || path.resolve(__dirname, '../../../../../content/seo-articles/law-elite-network');

const ARGS = process.argv.slice(2);
const FLAG = (n) => ARGS.includes(`--${n}`);
const OPT = (n) => { const h = ARGS.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=').slice(1).join('=') : undefined; };
const ONLY = OPT('only');
const flags = { export: FLAG('export'), dryRun: FLAG('dry-run'), update: FLAG('update') };

const HOUSE_AUTHOR = { name: 'Law Elite Editorial', title: 'Legal Research & Editorial Desk', site: 'LawEliteNetwork.com' };

// ── minimal frontmatter parser (title/metaTitle/metaDescription/slug/category/keywords) ──
function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      meta[key] = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      meta[key] = val.replace(/^["']|["']$/g, '');
    }
  }
  return { meta, body: m[2] };
}

// First H1 in the body is the article title; the converter skips it but we use it for `title`.
function extractTitle(body, fallback) {
  const h1 = body.match(/^#\s+(.+)$/m);
  return h1 ? h1[1].trim() : fallback;
}

// A short excerpt = first real paragraph of the body.
function firstParagraph(body) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  let started = false;
  for (const l of lines) {
    const t = l.trim();
    if (/^#\s/.test(t)) { started = true; continue; }
    if (started && t && !t.startsWith('#')) return t.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  }
  return '';
}

function loadArticles() {
  if (!fs.existsSync(CONTENT_DIR)) throw new Error(`Law content dir not found: ${CONTENT_DIR}`);
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md')).sort();
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    const slug = slugify(meta.slug || file.replace(/\.md$/, ''));
    const title = meta.title || extractTitle(body, slug);
    const excerpt = meta.metaDescription || firstParagraph(body).slice(0, 300);
    return { file, slug, title, meta, body, excerpt };
  });
}

function buildDoc(a) {
  const contentBlocks = markdownToBlocks(a.body, { htmlOnly: true });
  const words = wordCount(a.body);
  const keywords = Array.isArray(a.meta.keywords) ? a.meta.keywords : [];
  const alphabet = (a.title || '#').trim().charAt(0).toUpperCase();
  return {
    title: a.title,
    slug: a.slug,
    contentType: 'article',
    excerpt: a.excerpt,
    visibility: 'public',
    seoMetadata: { title: a.meta.metaTitle || a.title, description: a.meta.metaDescription || a.excerpt, keywords },
    customFields: {
      author: HOUSE_AUTHOR,
      wordCount: words,
      readingTime: `${Math.max(1, Math.round(words / 200))} min read`,
      focusKeyword: keywords[0] || '',
      secondaryKeywords: keywords.slice(1),
      alphabet: /[A-Z]/.test(alphabet) ? alphabet : '#',
      category: a.meta.category || CATEGORY_NAME,
      schemaRecommendation: 'Article',
    },
    contentBlocks,
  };
}

async function main() {
  const all = loadArticles().filter((a) => !ONLY || a.slug === ONLY);
  if (!all.length) throw new Error(ONLY ? `--only=${ONLY} matched no file` : `no .md articles in ${CONTENT_DIR}`);
  console.log('Law Elite Network legal-guide seed');
  console.log(`  target : ${TARGET_BASE}`);
  console.log(`  site   : ${SITE}   category: ${CATEGORY_SLUG}`);
  console.log(`  source : ${CONTENT_DIR}`);
  console.log(`  mode   : ${flags.export ? 'EXPORT' : flags.dryRun ? 'DRY RUN' : flags.update ? 'UPDATE + CREATE' : 'CREATE + PUBLISH'}`);
  console.log(`  count  : ${all.length} article(s)\n`);

  const docs = all.map(buildDoc);
  const runner = createRunner({
    base: TARGET_BASE, site: SITE, categorySlug: CATEGORY_SLUG, categoryName: CATEGORY_NAME,
    token: process.env.CMS_TOKEN || null, flags,
    outDir: process.env.OUT_DIR || path.join(process.env.TEMP || '/tmp', 'law-elite-seed'),
  });
  await runner.run(docs);
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
