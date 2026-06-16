'use strict';
/**
 * Publishes every draft/approved content item for a given website via the real
 * workflow transition API (sets status=published, publishedAt, workflow state,
 * revision + audit). Resilient: retries each request a few times so a transient
 * DB/connection hiccup doesn't abort the batch. Idempotent: skips already-published.
 *
 *   node scripts/publishWebsite.cjs <websiteSlug>
 *   node scripts/publishWebsite.cjs about-baalvion
 */
const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS  = process.env.CMS_URL  || 'http://localhost:3018/api/v1';
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW    = process.env.SUPERADMIN_PASSWORD;

const SLUG = process.argv[2] || 'about-baalvion';
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
      // Retry on transient server errors
      if (r.status >= 500 && i < attempts - 1) { await sleep(400 * (i + 1)); continue; }
      return { status: r.status, data };
    } catch (e) {
      lastErr = e;
      await sleep(400 * (i + 1)); // network/connection hiccup -> back off and retry
    }
  }
  throw lastErr || new Error('request failed after retries');
}

async function main() {
  const login = await req('POST', `${AUTH}/login`, null, { email: EMAIL, password: PW });
  const token = login.data?.data?.accessToken;
  if (!token) throw new Error('login failed: ' + JSON.stringify(login.data).slice(0, 200));

  // Resolve websiteId from slug via the authenticated websites list
  const wl = await req('GET', `${CMS}/cms/websites?limit=200`, token);
  const site = (wl.data?.data || []).find((w) => w.slug === SLUG);
  if (!site) throw new Error(`website not found for slug: ${SLUG}`);
  const base = `${CMS}/cms/websites/${site.id}`;

  // Gather all content (paginated)
  const items = [];
  for (let page = 1; page <= 50; page++) {
    const res = await req('GET', `${base}/content?limit=100&page=${page}`, token);
    const rows = res.data?.data || [];
    items.push(...rows);
    const p = res.data?.pagination;
    if (!p || page >= p.totalPages) break;
  }

  let published = 0, already = 0, failed = 0;
  for (const c of items) {
    if (!['draft', 'approved'].includes(c.status)) { already++; continue; }
    const res = await req('POST', `${base}/content/${c.id}/workflow/transition`, token, { action: 'publish' });
    if (res.status === 200 || res.status === 201) { published++; }
    else { failed++; console.error(`  publish ${c.slug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 200)); }
  }

  console.log(JSON.stringify({ ok: true, website: SLUG, id: site.id, total: items.length, published, already, failed }, null, 2));
}
main().catch((e) => { console.error('publish failed:', e.message); process.exit(1); });
