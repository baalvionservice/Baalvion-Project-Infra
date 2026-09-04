'use strict';
/**
 * AdSense-readiness content pass (Law Elite Network): pushes locally-drafted
 * editorial rewrites of the 28 kept articles (3 surviving categories --
 * Maritime & Offshore Injury Law, Cruise Ship & Passenger Vessel Accidents,
 * Personal Injury Lawyer -- see Frontend/Law-Elite-Network-main/src/lib/
 * category-slugs.ts's CURRENT_CATEGORY_SLUGS) into the CMS.
 *
 * WHY: the site's original live content was flagged as reading templated/
 * AI-generated -- every sampled article closed with the identical verbatim
 * "Frequently Asked Questions" / "Getting Legal Guidance" heading pair,
 * generic template headings, and 200-400 word bodies. Rewritten locally with
 * a hard no-fabrication rule (no invented case citations, settlement
 * figures, or statistics -- only genuine depth on doctrine already correctly
 * cited in the source, e.g. the Jones Act, LHWCA, maintenance and cure,
 * Carnival Cruise Lines v. Shute), organic per-article structure, no shared
 * closer skeleton. Source drafts, one JSON file per slug (shape: slug,
 * title, excerpt, contentBlocks, seoMetadata), live under:
 *   <REWRITES_DIR>/{maritime-offshore-injury-law,cruise-ship-passenger-vessel-accidents,personal-injury-lawyer}/*.json
 * (default REWRITES_DIR is this session's scratchpad -- override via env var
 * if running from a different machine/checkout).
 *
 * MECHANISM: PATCH .../content/:contentId accepts title/excerpt/
 * contentBlocks/seoMetadata directly (validators/contentSchemas.js's
 * updateContentSchema -- no workflow-transition needed for a content-body
 * edit, unlike archiving). contentId isn't stored in the local draft files
 * (they only ever needed slug), so this script first fetches the admin
 * content list and builds a slug -> id map, same paging pattern as
 * archive-law-elite-retired-categories.cjs's listPublishedArticles().
 *
 * USAGE
 *   # Preview exactly what would be sent, no network writes:
 *   node scripts/push-law-elite-article-rewrites.cjs --dry-run
 *
 *   # Local dev CMS (login flow):
 *   AUTH_URL=http://localhost:3001/v1/auth CMS_URL=http://localhost:3011/api/v1 \
 *   SUPERADMIN_EMAIL=superadmin@baalvion.com SUPERADMIN_PASSWORD=*** \
 *   node scripts/push-law-elite-article-rewrites.cjs
 *
 *   # Production (bearer token, e.g. copied from a DevTools /cms/ request
 *   # while logged into admin.baalvion.com as super_admin):
 *   TARGET_CMS_BASE=https://admin.baalvion.com/api-bff/knowledge/cms/api/v1 \
 *   CMS_TOKEN=<bearer> node scripts/push-law-elite-article-rewrites.cjs
 *
 * Idempotent / safe to re-run: each PATCH just re-applies the same draft
 * content, so a partial prior run (network failure partway through) can be
 * resumed by running again -- already-updated articles are simply
 * overwritten with the same content, not duplicated. Does NOT execute
 * anything against production on its own -- this file is prep only.
 */

const fs = require('fs');
const path = require('path');

const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS = process.env.CMS_URL || 'http://localhost:3011/api/v1';
const TARGET_CMS_BASE = process.env.TARGET_CMS_BASE || null;
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW = process.env.SUPERADMIN_PASSWORD;
const CMS_TOKEN = process.env.CMS_TOKEN || null;
const SITE = process.env.WEBSITE_SLUG || 'law-elite-network';
const REWRITES_DIR = process.env.REWRITES_DIR
  || '/private/tmp/claude-501/-Users-wade-Desktop-Baalvion-Project-Infra-main/d5592b16-bbd8-4fc4-925d-3b167a6ecd2b/scratchpad/law-elite-articles/rewritten';

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');

const CMS_BASE = TARGET_CMS_BASE || CMS;
const BASE = `${CMS_BASE.replace(/\/+$/, '')}/cms/websites/${encodeURIComponent(SITE)}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function req(method, url, token, body, attempts = 5) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await r.json().catch(() => ({}));
      if (r.status >= 500 && i < attempts - 1) { await sleep(400 * (i + 1)); continue; }
      return { status: r.status, data };
    } catch (e) {
      lastErr = e;
      await sleep(400 * (i + 1));
    }
  }
  throw lastErr || new Error('request failed after retries');
}

async function getToken() {
  if (CMS_TOKEN) return CMS_TOKEN;
  if (!PW) throw new Error('Set CMS_TOKEN (prod bearer) or SUPERADMIN_PASSWORD (local login) — see script header for usage.');
  const login = await req('POST', `${AUTH}/login`, null, { email: EMAIL, password: PW });
  const token = login.data?.data?.accessToken;
  if (!token) throw new Error('login failed: ' + JSON.stringify(login.data).slice(0, 200));
  return token;
}

/** Same paging pattern as archive-law-elite-retired-categories.cjs's listPublishedArticles(). */
async function listAllArticles(token) {
  const items = [];
  for (let page = 1; page <= 50; page++) {
    const res = await req('GET', `${BASE}/content?contentType=article&page=${page}&limit=100`, token);
    if (res.status !== 200) throw new Error(`content list page ${page} -> ${res.status} ${JSON.stringify(res.data).slice(0, 200)}`);
    const pageItems = res.data?.data ?? [];
    items.push(...pageItems);
    const pg = res.data?.pagination;
    if (!pg || !pg.hasNext || pageItems.length === 0) break;
  }
  return items;
}

function loadDrafts() {
  const drafts = [];
  for (const category of fs.readdirSync(REWRITES_DIR)) {
    const dir = path.join(REWRITES_DIR, category);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.json')) continue;
      const draft = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      if (!draft.slug) throw new Error(`draft missing slug: ${path.join(dir, file)}`);
      drafts.push({ category, file, draft });
    }
  }
  return drafts;
}

async function main() {
  const drafts = loadDrafts();
  console.log(JSON.stringify({ ok: true, mode: 'loaded-drafts', dryRun: DRY_RUN, rewritesDir: REWRITES_DIR, count: drafts.length }, null, 2));

  const token = await getToken();
  const articles = await listAllArticles(token);
  const idBySlug = new Map(articles.map((a) => [a.slug, a.id]));

  let updated = 0, missing = 0, failed = 0;
  const missingSlugs = [];
  for (const { category, file, draft } of drafts) {
    const id = idBySlug.get(draft.slug);
    if (!id) { missing++; missingSlugs.push(draft.slug); continue; }

    const payload = {
      title: draft.title,
      excerpt: draft.excerpt,
      contentBlocks: draft.contentBlocks,
      seoMetadata: draft.seoMetadata,
    };

    if (DRY_RUN) {
      console.log(JSON.stringify({ wouldUpdate: draft.slug, id, category, file }, null, 2));
      updated++;
      continue;
    }

    const res = await req('PATCH', `${BASE}/content/${id}`, token, payload);
    if (res.status === 200) {
      updated++;
    } else {
      failed++;
      console.error(`update ${draft.slug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 300));
    }
    await sleep(150);
  }

  console.log(JSON.stringify({
    ok: true,
    mode: 'push-article-rewrites',
    dryRun: DRY_RUN,
    site: SITE,
    base: BASE,
    totalDrafts: drafts.length,
    updated,
    missing,
    missingSlugs,
    failed,
  }, null, 2));
}

main().catch((e) => { console.error('law elite article-rewrite push failed:', e.message); process.exit(1); });
