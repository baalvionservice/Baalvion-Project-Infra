'use strict';
/**
 * Recreates the Amarisé commerce catalog taxonomy (store + department/category tree) in
 * commerce-service, so the storefront mega-menu (Header.tsx `dynamicNav`) can switch from
 * the hardcoded `MEGA_MENU_DATA` fallback to real, admin-managed data.
 *
 * WHY THIS EXISTS: the production commerce store (NEXT_PUBLIC_STORE_ID
 * a0a00000-0000-4000-8000-000000000001, live-verified 2026-06-03) was lost when the
 * core-stack Postgres volume was re-initialized on 2026-06-21. The recovery that day only
 * restored the CMS schema from a local mirror — the commerce schema (stores/categories/
 * products) was never re-seeded. `GET /commerce/storefront/<that id>/departments` now 404s
 * with "Store not found", so `useDepartments()`/`useCategories()` always return [] and
 * Header.tsx permanently falls back to the static MEGA_MENU_DATA block.
 *
 * commerce-service's `createStoreSchema` has no `id` field — a fresh store gets a NEW
 * random UUID. After this script runs, copy the printed `storeId` into
 * NEXT_PUBLIC_STORE_ID (Vercel production env var) and redeploy — this script cannot do
 * that part, it only has API access, not your Vercel project.
 *
 * Idempotent: re-running skips any store/category whose code/slug already exists.
 *
 *   AUTH_URL=https://auth.baalvion.com/v1/auth \
 *   COMMERCE_URL=https://api.baalvion.com/api/v1 \
 *   SUPERADMIN_EMAIL=<real admin email> SUPERADMIN_PASSWORD=*** \
 *   node scripts/seed-amarise-commerce-catalog.cjs
 *
 * Local dev:
 *   AUTH_URL=http://localhost:4000/v1/auth COMMERCE_URL=http://localhost:3012/api/v1 \
 *   SUPERADMIN_EMAIL=superadmin@baalvion.com SUPERADMIN_PASSWORD=*** \
 *   node scripts/seed-amarise-commerce-catalog.cjs
 */
const AUTH = process.env.AUTH_URL || 'http://localhost:4000/v1/auth';
const COMMERCE = process.env.COMMERCE_URL || 'http://localhost:3012/api/v1';
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW = process.env.SUPERADMIN_PASSWORD;
const STORE_CODE = process.env.STORE_CODE || 'amarise';
const STORE_ID = process.env.STORE_ID; // set to reuse an existing store instead of creating one

// ── HTTP helpers (mirrors seed-amarise-cms.cjs) ──────────────────────────────
async function req(method, url, token, body) {
  const r = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}
const jget = (url, token) => req('GET', url, token);
const jpost = (url, token, body) => req('POST', url, token, body);

async function login() {
  const res = await jpost(`${AUTH}/login`, null, { email: EMAIL, password: PW });
  const token = res.data?.data?.accessToken || res.data?.accessToken || res.data?.data?.token || res.data?.token;
  if (!token) throw new Error('login failed: status ' + res.status);
  return token;
}

// ── Store ─────────────────────────────────────────────────────────────────────
async function getOrCreateStore(token) {
  if (STORE_ID) return STORE_ID;

  const list = await jget(`${COMMERCE}/commerce/stores?search=${encodeURIComponent(STORE_CODE)}&limit=100`, token);
  const rows = list.data?.data || [];
  const found = Array.isArray(rows) && rows.find((s) => s.code === STORE_CODE);
  if (found) return found.id;

  const res = await jpost(`${COMMERCE}/commerce/stores`, token, {
    name: 'Amarisé Maison Avenue',
    code: STORE_CODE,
    countryCode: 'US',
    currencyCode: 'USD',
    locale: 'en',
    timezone: 'UTC',
    taxInclusive: false,
    defaultTaxRate: 0,
  });
  const id = res.data?.data?.id;
  if (!id) throw new Error('store create failed: ' + JSON.stringify(res.data).slice(0, 280));
  return id;
}

// ── Taxonomy ──────────────────────────────────────────────────────────────────
// Departments = root categories. Their `key` is only used internally by this script to
// group children below — the real dept.id the storefront keys off of is whatever slug
// commerce-service assigns.
const DEPARTMENTS = [
  { key: 'new', name: 'New Arrivals', slug: 'dept-new-arrivals' },
  { key: 'hermes', name: 'Hermès', slug: 'dept-hermes' },
  { key: 'chanel', name: 'Chanel', slug: 'dept-chanel' },
  { key: 'goyard', name: 'Goyard', slug: 'dept-goyard' },
  { key: 'other', name: 'Other Brands', slug: 'dept-other-brands' },
  { key: 'jewelry', name: 'Jewelry', slug: 'dept-jewelry' },
];

// Children — slugs match the hrefs already hardcoded across the storefront (Header.tsx
// MEGA_MENU_DATA + defaultNavLinks, homepage CTAs, footer links) so existing /category/*
// links keep resolving once this taxonomy goes live. Each slug appears exactly once here
// even though a few are cross-linked from multiple mega-menu sections in the static data
// (e.g. "fine-jewelry" is referenced from both the Hermès and Jewelry columns) — the real
// taxonomy can only own a category under one parent.
const CATEGORIES = [
  // New Arrivals
  { dept: 'new', slug: 'new-arrivals-handbags', name: 'New Arrivals' },
  { dept: 'new', slug: 'new-arrivals-hermes', name: 'Hermès' },
  { dept: 'new', slug: 'new-arrivals-chanel-handbags-and-accessories', name: 'Chanel' },
  { dept: 'new', slug: 'view-all-new-arrivals', name: 'Other Brands' },
  { dept: 'new', slug: 'jewelry-new-arrivals', name: 'Jewelry New Arrivals' },

  // Hermès
  { dept: 'hermes', slug: 'hermes-handbags', name: 'All Hermès Bags' },
  { dept: 'hermes', slug: 'hermes-birkin-handbags', name: 'Birkin Bags' },
  { dept: 'hermes', slug: 'hermes-kelly-handbags', name: 'Kelly Bags' },
  { dept: 'hermes', slug: 'hermes-constance-handbags', name: 'Constance Bags' },
  { dept: 'hermes', slug: 'hermes-evelyne-bags', name: 'Evelyne Bags' },
  { dept: 'hermes', slug: 'hermes-picotin-bags', name: 'Picotin Bags' },
  { dept: 'hermes', slug: 'hermes-lindy-bags', name: 'Lindy Bags' },
  { dept: 'hermes', slug: 'hermes-bolide-bags', name: 'Bolide Bags' },
  { dept: 'hermes', slug: 'hermes-herbag-collection', name: 'Herbag Collection' },
  { dept: 'hermes', slug: 'hermes-clutch', name: 'Pochettes & Kelly Cuts' },
  { dept: 'hermes', slug: 'hermes-hss-special-order-bags', name: 'HSS Special Order Bags' },
  { dept: 'hermes', slug: 'hermes-wallets', name: 'Wallets' },
  { dept: 'hermes', slug: 'watches', name: 'Watches' },
  { dept: 'hermes', slug: 'hermes-belts', name: 'Belts' },
  { dept: 'hermes', slug: 'hermes-charms', name: 'Charms' },
  { dept: 'hermes', slug: 'hermes-scarves', name: 'Scarves' },
  { dept: 'hermes', slug: 'hermes-shoes', name: 'Shoes' },
  { dept: 'hermes', slug: 'fine-jewelry', name: 'Jewelry' },
  { dept: 'hermes', slug: 'hermes-exotic-handbags', name: 'Exotic Handbags' },
  { dept: 'hermes', slug: 'hermes-rare-handbags', name: 'Rare & Unique Bags' },
  { dept: 'hermes', slug: 'hermes-pre-owned-vintage', name: 'Pre-Owned & Vintage' },
  { dept: 'hermes', slug: 'bag-besties-organizers', name: 'Bag Besties & Organizers' },

  // Chanel
  { dept: 'chanel', slug: 'chanel-bags', name: 'All Chanel Bags' },
  { dept: 'chanel', slug: 'chanel-flap-bags', name: 'Classic Flap Bags' },
  { dept: 'chanel', slug: 'chanel-classic-mini', name: 'Classic Mini Bags' },
  { dept: 'chanel', slug: 'chanel-classic-small', name: 'Classic Small Bags' },
  { dept: 'chanel', slug: 'chanel-classic-medium', name: 'Classic Medium Bags' },
  { dept: 'chanel', slug: 'chanel-jumbo-maxi-flaps', name: 'Jumbo & Maxi Flaps' },
  { dept: 'chanel', slug: 'chanel-22-bags', name: 'Chanel 22 Bags' },
  { dept: 'chanel', slug: 'chanel-25-bags', name: 'Chanel 25 Bags' },
  { dept: 'chanel', slug: 'chanel-tote', name: 'Totes' },
  { dept: 'chanel', slug: 'chanel-wallet-on-chain', name: 'Wallet on Chain' },
  { dept: 'chanel', slug: 'chanel-fashion-runway-bags', name: 'Fashion & Runway' },
  { dept: 'chanel', slug: 'chanel-wallets', name: 'Wallets' },
  { dept: 'chanel', slug: 'chanel-shoes', name: 'Shoes' },
  { dept: 'chanel', slug: 'vintage-chanel-jewelry', name: 'Vintage Chanel Jewelry' },
  { dept: 'chanel', slug: 'chanel-contemporary-jewelry', name: 'Contemporary Jewelry' },
  { dept: 'chanel', slug: 'chanel-pre-owned', name: 'Pre-Owned & Vintage' },

  // Goyard
  { dept: 'goyard', slug: 'goyard', name: 'All Goyard Bags' },
  { dept: 'goyard', slug: 'goyard-st-louis-bags', name: 'Saint Louis' },
  { dept: 'goyard', slug: 'goyard-saigon-bags', name: 'Saigon' },
  { dept: 'goyard', slug: 'goyard-anjou-bags', name: 'Anjou' },
  { dept: 'goyard', slug: 'goyard-artois-bags', name: 'Artois' },
  { dept: 'goyard', slug: 'goyard-other-styles', name: 'Other Styles' },

  // Other Brands
  { dept: 'other', slug: 'other-bags-1', name: 'All Other Brands' },
  { dept: 'other', slug: 'the-row-bags', name: 'The Row' },
  { dept: 'other', slug: 'louis-vuitton-bags', name: 'Louis Vuitton' },
  { dept: 'other', slug: 'christian-dior-bags', name: 'Christian Dior' },
  { dept: 'other', slug: 'fendi-bags', name: 'Fendi' },
  { dept: 'other', slug: 'loro-piana-bags', name: 'Loro Piana' },

  // Jewelry (fine-jewelry itself lives under Hermès above; jewelry-new-arrivals under New Arrivals)
  { dept: 'jewelry', slug: 'jewelry-vintage', name: 'Vintage Jewelry' },
  { dept: 'jewelry', slug: 'jewelry-contemporary', name: 'Contemporary' },
  { dept: 'jewelry', slug: 'costume-jewelry', name: 'Costume Jewelry' },
  { dept: 'jewelry', slug: 'fine-jewelry-earrings', name: 'Earrings' },
  { dept: 'jewelry', slug: 'fine-jewelry-bracelets', name: 'Bracelets' },
  { dept: 'jewelry', slug: 'fine-jewelry-necklaces', name: 'Necklaces' },
  { dept: 'jewelry', slug: 'fine-jewelry-rings', name: 'Rings' },
  { dept: 'jewelry', slug: 'hermes', name: 'Hermès' },
  { dept: 'jewelry', slug: 'jewelry', name: 'Fine Jewelry Brands' },
  { dept: 'jewelry', slug: 'chanel', name: 'Chanel Jewelry' },
];

function flattenTree(nodes = []) {
  const out = [];
  for (const n of nodes) {
    out.push(n);
    if (n.children?.length) out.push(...flattenTree(n.children));
  }
  return out;
}

async function fetchExistingBySlug(storeId, token) {
  const res = await jget(`${COMMERCE}/commerce/stores/${storeId}/categories`, token);
  const tree = res.data?.data || [];
  const flat = flattenTree(tree);
  return new Map(flat.map((c) => [c.slug, c]));
}

async function main() {
  if (!PW) throw new Error('SUPERADMIN_PASSWORD is required');
  const token = await login();
  const storeId = await getOrCreateStore(token);

  let existing = await fetchExistingBySlug(storeId, token);
  const deptIds = {};
  let created = 0,
    skipped = 0,
    failed = 0;

  for (const dept of DEPARTMENTS) {
    const found = existing.get(dept.slug);
    if (found) {
      deptIds[dept.key] = found.id;
      skipped++;
      continue;
    }
    const res = await jpost(`${COMMERCE}/commerce/stores/${storeId}/categories`, token, {
      name: dept.name,
      slug: dept.slug,
    });
    const row = res.data?.data;
    if (!row?.id) {
      failed++;
      console.error(`  dept ${dept.slug} -> ${res.status} ${JSON.stringify(res.data).slice(0, 240)}`);
      continue;
    }
    deptIds[dept.key] = row.id;
    created++;
  }

  for (const cat of CATEGORIES) {
    if (existing.has(cat.slug)) {
      skipped++;
      continue;
    }
    const parentId = deptIds[cat.dept];
    if (!parentId) {
      failed++;
      console.error(`  category ${cat.slug} -> skipped, department "${cat.dept}" was not created`);
      continue;
    }
    const res = await jpost(`${COMMERCE}/commerce/stores/${storeId}/categories`, token, {
      parentId,
      name: cat.name,
      slug: cat.slug,
    });
    if (res.status === 201 || res.status === 200) created++;
    else if (res.status === 409) skipped++;
    else {
      failed++;
      console.error(`  category ${cat.slug} -> ${res.status} ${JSON.stringify(res.data).slice(0, 240)}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: failed === 0,
        storeId,
        departments: { count: DEPARTMENTS.length },
        categories: { created, skipped, failed, total: DEPARTMENTS.length + CATEGORIES.length },
        nextStep: STORE_ID
          ? 'Reused existing STORE_ID — no env var change needed.'
          : `Set NEXT_PUBLIC_STORE_ID=${storeId} in the frontend env (Vercel production settings for prod) and redeploy.`,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error('seed failed:', e.message);
  process.exit(1);
});
