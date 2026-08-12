'use strict';
/*
 * One-off: the live CMS record for Law Elite Network's "How Does Bail Work?"
 * (slug: how-does-bail-work) predates the new callout-box and collapsible
 * "Article Sources" components added to globals.css (.callout, .prose-legal
 * details/summary). This patches that single content record's contentBlocks
 * to add one callout and one sources block, in the site's own blue palette --
 * matching the pattern already applied to the bundled criminal-law.ts /
 * employment-labor-jurisdiction.ts articles. Every other block in the article
 * is left byte-for-byte untouched.
 *
 * Idempotent: checks for the callout/sources text before inserting, so a
 * re-run after a successful patch is a no-op.
 *
 * USAGE
 *   node scripts/patchBailArticleDesign.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/patchBailArticleDesign.cjs
 *
 * AUTH : CMS_TOKEN = prod super_admin / cms_editor bearer from admin.baalvion.com
 *        (DevTools -> any /cms/ request -> copy the Authorization header value).
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff.
 */

const SITE = process.env.WEBSITE_SLUG || 'law-elite-network';
const SLUG = 'how-does-bail-work';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';
const PUBLIC_BASE = process.env.PUBLIC_CMS_BASE || 'https://api.baalvion.com/api/v1/public';

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const TOKEN = process.env.CMS_TOKEN || null;

const CALLOUT_MARKER = 'get it in writing before you pay it';
const SOURCES_MARKER = 'Article Sources';

const CALLOUT_HTML =
  '<div class="callout callout-info"><p><strong>Before paying a bail bondsman, confirm the fee percentage and get it in writing before you pay it.</strong>' +
  ' It is a nonrefundable service charge no matter how the case ends, so it is worth understanding the exact terms up front rather than after the money has changed hands.</p></div>';

const SOURCES_HTML =
  '<details><summary>Article Sources</summary><ul>' +
  '<li>Bail Reform Act of 1984 (federal pretrial release standards)</li>' +
  '<li>Bail is primarily governed at the state level in the U.S. — consult the specific state’s bail statutes and court rules</li>' +
  '<li>American Bar Association, Standards for Criminal Justice: Pretrial Release</li>' +
  '</ul></details>';

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

function blockText(b) {
  const c = b.content || {};
  return String(c.html ?? c.text ?? '');
}

async function main() {
  if (!DRY_RUN && !TOKEN) throw new Error('CMS_TOKEN not set (or pass --dry-run)');

  const pub = await fetch(`${PUBLIC_BASE}/${encodeURIComponent(SITE)}/content/${encodeURIComponent(SLUG)}`).then((r) => r.json());
  const doc = pub?.data;
  if (!doc) throw new Error(`content "${SLUG}" not found on live site`);

  const blocks = (doc.contentBlocks || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const alreadyHasCallout = blocks.some((b) => blockText(b).includes(CALLOUT_MARKER));
  const alreadyHasSources = blocks.some((b) => blockText(b).includes(SOURCES_MARKER));

  if (alreadyHasCallout && alreadyHasSources) {
    console.log(JSON.stringify({ ok: true, dryRun: DRY_RUN, changed: false, reason: 'already patched' }, null, 2));
    return;
  }

  // Insert the callout right after the bail-bondsman-fee paragraph, and the
  // sources block at the very end, mirroring where the equivalent sections
  // landed on the bundled bail article. The schema requires an integer
  // `order` (z.number().int()), so insert-by-splice + full renumber rather
  // than a fractional order value between two existing blocks.
  const anchorIdx = blocks.findIndex((b) => blockText(b).includes('nonrefundable even if the case is dismissed'));
  const insertAt = anchorIdx >= 0 ? anchorIdx + 1 : Math.floor(blocks.length / 2);

  const working = blocks.slice();
  if (!alreadyHasSources) {
    working.push({ id: 'blk-patch-sources', type: 'html', content: { html: SOURCES_HTML } });
  }
  if (!alreadyHasCallout) {
    working.splice(insertAt, 0, { id: 'blk-patch-callout', type: 'html', content: { html: CALLOUT_HTML } });
  }
  const nextBlocks = working.map((b, i) => ({ ...b, order: i }));

  console.log(`${SLUG}: inserting ${!alreadyHasCallout ? 'callout' : ''}${!alreadyHasCallout && !alreadyHasSources ? ' + ' : ''}${!alreadyHasSources ? 'sources' : ''} block(s)`);
  if (DRY_RUN) {
    console.log(JSON.stringify({ ok: true, dryRun: true, changed: true, blockCountBefore: blocks.length, blockCountAfter: nextBlocks.length }, null, 2));
    return;
  }

  await api('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/content/${encodeURIComponent(doc.id)}`, { contentBlocks: nextBlocks });
  console.log(JSON.stringify({ ok: true, dryRun: false, changed: true, blockCountBefore: blocks.length, blockCountAfter: nextBlocks.length }, null, 2));
}

main().catch((e) => { console.error('bail article patch failed:', e.message); process.exit(1); });
