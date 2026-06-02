'use strict';
/**
 * Seeds the Amarisé Maison Avenue storefront into commerce-service (idempotent: wipe + reseed).
 * Brand-centric IA matching the storefront's navigation/labels:
 *   departments(root categories) = brands (Hermès, Chanel, Goyard, Other Brands, Jewelry),
 *   categories(children) use the app's CATEGORY_LABELS slugs (hermes-birkin-handbags, …),
 *   plus 9 collections and a curated catalog of real luxury products with variants/pricing/media.
 * All products status=published / visibility=public so the public storefront API serves them.
 *
 * Run:  node scripts/seedAmarise.js     (from the commerce-service directory)
 */
const db = require('../models');
const {
    sequelize, CommerceStore, CommerceCategory, CommerceCollection, CommerceCollectionProduct,
    CommerceProduct, CommerceProductVariant, CommerceProductPricing, CommerceProductMedia,
} = db;

const STORE_ID = 'a0a00000-0000-4000-8000-000000000001';
// Owned by the platform organization so the central admin-platform commerce console manages it.
// Override per environment via AMARISE_ORG_ID / AMARISE_OWNER_ID (default = local super-admin org).
const ORG_ID = process.env.AMARISE_ORG_ID || '52c76e5c-0668-4492-ba20-23e7ee16f49b';
const SYSTEM_USER = Number(process.env.AMARISE_OWNER_ID || 67);
const REGIONS = ['us', 'uk', 'ae', 'in', 'sg', 'ca'];

const slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const img = (seed) => `https://picsum.photos/seed/amarise-${seed}/800/1000`;

// Brands → root categories (the storefront nav: HERMÈS / CHANEL / GOYARD / OTHER BRANDS / JEWELRY).
const BRANDS = [
    { slug: 'hermes', name: 'Hermès', description: 'The pinnacle of leather craftsmanship since 1837.' },
    { slug: 'chanel', name: 'Chanel', description: 'Timeless Parisian elegance.' },
    { slug: 'goyard', name: 'Goyard', description: 'Maison Goyard — woven heritage.' },
    { slug: 'other-brands', name: 'Other Brands', description: 'A curated edit of the world’s finest maisons.' },
    { slug: 'jewelry', name: 'Jewelry', description: 'Fine jewelry & horology.' },
];

// Child categories — slugs aligned to the app's CATEGORY_LABELS so labels render automatically.
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

const COLLECTIONS = [
    { slug: 'heritage', name: 'The Heritage Line', description: 'Founding archives.' },
    { slug: 'spring-24', name: 'Spring Summer 2024', description: 'Mediterranean Dawn.' },
    { slug: 'prive', name: 'Maison Privé', description: 'VIP Exclusive artifacts.' },
    { slug: 'resort-24', name: 'Resort 2024', description: 'Coastal elegance.' },
    { slug: 'bridal', name: 'Couture Bridal', description: 'Forever heritage.' },
    { slug: 'mens-bespoke', name: 'Bespoke Tailoring', description: 'Architectural cuts.' },
    { slug: 'high-jewelry', name: 'Atelier Diamonds', description: 'Celestial light.' },
    { slug: 'accessories-24', name: 'The Silk Edit', description: 'Hand-painted archives.' },
    { slug: 'watches-collection', name: 'Horological Secrets', description: 'Eternal precision.' },
];

// Curated real-world luxury catalog, brand-aligned.
const PRODUCTS = [
    { name: 'Hermès Special Order Birkin 25 White & Etoupe Clemence Brushed Gold Hardware', category: 'hermes-birkin-handbags', subcategory: 'Birkin 25', collection: 'heritage', price: 31741.89, isVip: true, condition: 'NEW', conditionDetails: 'Never worn (plastic on hardware); two faint scuff marks on the front-wall open pocket.', specialNotes: 'Extremely rare HSS (Horseshoe Stamp) Special Order configuration.', colors: ['Ivory', 'Gold'], sizes: ['25cm'], rating: 5.0, reviewsCount: 1, stock: 1, description: 'A coveted Special Order Birkin 25 in White and Etoupe Clemence leather with brushed gold hardware.' },
    { name: 'Hermès Birkin 30 Orange Togo Gold Hardware', category: 'hermes-birkin-handbags', subcategory: 'Birkin 30', collection: 'prive', price: 29500.0, isVip: true, condition: 'NEW', colors: ['Gold'], sizes: ['30cm'], rating: 4.9, reviewsCount: 8, stock: 2, description: 'The iconic Birkin 30 in vibrant Orange Togo leather with gold hardware.' },
    { name: 'Hermès Birkin 25 White Swift Palladium Hardware', category: 'hermes-birkin-handbags', subcategory: 'Birkin 25', collection: 'spring-24', price: 27393.69, isVip: true, colors: ['Ivory'], sizes: ['25cm'], rating: 4.9, reviewsCount: 4, stock: 1, description: 'A pristine Birkin 25 in White Swift leather with palladium hardware.' },
    { name: 'Hermès Kelly 28 Sellier Gold Togo Gold Hardware', category: 'hermes-kelly-handbags', subcategory: 'Kelly Sellier', collection: 'heritage', price: 24800.0, isVip: true, colors: ['Gold'], sizes: ['28cm'], rating: 4.9, reviewsCount: 6, stock: 2, description: 'The architectural Kelly 28 Sellier in Gold Togo leather with gold hardware.' },
    { name: 'Hermès Kelly 25 Retourne Black Togo Gold Hardware', category: 'hermes-kelly-handbags', subcategory: 'Kelly 25', collection: 'prive', price: 26500.0, isVip: true, colors: ['Onyx', 'Gold'], sizes: ['25cm'], rating: 5.0, reviewsCount: 3, stock: 1, description: 'A timeless Kelly 25 Retourne in Black Togo leather with gold hardware.' },
    { name: 'Hermès Constance 24 Black Epsom Gold Hardware', category: 'hermes-constance-handbags', subcategory: 'Constance 24', collection: 'heritage', price: 18950.0, isVip: true, colors: ['Onyx', 'Gold'], sizes: ['24cm'], rating: 4.8, reviewsCount: 11, stock: 2, description: 'The elegant Constance 24 in Black Epsom leather with the signature H clasp.' },
    { name: 'Hermès Constance 18 Rose Sakura Gold Hardware', category: 'hermes-constance-handbags', subcategory: 'Constance 18', collection: 'spring-24', price: 16400.0, isVip: false, colors: ['Plum', 'Gold'], sizes: ['18cm'], rating: 4.7, reviewsCount: 19, stock: 3, description: 'A delicate Constance 18 in Rose Sakura with gold hardware.' },
    { name: 'Hermès Béarn Wallet Gold Epsom', category: 'hermes-wallets', subcategory: 'Bearn', collection: 'accessories-24', price: 3250.0, isVip: false, colors: ['Gold'], sizes: ['One Size'], rating: 4.6, reviewsCount: 47, stock: 8, description: 'The Béarn bifold wallet in Gold Epsom leather.' },

    { name: 'Chanel Classic Medium Flap Black Caviar Gold Hardware', category: 'chanel-flap-bags', subcategory: 'Classic Medium', collection: 'heritage', price: 10200.0, isVip: true, colors: ['Onyx', 'Gold'], sizes: ['Medium'], rating: 4.9, reviewsCount: 33, stock: 4, description: 'The Classic Medium Double Flap in black caviar leather with gold hardware.' },
    { name: 'Chanel Mini Rectangular Flap Pink Lambskin', category: 'chanel-flap-bags', subcategory: 'Classic Mini', collection: 'spring-24', price: 8800.0, isVip: false, colors: ['Plum'], sizes: ['Mini'], rating: 4.7, reviewsCount: 52, stock: 6, description: 'The coveted Mini Rectangular Flap in pink lambskin.' },
    { name: 'Chanel Jumbo Double Flap Beige Caviar', category: 'chanel-flap-bags', subcategory: 'Jumbo', collection: 'prive', price: 11400.0, isVip: true, colors: ['Ivory', 'Gold'], sizes: ['Jumbo'], rating: 4.8, reviewsCount: 21, stock: 2, description: 'The Jumbo Classic Double Flap in beige caviar leather.' },
    { name: 'Chanel Deauville Tote Navy Canvas', category: 'chanel-tote', subcategory: 'Deauville', collection: 'resort-24', price: 4600.0, isVip: false, colors: ['Midnight'], sizes: ['Medium'], rating: 4.5, reviewsCount: 64, stock: 9, description: 'The casual-chic Deauville tote in navy canvas.' },
    { name: 'Chanel Classic Long Wallet Black Caviar', category: 'chanel-wallets', subcategory: 'Long Wallet', collection: 'accessories-24', price: 1450.0, isVip: false, colors: ['Onyx'], sizes: ['One Size'], rating: 4.6, reviewsCount: 88, stock: 14, description: 'The Classic Long Flap Wallet in black caviar leather.' },

    { name: 'Goyard St. Louis GM Tote Black', category: 'goyard-st-louis-bags', subcategory: 'St. Louis GM', collection: 'heritage', price: 1980.0, isVip: false, colors: ['Onyx'], sizes: ['GM'], rating: 4.7, reviewsCount: 41, stock: 7, description: 'The reversible St. Louis GM tote in classic Goyardine canvas.' },
    { name: 'Goyard Artois MM Bordeaux', category: 'goyard-artois-bags', subcategory: 'Artois MM', collection: 'resort-24', price: 3400.0, isVip: false, colors: ['Plum'], sizes: ['MM'], rating: 4.6, reviewsCount: 17, stock: 4, description: 'The structured Artois MM in Bordeaux Goyardine.' },

    { name: 'The Row Margaux 15 Black Leather', category: 'the-row-bags', subcategory: 'Margaux', collection: 'spring-24', price: 6490.0, isVip: false, colors: ['Onyx'], sizes: ['15'], rating: 4.8, reviewsCount: 23, stock: 5, description: 'The understated Margaux 15 top-handle in black leather.' },
    { name: 'Louis Vuitton Capucines BB Taurillon', category: 'louis-vuitton-bags', subcategory: 'Capucines', collection: 'prive', price: 7350.0, isVip: true, colors: ['Ivory'], sizes: ['BB'], rating: 4.7, reviewsCount: 14, stock: 3, description: 'The Capucines BB in supple Taurillon leather.' },
    { name: 'Christian Dior Lady Dior Medium Cannage', category: 'christian-dior-bags', subcategory: 'Lady Dior', collection: 'spring-24', price: 6500.0, isVip: false, colors: ['Onyx'], sizes: ['Medium'], rating: 4.6, reviewsCount: 29, stock: 4, description: 'The iconic Lady Dior Medium in cannage lambskin.' },

    { name: 'Amarisé Rare Gem Necklace Colombian Emerald', category: 'fine-jewelry', subcategory: 'Necklaces', collection: 'high-jewelry', price: 128000.0, isVip: true, colors: ['Emerald', 'Gold'], sizes: ['One Size'], rating: 5.0, reviewsCount: 2, stock: 1, description: 'A high-jewelry necklace centred on a Colombian emerald, set in 18k gold.' },
    { name: 'Hermès Heritage Chronograph Steel', category: 'watches', subcategory: 'Heritage', collection: 'watches-collection', price: 34500.0, isVip: false, colors: ['Onyx'], sizes: ['One Size'], rating: 4.7, reviewsCount: 14, stock: 3, description: 'A heritage chronograph in polished steel with silvered dial.' },
];

async function wipeStore() {
    const products = await CommerceProduct.findAll({ where: { storeId: STORE_ID }, attributes: ['id'] });
    const pids = products.map((p) => p.id);
    if (pids.length) {
        await CommerceProductMedia.destroy({ where: { productId: pids } });
        await CommerceProductPricing.destroy({ where: { productId: pids } });
        await CommerceProductVariant.destroy({ where: { productId: pids } });
        await CommerceCollectionProduct.destroy({ where: { productId: pids } });
        await CommerceProduct.destroy({ where: { id: pids } });
    }
    await CommerceCollection.destroy({ where: { storeId: STORE_ID } });
    await CommerceCategory.destroy({ where: { storeId: STORE_ID } });
}

async function seed() {
    await sequelize.authenticate();

    const [store] = await CommerceStore.findOrCreate({
        where: { id: STORE_ID },
        defaults: {
            organizationId: ORG_ID, name: 'Amarisé Maison Avenue', code: 'amarise-luxe',
            countryCode: 'US', currencyCode: 'USD', locale: 'en', timezone: 'UTC',
            status: 'active', createdBy: SYSTEM_USER,
            seoConfig: { siteName: 'Amarisé Maison Avenue' }, meta: { brandId: 'amarise-luxe' },
        },
    });

    await wipeStore();

    const brandRows = {};
    for (let i = 0; i < BRANDS.length; i++) {
        const b = BRANDS[i];
        brandRows[b.slug] = await CommerceCategory.create({
            storeId: STORE_ID, slug: b.slug, name: b.name, description: b.description,
            parentId: null, depth: 0, sortOrder: i, isActive: true, seoMetadata: { brand: true },
        });
    }
    const catRows = {};
    for (let i = 0; i < CATEGORIES.length; i++) {
        const c = CATEGORIES[i];
        catRows[c.slug] = await CommerceCategory.create({
            storeId: STORE_ID, slug: c.slug, name: c.name,
            parentId: brandRows[c.brand] ? brandRows[c.brand].id : null, depth: 1, sortOrder: i, isActive: true,
            seoMetadata: { subcategories: c.subcategories },
        });
    }
    const colRows = {};
    for (let i = 0; i < COLLECTIONS.length; i++) {
        const c = COLLECTIONS[i];
        colRows[c.slug] = await CommerceCollection.create({
            storeId: STORE_ID, slug: c.slug, name: c.name, description: c.description,
            sortOrder: i, isActive: true, seoMetadata: { brandId: 'amarise-luxe', isGlobal: true },
        });
    }

    let created = 0;
    for (let i = 0; i < PRODUCTS.length; i++) {
        const p = PRODUCTS[i];
        const slug = slugify(p.name);
        const cat = catRows[p.category];
        const brand = CATEGORIES.find((c) => c.slug === p.category)?.brand || '';
        await sequelize.transaction(async (t) => {
            const product = await CommerceProduct.create({
                storeId: STORE_ID, categoryId: cat ? cat.id : null, createdBy: SYSTEM_USER, lastEditedBy: SYSTEM_USER,
                name: p.name, slug, shortDescription: (p.description || p.name).slice(0, 160),
                description: p.description || '', productType: 'simple', status: 'published', visibility: 'public',
                isFeatured: !!p.isVip, publishedAt: new Date(),
                tags: ['amarise', brand, p.category].filter(Boolean),
                seoMetadata: { title: `${p.name} | Amarisé Luxe`, description: p.description || p.name },
                customFields: {
                    departmentId: brand, categoryId: p.category, subcategoryId: slugify(p.subcategory), collectionId: p.collection,
                    isVip: !!p.isVip, rating: p.rating ?? 0, reviewsCount: p.reviewsCount ?? 0, stock: p.stock ?? 0,
                    basePrice: p.price, brandId: 'amarise-luxe', isGlobal: true, regions: REGIONS,
                    scope: 'global', currentVersion: 1, conflictStrategy: 'global-priority', lastEditedRegion: 'global',
                    colors: p.colors || [], sizes: p.sizes || [],
                    condition: p.condition, conditionDetails: p.conditionDetails, specialNotes: p.specialNotes,
                    vendorId: `vend-${(i % 5) + 1}`,
                },
            }, { transaction: t });

            const variant = await CommerceProductVariant.create({
                productId: product.id, sku: `AMARISE-${String(i + 1).padStart(3, '0')}-DEFAULT`, name: 'Default',
                price: p.price, currencyCode: 'USD', isDefault: true, isActive: true, sortOrder: 0,
                attributeValues: [{ color: (p.colors || [])[0] || null }, { size: (p.sizes || [])[0] || null }],
            }, { transaction: t });

            await CommerceProductPricing.create({
                productId: product.id, variantId: variant.id, storeId: STORE_ID,
                price: p.price, currencyCode: 'USD', taxClass: 'standard', isActive: true,
            }, { transaction: t });

            await CommerceProductMedia.bulkCreate([
                { productId: product.id, mediaType: 'image', url: img(`${slug}-1`), altText: p.name, sortOrder: 0, isFeatured: true },
                { productId: product.id, mediaType: 'image', url: img(`${slug}-2`), altText: p.name, sortOrder: 1, isFeatured: false },
            ], { transaction: t });

            const col = colRows[p.collection];
            if (col) await product.addCollection(col, { transaction: t });
            created++;
        });
    }

    console.log(`[seedAmarise] store=${store.id} brands=${BRANDS.length} categories=${CATEGORIES.length} collections=${COLLECTIONS.length} products=${created}`);
    await sequelize.close();
}

seed().then(() => process.exit(0)).catch((err) => { console.error('[seedAmarise] FAILED:', err); process.exit(1); });
