'use strict';
/*
 * Reassigns the 21 live "Creator Economy" articles from their current bylines
 * (a mix of unset authorId=1 and a fictional house persona that was never a
 * real cms_authors record) to the three real, named contributors who actually
 * write this vertical: Vishal Mankare, Sasmita Gamel, Bismita Kar (see
 * Frontend/Imperialpedia-main/src/config/authors.ts for their verified
 * name/title/LinkedIn — nothing else about them is asserted).
 *
 * Per instruction, this vertical does NOT get a reviewer/fact-checker byline —
 * any `reviewer`/`factChecker`/`reviewerSlug`/`factCheckerSlug` keys already on
 * these articles are stripped, not just left stale. `AuthorBioCard` and the
 * Article JSON-LD (schema-service.ts) already render those fields as fully
 * optional, so removing them is safe — the page just shows the writer.
 *
 * The 21 target slugs are hardcoded rather than filtered by a live category
 * query — confirmed 2026-09-17 via the public content API
 * (GET /public/imperialpedia/content?contentType=article) that these are
 * exactly and only the "Creator Economy" (categoryId 6118148f-...) articles.
 * Deterministic round-robin by slug (alphabetical), so re-runs are idempotent.
 *
 * USAGE
 *   node scripts/rotate-creator-economy-authors.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/rotate-creator-economy-authors.cjs
 *
 * AUTH : CMS_TOKEN = prod super_admin (or cms_editor) bearer from
 *        admin.baalvion.com (DevTools → any /cms/ request), ~15 min TTL.
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff.
 */

const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';

const ROSTER = [
  { slug: 'vishal-mankare', name: 'Vishal Mankare', title: 'Digital Media & Technology Writer' },
  { slug: 'sasmita-gamel', name: 'Sasmita Gamel', title: 'Digital Media & Social Media Writer' },
  { slug: 'bismita-kar', name: 'Bismita Kar', title: 'Digital Media & Social Media Writer' },
];

// The 21 live Creator Economy article slugs (categoryId 6118148f-e47c-44a2-9f3e-93ae52feae49).
const TARGET_SLUGS = [
  'ad-revenue-sharing-models-and-cpm-trends',
  'adsense-payment-schedules-and-threshold-rules',
  'affiliate-marketing-commission-structures-and-tracking',
  'benchmarking-instagram-creator-sponsorship-rates',
  'building-a-sustainable-digital-media-business',
  'calculating-page-rpm-and-session-revenue',
  'creator-contract-essentials-and-invoice-payment-terms',
  'cross-platform-payout-comparison-tiktok-youtube-and-x',
  'display-ad-networks-mediavine-vs-raptive-vs-ezoic',
  'diversifying-income-sponsorships-ad-revenue-digital-goods',
  'how-platform-creator-funds-calculate-rpm',
  'instagram-creator-subscriptions-and-reel-bonus-rules',
  'platform-payout-comparison-chart',
  'rate-sheets-and-media-kit-templates-for-creators',
  'rpm-and-cpm-calculator-for-youtube-and-web-creators',
  'sponsored-post-rate-benchmarks-for-micro-influencers',
  'sponsorship-rate-estimator-tool',
  'taxes-for-creators-deductions-quarterly-estimates-and-llcs',
  'youtube-partner-program-vs-direct-brand-deals',
  'youtube-rpm-vs-cpm-explained',
  'youtube-shorts-monetization-vs-long-form-payout-rates',
].sort();

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

async function allPublished() {
  const items = [];
  for (let page = 1; page <= 50; page++) {
    const res = await api('GET', `/cms/websites/${encodeURIComponent(SITE)}/content?status=published&page=${page}&limit=100`);
    const pageItems = res?.data ?? [];
    items.push(...pageItems);
    const pg = res?.pagination;
    if (!pg || !pg.hasNext || pageItems.length === 0) break;
  }
  return items;
}

async function main() {
  console.log('Creator Economy author rotation');
  console.log(`  target : ${TARGET_BASE}`);
  console.log(`  site   : ${SITE}`);
  console.log(`  mode   : ${DRY_RUN ? 'DRY RUN' : 'UPDATE'}`);
  console.log(`  roster : ${ROSTER.map((r) => r.name).join(', ')}`);
  console.log(`  target : ${TARGET_SLUGS.length} Creator Economy article(s)\n`);

  if (!DRY_RUN && !TOKEN) throw new Error('No CMS_TOKEN set — provide a prod bearer (cms_editor or higher) to update.');

  const allArticles = await allPublished();
  const bySlug = new Map(allArticles.map((a) => [a.slug, a]));

  const missing = TARGET_SLUGS.filter((s) => !bySlug.has(s));
  if (missing.length) {
    console.warn(`  ! ${missing.length} target slug(s) not found among published content (skipping): ${missing.join(', ')}`);
  }

  const found = TARGET_SLUGS.filter((s) => bySlug.has(s));
  let changed = 0;
  for (let i = 0; i < found.length; i++) {
    const article = bySlug.get(found[i]);
    const assignee = ROSTER[i % ROSTER.length];
    const cf = article.customFields || {};
    const {
      author: _oldAuthor,
      authorSlug: oldAuthorSlug,
      reviewer: _oldReviewer,
      factChecker: _oldFactChecker,
      reviewerSlug: _oldReviewerSlug,
      factCheckerSlug: _oldFactCheckerSlug,
      ...rest
    } = cf;

    if (oldAuthorSlug === assignee.slug && !_oldReviewer && !_oldFactChecker && !_oldReviewerSlug && !_oldFactCheckerSlug) {
      console.log(`  = already ${assignee.name}, no reviewer/fact-checker  ${article.slug}`);
      continue;
    }

    const nextCustomFields = {
      ...rest,
      author: { name: assignee.name, title: assignee.title },
      authorSlug: assignee.slug,
    };

    if (DRY_RUN) {
      console.log(`  ~ would set ${assignee.name}  ${article.slug}  (was authorSlug: ${oldAuthorSlug || 'unset'}${_oldReviewer || _oldReviewerSlug ? ', dropping reviewer' : ''}${_oldFactChecker || _oldFactCheckerSlug ? ', dropping fact-checker' : ''})`);
      changed++;
      continue;
    }

    await api('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/content/${article.id}`, {
      customFields: nextCustomFields,
    });
    console.log(`  ✓ set ${assignee.name}  ${article.slug}`);
    changed++;
  }

  console.log(
    DRY_RUN
      ? `\n(dry run — ${changed} would change, nothing was updated)`
      : `\n✓ complete. ${changed} article(s) updated.`
  );
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
