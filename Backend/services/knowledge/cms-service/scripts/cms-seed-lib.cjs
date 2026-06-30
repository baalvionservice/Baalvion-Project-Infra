'use strict';
/*
 * Shared engine for seeding authored articles into a cms-service "website" via the
 * management API and publishing them. Used by:
 *   - seed-imperialpedia-seo-articles.cjs  (finance, block-rich)
 *   - seed-law-elite-seo-articles.cjs      (legal, html-only for Law's renderer)
 *
 * Exposes a markdown→block converter that mirrors the live block shape
 * ({id,type,order,content}) plus a runner with export / dry-run / live / update modes.
 *
 * Block-type note: Imperialpedia's reader (cms-public.ts) renders html/heading/callout/
 * quote/table/divider. Law Elite's reader (lib/cms.ts) only special-cases heading + html
 * and renders everything else as <p>{text}</p>. Pass { htmlOnly: true } so callouts,
 * quotes, tables, and dividers are emitted as `html` blocks that BOTH readers pass through.
 */

const fs = require('fs');
const path = require('path');

// ── markdown → blocks ────────────────────────────────────────────────────────
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function inline(text) {
  let s = esc(text);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g,
    (m, label, href) => href.startsWith('http')
      ? `<a href="${href}" rel="noopener noreferrer" target="_blank">${label}</a>`
      : `<a href="${href}">${label}</a>`);
  return s;
}

function slugify(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function parseTable(lines) {
  if (lines.length < 2) return null;
  const isRow = (l) => /^\s*\|.*\|\s*$/.test(l);
  if (!isRow(lines[0]) || !/^\s*\|[\s:|-]+\|\s*$/.test(lines[1])) return null;
  const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  return { headers: cells(lines[0]), rows: lines.slice(2).filter(isRow).map(cells) };
}

function tableHtml(t) {
  const thead = `<thead><tr>${t.headers.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
  return `<table>${thead}${tbody}</table>`;
}

function markdownToBlocks(md, opts = {}) {
  const htmlOnly = !!opts.htmlOnly;
  const blocks = [];
  let order = 0;
  const push = (type, content) => blocks.push({ id: `blk-${order}`, type, order: order++, content });
  const pushHtml = (html) => push('html', { html });

  const rawLines = md.replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  let listBuf = null;

  const flushList = () => {
    if (!listBuf) return;
    const tag = listBuf.ordered ? 'ol' : 'ul';
    pushHtml(`<${tag}>${listBuf.items.map((t) => `<li>${inline(t)}</li>`).join('')}</${tag}>`);
    listBuf = null;
  };

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();
    if (!trimmed) { flushList(); i++; continue; }

    // Table
    if (/^\s*\|.*\|\s*$/.test(line)) {
      flushList();
      const tbl = [];
      while (i < rawLines.length && /^\s*\|.*\|\s*$/.test(rawLines[i])) { tbl.push(rawLines[i]); i++; }
      const parsed = parseTable(tbl);
      if (parsed) { htmlOnly ? pushHtml(tableHtml(parsed)) : push('table', parsed); continue; }
      tbl.forEach((t) => pushHtml(`<p>${inline(t)}</p>`));
      continue;
    }

    // Divider
    if (/^---+$/.test(trimmed)) { flushList(); htmlOnly ? pushHtml('<hr />') : push('divider', {}); i++; continue; }

    // Callout: > [!INFO] text
    const calloutMatch = trimmed.match(/^>\s*\[!(\w+)\]\s*(.*)$/);
    if (calloutMatch) {
      flushList();
      const variant = calloutMatch[1].toLowerCase();
      const v = ['info', 'warning', 'success', 'error'].includes(variant) ? variant : 'info';
      const text = calloutMatch[2].trim();
      htmlOnly ? pushHtml(`<div class="callout callout-${v}">${inline(text)}</div>`) : push('callout', { text, variant: v });
      i++; continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      flushList();
      const qLines = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
        qLines.push(rawLines[i].trim().replace(/^>\s?/, '')); i++;
      }
      let cite;
      const last = qLines[qLines.length - 1] || '';
      if (/^[—-]\s+/.test(last)) { cite = last.replace(/^[—-]\s+/, '').trim(); qLines.pop(); }
      const text = qLines.join(' ').trim();
      if (htmlOnly) pushHtml(`<blockquote><p>${inline(text)}</p>${cite ? `<cite>${inline(cite)}</cite>` : ''}</blockquote>`);
      else push('quote', { text, ...(cite ? { cite } : {}) });
      continue;
    }

    // Headings
    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushList();
      const level = h[1].length;
      if (level === 1) { i++; continue; } // title is the doc title; skip body H1
      push('heading', { text: h[2].trim(), level: Math.min(level, 6) });
      i++; continue;
    }

    // Lists
    const ul = trimmed.match(/^[-*]\s+(.*)$/);
    const ol = trimmed.match(/^\d+\.\s+(.*)$/);
    if (ul || ol) {
      const ordered = !!ol;
      const item = (ul ? ul[1] : ol[1]).trim();
      if (!listBuf || listBuf.ordered !== ordered) { flushList(); listBuf = { ordered, items: [] }; }
      listBuf.items.push(item);
      i++; continue;
    }

    // Paragraph
    flushList();
    const paraLines = [trimmed];
    i++;
    while (i < rawLines.length) {
      const t = rawLines[i].trim();
      if (!t || /^(#{1,6})\s/.test(t) || t.startsWith('>') || /^---+$/.test(t)
        || /^[-*]\s+/.test(t) || /^\d+\.\s+/.test(t) || /^\s*\|.*\|\s*$/.test(rawLines[i])) break;
      paraLines.push(t); i++;
    }
    pushHtml(`<p>${inline(paraLines.join(' '))}</p>`);
  }
  flushList();
  return blocks;
}

function wordCount(md) {
  return md.replace(/[#>*`|_-]/g, ' ').split(/\s+/).filter(Boolean).length;
}

// ── API client + runner ──────────────────────────────────────────────────────
function createRunner(cfg) {
  // cfg: { base, site, categorySlug, categoryName, token, flags:{export,dryRun,update,only}, outDir }
  const THROTTLE_MS = Number(process.env.MIGRATE_THROTTLE_MS || 350);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const log = (...a) => console.log(...a);
  const warn = (...a) => console.warn('  ⚠ ', ...a);
  let TOKEN = cfg.token;
  const BASE = cfg.base.replace(/\/+$/, '');
  const SITE = cfg.site;

  async function api(method, urlPath, body, _attempt = 0) {
    const headers = { 'Content-Type': 'application/json' };
    if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
    const res = await fetch(`${BASE}${urlPath}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 429 && _attempt < 6) {
      const ra = Number(res.headers.get('retry-after'));
      const waitMs = (Number.isFinite(ra) && ra > 0 ? ra * 1000 : 60_000) + 750;
      log(`  …rate-limited; waiting ${Math.round(waitMs / 1000)}s`);
      await sleep(waitMs);
      return api(method, urlPath, body, _attempt + 1);
    }
    if (res.status === 401) { const e = new Error('401 Unauthorized — CMS_TOKEN missing/expired.'); e.fatal = true; throw e; }
    const text = await res.text();
    let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* */ }
    if (!res.ok) {
      const msg = (json && (json.error?.message || json.message)) || text || res.statusText;
      const e = new Error(`${method} ${urlPath} → ${res.status} ${msg}`); e.status = res.status; throw e;
    }
    await sleep(THROTTLE_MS);
    return json;
  }

  function flattenTree(payload) {
    const map = new Map();
    const walk = (nodes) => { if (!Array.isArray(nodes)) return; for (const n of nodes) { if (n && n.slug && n.id) map.set(n.slug, n.id); if (n && Array.isArray(n.children)) walk(n.children); } };
    walk(payload); return map;
  }

  async function resolveCategoryId() {
    const existing = await api('GET', `/cms/websites/${encodeURIComponent(SITE)}/categories`);
    const byId = flattenTree(existing?.data ?? existing);
    if (byId.has(cfg.categorySlug)) return byId.get(cfg.categorySlug);
    log(`  + creating category ${cfg.categorySlug}`);
    const created = await api('POST', `/cms/websites/${encodeURIComponent(SITE)}/categories`,
      { name: cfg.categoryName, slug: cfg.categorySlug, sortOrder: 0 });
    return created?.data?.id ?? created?.id;
  }

  async function existingSlugMap() {
    const map = new Map();
    for (let page = 1; page <= 50; page++) {
      const res = await api('GET', `/cms/websites/${encodeURIComponent(SITE)}/content?page=${page}&limit=100`);
      const items = res?.data ?? [];
      items.forEach((it) => it.slug && map.set(it.slug, it.id));
      const pg = res?.pagination;
      if (!pg || !pg.hasNext || items.length === 0) break;
    }
    return map;
  }

  async function run(docs) {
    const { flags } = cfg;
    fs.mkdirSync(cfg.outDir, { recursive: true });
    const outFile = path.join(cfg.outDir, `${SITE}-seed.json`);
    fs.writeFileSync(outFile, JSON.stringify(docs, null, 2));
    log(`  build written → ${outFile}`);
    docs.forEach((d) => log(`    • ${d.slug.padEnd(38)} ${String(d.customFields?.wordCount ?? '').padStart(4)}w  ${d.contentBlocks.length} blocks  ${(d.customFields?.faq?.length ?? 0)} faq`));
    if (flags.export) { log('\n✓ export-only complete (no target writes).'); return; }

    if (!TOKEN) throw new Error('No CMS_TOKEN set — provide a prod super_admin bearer to write.');
    const categoryId = await resolveCategoryId();
    log(`  category id: ${categoryId}\n`);
    const existing = await existingSlugMap();

    const report = { created: 0, updated: 0, published: 0, skipped: 0, errors: 0 };
    for (const d of docs) {
      const body = { ...d, ...(categoryId ? { categoryIds: [categoryId] } : {}) };
      const existsId = existing.get(d.slug);
      if (existsId && !flags.update) { log(`  = skip (exists)  ${d.slug}`); report.skipped++; continue; }

      if (existsId && flags.update) {
        if (flags.dryRun) { log(`  ~ would update  ${d.slug}  (${d.contentBlocks.length} blocks)`); report.updated++; continue; }
        try {
          await api('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/content/${existsId}`, body);
          report.updated++; log(`  ~ updated  ${d.slug}`);
          // ensure it stays published
          try { await api('POST', `/cms/websites/${encodeURIComponent(SITE)}/content/${existsId}/workflow/transition`, { action: 'publish' }); report.published++; } catch { /* may already be published */ }
        } catch (e) { if (e.fatal) throw e; warn(`update ${d.slug}: ${e.message}`); report.errors++; }
        continue;
      }

      if (flags.dryRun) { log(`  + would create + publish  ${d.slug}  (${d.contentBlocks.length} blocks)`); report.created++; continue; }
      try {
        const created = await api('POST', `/cms/websites/${encodeURIComponent(SITE)}/content`, body);
        const id = created?.data?.id ?? created?.id;
        report.created++; log(`  + created  ${d.slug}  (${id})`);
        if (id) { await api('POST', `/cms/websites/${encodeURIComponent(SITE)}/content/${id}/workflow/transition`, { action: 'publish' }); report.published++; log('    ✓ published'); }
      } catch (e) { if (e.fatal) throw e; warn(`content ${d.slug}: ${e.message}`); report.errors++; }
    }

    log(`\n──────── ${flags.dryRun ? 'DRY RUN' : 'SEED'} SUMMARY ────────`);
    log(`  created   : ${report.created}`);
    log(`  updated   : ${report.updated}`);
    log(`  published : ${report.published}`);
    log(`  skipped   : ${report.skipped} (already existed)`);
    log(`  errors    : ${report.errors}`);
    log(flags.dryRun ? '\n(dry run — nothing was written)' : '\n✓ complete.');
  }

  return { run };
}

module.exports = { markdownToBlocks, wordCount, slugify, createRunner };
