'use strict';
/**
 * Creates the 4 missing Amarisé Maison Avenue per-country stores (UK/AE/IN/SG) alongside the
 * existing live US store, plus the same real brand/category taxonomy already used for US —
 * NO products, NO collections, NO fabricated data. Idempotent (findOrCreate keyed by `code`),
 * safe to re-run.
 *
 * Country config (currency/locale/tax) mirrors
 * Frontend/amarisemaisonavenue.com/src/lib/mock-global-config.ts COUNTRIES_CONFIG exactly —
 * keep both in sync if either changes.
 *
 * Run:  node scripts/seedAmariseCountryStores.js     (from the commerce-service directory,
 *       against the target environment's DB)
 */
const db = require('../models');
const { sequelize, CommerceStore, CommerceCategory } = db;

// The real, live US store — source of organizationId/createdBy for the new siblings.
const US_STORE_ID = '8503a0f6-dab8-4bc5-ad3d-95e4414d0fc7';

const NEW_STORES = [
    { code: 'amarise-uk', countryLabel: 'United Kingdom', countryCode: 'UK', currencyCode: 'GBP', locale: 'en-GB', timezone: 'Europe/London', taxInclusive: true, defaultTaxRate: 20 },
    { code: 'amarise-ae', countryLabel: 'United Arab Emirates', countryCode: 'AE', currencyCode: 'AED', locale: 'ar-AE', timezone: 'Asia/Dubai', taxInclusive: true, defaultTaxRate: 5 },
    { code: 'amarise-in', countryLabel: 'India', countryCode: 'IN', currencyCode: 'INR', locale: 'en-IN', timezone: 'Asia/Kolkata', taxInclusive: true, defaultTaxRate: 18 },
    { code: 'amarise-sg', countryLabel: 'Singapore', countryCode: 'SG', currencyCode: 'SGD', locale: 'en-SG', timezone: 'Asia/Singapore', taxInclusive: true, defaultTaxRate: 7 },
];

// Same real brand/category taxonomy as scripts/seedAmarise.js (labels only — no products).
const BRANDS = [
    { slug: 'hermes', name: 'Hermès', description: 'The pinnacle of leather craftsmanship since 1837.' },
    { slug: 'chanel', name: 'Chanel', description: 'Timeless Parisian elegance.' },
    { slug: 'goyard', name: 'Goyard', description: 'Maison Goyard — woven heritage.' },
    { slug: 'other-brands', name: 'Other Brands', description: 'A curated edit of the world’s finest maisons.' },
    { slug: 'jewelry', name: 'Jewelry', description: 'Fine jewelry & horology.' },
];
const CATEGORIES = [
    { slug: 'hermes-birkin-handbags', brand: 'hermes', name: 'Hermès Birkin Bags', subcategories: ['Birkin 25', 'Birkin 30', 'Birkin 35'] },
    { slug: 'hermes-kelly-handbags', brand: 'hermes', name: 'Hermès Kelly Bags', subcategories: ['Kelly 25', 'Kelly 28', 'Kelly Sellier'] },
    { slug: 'hermes-constance-handbags', brand: 'hermes', name: 'Hermès Constance Bags', subcategories: ['Constance 18', 'Constance 24'] },
    { slug: 'hermes-wallets', brand: 'hermes', name: 'Hermès Wallets', subcategories: ['Bearn', 'Calvi'] },
    { slug: 'chanel-flap-bags', brand: 'chanel', name: 'Chanel Flap Bags', subcategories: ['Classic Mini', 'Classic Medium', 'Jumbo'] },
    { slug: 'chanel-tote', brand: 'chanel', name: 'Chanel Totes', subcategories: ['Deauville', 'GST'] },
    { slug: 'chanel-wallets', brand: 'chanel', name: 'Chanel Wallets', subcategories: ['Long Wallet', 'WOC'] },
    { slug: 'goyard-st-louis-bags', brand: 'goyard', name: 'Goyard St. Louis Totes', subcategories: ['St. Louis GM', 'St. Louis PM'] },
    { slug: 'goyard-artois-bags', brand: 'goyard', name: 'Goyard Artois Bags', subcategories: ['Artois MM', 'Artois PM'] },
    { slug: 'the-row-bags', brand: 'other-brands', name: 'The Row Bags', subcategories: ['Margaux', 'Park Tote'] },
    { slug: 'louis-vuitton-bags', brand: 'other-brands', name: 'Louis Vuitton Bags', subcategories: ['Capucines', 'Twist'] },
    { slug: 'christian-dior-bags', brand: 'other-brands', name: 'Christian Dior Bags', subcategories: ['Lady Dior', 'Book Tote'] },
    { slug: 'fine-jewelry', brand: 'jewelry', name: 'Fine Jewelry', subcategories: ['Necklaces', 'Earrings', 'Rings'] },
    { slug: 'watches', brand: 'jewelry', name: 'Watches', subcategories: ['Heritage', 'Complications'] },
];

async function seedTaxonomy(storeId) {
    const brandRows = {};
    for (let i = 0; i < BRANDS.length; i++) {
        const b = BRANDS[i];
        const [row] = await CommerceCategory.findOrCreate({
            where: { storeId, slug: b.slug },
            defaults: { storeId, slug: b.slug, name: b.name, description: b.description, parentId: null, depth: 0, sortOrder: i, isActive: true, seoMetadata: { brand: true } },
        });
        brandRows[b.slug] = row;
    }
    for (let i = 0; i < CATEGORIES.length; i++) {
        const c = CATEGORIES[i];
        await CommerceCategory.findOrCreate({
            where: { storeId, slug: c.slug },
            defaults: {
                storeId, slug: c.slug, name: c.name,
                parentId: brandRows[c.brand] ? brandRows[c.brand].id : null,
                depth: 1, sortOrder: i, isActive: true, seoMetadata: { subcategories: c.subcategories },
            },
        });
    }
}

async function run() {
    await sequelize.authenticate();

    const usStore = await CommerceStore.findByPk(US_STORE_ID);
    if (!usStore) {
        throw new Error(`US store ${US_STORE_ID} not found — refusing to guess organizationId/createdBy.`);
    }

    console.log(`Reusing organizationId=${usStore.organizationId} createdBy=${usStore.createdBy} from the live US store.`);

    const created = { [US_STORE_ID]: 'us (existing)' };

    for (const s of NEW_STORES) {
        const [store, wasCreated] = await CommerceStore.findOrCreate({
            where: { code: s.code },
            defaults: {
                organizationId: usStore.organizationId,
                name: `Amarisé Maison Avenue — ${s.countryLabel}`,
                code: s.code,
                countryCode: s.countryCode,
                currencyCode: s.currencyCode,
                locale: s.locale,
                timezone: s.timezone,
                status: 'active',
                taxInclusive: s.taxInclusive,
                defaultTaxRate: s.defaultTaxRate,
                createdBy: usStore.createdBy,
                seoConfig: { siteName: `Amarisé Maison Avenue — ${s.countryLabel}` },
                meta: { brandId: 'amarise-luxe' },
            },
        });
        console.log(`${wasCreated ? 'Created' : 'Already existed'}: ${store.name} (${store.id})`);
        await seedTaxonomy(store.id);
        created[store.id] = s.countryCode.toLowerCase();
    }

    console.log('\nDone. Country → storeId map for the frontend:');
    console.log(JSON.stringify(created, null, 2));
}

run()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
