#!/usr/bin/env node
'use strict';
/**
 * Seed Imperialpedia's newsroom categories (idempotent) — the top-level topics
 * shown in the site nav (Business, Tech, Politics, World, ...) plus a
 * World > Region > Country tree.
 *
 * The region slugs MUST match the RegionId values in
 * Frontend/Imperialpedia-main/src/lib/data/worldRegions.ts (e.g. "asia", not
 * "asia-pacific") — the frontend derives an article's worldRegion/worldCountry
 * by finding a checked category whose slug matches a known region id, then
 * finding whichever other checked category has that region as its parent (see
 * cms-public.ts's deriveWorldGeo). Country slugs are open-ended: add more by
 * re-running this script with WORLD_COUNTRIES extended, no frontend change
 * needed.
 *
 *   CMS_URL    default http://127.0.0.1:3011/api/v1
 *   WEBSITE_ID default imperialpedia website id
 *   CMS_TOKEN  required: a Bearer JWT for a cms_editor+/super_admin user
 *
 * Usage:
 *   CMS_TOKEN="$(node Backend/scripts/mint-token.cjs --sub 9000099 --roles super_admin --org <org>)" \
 *     node Backend/scripts/seed-imperialpedia-world-categories.cjs
 */

const CMS_URL = process.env.CMS_URL || 'http://127.0.0.1:3011/api/v1';
const WEBSITE_ID = process.env.WEBSITE_ID || 'e9b3a833-8074-44e9-8451-34949214e4be';
const TOKEN = process.env.CMS_TOKEN;

if (!TOKEN) {
  console.error('CMS_TOKEN env var is required (a cms_editor+/super_admin Bearer JWT).');
  process.exit(1);
}

// Top-level newsroom topics — siblings, no parent. Skips any that already
// exist (e.g. Markets, Real Estate, Personal Finance from the finance taxonomy).
const TOPICS = [
  ['business', 'Business'],
  ['tech', 'Technology'],
  ['politics', 'Politics'],
  ['world', 'World'],
  ['finance', 'Finance'],
  ['health-science', 'Health & Science'],
  ['media', 'Media'],
  ['energy', 'Energy'],
  ['climate', 'Climate'],
  ['investing', 'Investing'],
];

// Region slug (must match RegionId) → display label. Excludes "world" itself
// (that's the parent, not a region under it).
const REGIONS = [
  ['us', 'U.S.'],
  ['europe', 'Europe'],
  ['asia', 'Asia-Pacific'],
  ['china', 'China'],
  ['emerging', 'Emerging Markets'],
];

// Region slug → [ [country slug, label], ... ]. Starter set — extend as new
// countries get covered; each entry is one idempotent category create.
const WORLD_COUNTRIES = {
  asia: [
    ['india', 'India'],
    ['japan', 'Japan'],
    ['south-korea', 'South Korea'],
  ],
  europe: [
    ['uk', 'United Kingdom'],
    ['germany', 'Germany'],
    ['france', 'France'],
  ],
  us: [],
  china: [],
  emerging: [
    ['brazil', 'Brazil'],
    ['south-africa', 'South Africa'],
  ],
};

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

async function listCategories() {
  const data = await api('GET', `/cms/websites/${WEBSITE_ID}/categories?limit=500`);
  return Array.isArray(data) ? data : data.items ?? [];
}

async function ensureCategory(bySlug, { name, slug, parentId, sortOrder }) {
  if (bySlug.has(slug)) return bySlug.get(slug);
  const created = await api('POST', `/cms/websites/${WEBSITE_ID}/categories`, {
    name, slug, parentId, sortOrder,
  });
  bySlug.set(slug, created);
  console.log(`  + ${parentId ? '  └ ' : ''}${slug}`);
  return created;
}

(async () => {
  console.log(`Seeding newsroom + world categories for website ${WEBSITE_ID} via ${CMS_URL}`);
  const existing = await listCategories();
  const bySlug = new Map(existing.map((c) => [c.slug, c]));
  console.log(`Existing categories: ${existing.length}`);
  const before = bySlug.size;

  let order = 100; // stay clear of the finance taxonomy seeder's sortOrder range
  for (const [slug, name] of TOPICS) {
    await ensureCategory(bySlug, { name, slug, sortOrder: order++ });
  }

  const world = bySlug.get('world');
  let regionOrder = 0;
  for (const [regionSlug, regionName] of REGIONS) {
    const region = await ensureCategory(bySlug, {
      name: regionName, slug: regionSlug, parentId: world.id, sortOrder: regionOrder++,
    });
    let countryOrder = 0;
    for (const [countrySlug, countryName] of WORLD_COUNTRIES[regionSlug] || []) {
      await ensureCategory(bySlug, {
        name: countryName, slug: countrySlug, parentId: region.id, sortOrder: countryOrder++,
      });
    }
  }

  const final = await listCategories();
  console.log(`\nDone. Categories now: ${final.length} (created ${bySlug.size - before} this run).`);
})().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
