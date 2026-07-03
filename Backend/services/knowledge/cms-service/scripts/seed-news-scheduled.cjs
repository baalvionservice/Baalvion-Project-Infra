'use strict';
/*
 * Seed NEWS-type content into prod cms-service and SCHEDULE (not immediately publish) it,
 * for both imperialpedia and law-elite-network. Unlike cms-seed-lib's createRunner().run()
 * (which always calls workflow/transition {action:'publish'} immediately), this script walks
 * the full workflow state machine — draft → submit_for_review → approve → schedule — so
 * content goes live automatically at each doc's `scheduledAt` via cms-service's BullMQ
 * scheduler worker (queues/schedulerQueue.js, always running per index.js).
 *
 * Content : ./news-scheduled-articles.data.cjs  (array of { site, categorySlug, categoryName,
 *            title, slug, excerpt, markdown, scheduledAt (ISO), customFields overrides... })
 * Engine  : reuses markdownToBlocks/wordCount/slugify from ./cms-seed-lib.cjs; implements its
 *           own runner because createRunner() has no scheduling support.
 *
 * USAGE
 *   node scripts/seed-news-scheduled.cjs --export                       # build JSON, no creds
 *   CMS_TOKEN=<bearer> node scripts/seed-news-scheduled.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/seed-news-scheduled.cjs             # create + schedule
 *
 * AUTH : CMS_TOKEN = prod super_admin bearer (POST admin.baalvion.com/auth-bff/login). Super
 *        admin bypasses workflow requiredLevel checks (service/workflowService.js resolveLevel)
 *        but the `from` state-machine check still applies, so the full chain is still required.
 * BASE : defaults to prod management ingress admin.baalvion.com/api-bff/knowledge/cms/api/v1.
 */

const fs = require('fs');
const path = require('path');
const { markdownToBlocks, wordCount, slugify } = require('./cms-seed-lib.cjs');
const DOCS_IN = require('./news-scheduled-articles.data.cjs');

const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';
const THROTTLE_MS = Number(process.env.MIGRATE_THROTTLE_MS || 400);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ARGS = process.argv.slice(2);
const FLAG = (n) => ARGS.includes(`--${n}`);
const flags = { export: FLAG('export'), dryRun: FLAG('dry-run') };

let TOKEN = process.env.CMS_TOKEN || null;

async function api(method, urlPath, body, _attempt = 0) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`${TARGET_BASE}${urlPath}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 429 && _attempt < 6) {
    const ra = Number(res.headers.get('retry-after'));
    const waitMs = (Number.isFinite(ra) && ra > 0 ? ra * 1000 : 60_000) + 750;
    console.log(`  …rate-limited; waiting ${Math.round(waitMs / 1000)}s`);
    await sleep(waitMs);
    return api(method, urlPath, body, _attempt + 1);
  }
  if (res.status === 401) { const e = new Error('401 Unauthorized — CMS_TOKEN missing/expired.'); e.fatal = true; throw e; }
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* */ }
  if (!res.ok) {
    const msg = (json && (json.error?.message || json.message)) || text || res.statusText;
    const e = new Error(`${method} ${urlPath} → ${res.status} ${msg}`); e.status = res.status; throw e;
  }
  await sleep(THROTTLE_MS);
  return json;
}

function flattenTree(payload) {
  const map = new Map();
  const walk = (nodes) => { if (!Array.isArray(nodes)) return; for (const n of nodes) { if (n && n.slug && n.id) map.set(n.slug, n.id); if (n && Array.isArray(n.children)) walk(n.children); } };
  walk(payload); return map;
}

function buildDoc(a) {
  const contentBlocks = markdownToBlocks(a.markdown, { htmlOnly: !!a.htmlOnly });
  const keywords = [a.focusKeyword, ...(a.secondaryKeywords || [])].filter(Boolean);
  return {
    site: a.site,
    categorySlug: a.categorySlug,
    categoryName: a.categoryName,
    scheduledAt: a.scheduledAt,
    title: a.title,
    slug: slugify(a.slug),
    contentType: 'news',
    excerpt: a.excerpt,
    visibility: 'public',
    seoMetadata: { title: a.metaTitle || a.title, description: a.metaDescription || a.excerpt, keywords },
    customFields: {
      faq: (a.faq || []).map((f) => ({ question: f.question, answer: f.answer })),
      author: a.author,
      wordCount: wordCount(a.markdown),
      focusKeyword: a.focusKeyword,
      keyTakeaways: a.keyTakeaways || [],
      searchIntent: a.searchIntent || 'Informational',
      dateline: a.dateline,
      schemaRecommendation: 'NewsArticle',
    },
    contentBlocks,
  };
}

async function processSite(site, docs) {
  console.log(`\n── ${site} (${docs.length} doc(s)) ──`);
  const categoryCache = new Map();
  let categoryTreeFetched = false;

  async function resolveCategoryId(slug, name) {
    if (categoryCache.has(slug)) return categoryCache.get(slug);
    if (!categoryTreeFetched) {
      const existing = await api('GET', `/cms/websites/${encodeURIComponent(site)}/categories`);
      for (const [s, id] of flattenTree(existing?.data ?? existing)) categoryCache.set(s, id);
      categoryTreeFetched = true;
    }
    if (categoryCache.has(slug)) return categoryCache.get(slug);
    console.log(`  + creating category ${slug}`);
    const created = await api('POST', `/cms/websites/${encodeURIComponent(site)}/categories`, { name, slug, sortOrder: 0 });
    const id = created?.data?.id ?? created?.id;
    categoryCache.set(slug, id);
    return id;
  }

  const existingMap = new Map();
  for (let page = 1; page <= 50; page++) {
    const res = await api('GET', `/cms/websites/${encodeURIComponent(site)}/content?page=${page}&limit=100`);
    const items = res?.data ?? [];
    items.forEach((it) => it.slug && existingMap.set(it.slug, it.id));
    const pg = res?.pagination;
    if (!pg || !pg.hasNext || items.length === 0) break;
  }

  for (const d of docs) {
    const { categorySlug, categoryName, scheduledAt, ...docBody } = d;
    if (existingMap.has(d.slug)) { console.log(`  = skip (exists)  ${d.slug}`); continue; }
    if (flags.dryRun) { console.log(`  + would create+schedule  ${d.slug}  → ${scheduledAt}`); continue; }

    const categoryId = await resolveCategoryId(categorySlug, categoryName);
    const body = { ...docBody, ...(categoryId ? { categoryIds: [categoryId] } : {}) };
    const created = await api('POST', `/cms/websites/${encodeURIComponent(site)}/content`, body);
    const id = created?.data?.id ?? created?.id;
    if (!id) { console.warn(`  ⚠  create returned no id for ${d.slug}`); continue; }
    console.log(`  + created  ${d.slug}  (${id})`);

    await api('POST', `/cms/websites/${encodeURIComponent(site)}/content/${id}/workflow/transition`, { action: 'submit_for_review' });
    await api('POST', `/cms/websites/${encodeURIComponent(site)}/content/${id}/workflow/transition`, { action: 'approve' });
    await api('POST', `/cms/websites/${encodeURIComponent(site)}/content/${id}/workflow/transition`, { action: 'schedule', scheduledAt });
    console.log(`    ✓ scheduled for ${scheduledAt}`);
  }
}

async function main() {
  const docs = DOCS_IN.map(buildDoc);
  console.log('News scheduled seed');
  console.log(`  target : ${TARGET_BASE}`);
  console.log(`  mode   : ${flags.export ? 'EXPORT' : flags.dryRun ? 'DRY RUN' : 'CREATE + SCHEDULE'}`);
  console.log(`  count  : ${docs.length} doc(s)\n`);

  const outDir = process.env.OUT_DIR || path.join(process.env.TEMP || '/tmp', 'news-scheduled-seed');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'news-scheduled-seed.json');
  fs.writeFileSync(outFile, JSON.stringify(docs, null, 2));
  console.log(`  build written → ${outFile}`);
  docs.forEach((d) => console.log(`    • [${d.site}] ${d.slug.padEnd(45)} → ${d.scheduledAt}`));

  if (flags.export) { console.log('\n✓ export-only complete (no target writes).'); return; }
  if (!TOKEN) throw new Error('No CMS_TOKEN set — provide a prod super_admin bearer to write.');

  const bySite = new Map();
  for (const d of docs) { if (!bySite.has(d.site)) bySite.set(d.site, []); bySite.get(d.site).push(d); }
  for (const [site, siteDocs] of bySite) await processSite(site, siteDocs);

  console.log('\n✓ complete.');
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
