'use strict';
// Applies the four approved sync payloads to the LOCAL cms-service only.
// Refuses any host other than localhost/127.0.0.1. Usage:
//   CMS_TOKEN=<local bearer> node content-plan/cms-sync/apply-local.cjs [--apply]
// Default is a dry run. Snapshots each record to before/ prior to PATCH.
const fs = require('fs');
const path = require('path');

const BASE = process.env.CMS_URL || 'http://localhost:3018/api/v1';
const SITE = 'law-elite-network';
const TOKEN = process.env.CMS_TOKEN;
const APPLY = process.argv.includes('--apply');
const SLUGS = [
  'financial-settlements-divorce-england-wales',
  'community-property-vs-equitable-distribution-us',
  'ontario-non-compete-ban-vs-rest-of-canada',
  'australia-non-compete-ban-sub-threshold-workers',
];

const host = new URL(BASE).hostname;
if (host !== 'localhost' && host !== '127.0.0.1') throw new Error(`refusing non-local host ${host}`);
if (!TOKEN) throw new Error('CMS_TOKEN required');

const api = async (method, id, body) => {
  const r = await fetch(`${BASE}/cms/websites/${SITE}/content/${id}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${method} ${id} -> ${r.status} ${await r.text()}`);
  return (await r.json()).data;
};

(async () => {
  fs.mkdirSync(path.join(__dirname, 'before'), { recursive: true });
  fs.mkdirSync(path.join(__dirname, 'after'), { recursive: true });
  for (const slug of SLUGS) {
    const p = JSON.parse(fs.readFileSync(path.join(__dirname, `${slug}.json`), 'utf8'));
    if (p.slug !== slug) throw new Error(`payload slug mismatch ${slug}`);
    const cur = await api('GET', p.cmsId);
    if (cur.slug !== slug) throw new Error(`CMS slug mismatch for ${p.cmsId}: ${cur.slug}`);
    fs.writeFileSync(path.join(__dirname, 'before', `${slug}.json`), JSON.stringify(cur, null, 2) + '\n');
    const body = {
      title: p.title,
      excerpt: p.excerpt,
      contentBlocks: p.contentBlocks.map((b, i) => ({ id: cur.contentBlocks?.[i]?.id || `block-${i + 1}`, ...b })),
      seoMetadata: { ...(cur.seoMetadata || {}), description: p.excerpt },
      customFields: { ...(cur.customFields || {}), citations: p.customFields.citations },
    };
    console.log(`${APPLY ? 'PATCH' : 'dry-run'} ${slug} (${p.cmsId})`);
    if (!APPLY) continue;
    await api('PATCH', p.cmsId, body);
    const post = await api('GET', p.cmsId);
    fs.writeFileSync(path.join(__dirname, 'after', `${slug}.json`), JSON.stringify(post, null, 2) + '\n');
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
