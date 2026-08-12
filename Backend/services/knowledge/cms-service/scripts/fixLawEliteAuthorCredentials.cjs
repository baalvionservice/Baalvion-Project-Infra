'use strict';
/*
 * One-off correction: seedLawEliteAuthors.cjs originally hardcoded unverified
 * "12+ years", "LL.M.", "J.D." style credentials for the 11 original Law Elite
 * Network contributors and ran them into production. The bundled fallback
 * (Frontend/Law-Elite-Network-main/src/data/authors.ts) deliberately excludes
 * exactly this kind of unverified degree/experience claim — see its file
 * header comment. The seed script has been corrected to match; this script
 * PATCHes the already-created live CMS author records to the same honest
 * "<Desk> desk, Law Elite Network" wording so production matches the fixed
 * source. Only touches `credentials` — name/title/bio/expertise/social are
 * left as-is.
 *
 * Idempotent: re-running after the fix is a no-op (PATCH sets the same value).
 *
 * USAGE
 *   node scripts/fixLawEliteAuthorCredentials.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/fixLawEliteAuthorCredentials.cjs
 *
 * AUTH : CMS_TOKEN = prod super_admin / cms_editor bearer from admin.baalvion.com
 *        (DevTools → any /cms/ request → copy the Authorization header value).
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff.
 */

const SITE = process.env.WEBSITE_SLUG || 'law-elite-network';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';
const PUBLIC_BASE = process.env.PUBLIC_CMS_BASE || 'https://api.baalvion.com/api/v1/public';

// Honest wording — verbatim from Frontend/Law-Elite-Network-main/src/data/authors.ts.
const CORRECTIONS = {
  'elena-rossi': 'Corporate & Securities desk, Law Elite Network',
  'marcus-hale': 'Technology & Data Protection desk, Law Elite Network',
  'priya-menon': 'Startups & Venture desk, Law Elite Network',
  'sofia-almeida': 'Family Law desk, Law Elite Network',
  'rajesh-iyer': 'Family & Children’s Law desk, Law Elite Network',
  'eleanor-whitfield': 'Estate Planning & Probate desk, Law Elite Network',
  'priya-nair': 'Senior Editor, Law Elite Network',
  'daniel-okafor': 'Criminal & Regulatory desk, Law Elite Network',
  'daniel-okoro': 'Employment Law desk, Law Elite Network',
  'aisha-rahman': 'Criminal Justice desk, Law Elite Network',
  'marcus-whitfield': 'Dispute Resolution desk, Law Elite Network',
};

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

async function main() {
  if (!DRY_RUN && !TOKEN) throw new Error('CMS_TOKEN not set (or pass --dry-run)');

  // Public endpoint needs no auth and already returns each author's id.
  const pub = await fetch(`${PUBLIC_BASE}/${encodeURIComponent(SITE)}/authors`).then((r) => r.json());
  const authors = Array.isArray(pub?.data) ? pub.data : [];
  const bySlug = new Map(authors.map((a) => [a.slug, a]));

  let patched = 0, skipped = 0, missing = 0, failed = 0;
  for (const [slug, credentials] of Object.entries(CORRECTIONS)) {
    const author = bySlug.get(slug);
    if (!author) { missing++; console.error(`author ${slug} → not found on live site`); continue; }
    if (author.credentials === credentials) { skipped++; continue; }

    console.log(`${slug}: "${author.credentials}" → "${credentials}"`);
    if (DRY_RUN) { patched++; continue; }

    try {
      await api('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/authors/${encodeURIComponent(author.id)}`, { credentials });
      patched++;
    } catch (e) {
      failed++;
      console.error(`author ${slug} → PATCH failed: ${e.message}`);
    }
  }

  console.log(JSON.stringify({ ok: failed === 0 && missing === 0, dryRun: DRY_RUN, patched, skipped, missing, failed }, null, 2));
}

main().catch((e) => { console.error('credential fix failed:', e.message); process.exit(1); });
