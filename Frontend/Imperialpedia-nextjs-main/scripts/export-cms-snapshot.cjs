#!/usr/bin/env node
'use strict';
/**
 * Export the LIVE published CMS content into the committed snapshot:
 *   cms-service public delivery API  →  src/generated/personal-finance-content.json
 *
 * Use this to sync admin-panel edits to the repo so they reach Vercel:
 *   1) edit content in the admin console (admin-platform → cms-service)
 *   2) node scripts/export-cms-snapshot.cjs   (a.k.a. `pnpm run export:cms`)
 *   3) git commit + push  →  Vercel rebuilds and serves the updated content
 *
 * It reads ONLY published, public content (the same the live site serves), and
 * writes the exact CMS-public shape the frontend already renders — so the offline
 * snapshot stays identical to the live CMS. A reachable CMS still wins at runtime.
 *
 *   CMS_PUBLIC_URL  default http://localhost:3011/api/v1/public
 *   WEBSITE_SLUG    default imperialpedia
 *   CATEGORY_SLUG   default personal-finance   (which articles to include)
 *
 * Point CMS_PUBLIC_URL at a hosted CMS to export from production instead of local.
 */

const fs = require('fs');
const path = require('path');

const CMS_PUBLIC = (process.env.CMS_PUBLIC_URL || 'http://localhost:3011/api/v1/public').replace(/\/$/, '');
const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const CATEGORY = process.env.CATEGORY_SLUG || 'personal-finance';
// Only these page docs are part of this snapshot (keeps it in sync with the specs and
// avoids pulling unrelated CMS pages). Override with PAGE_SLUGS="a,b,c".
const PAGE_SLUGS = (process.env.PAGE_SLUGS || 'about,contact,privacy-policy')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const OUT = path.resolve(__dirname, '..', 'src', 'generated', 'personal-finance-content.json');

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

// Paginate a public content list query → array of summaries.
async function listAll(params) {
  const out = [];
  for (let page = 1; page <= 50; page++) {
    const qs = new URLSearchParams({ ...params, page: String(page), limit: '100' }).toString();
    const env = await getJson(`${CMS_PUBLIC}/${SITE}/content?${qs}`);
    out.push(...(env.data || []));
    const p = env.pagination;
    if (!p || page >= (p.totalPages || 1)) break;
  }
  return out;
}

// Live content → the snapshot shape the frontend renders (matches generate-static-content).
function normalize(full, contentType) {
  return {
    id: full.id,
    slug: full.slug,
    title: full.title,
    excerpt: full.excerpt ?? '',
    featuredImage: full.featuredImage ?? null,
    contentType,
    contentBlocks: full.contentBlocks || [],
    tagIds: full.tagIds || [],
    seoMetadata: full.seoMetadata || {},
    status: 'published',
    visibility: 'public',
    authorId: full.authorId != null ? String(full.authorId) : 'imperialpedia',
    publishedAt: full.publishedAt || full.updatedAt || null,
    updatedAt: full.updatedAt || full.publishedAt || null,
    viewCount: 0, // normalized — never let the live view counter churn the snapshot
    category:
      contentType === 'article'
        ? full.category
          ? { id: full.category.id, name: full.category.name, slug: full.category.slug }
          : { id: 'pf-personal-finance', name: 'Personal Finance', slug: CATEGORY }
        : null,
    customFields: full.customFields || {},
  };
}

async function fetchFull(summaries, contentType) {
  const out = [];
  for (const s of summaries) {
    const env = await getJson(`${CMS_PUBLIC}/${SITE}/content/${encodeURIComponent(s.slug)}`);
    out.push(normalize(env.data, contentType));
  }
  return out;
}

async function main() {
  // Confirm the website resolves before doing work (clear error if CMS is down).
  await getJson(`${CMS_PUBLIC}/${SITE}`);

  const artSummaries = await listAll({ contentType: 'article', categorySlug: CATEGORY });
  const pageSummaries = (await listAll({ contentType: 'page' })).filter((p) => PAGE_SLUGS.includes(p.slug));

  const articles = (await fetchFull(artSummaries, 'article')).sort((a, b) => a.slug.localeCompare(b.slug));
  const pages = (await fetchFull(pageSummaries, 'page')).sort((a, b) => a.slug.localeCompare(b.slug));
  const all = [...articles, ...pages];

  if (!all.length) {
    console.error('Refusing to write an empty snapshot — is the CMS reachable and seeded?');
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(all));
  const bytes = fs.statSync(OUT).size;
  console.log(
    `Exported ${all.length} docs (${articles.length} articles, ${pages.length} pages) from ` +
      `${CMS_PUBLIC}/${SITE} → ${path.relative(process.cwd(), OUT)} (${(bytes / 1024).toFixed(0)} KB)`,
  );
}

main().catch((e) => {
  console.error('export failed:', e.message);
  process.exit(1);
});
