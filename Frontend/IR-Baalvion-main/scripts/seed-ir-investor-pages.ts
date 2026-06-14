/**
 * Seeds the institutional IR pages (Why Invest, Investment Thesis, Market Opportunity,
 * Use of Proceeds, Our Story, Financial Framework, Governance Framework, Investor FAQ,
 * Investor Resources) into the central CMS (cms-service) for the ir.baalvion.com website,
 * and refreshes the primary navigation tree so the new pages appear in the site header.
 *
 * Pages are stored as contentType=page with the full PageDefinition carried in
 * customFields.pageDefinition (the convention the IR frontend's cms.ts reads). The
 * dedicated route segments render from code for SEO; seeding makes the same page
 * composition + SEO visible and editable in the admin console.
 *
 * Idempotent: existing page slugs are skipped; the navigation post is updated in place.
 *
 *   CMS_URL=http://localhost:3011/api/v1 npx tsx scripts/seed-ir-investor-pages.ts
 */
import { IR_PAGES } from '../src/lib/ir-pages';

const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS = process.env.CMS_URL || 'http://localhost:3011/api/v1';
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW = process.env.SUPERADMIN_PASSWORD || 'Sup3rAdmin!2026';
const WEBSITE_ID = process.env.IR_WEBSITE_ID || '7bced69e-a861-4530-9660-e0ddb955d72b';
const BASE = `${CMS}/cms/websites/${WEBSITE_ID}`;

// CMS slugs are [a-z0-9-]; map the route path to a flat slug ("/company/story" -> "company-story").
const toCmsSlug = (s: string) => s.replace(/^\/+/, '').replace(/\//g, '-') || 'home';

// Primary navigation tree (mirrors src/lib/cms-seed.ts SEED_NAVIGATION, including the new IR pages).
const NAVIGATION = [
  { id: 'nav-invest', label: 'Why Invest', order: 0, isActive: true, roles: ['public'], children: [
    { id: 'nav-invest-why', label: 'Why Invest in Baalvion', order: 0, isActive: true, roles: ['public'], href: '/why-invest' },
    { id: 'nav-invest-thesis', label: 'Investment Thesis', order: 1, isActive: true, roles: ['public'], href: '/investment-thesis' },
    { id: 'nav-invest-market', label: 'Market Opportunity', order: 2, isActive: true, roles: ['public'], href: '/market-opportunity' },
    { id: 'nav-invest-proceeds', label: 'Use of Proceeds', order: 3, isActive: true, roles: ['public'], href: '/use-of-proceeds' },
    { id: 'nav-invest-financials', label: 'Financial Framework', order: 4, isActive: true, roles: ['public'], href: '/financials' },
  ] },
  { id: 'nav-company', label: 'Company', order: 1, isActive: true, roles: ['public'], children: [
    { id: 'nav-company-story', label: 'Our Story', order: 0, isActive: true, roles: ['public'], href: '/company/story' },
    { id: 'nav-company-faq', label: 'Investor FAQ', order: 1, isActive: true, roles: ['public'], href: '/faq' },
    { id: 'nav-company-resources', label: 'Investor Resources', order: 2, isActive: true, roles: ['public'], href: '/resources' },
  ] },
  { id: 'nav-governance', label: 'Governance', order: 2, isActive: true, roles: ['public'], children: [
    { id: 'nav-gov-overview', label: 'Overview', order: 0, isActive: true, roles: ['public'], href: '/governance/overview' },
    { id: 'nav-gov-framework', label: 'Governance Framework', order: 1, isActive: true, roles: ['public'], href: '/governance/framework' },
    { id: 'nav-gov-board', label: 'Board of Directors', order: 2, isActive: true, roles: ['public'], href: '/governance/board-of-directors' },
    { id: 'nav-gov-leadership', label: 'Leadership', order: 3, isActive: true, roles: ['public'], href: '/governance/leadership' },
    { id: 'nav-gov-committee', label: 'Committee Composition', order: 4, isActive: true, roles: ['public'], href: '/governance/committee-composition' },
    { id: 'nav-gov-voting', label: 'My Voting', order: 5, isActive: true, roles: ['public'], href: '/governance/my-voting' },
  ] },
  { id: 'nav-news', label: 'News & Events', order: 3, isActive: true, roles: ['public'], children: [
    { id: 'nav-news-news', label: 'News', order: 0, isActive: true, roles: ['public'], href: '/news-and-events/news' },
    { id: 'nav-news-press', label: 'Press Releases', order: 1, isActive: true, roles: ['public'], href: '/news-and-events/press-releases' },
    { id: 'nav-news-events', label: 'Events', order: 2, isActive: true, roles: ['public'], href: '/news-and-events/events' },
    { id: 'nav-news-webcast', label: 'Webcast', order: 3, isActive: true, roles: ['public'], href: '/news-and-events/webcast' },
    { id: 'nav-news-investor-day', label: 'Investor Day', order: 4, isActive: true, roles: ['public'], href: '/news-and-events/investor-day' },
  ] },
  { id: 'nav-portal', label: 'Investor Portal', order: 4, isActive: true, roles: ['public'], children: [
    { id: 'nav-portal-dashboard', label: 'Dashboard', order: 0, isActive: true, roles: ['public'], href: '/dashboard' },
    { id: 'nav-portal-capital', label: 'Capital Operations', order: 1, isActive: true, roles: ['public'], href: '/capital-ops' },
    { id: 'nav-portal-operator', label: 'Strategic Operator', order: 2, isActive: true, roles: ['public'], href: '/strategic-operator' },
  ] },
  { id: 'nav-resources', label: 'Resources', order: 5, isActive: true, roles: ['public'], children: [
    { id: 'nav-res-faq', label: 'Investor FAQ', order: 0, isActive: true, roles: ['public'], href: '/faq' },
    { id: 'nav-res-downloads', label: 'Download Center', order: 1, isActive: true, roles: ['public'], href: '/resources' },
    { id: 'nav-res-contact', label: 'Contact IR', order: 2, isActive: true, roles: ['public'], href: '/resources/contact-ir' },
    { id: 'nav-res-alerts', label: 'Email Alerts', order: 3, isActive: true, roles: ['public'], href: '/resources/email-alerts' },
  ] },
];

async function req(method: string, url: string, token: string | null, body?: any) {
  const r = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

async function listContent(token: string, contentType: string): Promise<any[]> {
  const res = await req('GET', `${BASE}/content?contentType=${contentType}&limit=200`, token);
  return res.data?.data || [];
}

async function main() {
  const login = await req('POST', `${AUTH}/login`, null, { email: EMAIL, password: PW });
  const token = login.data?.data?.accessToken;
  if (!token) throw new Error('login failed: ' + JSON.stringify(login.data).slice(0, 200));

  // ── Pages ──────────────────────────────────────────────────────────────
  const existingPages = await listContent(token, 'page');
  const havePages = new Set(existingPages.map((c) => c.slug));
  let created = 0, skipped = 0;
  for (const page of IR_PAGES) {
    const cmsSlug = toCmsSlug(page.slug);
    if (havePages.has(cmsSlug)) { skipped++; continue; }
    const seo: any = page.seo || {};
    const payload = {
      title: page.title,
      slug: cmsSlug,
      contentType: 'page',
      excerpt: seo.title || page.title,
      customFields: { kind: 'ir-page', pageSlug: page.slug, pageDefinition: page },
      seoMetadata: {
        title: String(seo.title || page.title).slice(0, 200),
        description: String(seo.description || page.description || '').slice(0, 300),
        keywords: seo.keywords || [],
      },
    };
    const res = await req('POST', `${BASE}/content`, token, payload);
    if (res.status === 200 || res.status === 201) created++;
    else if (res.status === 409) skipped++;
    else console.error(`page ${cmsSlug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 200));
  }

  // ── Navigation (update the existing primary-navigation post in place) ────
  const posts = await listContent(token, 'post');
  const navItem = posts.find((c) => c.slug === 'primary-navigation');
  const navBody = {
    title: 'Primary Navigation',
    slug: 'primary-navigation',
    contentType: 'post',
    excerpt: 'IR site primary navigation tree',
    customFields: { kind: 'navigation', items: NAVIGATION },
  };
  let navResult: string;
  if (navItem) {
    const res = await req('PATCH', `${BASE}/content/${navItem.id}`, token, navBody);
    navResult = `updated (${res.status})`;
  } else {
    const res = await req('POST', `${BASE}/content`, token, navBody);
    navResult = `created (${res.status})`;
  }

  console.log(JSON.stringify({ ok: true, website: WEBSITE_ID, pages: { created, skipped }, navigation: navResult }, null, 2));
}

main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
