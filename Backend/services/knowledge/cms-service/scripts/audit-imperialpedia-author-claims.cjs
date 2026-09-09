'use strict';
/*
 * Audits every Imperialpedia author bio for claims about the author's
 * relationship to Imperialpedia that a reviewer can check against the site
 * itself, and fixes the one class of defect that is unambiguously a defect.
 *
 * WHY THIS EXISTS
 * The 34-person roster is real and confirmed by the site owner — this script
 * does not question that and does not touch who is on it. What it checks is
 * narrower: whether the *sentences* about Imperialpedia in each bio agree with
 * the site's own published facts. Several don't, and they contradict pages
 * that are one click apart:
 *
 *   - 17 of 34 bios contain a lowercase "imperialpedia" mid-sentence. Nothing
 *     in this repo writes that string, so it arrived via a bulk find-and-
 *     replace on text that named a different publication. That is the only
 *     thing --fix-casing repairs, because capitalisation asserts nothing new.
 *   - 6 bios claim a tenure at Imperialpedia beginning in 2017-2021. The
 *     homepage's own "Our Mission" section dates the project to 26 March 2022.
 *   - One bio claims the author "has updated more than 500 articles"; the
 *     Transparency page reports 70 published articles site-wide.
 *   - One cites an "imperialpedia's 100 Top Financial Advisors list" that the
 *     site does not publish.
 *
 * On a YMYL finance site the masthead is the first thing a reviewer inspects,
 * and these are checkable in under a minute against the site's own pages.
 *
 * WHAT THIS SCRIPT DELIBERATELY WILL NOT DO
 * Rewrite a factual claim about a real, named person. Only the site owner
 * knows which relationships and dates are accurate, so corrected wording is
 * supplied by them via --apply. See the content-integrity rule: real data or
 * nothing, never a plausible-sounding substitute.
 *
 * USAGE
 *   node scripts/audit-imperialpedia-author-claims.cjs                  # report only, no auth needed
 *   CMS_TOKEN=<bearer> node .../audit-imperialpedia-author-claims.cjs --fix-casing --dry-run
 *   CMS_TOKEN=<bearer> node .../audit-imperialpedia-author-claims.cjs --fix-casing
 *   CMS_TOKEN=<bearer> node .../audit-imperialpedia-author-claims.cjs --apply corrected-bios.json
 *
 * --apply takes { "<author-slug>": { "bio": "...", "title": "..." }, ... };
 * every field is optional and only what's present is written.
 *
 * AUTH : CMS_TOKEN = prod super_admin bearer from admin.baalvion.com (DevTools -> any /cms/ request).
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff.
 */

const fs = require('node:fs');

const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';
const PUBLIC_BASE = process.env.PUBLIC_CMS_BASE || 'https://api.baalvion.com/api/v1/public/imperialpedia';

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const FIX_CASING = ARGS.includes('--fix-casing');
const APPLY_FILE = (() => {
  const i = ARGS.indexOf('--apply');
  return i >= 0 ? ARGS[i + 1] : null;
})();
const TOKEN = process.env.CMS_TOKEN || null;

/** The site's own stated founding date (homepage "Our Mission"). */
const FOUNDED_YEAR = 2022;

async function adminApi(method, urlPath, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`${TARGET_BASE.replace(/\/+$/, '')}${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON error body */ }
  if (!res.ok) {
    const msg = (json && (json.error?.message || json.message)) || text || res.statusText;
    throw new Error(`${method} ${urlPath} -> ${res.status} ${msg}`);
  }
  return json;
}

/** Public read needs no token, so the report half of this script runs without one. */
async function publicAuthors() {
  const res = await fetch(`${PUBLIC_BASE}/authors`);
  if (!res.ok) throw new Error(`GET ${PUBLIC_BASE}/authors -> ${res.status}`);
  return (await res.json())?.data ?? [];
}

/** Sentences that mention Imperialpedia — the only ones this audit judges. */
function siteSentences(text) {
  return (String(text || '').match(/[^.!?]*\bimperialpedia\b[^.!?]*[.!?]?/gi) || []).map((s) => s.trim());
}

function findings(author) {
  const fields = ['title', 'credentials', 'bio'];
  const blob = fields.map((f) => String(author[f] || '')).join(' ');
  const out = [];

  // Mid-sentence lowercase spelling: never written by this codebase, so it is
  // residue from a replace over another publication's copy.
  if (/(?<![.!?]\s)(?<!^)\bimperialpedia\b/.test(blob)) {
    out.push({ kind: 'casing', detail: 'lowercase "imperialpedia" mid-sentence' });
  }

  for (const sentence of siteSentences(author.bio)) {
    const years = (sentence.match(/\b(19\d\d|20[0-2]\d)\b/g) || []).map(Number).filter((y) => y < FOUNDED_YEAR);
    if (years.length) {
      out.push({
        kind: 'pre-founding-tenure',
        detail: `claims ${years.join(', ')}, before the site's stated founding (${FOUNDED_YEAR})`,
        sentence,
      });
    }
    const volume = sentence.match(/\b(?:more than\s+)?([\d,]{2,})\s+articles\b/i);
    if (volume) {
      out.push({
        kind: 'volume-claim',
        detail: `claims ${volume[1]} articles; check against the site's published total`,
        sentence,
      });
    }
    if (/\b\d+\s+top\s+financial\s+advisors?\b/i.test(sentence)) {
      out.push({
        kind: 'unpublished-award',
        detail: 'cites an Imperialpedia ranking the site does not publish',
        sentence,
      });
    }
  }
  return out;
}

function fixCasing(text) {
  if (!text) return text;
  // Leading position and sentence-initial position are legitimately capitalised
  // too, so this only ever raises case and never lowers it.
  return String(text).replace(/\bimperialpedia\b/g, 'Imperialpedia');
}

async function main() {
  const authors = await publicAuthors();
  console.log(`Imperialpedia author roster: ${authors.length} profiles\n`);

  const flagged = authors
    .map((a) => ({ author: a, issues: findings(a) }))
    .filter((r) => r.issues.length);

  for (const { author, issues } of flagged) {
    console.log(`── ${author.name} (${author.slug})`);
    for (const issue of issues) {
      console.log(`   [${issue.kind}] ${issue.detail}`);
      if (issue.sentence) console.log(`      "${issue.sentence}"`);
    }
    console.log();
  }

  const byKind = flagged.flatMap((r) => r.issues).reduce((acc, i) => {
    acc[i.kind] = (acc[i.kind] || 0) + 1;
    return acc;
  }, {});
  console.log(`${flagged.length} of ${authors.length} profiles flagged:`, byKind);

  if (APPLY_FILE) {
    const corrections = JSON.parse(fs.readFileSync(APPLY_FILE, 'utf8'));
    console.log(`\nApplying operator-supplied corrections for ${Object.keys(corrections).length} profiles…`);
    for (const [slug, patch] of Object.entries(corrections)) {
      const author = authors.find((a) => a.slug === slug);
      if (!author) { console.log(`  ! no author with slug "${slug}" — skipped`); continue; }
      const body = {};
      if (typeof patch.bio === 'string') body.bio = patch.bio;
      if (typeof patch.title === 'string') body.title = patch.title;
      if (!Object.keys(body).length) { console.log(`  · ${slug}: nothing to write`); continue; }
      if (DRY_RUN || !TOKEN) { console.log(`  · ${slug}: would PATCH ${Object.keys(body).join(', ')}`); continue; }
      await adminApi('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/authors/${author.id}`, body);
      console.log(`  ✓ ${slug}: wrote ${Object.keys(body).join(', ')}`);
    }
    return;
  }

  if (!FIX_CASING) {
    console.log('\nReport only. Re-run with --fix-casing to repair the spelling,');
    console.log('or --apply <file.json> to write corrected bios you have authored.');
    return;
  }

  const casingTargets = flagged.filter((r) => r.issues.some((i) => i.kind === 'casing'));
  console.log(`\nRepairing "imperialpedia" -> "Imperialpedia" on ${casingTargets.length} profiles…`);
  for (const { author } of casingTargets) {
    const body = {};
    for (const field of ['title', 'credentials', 'bio']) {
      const fixed = fixCasing(author[field]);
      if (fixed !== author[field]) body[field] = fixed;
    }
    if (!Object.keys(body).length) continue;
    if (DRY_RUN || !TOKEN) { console.log(`  · ${author.slug}: would PATCH ${Object.keys(body).join(', ')}`); continue; }
    await adminApi('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/authors/${author.id}`, body);
    console.log(`  ✓ ${author.slug}: ${Object.keys(body).join(', ')}`);
  }
  console.log('\nCasing only. The tenure, volume and award claims above still need');
  console.log('your decision — nothing about them has been changed.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
