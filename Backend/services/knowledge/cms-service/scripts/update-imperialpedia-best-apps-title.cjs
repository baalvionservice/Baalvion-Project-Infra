'use strict';
/*
 * Updates the title on /personal-finance/best-personal-finance-apps from
 * "...in 2024" to "...in 2024 to 2026" (H1/on-page title + SEO <title>/OG title),
 * so the page reads as freshly maintained rather than a stale 2024 guide.
 *
 * USAGE
 *   node scripts/update-imperialpedia-best-apps-title.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/update-imperialpedia-best-apps-title.cjs
 *
 * AUTH : CMS_TOKEN = prod super_admin bearer from admin.baalvion.com (DevTools → any /cms/ request).
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff.
 */

const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';
const SLUG = 'best-personal-finance-apps';
const NEW_TITLE = 'Best Personal Finance Apps to Manage Your Money in 2024 to 2026';

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const TOKEN = process.env.CMS_TOKEN || null;

async function api(method, urlPath, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`${TARGET_BASE.replace(/\/+$/, '')}${urlPath}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* */ }
  if (!res.ok) {
    const msg = (json && (json.error?.message || json.message)) || text || res.statusText;
    throw new Error(`${method} ${urlPath} → ${res.status} ${msg}`);
  }
  return json;
}

async function findBySlug(slug) {
  for (let page = 1; page <= 50; page++) {
    const res = await api('GET', `/cms/websites/${encodeURIComponent(SITE)}/content?page=${page}&limit=100`);
    const items = res?.data ?? [];
    const found = items.find((it) => it.slug === slug);
    if (found) return found;
    const pg = res?.pagination;
    if (!pg || !pg.hasNext || items.length === 0) break;
  }
  return null;
}

async function main() {
  console.log('Imperialpedia best-personal-finance-apps title update');
  console.log(`  target : ${TARGET_BASE}`);
  console.log(`  site   : ${SITE}`);
  console.log(`  mode   : ${DRY_RUN ? 'DRY RUN' : 'UPDATE'}`);
  console.log(`  new title : ${NEW_TITLE}\n`);

  if (!DRY_RUN && !TOKEN) throw new Error('No CMS_TOKEN set — provide a prod super_admin bearer to update.');

  const article = await findBySlug(SLUG);
  if (!article) throw new Error(`Article not found: ${SLUG}`);

  console.log(`  current title      : ${article.title}`);
  console.log(`  current seo.title  : ${article.seoMetadata?.title || '(unset)'}`);
  console.log(`  current seo.ogTitle: ${article.seoMetadata?.ogTitle || '(unset)'}\n`);

  if (DRY_RUN) {
    console.log('~ would update title, seoMetadata.title, seoMetadata.ogTitle');
    return;
  }

  await api('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/content/${article.id}`, {
    title: NEW_TITLE,
    seoMetadata: {
      ...(article.seoMetadata || {}),
      title: NEW_TITLE,
      ogTitle: NEW_TITLE,
    },
  });
  console.log('✓ updated.');
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
