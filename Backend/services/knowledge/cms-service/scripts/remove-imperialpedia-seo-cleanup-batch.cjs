'use strict';
/*
 * Deletes the batch of Imperialpedia articles flagged for the AdSense-readiness
 * content cleanup — thin/low-value news recaps and evergreen guides the site
 * doesn't want indexed. Same pattern as remove-imperialpedia-bonds-article.cjs
 * and remove-imperialpedia-offtopic-content.cjs: archive (workflow transition)
 * then hard-delete via the admin CMS API. Removed URLs 404 through the existing
 * `[...slug]` catch-all — no separate redirect/410 handling needed.
 *
 * USAGE
 *   node scripts/remove-imperialpedia-seo-cleanup-batch.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/remove-imperialpedia-seo-cleanup-batch.cjs
 *
 * AUTH : CMS_TOKEN = prod super_admin bearer from admin.baalvion.com (DevTools → any /cms/ request).
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff.
 */

const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';

const SLUGS_TO_REMOVE = [
  // 2026-07-29
  'robo-advisors-vs-human-financial-advisors-2',
  'how-to-switch-financial-advisors',
  'how-to-evaluate-a-financial-advisor',
  'fiduciary-standard-explained',
  'fee-only-vs-fee-based-advisors',
  'common-financial-advisor-fees',
  // 2026-07-16
  'robo-advisors-vs-human-financial-advisors',
  'robo-advisor-account-minimums-and-account-types',
  'order-execution-quality-explained',
  'insurance-shopping-red-flags',
  'insurance-complaint-ratios-and-claim-satisfaction',
  'insurance-broker-vs-captive-agent',
  'how-to-evaluate-a-brokers-platform-and-tools',
  'how-robo-advisors-automate-tax-loss-harvesting',
  'how-commission-free-brokers-make-money',
  'credit-card-rewards-programs-compared',
  'credit-card-fine-print-red-flags',
  'cash-vs-margin-brokerage-accounts',
  'bundling-insurance-policies-pros-and-cons',
  'balance-transfer-offers-explained',
  'automatic-portfolio-rebalancing-explained',
  'are-credit-card-annual-fees-worth-it',
  // 2026-03-15
  'sp500-record-high-earnings',
  'fed-holds-rates-inflation-cooling',
  'bitcoin-surges-institutional-demand',
  // 2026-03-14
  'tech-stocks-ai-spending-boom',
  'housing-market-cools-mortgage-rates',
  // 2026-03-13
  'treasury-yields-jobs-data',
  'best-high-yield-savings-accounts-2026',
  // 2026-03-12
  'gold-hits-2400-safe-haven',
  'etf-inflows-record-february',
];

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

async function existingSlugMap() {
  const map = new Map();
  for (let page = 1; page <= 50; page++) {
    const res = await api('GET', `/cms/websites/${encodeURIComponent(SITE)}/content?page=${page}&limit=100`);
    const items = res?.data ?? [];
    items.forEach((it) => it.slug && map.set(it.slug, it.id));
    const pg = res?.pagination;
    if (!pg || !pg.hasNext || items.length === 0) break;
  }
  return map;
}

async function main() {
  console.log('Imperialpedia SEO-cleanup batch removal');
  console.log(`  target : ${TARGET_BASE}`);
  console.log(`  site   : ${SITE}`);
  console.log(`  mode   : ${DRY_RUN ? 'DRY RUN' : 'DELETE'}`);
  console.log(`  count  : ${SLUGS_TO_REMOVE.length} slugs\n`);

  if (!DRY_RUN && !TOKEN) throw new Error('No CMS_TOKEN set — provide a prod super_admin bearer to delete.');

  const existing = await existingSlugMap();
  let deleted = 0;
  let missing = 0;
  for (const slug of SLUGS_TO_REMOVE) {
    const id = existing.get(slug);
    if (!id) { console.log(`  = not found (already gone / slug mismatch?)  ${slug}`); missing++; continue; }
    if (DRY_RUN) { console.log(`  ~ would archive + delete  ${slug}  (${id})`); continue; }
    try {
      await api('POST', `/cms/websites/${encodeURIComponent(SITE)}/content/${id}/workflow/transition`, { action: 'archive' });
    } catch (e) { console.log(`    (archive step: ${e.message})`); }
    await api('DELETE', `/cms/websites/${encodeURIComponent(SITE)}/content/${id}`);
    console.log(`  ✓ archived + deleted  ${slug}  (${id})`);
    deleted++;
  }
  console.log(
    DRY_RUN
      ? '\n(dry run — nothing was deleted)'
      : `\n✓ complete. ${deleted} deleted, ${missing} not found.`
  );
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
