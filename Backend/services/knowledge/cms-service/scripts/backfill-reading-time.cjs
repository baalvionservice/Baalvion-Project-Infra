'use strict';
/*
 * One-time backfill for `readingTimeMinutes` on every published article that's
 * missing it (or has it wrong) — most visibly the 21 Creator Economy articles,
 * whose single raw-HTML content block made the backend's OLD `_extractBlockText`
 * (fixed in contentService.js) always compute 0 words -> null -> the frontend
 * fell back to counting just the excerpt (~18 words), always rounding to "1 min
 * read" regardless of real length.
 *
 * Going forward this class of bug can't recur: contentService.js now (a) reads
 * `html`/`code` block content when estimating word count, not just
 * text/caption/title/subtitle, and (b) uses 120 words/minute (not 200) as the
 * one standing formula — see WORDS_PER_MINUTE there. Every article created or
 * edited from now on gets a real, persisted value automatically. This script
 * only needs to run once, for content that predates that fix.
 *
 * The admin content LIST endpoint excludes `contentBlocks` (payload size), so
 * this fetches each article individually to get its real body before
 * recomputing — same 120 wpm formula as the backend, duplicated here only
 * because this is a client-side script, not a request the backend handles.
 *
 * USAGE
 *   node scripts/backfill-reading-time.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/backfill-reading-time.cjs
 *
 * AUTH : CMS_TOKEN = prod super_admin (or cms_editor) bearer from
 *        admin.baalvion.com (DevTools -> any /cms/ request), ~15 min TTL.
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff.
 */

const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';
const WORDS_PER_MINUTE = 120;

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

function extractBlockText(block) {
  const c = block && block.content;
  if (!c) return '';
  const htmlText = typeof c.html === 'string' ? c.html.replace(/<[^>]+>/g, ' ') : '';
  return [c.text, c.caption, c.title, c.subtitle, htmlText, c.code].filter((v) => typeof v === 'string').join(' ');
}

function estimateReadingTime(contentBlocks) {
  const wordCount = (contentBlocks || [])
    .map(extractBlockText)
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return wordCount ? Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)) : null;
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
  console.log('Reading-time backfill (120 words/minute)');
  console.log(`  target : ${TARGET_BASE}`);
  console.log(`  site   : ${SITE}`);
  console.log(`  mode   : ${DRY_RUN ? 'DRY RUN' : 'UPDATE'}\n`);

  if (!DRY_RUN && !TOKEN) throw new Error('No CMS_TOKEN set — provide a prod bearer (cms_editor or higher) to update.');

  const list = await allPublishedArticles();
  console.log(`  found  : ${list.length} published article(s)\n`);

  let changed = 0, unchanged = 0, skipped = 0;
  for (const item of list) {
    let full;
    try {
      const res = await api('GET', `/cms/websites/${encodeURIComponent(SITE)}/content/${item.id}`);
      full = res?.data;
    } catch (e) {
      console.warn(`  ! could not fetch ${item.slug}: ${e.message}`);
      skipped++;
      continue;
    }
    const estimated = estimateReadingTime(full?.contentBlocks);
    const current = item.readingTimeMinutes ?? null;

    if (estimated === null) {
      console.warn(`  ! ${item.slug}: no extractable text in contentBlocks, leaving as-is (was ${current ?? 'unset'})`);
      skipped++;
      continue;
    }
    if (current === estimated) {
      unchanged++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  ~ ${item.slug}: ${current ?? 'unset'} -> ${estimated} min`);
      changed++;
      continue;
    }

    await api('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/content/${item.id}`, { readingTimeMinutes: estimated });
    console.log(`  ✓ ${item.slug}: ${current ?? 'unset'} -> ${estimated} min`);
    changed++;
  }

  console.log(
    `\n${DRY_RUN ? '(dry run) ' : ''}${changed} changed, ${unchanged} already correct, ${skipped} skipped.`
  );
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
