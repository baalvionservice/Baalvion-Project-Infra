'use strict';
/*
 * Spreads Imperialpedia's clustered publishedAt dates into a natural-looking
 * organic cadence. As of 2026-09-23 all 46 live articles fall on just 5
 * distinct calendar days — 18 on 2026-07-16, 5 on 2026-09-03, 21 on
 * 2026-09-15 (plus 2 singletons) — the exact signature of a bulk/bot import
 * rather than an editorial team publishing over time, which reads badly to
 * an AdSense reviewer (or anyone checking Search Console's indexing history).
 *
 * Algorithm: sort every published article by its current (publishedAt,
 * slug), then spread them evenly across the full window from the earliest
 * existing date up to "today" — preserving relative order (nothing moves
 * out of its original sequence, articles just spread out) and never placing
 * a date in the future. With 46 articles across ~81 days that's roughly one
 * every 1.8 days, which reads as a normal publishing pace.
 *
 * Re-running is safe and idempotent for review: with --dry-run it always
 * recomputes the same target schedule from the CURRENT live dates, so it
 * converges (a second real run after the first would compute ~0 days of
 * drift, not re-shuffle everything again) as long as nothing else changes
 * `today` or adds new articles in between.
 *
 * USAGE
 *   node scripts/destagger-imperialpedia-publish-dates.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/destagger-imperialpedia-publish-dates.cjs
 *
 * AUTH : CMS_TOKEN = prod super_admin (or cms_editor) bearer from
 *        admin.baalvion.com (DevTools -> any /cms/ request), ~15 min TTL.
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff.
 *
 * Standing procedure (decided 2026-09-23): re-run this after any future
 * bulk-publish batch to fold the new articles into the spread. For NEW
 * batches, prefer preventing the clustering at publish time instead — see
 * scripts/lib/staggerPublishDates.cjs, whose spreadDates() this script also
 * uses, and workflowSchemas.js's transitionSchema, which now accepts an
 * explicit publishedAt override on the "publish" action for exactly this.
 */

const { spreadDates, toDateOnly, fmtDate } = require('./lib/staggerPublishDates.cjs');

const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';

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

async function allPublishedArticles() {
  const items = [];
  for (let page = 1; page <= 50; page++) {
    const res = await api('GET', `/cms/websites/${encodeURIComponent(SITE)}/content?status=published&contentType=article&page=${page}&limit=100`);
    const pageItems = res?.data ?? [];
    items.push(...pageItems);
    const pg = res?.pagination;
    if (!pg || !pg.hasNext || pageItems.length === 0) break;
  }
  return items;
}

async function main() {
  console.log('Imperialpedia publish-date de-staggering');
  console.log(`  target : ${TARGET_BASE}`);
  console.log(`  site   : ${SITE}`);
  console.log(`  mode   : ${DRY_RUN ? 'DRY RUN' : 'UPDATE'}\n`);

  if (!DRY_RUN && !TOKEN) throw new Error('No CMS_TOKEN set — provide a prod bearer (cms_editor or higher) to update.');

  const list = await allPublishedArticles();
  console.log(`  found  : ${list.length} published article(s)\n`);
  if (list.length === 0) return;

  const sorted = list
    .map((a) => ({ ...a, _origIso: a.publishedAt || a.createdAt }))
    .sort((a, b) => (a._origIso < b._origIso ? -1 : a._origIso > b._origIso ? 1 : a.slug < b.slug ? -1 : 1));

  const start = toDateOnly(sorted[0]._origIso);
  const today = toDateOnly(new Date().toISOString());
  const targets = spreadDates(start, today, sorted.length);

  // Preserve original time-of-day so this only touches the calendar day, not
  // the hour — a fixed 09:00 UTC keeps every timestamp readable and distinct
  // from a literal midnight stamp (another bot tell).
  let changed = 0, unchanged = 0;
  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const origDay = fmtDate(toDateOnly(item._origIso));
    const newDay = fmtDate(targets[i]);
    if (origDay === newDay) { unchanged++; continue; }

    const newIso = `${newDay}T09:00:00.000Z`;
    if (DRY_RUN) {
      console.log(`  ~ ${item.slug}: ${origDay} -> ${newDay}`);
    } else {
      await api('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/content/${item.id}`, { publishedAt: newIso });
      console.log(`  ✓ ${item.slug}: ${origDay} -> ${newDay}`);
    }
    changed++;
  }

  console.log(`\n${DRY_RUN ? '(dry run) ' : ''}${changed} changed, ${unchanged} already unique.`);
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
