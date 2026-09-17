'use strict';
/*
 * Applies de-templated content rewrites from ./creator-economy-rewrites/*.js
 * to their matching live Creator Economy articles. Each rewrite file exports
 * { slug, bodyHtml, faq, keyTakeaways, citations, tool? } — see
 * rpm-and-cpm-calculator-for-youtube-and-web-creators.js for the first one.
 *
 * Replaces the article's single raw-HTML contentBlock and the customFields
 * that drive the templated boilerplate (faq/keyTakeaways/externalSources),
 * while preserving author/authorSlug (already correct from the prior
 * rotation pass) and NOT re-adding reviewer/factChecker fields.
 *
 * USAGE
 *   node scripts/apply-creator-economy-rewrites.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/apply-creator-economy-rewrites.cjs
 *   node scripts/apply-creator-economy-rewrites.cjs --dry-run --only=<slug>
 *
 * AUTH : CMS_TOKEN = prod super_admin (or cms_editor) bearer from
 *        admin.baalvion.com (DevTools -> any /cms/ request), ~15 min TTL.
 */

const fs = require('fs');
const path = require('path');

const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';
const REWRITES_DIR = path.join(__dirname, 'creator-economy-rewrites');

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const ONLY = (ARGS.find((a) => a.startsWith('--only=')) || '').split('=')[1] || null;
const TOKEN = process.env.CMS_TOKEN || null;

async function api(method, urlPath, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`${TARGET_BASE.replace(/\/+$/, '')}${urlPath}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* */ }
  if (!res.ok) {
    const msg = (json && (json.error?.message || json.message)) || text || res.statusText;
    throw new Error(`${method} ${urlPath} -> ${res.status} ${msg}`);
  }
  return json;
}

function loadRewrites() {
  const files = fs.readdirSync(REWRITES_DIR).filter((f) => f.endsWith('.js'));
  return files
    .map((f) => require(path.join(REWRITES_DIR, f)))
    .filter((r) => !ONLY || r.slug === ONLY);
}

async function findArticleBySlug(slug) {
  for (let page = 1; page <= 50; page++) {
    const res = await api('GET', `/cms/websites/${encodeURIComponent(SITE)}/content?status=published&contentType=article&page=${page}&limit=100`);
    const found = (res?.data ?? []).find((a) => a.slug === slug);
    if (found) return found;
    const pg = res?.pagination;
    if (!pg || !pg.hasNext || (res?.data ?? []).length === 0) break;
  }
  return null;
}

async function main() {
  const rewrites = loadRewrites();
  console.log('Creator Economy content rewrites');
  console.log(`  target : ${TARGET_BASE}`);
  console.log(`  mode   : ${DRY_RUN ? 'DRY RUN' : 'UPDATE'}`);
  console.log(`  found  : ${rewrites.length} rewrite(s) to apply\n`);

  if (!DRY_RUN && !TOKEN) throw new Error('No CMS_TOKEN set — provide a prod bearer (cms_editor or higher) to update.');

  for (const rewrite of rewrites) {
    const article = await findArticleBySlug(rewrite.slug);
    if (!article) {
      console.warn(`  ! ${rewrite.slug}: not found among published articles, skipping`);
      continue;
    }

    const {
      reviewer: _r, factChecker: _fc, reviewerSlug: _rs, factCheckerSlug: _fcs,
      faq: _oldFaq, keyTakeaways: _oldKt, takeaways: _oldTakeaways, externalSources: _oldSources, tool: _oldTool,
      ...rest
    } = article.customFields || {};

    const nextCustomFields = {
      ...rest,
      faq: rewrite.faq || [],
      keyTakeaways: rewrite.keyTakeaways || [],
      externalSources: rewrite.citations || [],
      ...(rewrite.tool ? { tool: rewrite.tool } : {}),
    };

    const nextContentBlocks = [
      { id: require('crypto').randomUUID(), type: 'html', order: 0, content: { html: rewrite.bodyHtml } },
    ];

    if (DRY_RUN) {
      console.log(`  ~ would rewrite ${rewrite.slug} (${rewrite.bodyHtml.length} chars body, ${rewrite.faq?.length || 0} faq, tool=${rewrite.tool?.type || 'none'})`);
      continue;
    }

    await api('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/content/${article.id}`, {
      contentBlocks: nextContentBlocks,
      customFields: nextCustomFields,
    });
    console.log(`  ✓ rewrote ${rewrite.slug}`);
  }

  console.log(DRY_RUN ? '\n(dry run — nothing was updated)' : '\n✓ complete.');
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1); });
