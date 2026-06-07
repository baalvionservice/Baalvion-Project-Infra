#!/usr/bin/env node
'use strict';
/**
 * Seed the Imperialpedia CMS category tree (idempotent).
 *
 * Creates Investopedia-style top categories + subcategories whose slugs match the
 * frontend topic routes (/banking, /stocks, ...), so the dynamic CategoryFeed pages
 * filter real published content by category. Safe to re-run — existing slugs skip.
 *
 *   CMS_URL    default http://127.0.0.1:3011/api/v1
 *   WEBSITE_ID default imperialpedia website id
 *   CMS_TOKEN  required: a Bearer JWT for a cms_editor+/super_admin user
 *
 * Usage:
 *   CMS_TOKEN="$(node Backend/scripts/mint-token.cjs --sub 9000099 --roles super_admin --org <org>)" \
 *     node Backend/scripts/seed-imperialpedia-taxonomy.cjs
 */

const CMS_URL = process.env.CMS_URL || 'http://127.0.0.1:3011/api/v1';
const WEBSITE_ID = process.env.WEBSITE_ID || 'f963f97f-e03f-4383-bac3-d8849e9a7c71';
const TOKEN = process.env.CMS_TOKEN;

if (!TOKEN) {
  console.error('CMS_TOKEN env var is required (a cms_editor+/super_admin Bearer JWT).');
  process.exit(1);
}

// Parent slug → { name, children: [{slug, name}] }
const TREE = {
  investing: {
    name: 'Investing',
    children: [
      ['stocks', 'Stocks'], ['bonds', 'Bonds'], ['etfs', 'ETFs'],
      ['options', 'Options'], ['mutual-funds', 'Mutual Funds'], ['commodities', 'Commodities'],
    ],
  },
  'personal-finance': {
    name: 'Personal Finance',
    children: [
      ['banking', 'Banking'], ['budgeting', 'Budgeting'], ['savings', 'Savings'],
      ['credit', 'Credit'], ['credit-cards', 'Credit Cards'], ['mortgages', 'Mortgages'],
      ['loans', 'Loans'], ['insurance', 'Insurance'], ['retirement', 'Retirement'],
      ['taxes', 'Taxes'], ['debt', 'Debt'], ['income', 'Income'],
      ['real-estate', 'Real Estate'], ['student-loans', 'Student Loans'], ['auto-loans', 'Auto Loans'],
    ],
  },
  economy: {
    name: 'Economy',
    children: [
      ['inflation', 'Inflation'], ['interest-rates', 'Interest Rates'], ['gdp', 'GDP'],
      ['fed', 'Federal Reserve'], ['monetary-policy', 'Monetary Policy'],
      ['fiscal-policy', 'Fiscal Policy'], ['unemployment', 'Unemployment'], ['indicators', 'Indicators'],
    ],
  },
  markets: {
    name: 'Markets',
    children: [
      ['crypto', 'Cryptocurrency'], ['market-news', 'Market News'],
      ['earnings', 'Earnings'], ['company-news', 'Company News'],
    ],
  },
  reviews: {
    name: 'Reviews',
    children: [
      ['bank-reviews', 'Bank Reviews'], ['broker-reviews', 'Broker Reviews'],
      ['credit-card-reviews', 'Credit Card Reviews'], ['robo-advisors', 'Robo-Advisors'],
      ['insurance-reviews', 'Insurance Reviews'],
    ],
  },
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
  console.log(`Seeding taxonomy for website ${WEBSITE_ID} via ${CMS_URL}`);
  const existing = await listCategories();
  const bySlug = new Map(existing.map((c) => [c.slug, c]));
  console.log(`Existing categories: ${existing.length}`);

  let created = 0;
  let order = 0;
  for (const [parentSlug, def] of Object.entries(TREE)) {
    const before = bySlug.size;
    const parent = await ensureCategory(bySlug, { name: def.name, slug: parentSlug, sortOrder: order++ });
    let childOrder = 0;
    for (const [slug, name] of def.children) {
      await ensureCategory(bySlug, { name, slug, parentId: parent.id, sortOrder: childOrder++ });
    }
    created += bySlug.size - before;
  }

  const final = await listCategories();
  console.log(`\nDone. Categories now: ${final.length} (created ${created} this run).`);
})().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
