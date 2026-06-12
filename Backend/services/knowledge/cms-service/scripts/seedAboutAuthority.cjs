'use strict';
/**
 * Publishes the "authority content" set for about.baalvion.com into the central
 * CMS via the live cms-service API, then publishes everything so it is served by
 * the public delivery API.
 *
 * Source of truth = the generated JSON under:
 *   Frontend/about-baalvion-main/content-gen/{articles,case-studies,services,industries,company}/*.json
 *
 * Mapping to CMS content types (matches the frontend readers in src/lib/cms.ts):
 *   articles      -> contentType 'news'    customFields.kind = 'article'      (/news/<category>/<slug>)
 *   services      -> contentType 'product' customFields.kind = 'service'      (/services/<slug>)
 *   industries    -> contentType 'doc'     customFields.kind = 'industry'     (/industries/<slug>)
 *   case-studies  -> contentType 'event'   customFields.kind = 'case_study'   (/case-studies/<slug>)
 *   company       -> contentType 'doc'     customFields.kind = 'company-about'(/about/<slug>)
 *
 * Idempotent: existing slugs are skipped (create), and any draft/approved item
 * (new or pre-existing) is transitioned to published.
 *
 *   CMS_URL=http://localhost:3011/api/v1 node scripts/seedAboutAuthority.cjs
 */
const fs = require('fs');
const path = require('path');

const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS = process.env.CMS_URL || 'http://localhost:3011/api/v1';
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW = process.env.SUPERADMIN_PASSWORD || 'Sup3rAdmin!2026';
const WEBSITE_ID = process.env.ABOUT_WEBSITE_ID || 'cf2d3583-7247-48a6-9fd2-0959043c7a8b';
const BASE = `${CMS}/cms/websites/${WEBSITE_ID}`;

const CONTENT_ROOT =
  process.env.CONTENT_ROOT ||
  path.resolve(__dirname, '../../../../../Frontend/about-baalvion-main/content-gen');

const KIND_MAP = {
  articles: { contentType: 'news', kind: 'article' },
  services: { contentType: 'product', kind: 'service' },
  industries: { contentType: 'doc', kind: 'industry' },
  'case-studies': { contentType: 'event', kind: 'case_study' },
  company: { contentType: 'doc', kind: 'company-about' },
};

// ── inline markdown -> safe HTML (links + bold) for list items / html blocks ──
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function mdToHtml(text) {
  let out = escapeHtml(text);
  // links: [label](href) — href is validated to be a relative path or http(s)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, href) => {
    const safe = /^\/[\w\-/#?=&.]*$/.test(href) || /^https?:\/\//.test(href);
    if (!safe) return label;
    const ext = /^https?:\/\//.test(href);
    return `<a href="${href}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return out;
}

// ── content JSON block -> CMS contentBlock ──
function toCmsBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .map((b, i) => {
      if (!b || typeof b !== 'object') return null;
      if (b.type === 'heading') {
        return { id: `blk-${i}`, type: 'heading', order: i, content: { text: String(b.text || ''), level: Number(b.level) || 2 } };
      }
      if (b.type === 'list') {
        const tag = b.ordered ? 'ol' : 'ul';
        const lis = (Array.isArray(b.items) ? b.items : []).map((x) => `<li>${mdToHtml(x)}</li>`).join('');
        return { id: `blk-${i}`, type: 'html', order: i, content: { html: `<${tag}>${lis}</${tag}>` } };
      }
      if (b.type === 'html') {
        return { id: `blk-${i}`, type: 'html', order: i, content: { html: String(b.html || '') } };
      }
      if (b.type === 'quote') {
        return { id: `blk-${i}`, type: 'quote', order: i, content: { text: String(b.text || '') } };
      }
      // paragraph (default) — keep markdown so the frontend renderer turns
      // [a](/b) into real <Link> anchors.
      return { id: `blk-${i}`, type: 'paragraph', order: i, content: { text: String(b.text || '') } };
    })
    .filter(Boolean);
}

function loadDir(dir) {
  const abs = path.join(CONTENT_ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(abs, f), 'utf-8'));
      } catch (e) {
        console.error(`  bad JSON ${dir}/${f}: ${e.message}`);
        return null;
      }
    })
    .filter(Boolean);
}

function buildPayload(doc, mapping) {
  const seed = doc.heroImageSeed || doc.slug;
  const featuredImage = `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/630`;
  const customFields = {
    ...(doc.customFields || {}),
    kind: mapping.kind,
    faqs: Array.isArray(doc.faqs) ? doc.faqs.filter((f) => f && f.q && f.a) : [],
    internalLinks: Array.isArray(doc.internalLinks) ? doc.internalLinks : [],
  };
  if (doc.category) customFields.category = doc.category;
  if (doc.author) customFields.author = doc.author;
  if (doc.readTime) customFields.readTime = doc.readTime;
  if (mapping.kind === 'article') customFields.isTrending = !!doc.isTrending;

  const seo = doc.seo || {};
  return {
    title: doc.title,
    slug: doc.slug,
    contentType: mapping.contentType,
    excerpt: doc.excerpt || seo.description || '',
    featuredImage,
    contentBlocks: toCmsBlocks(doc.blocks),
    customFields,
    seoMetadata: {
      title: seo.title || doc.title,
      description: seo.description || doc.excerpt || '',
      keywords: Array.isArray(seo.keywords) ? seo.keywords : [],
    },
  };
}

// ── HTTP helpers ──
async function req(method, url, token, body) {
  const r = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}
const jget = (url, token) => req('GET', url, token);
const jpost = (url, token, body) => req('POST', url, token, body);

async function login() {
  const res = await jpost(`${AUTH}/login`, null, { email: EMAIL, password: PW });
  const token = res.data?.data?.accessToken;
  if (!token) throw new Error('login failed: ' + JSON.stringify(res.data).slice(0, 240));
  return token;
}

async function fetchContent(token) {
  const map = {};
  for (let page = 1; page <= 30; page++) {
    const res = await jget(`${BASE}/content?limit=100&page=${page}`, token);
    const rows = res.data?.data || [];
    for (const c of rows) map[c.slug] = { id: c.id, status: c.status };
    const p = res.data?.pagination;
    if (!p || page >= p.totalPages) break;
  }
  return map;
}

async function main() {
  const token = await login();
  let existing = await fetchContent(token);

  const summary = {};
  const touched = [];

  for (const [dir, mapping] of Object.entries(KIND_MAP)) {
    const docs = loadDir(dir);
    let created = 0,
      skipped = 0,
      failed = 0;
    for (const doc of docs) {
      if (!doc.slug || !doc.title) {
        failed++;
        continue;
      }
      touched.push(doc.slug);
      if (existing[doc.slug]) {
        skipped++;
        continue;
      }
      const payload = buildPayload(doc, mapping);
      const res = await jpost(`${BASE}/content`, token, payload);
      if (res.status === 201 || res.status === 200) created++;
      else if (res.status === 409) skipped++;
      else {
        failed++;
        console.error(`  create ${dir}/${doc.slug} -> ${res.status} ${JSON.stringify(res.data).slice(0, 220)}`);
      }
    }
    summary[dir] = { docs: docs.length, created, skipped, failed };
  }

  // Publish everything we touched (and re-fetch to get freshly-created ids).
  existing = await fetchContent(token);
  let published = 0,
    already = 0,
    pubFailed = 0;
  for (const slug of touched) {
    const rec = existing[slug];
    if (!rec) {
      pubFailed++;
      continue;
    }
    if (!['draft', 'approved'].includes(rec.status)) {
      already++;
      continue;
    }
    const res = await jpost(`${BASE}/content/${rec.id}/workflow/transition`, token, { action: 'publish' });
    if (res.status === 200 || res.status === 201) published++;
    else {
      pubFailed++;
      console.error(`  publish ${slug} -> ${res.status} ${JSON.stringify(res.data).slice(0, 200)}`);
    }
  }

  console.log(
    JSON.stringify(
      { ok: true, website: WEBSITE_ID, contentRoot: CONTENT_ROOT, summary, publish: { published, already, pubFailed }, touched: touched.length },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error('seed failed:', e.message);
  process.exit(1);
});
