#!/usr/bin/env node
'use strict';
/**
 * Bulk content importer for Imperialpedia — built for 100+ articles/day.
 *
 * Reads a JSON file (array of articles), creates each as CMS content, assigns its
 * category by slug, and publishes (or schedules) it. Idempotent by slug: an existing
 * slug is updated instead of duplicated. Designed to be driven by a human export,
 * a script, or an automation tool (n8n/cron) that POSTs batches.
 *
 *   CMS_URL    default http://127.0.0.1:3011/api/v1
 *   WEBSITE_ID default imperialpedia website id
 *   CMS_TOKEN  required: cms_editor+/super_admin Bearer JWT
 *
 * Usage:
 *   CMS_TOKEN="$(node Backend/scripts/mint-token.cjs --sub 9000099 --roles super_admin --org <org>)" \
 *     node Backend/scripts/import-imperialpedia-content.cjs path/to/articles.json
 *
 * Article item shape (all optional except title):
 *   {
 *     "title": "...", "slug": "...", "categorySlug": "banking",
 *     "excerpt": "...", "featuredImage": "https://...",
 *     "body": "Plain text.\n\nSecond paragraph.",      // OR provide contentBlocks
 *     "contentBlocks": [{ "type": "paragraph", "content": { "text": "..." } }],
 *     "seoMetadata": { "title": "...", "description": "...", "keywords": ["..."] },
 *     "tagIds": [], "publish": true, "scheduledAt": "2026-07-01T09:00:00Z"
 *   }
 */

const fs = require('fs');

const CMS_URL = process.env.CMS_URL || 'http://127.0.0.1:3011/api/v1';
const WEBSITE_ID = process.env.WEBSITE_ID || 'f963f97f-e03f-4383-bac3-d8849e9a7c71';
const TOKEN = process.env.CMS_TOKEN;
const CONCURRENCY = Number(process.env.CONCURRENCY || 5);

if (!TOKEN) { console.error('CMS_TOKEN env var is required.'); process.exit(1); }
const file = process.argv[2];
if (!file) { console.error('Usage: node import-imperialpedia-content.cjs <articles.json>'); process.exit(1); }

async function api(method, path, body) {
  const res = await fetch(`${CMS_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
  return json.data ?? json;
}

const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);

function toBlocks(item) {
  if (Array.isArray(item.contentBlocks) && item.contentBlocks.length) {
    return item.contentBlocks.map((b, i) => ({ id: b.id || `b${i}`, type: b.type || 'paragraph', order: i, content: b.content || {} }));
  }
  const text = String(item.body || item.excerpt || '');
  return text.split(/\n{2,}/).filter(Boolean).map((p, i) => ({ id: `b${i}`, type: 'paragraph', order: i, content: { text: p.trim() } }));
}

async function run() {
  const items = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(items)) throw new Error('Input JSON must be an array of articles.');

  // category slug → id (flatten the parent/children tree the API returns)
  const cats = await api('GET', `/cms/websites/${WEBSITE_ID}/categories?limit=500`);
  const catList = Array.isArray(cats) ? cats : cats.items ?? [];
  const catBySlug = new Map();
  const walk = (nodes) => {
    for (const c of nodes || []) {
      catBySlug.set(c.slug, c.id);
      if (Array.isArray(c.children)) walk(c.children);
    }
  };
  walk(catList);

  // existing content slugs (first page is enough for incremental runs; full scan optional)
  const existing = await api('GET', `/cms/websites/${WEBSITE_ID}/content?limit=100`).catch(() => []);
  const existingList = Array.isArray(existing) ? existing : existing.items ?? [];
  const idBySlug = new Map(existingList.map((c) => [c.slug, c.id]));

  let ok = 0, failed = 0, published = 0, scheduled = 0;

  async function importOne(item) {
    const slug = item.slug ? slugify(item.slug) : slugify(item.title);
    const payload = {
      title: item.title,
      slug,
      contentType: item.contentType || 'article',
      categoryId: item.categorySlug ? catBySlug.get(item.categorySlug) ?? null : null,
      excerpt: item.excerpt || '',
      featuredImage: item.featuredImage || null,
      contentBlocks: toBlocks(item),
      seoMetadata: item.seoMetadata || { title: item.title, description: item.excerpt || '' },
      tagIds: item.tagIds || [],
      visibility: 'public',
    };
    try {
      let id = idBySlug.get(slug);
      if (id) {
        await api('PATCH', `/cms/websites/${WEBSITE_ID}/content/${id}`, payload);
      } else {
        const created = await api('POST', `/cms/websites/${WEBSITE_ID}/content`, payload);
        id = created.id;
      }
      // Publish now, or schedule for a future timestamp.
      if (item.scheduledAt) {
        // Content must be 'approved' before 'schedule'; super_admin can drive it.
        await api('POST', `/cms/websites/${WEBSITE_ID}/content/${id}/workflow/transition`, { action: 'approve' }).catch(() => {});
        await api('POST', `/cms/websites/${WEBSITE_ID}/content/${id}/workflow/transition`, { action: 'schedule', scheduledAt: item.scheduledAt });
        scheduled++;
      } else if (item.publish !== false) {
        await api('POST', `/cms/websites/${WEBSITE_ID}/content/${id}/workflow/transition`, { action: 'publish' });
        published++;
      }
      ok++;
      process.stdout.write('.');
    } catch (e) {
      failed++;
      console.error(`\n  ✗ ${slug}: ${e.message}`);
    }
  }

  // Bounded concurrency.
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    await Promise.all(items.slice(i, i + CONCURRENCY).map(importOne));
  }

  console.log(`\nImported ${ok}/${items.length} (published ${published}, scheduled ${scheduled}, failed ${failed}).`);
}

run().catch((e) => { console.error('Import failed:', e.message); process.exit(1); });
