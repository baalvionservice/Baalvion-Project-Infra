'use strict';
/*
 * Deletes one or more content items on a live website by slug, via the authenticated
 * cms-service management API. Published content can't be hard-deleted directly
 * (contentService.deleteContent rejects it — see workflowService's archive transition),
 * so each slug is archived first, then deleted, mirroring the same two-step flow an
 * editor would do by hand in the admin console.
 *
 * USAGE
 *   # 1. Dry run — resolves every slug to its content id/status, mutates nothing:
 *   CMS_TOKEN=<bearer> node scripts/deleteContentBySlug.cjs --website=imperialpedia --dry-run \
 *     beta-explained budgeting-for-couples ...
 *
 *   # 2. Real delete:
 *   CMS_TOKEN=<bearer> node scripts/deleteContentBySlug.cjs --website=imperialpedia \
 *     beta-explained budgeting-for-couples ...
 *
 *   Slugs can also be piped one-per-line via stdin instead of argv.
 *
 * AUTH: set CMS_TOKEN to a super_admin/owner/cms_editor+ bearer token. Easiest way to
 * get one: log in to https://admin.baalvion.com, open DevTools → Network, copy the
 * `Authorization: Bearer ...` header from any /cms/... request. Alternatively set
 * SUPERADMIN_EMAIL + SUPERADMIN_PASSWORD (+ AUTH_LOGIN_URL if not the default) to log
 * in programmatically, same fallback migrate-content-local-to-prod.cjs uses.
 *
 * Idempotent: a slug that's already gone (404 on the public lookup) is reported and
 * skipped, not treated as an error.
 */
const CMS_BASE = (process.env.CMS_BASE
  || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1').replace(/\/+$/, '');
const AUTH_LOGIN_URL = process.env.AUTH_LOGIN_URL || 'https://auth-api.baalvion.com/v1/auth/login';

const ARGS = process.argv.slice(2);
const FLAG = (name) => ARGS.includes(`--${name}`);
const OPT = (name) => {
  const hit = ARGS.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : undefined;
};

const DRY_RUN = FLAG('dry-run');
const WEBSITE = OPT('website');
let TOKEN = process.env.CMS_TOKEN || null;
const SLUGS = ARGS.filter((a) => !a.startsWith('--'));

async function loginIfNeeded() {
  if (TOKEN) return;
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('No CMS_TOKEN and no SUPERADMIN_EMAIL/SUPERADMIN_PASSWORD set.');
  }
  const res = await fetch(AUTH_LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const j = await res.json().catch(() => null);
  const tok = j && (j.data?.accessToken || j.accessToken || j.token);
  if (!res.ok || !tok) throw new Error(`Login failed (${res.status}). ${JSON.stringify(j).slice(0, 200)}`);
  TOKEN = tok;
  console.log('  logged in');
}

async function readStdinSlugs() {
  if (process.stdin.isTTY) return [];
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

async function jfetch(method, url, token) {
  const r = await fetch(url, { method, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

async function jpost(url, token, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

async function main() {
  if (!WEBSITE) throw new Error('--website=<slug> is required');
  await loginIfNeeded();
  if (!TOKEN) throw new Error('CMS_TOKEN env var is required (see script header for how to get one)');

  const slugs = [...SLUGS, ...(await readStdinSlugs())];
  if (!slugs.length) throw new Error('no slugs given (argv or stdin)');

  console.log(`${DRY_RUN ? '[dry-run] ' : ''}resolving ${slugs.length} slug(s) on "${WEBSITE}"...`);

  const results = [];
  for (const slug of slugs) {
    const lookup = await jfetch('GET', `${CMS_BASE}/public/${WEBSITE}/content/${encodeURIComponent(slug)}`, TOKEN);
    if (lookup.status === 404) {
      console.log(`  - ${slug}: not found (already gone) — skipping`);
      results.push({ slug, outcome: 'not_found' });
      continue;
    }
    if (lookup.status !== 200) {
      console.error(`  - ${slug}: lookup failed → ${lookup.status}`, JSON.stringify(lookup.data).slice(0, 200));
      results.push({ slug, outcome: 'lookup_failed', status: lookup.status });
      continue;
    }

    const content = lookup.data?.data || lookup.data;
    const { id, status } = content;
    console.log(`  - ${slug}: id=${id} status=${status}`);
    if (DRY_RUN) { results.push({ slug, id, status, outcome: 'dry_run' }); continue; }

    if (status === 'published') {
      const arch = await jpost(
        `${CMS_BASE}/cms/websites/${WEBSITE}/content/${id}/workflow/transition`,
        TOKEN,
        { action: 'archive' },
      );
      if (arch.status !== 200) {
        console.error(`    archive failed → ${arch.status}`, JSON.stringify(arch.data).slice(0, 200));
        results.push({ slug, id, outcome: 'archive_failed', status: arch.status });
        continue;
      }
      console.log('    archived');
    }

    const del = await jfetch('DELETE', `${CMS_BASE}/cms/websites/${WEBSITE}/content/${id}`, TOKEN);
    if (del.status !== 200) {
      console.error(`    delete failed → ${del.status}`, JSON.stringify(del.data).slice(0, 200));
      results.push({ slug, id, outcome: 'delete_failed', status: del.status });
      continue;
    }
    console.log('    deleted');
    results.push({ slug, id, outcome: 'deleted' });
  }

  const summary = results.reduce((acc, r) => { acc[r.outcome] = (acc[r.outcome] || 0) + 1; return acc; }, {});
  console.log('\nsummary:', JSON.stringify(summary));
  const failed = results.some((r) => ['lookup_failed', 'archive_failed', 'delete_failed'].includes(r.outcome));
  if (failed) process.exitCode = 1;
}

main().catch((e) => { console.error('failed:', e.message); process.exit(1); });
