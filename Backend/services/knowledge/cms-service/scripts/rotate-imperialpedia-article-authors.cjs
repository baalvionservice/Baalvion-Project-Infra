'use strict';
/*
 * Redistributes the byline "author" credit across Imperialpedia's real editorial
 * roster instead of every published article crediting the same single writer —
 * a same-author-on-every-post pattern reads as templated/auto-generated content
 * to Google and undercuts E-E-A-T. The roster (src/config/authors.ts on the
 * frontend) already documents that any of the three staff can appear in any of
 * the three byline roles (writer/reviewer/fact-checker) — this only rotates who
 * gets the primary "By <name>" writer credit; it does not touch reviewer/
 * fact-checker assignment.
 *
 * Deterministic round-robin over published content, ordered by id, so re-runs
 * are idempotent (same input set → same assignment) rather than reshuffling
 * everything on every run. Only every real author on file is used — nothing is
 * invented.
 *
 * USAGE
 *   node scripts/rotate-imperialpedia-article-authors.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/rotate-imperialpedia-article-authors.cjs
 *
 * AUTH : CMS_TOKEN = prod super_admin bearer from admin.baalvion.com (DevTools → any /cms/ request).
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff.
 */

const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';

// Mirrors Frontend/Imperialpedia-main/src/config/authors.ts — the real editorial
// roster. Kept in sync manually; there are only three entries today.
const ROSTER = [
  { slug: 'allen-krewzz', name: 'Allen Krewzz', title: 'Financial Writer & Analyst' },
  { slug: 'tamanna-shaikh', name: 'Tamanna Shaikh', title: 'Senior Editor' },
  { slug: 'deepak-kuldeep', name: 'Deepak Kuldeep', title: 'Fact-Checking Editor' },
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

async function allPublished() {
  const items = [];
  for (let page = 1; page <= 50; page++) {
    const res = await api('GET', `/cms/websites/${encodeURIComponent(SITE)}/content?status=published&page=${page}&limit=100`);
    const pageItems = res?.data ?? [];
    items.push(...pageItems);
    const pg = res?.pagination;
    if (!pg || !pg.hasNext || pageItems.length === 0) break;
  }
  // Stable order so the round-robin assignment is the same on every run.
  items.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return items;
}

async function main() {
  console.log('Imperialpedia author rotation');
  console.log(`  target : ${TARGET_BASE}`);
  console.log(`  site   : ${SITE}`);
  console.log(`  mode   : ${DRY_RUN ? 'DRY RUN' : 'UPDATE'}`);
  console.log(`  roster : ${ROSTER.map((r) => r.name).join(', ')}\n`);

  if (!DRY_RUN && !TOKEN) throw new Error('No CMS_TOKEN set — provide a prod super_admin bearer to update.');

  const articles = await allPublished();
  console.log(`  found  : ${articles.length} published article(s)\n`);

  let changed = 0;
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const assignee = ROSTER[i % ROSTER.length];
    const currentAuthorSlug = article.customFields?.authorSlug;
    if (currentAuthorSlug === assignee.slug) {
      console.log(`  = already ${assignee.name}  ${article.slug}`);
      continue;
    }

    if (DRY_RUN) {
      console.log(`  ~ would set ${assignee.name}  ${article.slug}  (was: ${currentAuthorSlug || 'unset'})`);
      changed++;
      continue;
    }

    // Merge into the existing customFields JSONB rather than replacing it wholesale —
    // it also carries faq/editorialTeam/etc. that must survive this update untouched.
    const nextCustomFields = {
      ...(article.customFields || {}),
      author: { name: assignee.name, title: assignee.title },
      authorSlug: assignee.slug,
    };
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
