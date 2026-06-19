#!/usr/bin/env node
'use strict';
/**
 * Seed Imperialpedia's "Personal Finance" content into the central Baalvion CMS so it is
 * fully manageable from the admin console (admin-platform :3030) AND served to the live
 * site (:3029) through the public delivery API.
 *
 * It (idempotently):
 *   - logs in as a CMS publisher (super_admin bypasses workflow role levels)
 *   - resolves the `imperialpedia` website
 *   - ensures the `personal-finance` category exists
 *   - reads every article spec   in content/personal-finance/articles/*.json   → contentType 'article'
 *   - reads every page    spec   in content/personal-finance/pages/*.json       → contentType 'page'
 *   - converts each spec into validated CMS contentBlocks (+ SEO + customFields)
 *   - creates (or PATCH-updates) each document, then publishes it (draft → published)
 *
 * Re-runnable: existing slugs are updated in place; unpublished items get published.
 *
 *   AUTH_URL=http://localhost:3001/v1/auth \
 *   CMS_URL=http://localhost:3011/api/v1 \
 *   SUPERADMIN_EMAIL=superadmin@baalvion.com \
 *   SUPERADMIN_PASSWORD=*** \
 *   node scripts/seed-personal-finance.cjs
 *
 * Flags:
 *   --dry            build + validate specs, print a summary, do NOT call the CMS
 *   --articles-only  skip the About/Contact/Privacy page docs
 *   --pages-only     skip the 20 articles
 */

const fs = require('fs');
const path = require('path');

// ── Config ───────────────────────────────────────────────────────────────────
const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS = process.env.CMS_URL || 'http://localhost:3011/api/v1';
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW = process.env.SUPERADMIN_PASSWORD || 'BaalvionAdmin!2026';
const WEBSITE_SLUG = process.env.WEBSITE_SLUG || 'imperialpedia';
const WEBSITE_ID_FALLBACK = process.env.WEBSITE_ID || 'f963f97f-e03f-4383-bac3-d8849e9a7c71';
const CATEGORY = { name: 'Personal Finance', slug: 'personal-finance' };

const ROOT = path.resolve(__dirname, '..', 'content', 'personal-finance');
const ARTICLES_DIR = path.join(ROOT, 'articles');
const PAGES_DIR = path.join(ROOT, 'pages');

const DRY = process.argv.includes('--dry');
const ARTICLES_ONLY = process.argv.includes('--articles-only');
const PAGES_ONLY = process.argv.includes('--pages-only');

const AUTHOR = {
  name: 'Allen Krewzz',
  title: 'Personal Finance Researcher & Business Analyst',
  site: 'ImperialPedia.com',
  bio:
    'Allen Krewzz is a finance researcher, business analyst, and digital entrepreneur focused on ' +
    'personal finance, wealth creation, financial planning, investing, and business growth. His work ' +
    'simplifies complex financial concepts into practical strategies that help readers make smarter ' +
    'money decisions and build long-term financial security.',
};

// ── HTML helpers (mirror cms-public.ts: paragraph/heading escape, html passes through) ──
const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Escape, then re-enable a tiny, safe inline subset authored in the prose:
//   **bold**            → <strong>bold</strong>
//   [anchor](/slug)     → <a href="/slug">anchor</a>   (internal or http(s) only)
function inline(text) {
  let s = esc(text);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(
    /\[([^\]]+)\]\((\/[A-Za-z0-9\-/_#?=&.]+|https?:\/\/[^\s)]+)\)/g,
    '<a href="$2">$1</a>',
  );
  return s;
}

// ── block factory ──────────────────────────────────────────────────────────
function makeBlocks(spec, { appendAuthor }) {
  const blocks = [];
  let order = 0;
  const push = (type, content) => blocks.push({ id: `blk-${order}`, type, order: order++, content });
  const htmlBlock = (html) => push('html', { html });
  const paras = (arr) => (arr || []).forEach((p) => p && p.trim() && htmlBlock(`<p>${inline(p)}</p>`));

  // Intro (\n\n-separated paragraphs)
  if (spec.intro) paras(String(spec.intro).split(/\n{2,}/));

  // Table of contents
  if (Array.isArray(spec.tableOfContents) && spec.tableOfContents.length) {
    const items = spec.tableOfContents.map((t) => `<li>${esc(t)}</li>`).join('');
    htmlBlock(`<div class="toc"><p class="toc-title"><strong>Table of contents</strong></p><ol>${items}</ol></div>`);
  }

  // Sections
  for (const sec of spec.sections || []) {
    if (sec.heading) push('heading', { level: 2, text: sec.heading });
    paras(sec.paragraphs);
    if (sec.table && Array.isArray(sec.table.headers)) {
      if (sec.table.caption) htmlBlock(`<p class="table-caption"><em>${esc(sec.table.caption)}</em></p>`);
      push('table', { headers: sec.table.headers, rows: sec.table.rows || [] });
    }
    if (sec.callout && sec.callout.text) {
      const t = sec.callout.title ? `${sec.callout.title}: ${sec.callout.text}` : sec.callout.text;
      push('callout', { variant: 'info', text: t });
    }
    if (sec.quote && sec.quote.text) push('quote', { text: sec.quote.text, cite: sec.quote.cite || '' });
    for (const sub of sec.subsections || []) {
      if (sub.heading) push('heading', { level: 3, text: sub.heading });
      paras(sub.paragraphs);
    }
  }

  // Key takeaways
  if (Array.isArray(spec.keyTakeaways) && spec.keyTakeaways.length) {
    push('heading', { level: 2, text: 'Key Takeaways' });
    htmlBlock(`<ul class="key-takeaways">${spec.keyTakeaways.map((k) => `<li>${inline(k)}</li>`).join('')}</ul>`);
  }

  // FAQ
  if (Array.isArray(spec.faq) && spec.faq.length) {
    push('heading', { level: 2, text: 'Frequently Asked Questions' });
    for (const f of spec.faq) {
      if (!f || !f.question) continue;
      push('heading', { level: 3, text: f.question });
      htmlBlock(`<p>${inline(f.answer || '')}</p>`);
    }
  }

  // Conclusion
  if (spec.conclusion) {
    push('heading', { level: 2, text: 'Conclusion' });
    paras(String(spec.conclusion).split(/\n{2,}/));
  }

  // Related guides (internal links)
  if (Array.isArray(spec.internalLinks) && spec.internalLinks.length) {
    const items = spec.internalLinks
      .filter((l) => l && l.slug && l.anchor)
      .map((l) => `<li><a href="/articles/${esc(l.slug)}">${esc(l.anchor)}</a></li>`)
      .join('');
    if (items) {
      push('heading', { level: 2, text: 'Related Imperialpedia Guides' });
      htmlBlock(`<ul class="related-guides">${items}</ul>`);
    }
  }

  // Author box
  if (appendAuthor) {
    push('divider', {});
    htmlBlock(
      `<div class="author-bio">` +
        `<p><strong>Written by ${esc(AUTHOR.name)}</strong><br/>${esc(AUTHOR.title)}<br/>${esc(AUTHOR.site)}</p>` +
        `<p>${esc(AUTHOR.bio)}</p>` +
        `</div>`,
    );
  }

  return blocks;
}

// Rough body word count for the length guardrail.
function wordCount(spec) {
  const parts = [];
  if (spec.intro) parts.push(spec.intro);
  for (const s of spec.sections || []) {
    parts.push(...(s.paragraphs || []));
    for (const sub of s.subsections || []) parts.push(...(sub.paragraphs || []));
  }
  for (const f of spec.faq || []) parts.push(f.answer || '');
  if (spec.conclusion) parts.push(spec.conclusion);
  return parts.join(' ').split(/\s+/).filter(Boolean).length;
}

function buildDoc(spec, { contentType, categoryId, appendAuthor }) {
  const seo = spec.seo || {};
  const keywords = [seo.focusKeyword, ...(seo.secondaryKeywords || [])].filter(Boolean).slice(0, 15);
  const doc = {
    title: String(spec.title).slice(0, 500),
    slug: spec.slug,
    contentType,
    excerpt: (spec.excerpt || seo.metaDescription || '').slice(0, 2000),
    contentBlocks: makeBlocks(spec, { appendAuthor }),
    seoMetadata: {
      title: (seo.seoTitle || spec.title || '').slice(0, 200),
      description: (seo.metaDescription || spec.excerpt || '').slice(0, 500),
      keywords,
    },
    visibility: 'public',
    customFields: {
      focusKeyword: seo.focusKeyword || null,
      secondaryKeywords: seo.secondaryKeywords || [],
      searchIntent: seo.searchIntent || null,
      schemaRecommendation: seo.schemaRecommendation || null,
      internalLinks: spec.internalLinks || [],
      externalSources: spec.externalSources || [],
      keyTakeaways: spec.keyTakeaways || [],
      faq: spec.faq || [],
      author: { name: AUTHOR.name, title: AUTHOR.title, site: AUTHOR.site },
      wordCount: wordCount(spec),
    },
  };
  if (categoryId) doc.categoryId = categoryId;
  return doc;
}

function readSpecs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const full = path.join(dir, f);
      try {
        const spec = JSON.parse(fs.readFileSync(full, 'utf8'));
        if (!spec.slug) spec.slug = path.basename(f, '.json');
        return spec;
      } catch (e) {
        console.error(`  ! failed to parse ${f}: ${e.message}`);
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => (a.topicNumber || 0) - (b.topicNumber || 0));
}

// ── HTTP ─────────────────────────────────────────────────────────────────────
async function req(method, url, token, body) {
  const r = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

async function login() {
  const res = await req('POST', `${AUTH}/login`, null, { email: EMAIL, password: PW });
  const token = res.data?.data?.accessToken || res.data?.accessToken;
  if (!token) throw new Error('login failed: ' + JSON.stringify(res.data).slice(0, 240));
  return token;
}

async function resolveWebsite(token) {
  const list = await req('GET', `${CMS}/cms/websites?limit=100`, token);
  const rows = list.data?.data?.data || list.data?.data || list.data?.websites || [];
  const found = Array.isArray(rows) && rows.find((w) => w.slug === WEBSITE_SLUG);
  if (found) return found.id;
  console.warn(`  ! website slug '${WEBSITE_SLUG}' not in authenticated list — using fallback id ${WEBSITE_ID_FALLBACK}`);
  return WEBSITE_ID_FALLBACK;
}

async function ensureCategory(token, websiteId) {
  const res = await req('GET', `${CMS}/cms/websites/${websiteId}/categories?limit=500`, token);
  const rows = res.data?.data?.data || res.data?.data || res.data?.items || [];
  const found = Array.isArray(rows) && rows.find((c) => c.slug === CATEGORY.slug);
  if (found) return found.id;
  const created = await req('POST', `${CMS}/cms/websites/${websiteId}/categories`, token, {
    name: CATEGORY.name, slug: CATEGORY.slug, sortOrder: 0,
  });
  const id = created.data?.data?.id || created.data?.id;
  if (!id) throw new Error('category create failed: ' + JSON.stringify(created.data).slice(0, 240));
  console.log(`  + category ${CATEGORY.slug}`);
  return id;
}

async function fetchExisting(base, token) {
  const map = {};
  for (let page = 1; page <= 30; page++) {
    const res = await req('GET', `${base}/content?limit=100&page=${page}`, token);
    const rows = res.data?.data || [];
    for (const c of rows) map[c.slug] = { id: c.id, status: c.status };
    const p = res.data?.pagination;
    if (!p || page >= (p.totalPages || 1)) break;
  }
  return map;
}

async function upsert(base, token, existing, doc) {
  const found = existing[doc.slug];
  if (found) {
    const { contentType, ...patch } = doc; // contentType is create-only
    const res = await req('PATCH', `${base}/content/${found.id}`, token, patch);
    if (res.status !== 200) return { slug: doc.slug, action: 'update', ok: false, detail: `${res.status} ${JSON.stringify(res.data).slice(0, 160)}` };
    return { slug: doc.slug, action: 'update', ok: true, id: found.id, status: found.status };
  }
  const res = await req('POST', `${base}/content`, token, doc);
  const id = res.data?.data?.id || res.data?.id;
  if ((res.status === 200 || res.status === 201) && id) return { slug: doc.slug, action: 'create', ok: true, id, status: 'draft' };
  return { slug: doc.slug, action: 'create', ok: false, detail: `${res.status} ${JSON.stringify(res.data).slice(0, 160)}` };
}

async function publish(base, token, id) {
  const res = await req('POST', `${base}/content/${id}/workflow/transition`, token, { action: 'publish' });
  return res.status === 200 || res.status === 201;
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  const articleSpecs = PAGES_ONLY ? [] : readSpecs(ARTICLES_DIR);
  const pageSpecs = ARTICLES_ONLY ? [] : readSpecs(PAGES_DIR);
  console.log(`Specs found: ${articleSpecs.length} articles, ${pageSpecs.length} pages`);

  // Length guardrail
  for (const s of articleSpecs) {
    const wc = wordCount(s);
    if (wc < 1500) console.warn(`  ! SHORT: ${s.slug} ~${wc} words (< 1500 minimum)`);
  }

  if (DRY) {
    const rows = [];
    let problems = 0;
    const check = (specs, contentType, appendAuthor) => {
      for (const s of specs) {
        try {
          const doc = buildDoc(s, { contentType, categoryId: 'DRY', appendAuthor });
          const issues = [];
          if (!/^[a-z0-9-]+$/.test(doc.slug)) issues.push('bad-slug');
          if (!doc.title) issues.push('no-title');
          if ((doc.seoMetadata.title || '').length > 60) issues.push(`seoTitle>${doc.seoMetadata.title.length}`);
          if (contentType === 'article' && doc.customFields.wordCount < 1500) issues.push(`short:${doc.customFields.wordCount}`);
          if (issues.length) problems++;
          rows.push(`  ${issues.length ? 'x' : 'OK'} ${doc.slug.padEnd(40)} ${String(doc.customFields.wordCount).padStart(4)}w ${String(doc.contentBlocks.length).padStart(3)}blk ${issues.join(',')}`);
        } catch (e) {
          problems++;
          rows.push(`  x ${s.slug} BUILD ERROR: ${e.message}`);
        }
      }
    };
    check(articleSpecs, 'article', true);
    check(pageSpecs, 'page', false);
    console.log(`DRY — validating ${articleSpecs.length + pageSpecs.length} docs:\n${rows.join('\n')}`);
    console.log(problems ? `\nDRY done with ${problems} doc(s) flagged.` : '\nDRY done — all docs valid. No CMS calls made.');
    if (problems) process.exitCode = 1;
    return;
  }

  const token = await login();
  const websiteId = await resolveWebsite(token);
  const categoryId = await ensureCategory(token, websiteId);
  const base = `${CMS}/cms/websites/${websiteId}`;
  console.log(`website=${websiteId} category=${categoryId}`);

  let existing = await fetchExisting(base, token);

  const docs = [
    ...articleSpecs.map((s) => buildDoc(s, { contentType: 'article', categoryId, appendAuthor: true })),
    ...pageSpecs.map((s) => buildDoc(s, { contentType: 'page', categoryId: null, appendAuthor: false })),
  ];

  const results = [];
  for (const doc of docs) results.push(await upsert(base, token, existing, doc));

  // Publish everything (re-fetch to pick up freshly-created ids).
  existing = await fetchExisting(base, token);
  let published = 0, alreadyPub = 0, pubFail = 0;
  for (const doc of docs) {
    const rec = existing[doc.slug];
    if (!rec) { pubFail++; continue; }
    if (rec.status === 'published') { alreadyPub++; continue; }
    if (await publish(base, token, rec.id)) published++;
    else { pubFail++; console.error(`  publish ${doc.slug} failed`); }
  }

  const created = results.filter((r) => r.action === 'create' && r.ok).length;
  const updated = results.filter((r) => r.action === 'update' && r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({
    ok: failed.length === 0,
    website: { id: websiteId, slug: WEBSITE_SLUG },
    category: { id: categoryId, slug: CATEGORY.slug },
    upsert: { created, updated, failed: failed.length },
    publish: { published, alreadyPub, pubFail },
    public: `${CMS}/public/${WEBSITE_SLUG}/content?contentType=article&limit=30`,
    failures: failed,
  }, null, 2));
  if (failed.length || pubFail) process.exitCode = 1;
}

main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
