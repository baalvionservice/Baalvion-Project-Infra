/**
 * Seeds the IR page-builder definitions (homepage + compliance-test) and the primary
 * navigation tree into the central CMS (cms-service) for the baalvion-ir website, so the
 * frontend renders them from real, centrally-managed content instead of the in-memory
 * StorageAdapter/MOCK_PAGES. Mirrors scripts/seedBaalvionIr.cjs (editorial) + seedAboutBaalvion
 * (page-builder sections carried in customFields).
 *
 * After running this, publish it:  node ../../Backend/services/knowledge/cms-service/scripts/publishWebsite.cjs baalvion-ir
 *
 *   npx tsx scripts/seed-cms-pages.ts
 */
const MOCK_PAGES: any[] = [];
const MOCK_NAVIGATION: any[] = [];

const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS = process.env.CMS_URL || 'http://localhost:3018/api/v1';
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW = process.env.SUPERADMIN_PASSWORD;
const WEBSITE_ID =
  process.env.NEXT_PUBLIC_CMS_WEBSITE_ID || process.env.IR_WEBSITE_ID || '7bced69e-a861-4530-9660-e0ddb955d72b';
const BASE = `${CMS}/cms/websites/${WEBSITE_ID}`;

// cms slugs are [a-z0-9-]; the IR homepage's real slug is "/" — map it to "home".
const toCmsSlug = (s: string) => (s === '/' ? 'home' : s.replace(/^\/+/, '').replace(/\//g, '-') || 'home');

async function req(method: string, url: string, token: string | null, body?: any) {
  const r = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

async function existingSlugs(token: string, contentType: string): Promise<Set<string>> {
  const res = await req('GET', `${BASE}/content?contentType=${contentType}&limit=200`, token);
  const out = new Set<string>();
  for (const c of res.data?.data || []) out.add(c.slug);
  return out;
}

async function main() {
  const login = await req('POST', `${AUTH}/login`, null, { email: EMAIL, password: PW });
  const token = login.data?.data?.accessToken;
  if (!token) throw new Error('login failed: ' + JSON.stringify(login.data).slice(0, 200));

  // ── Pages (contentType=page; full PageDefinition lives in customFields.pageDefinition) ──
  const havePages = await existingSlugs(token, 'page');
  let pagesCreated = 0, pagesSkipped = 0;
  for (const page of MOCK_PAGES) {
    const cmsSlug = toCmsSlug(page.slug);
    if (havePages.has(cmsSlug)) { pagesSkipped++; continue; }
    const seo: any = (page as any).seoMetadata || {};
    const payload = {
      title: page.title,
      slug: cmsSlug,
      contentType: 'page',
      excerpt: seo.title || page.title,
      customFields: { kind: 'ir-page', pageSlug: page.slug, pageDefinition: page },
      seoMetadata: {
        title: String(seo.title || page.title).slice(0, 200),
        description: String(seo.description || '').slice(0, 300),
      },
    };
    const res = await req('POST', `${BASE}/content`, token, payload);
    if (res.status === 200 || res.status === 201) pagesCreated++;
    else if (res.status === 409) pagesSkipped++;
    else console.error(`page ${cmsSlug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 200));
  }

  // ── Navigation (single 'post' content item carrying the whole tree in customFields.items;
  //    cms-service has no 'navigation' contentType, so we use 'post' + kind='navigation') ──
  const haveNav = await existingSlugs(token, 'post');
  let navCreated = 0, navSkipped = 0;
  if (haveNav.has('primary-navigation')) navSkipped++;
  else {
    const res = await req('POST', `${BASE}/content`, token, {
      title: 'Primary Navigation',
      slug: 'primary-navigation',
      contentType: 'post',
      excerpt: 'IR site primary navigation tree',
      customFields: { kind: 'navigation', items: MOCK_NAVIGATION },
    });
    if (res.status === 200 || res.status === 201) navCreated++;
    else if (res.status === 409) navSkipped++;
    else console.error(`navigation -> ${res.status}`, JSON.stringify(res.data).slice(0, 200));
  }

  console.log(JSON.stringify({ ok: true, website: WEBSITE_ID, pages: { created: pagesCreated, skipped: pagesSkipped }, navigation: { created: navCreated, skipped: navSkipped } }, null, 2));
}
main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
