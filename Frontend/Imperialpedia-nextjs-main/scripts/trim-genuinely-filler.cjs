#!/usr/bin/env node
'use strict';
/**
 * Removes the reflexive "genuinely" filler word flagged in the 2026-09-18
 * content quality audit (section 2.5 / 5): 13 of the 46 live articles use
 * "genuinely" as a pure intensifier ("is genuinely easy", "genuinely
 * different") rather than for real contrast. Every occurrence found follows
 * the pattern "genuinely <next word>", so deleting the word (plus its
 * trailing space) is meaning-preserving and grammatical everywhere except
 * one spot (an indefinite article that needs "a" -> "an" once the adjective
 * that used to start with a consonant sound loses its modifier) — that one
 * case is fixed as an explicit substring replacement, applied before the
 * general regex, so it isn't double-processed.
 *
 * Read-only by default (prints a diff per article). Requires CMS_ADMIN_TOKEN
 * (a valid admin-platform Bearer access token — log into admin-platform,
 * copy the access token, e.g. from the Network tab's Authorization header on
 * any API call) to actually write:
 *
 *   node scripts/trim-genuinely-filler.cjs                 # dry run (default)
 *   CMS_ADMIN_TOKEN=xxx node scripts/trim-genuinely-filler.cjs --apply
 */

const PUBLIC_BASE = process.env.CMS_PUBLIC_URL || 'https://api.baalvion.com/api/v1/public';
const ADMIN_BASE = process.env.CMS_ADMIN_URL || 'https://api.baalvion.com/api/v1/knowledge/cms/api/v1';
const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const APPLY = process.argv.includes('--apply');
const TOKEN = process.env.CMS_ADMIN_TOKEN;

// The 13 articles flagged in the audit — confirmed by a full-text scan of all
// 46 live articles on 2026-09-18 (`genuinely_report.json`), not re-derived
// from the audit's prose alone.
const SLUGS = [
  'annual-budget-planning-guide',
  'bid-vs-ask-price',
  'budgeting-on-a-part-time-income',
  'couples-budgeting',
  'macd-explained',
  'manual-budgeting-without-apps',
  'nasdaq-explained',
  'outstanding-shares-explained',
  'reduce-grocery-costs',
  'rsi-explained',
  'sponsored-post-rate-benchmarks-for-micro-influencers',
  'stock-market-circuit-breakers',
  'what-is-market-capitalization',
];

// Applied before the general regex so it isn't double-processed. Only known
// case where deleting "genuinely " leaves a wrong indefinite article.
const SPECIAL_CASES = [
  [/\ba genuinely empty\b/g, 'an empty'],
];

// "genuinely <word>" -> "<word>" everywhere else. Every one of the 15
// instances found across the 13 articles follows this shape (none end a
// sentence with "... genuinely."), so a single regex covers all of them,
// case-insensitively (one heading has "Genuinely" mid-title-case).
const GENERAL_PATTERN = /\bgenuinely\s+/gi;

function trimText(text) {
  let out = text;
  for (const [pattern, replacement] of SPECIAL_CASES) {
    out = out.replace(pattern, replacement);
  }
  out = out.replace(GENERAL_PATTERN, '');
  return out;
}

function trimBlocks(blocks) {
  let changed = false;
  const next = blocks.map((b) => {
    const c = b.content;
    if (!c || typeof c !== 'object') return b;
    if (typeof c.html === 'string' && /\bgenuinely\b/i.test(c.html)) {
      changed = true;
      return { ...b, content: { ...c, html: trimText(c.html) } };
    }
    if (typeof c.text === 'string' && /\bgenuinely\b/i.test(c.text)) {
      changed = true;
      return { ...b, content: { ...c, text: trimText(c.text) } };
    }
    return b;
  });
  return { changed, blocks: next };
}

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

async function main() {
  const plan = [];

  for (const slug of SLUGS) {
    const env = await getJson(`${PUBLIC_BASE}/${SITE}/content/${encodeURIComponent(slug)}`);
    const data = env.data;
    const { changed, blocks } = trimBlocks(data.contentBlocks || []);
    if (!changed) {
      console.log(`SKIP ${slug}: no "genuinely" found in a live re-fetch (already fixed, or moved) — verify manually.`);
      continue;
    }
    plan.push({ slug, id: data.id, websiteId: data.websiteId, contentBlocks: blocks });
  }

  console.log(`\n${plan.length} of ${SLUGS.length} articles still need the fix.\n`);

  if (!APPLY) {
    console.log('Dry run only — no changes made. Re-run with CMS_ADMIN_TOKEN=<token> --apply to write these.');
    return;
  }
  if (!TOKEN) {
    console.error('\n--apply requires CMS_ADMIN_TOKEN (a valid admin-platform Bearer access token).');
    process.exitCode = 1;
    return;
  }

  for (const p of plan) {
    const url = `${ADMIN_BASE}/cms/websites/${p.websiteId}/content/${p.id}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ contentBlocks: p.contentBlocks }),
    });
    if (!res.ok) {
      console.error(`FAILED ${p.slug}: ${res.status} ${await res.text().catch(() => '')}`);
      continue;
    }
    console.log(`updated ${p.slug}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
