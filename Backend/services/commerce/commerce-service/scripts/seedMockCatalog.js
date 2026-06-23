'use strict';
/**
 * Top up the Amarisé catalog so EVERY child category has at least MOCK_MIN_PER_CATEGORY (default 3)
 * published products, by adding clearly-labelled MOCK filler products. Non-destructive and
 * idempotent: it only counts each category and creates the shortfall — re-running once a category
 * already has 3+ creates nothing.
 *
 * Every filler is marked so it's trivial to find, delete, and replace later:
 *   - customFields.isMock = true   → bulk-removable via scripts/deleteMockProducts.js
 *   - tags include 'mock'          → filterable in the admin
 *   - exactly ONE featured placeholder image → uploading a real photo in the admin Media tab
 *     (or hitting "Replace" on the placeholder) cleanly swaps it into the hero slot.
 *
 * Run:  node scripts/seedMockCatalog.js            (from the commerce-service directory)
 *       MOCK_MIN_PER_CATEGORY=4 node scripts/seedMockCatalog.js
 */
const db = require('../models');
const {
    sequelize, CommerceCategory, CommerceProduct, CommerceProductVariant, CommerceProductPricing,
    CommerceProductMedia,
} = db;

const STORE_ID = process.env.AMARISE_STORE_ID || 'a0a00000-0000-4000-8000-000000000001';
const SYSTEM_USER = Number(process.env.AMARISE_OWNER_ID || 67);
const MIN_PER_CATEGORY = Math.max(1, Number(process.env.MOCK_MIN_PER_CATEGORY || 3));
const REGIONS = ['us', 'uk', 'ae', 'in', 'sg', 'ca'];

// Same placeholder convention as seedAmarise.js — overridable so real assets can be wired without
// code changes. picsum URLs render as the branded monogram panel until a real photo is uploaded.
const SEED_MEDIA_BASE_URL = (process.env.SEED_MEDIA_BASE_URL || '').replace(/\/$/, '');
const SEED_MEDIA_EXT = process.env.SEED_MEDIA_EXT || 'jpg';
const img = (seed) =>
    SEED_MEDIA_BASE_URL ? `${SEED_MEDIA_BASE_URL}/${seed}.${SEED_MEDIA_EXT}` : `https://picsum.photos/seed/amarise-${seed}/800/1000`;

const slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// A modest, deterministic placeholder price (USD) so mocks look priced without pretending to be real.
const mockPrice = (n) => 1200 + ((n % 6) * 450);

async function run() {
    await sequelize.authenticate();

    // Child categories (depth 1) + their parent (brand/department) slug.
    const categories = await CommerceCategory.findAll({ where: { storeId: STORE_ID } });
    const byId = new Map(categories.map((c) => [c.id, c]));
    const children = categories.filter((c) => c.parentId);

    let createdTotal = 0;
    const report = [];

    for (const cat of children) {
        const brandSlug = (byId.get(cat.parentId) || {}).slug || '';
        const subcats = (cat.seoMetadata && Array.isArray(cat.seoMetadata.subcategories) && cat.seoMetadata.subcategories) || ['Sample'];

        const existing = await CommerceProduct.count({ where: { storeId: STORE_ID, categoryId: cat.id } });
        let count = existing;
        let sampleIdx = 0;
        let createdHere = 0;

        while (count < MIN_PER_CATEGORY) {
            sampleIdx += 1;
            const slug = `${cat.slug}-sample-${sampleIdx}`;
            // Skip a sample slot that already exists (idempotent across re-runs).
            // eslint-disable-next-line no-await-in-loop
            const clash = await CommerceProduct.findOne({ where: { storeId: STORE_ID, slug }, attributes: ['id'] });
            if (clash) continue;

            const subcategory = subcats[(sampleIdx - 1) % subcats.length];
            const name = `${cat.name} — Sample ${sampleIdx}`;
            const price = mockPrice(sampleIdx);

            // eslint-disable-next-line no-await-in-loop
            await sequelize.transaction(async (t) => {
                const product = await CommerceProduct.create({
                    storeId: STORE_ID, categoryId: cat.id, createdBy: SYSTEM_USER, lastEditedBy: SYSTEM_USER,
                    name, slug, shortDescription: `${name} — placeholder listing.`,
                    description: 'Sample listing for catalog population. Replace the image and details with a real product, or delete it.',
                    productType: 'simple', status: 'published', visibility: 'public', isFeatured: false, publishedAt: new Date(),
                    // First-class inventory column (storefront availability source of truth) — set it so
                    // mocks read as in-stock like the real catalog, not just customFields.stock.
                    stockQuantity: 5, trackInventory: true,
                    tags: ['amarise', brandSlug, cat.slug, 'mock'].filter(Boolean),
                    seoMetadata: { title: `${name} | Amarisé Luxe`, description: 'Sample listing.' },
                    customFields: {
                        isMock: true, isSample: true,
                        departmentId: brandSlug, categoryId: cat.slug, subcategoryId: slugify(subcategory), collectionId: '',
                        isVip: false, rating: 0, reviewsCount: 0, stock: 5,
                        basePrice: price, brandId: 'amarise-luxe', isGlobal: true, regions: REGIONS,
                        scope: 'global', currentVersion: 1, conflictStrategy: 'global-priority', lastEditedRegion: 'global',
                        colors: [], sizes: ['One Size'],
                    },
                }, { transaction: t });

                const variant = await CommerceProductVariant.create({
                    productId: product.id, sku: `AMARISE-MOCK-${cat.slug}-${sampleIdx}`.toUpperCase().slice(0, 60),
                    name: 'Default', price, currencyCode: 'USD', isDefault: true, isActive: true, sortOrder: 0,
                    attributeValues: [{ size: 'One Size' }],
                }, { transaction: t });

                await CommerceProductPricing.create({
                    productId: product.id, variantId: variant.id, storeId: STORE_ID,
                    price, currencyCode: 'USD', taxClass: 'standard', isActive: true,
                }, { transaction: t });

                // EXACTLY ONE featured placeholder → real-photo upload/replace lands in the hero slot.
                await CommerceProductMedia.create({
                    productId: product.id, mediaType: 'image', url: img(slug), altText: name, sortOrder: 0, isFeatured: true,
                }, { transaction: t });
            });

            count += 1;
            createdHere += 1;
            createdTotal += 1;
        }

        report.push({ category: cat.slug, existing, created: createdHere, total: count });
    }

    console.log(`[seedMockCatalog] store=${STORE_ID} min/category=${MIN_PER_CATEGORY}`);
    for (const r of report) {
        const note = r.created > 0 ? `+${r.created} mock` : 'ok';
        console.log(`  ${r.category.padEnd(28)} existing=${r.existing} → total=${r.total}  (${note})`);
    }
    console.log(`[seedMockCatalog] created ${createdTotal} mock products across ${children.length} categories`);
    await sequelize.close();
}

run().then(() => process.exit(0)).catch((err) => { console.error('[seedMockCatalog] FAILED:', err); process.exit(1); });
