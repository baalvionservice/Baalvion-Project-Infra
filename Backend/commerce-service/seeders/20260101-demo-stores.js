'use strict';
const { v4: uuidv4 } = require('uuid');

const DEMO_ORG_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const DEMO_USER_ID = 1;

const storeUAE = uuidv4();
const storeIN  = uuidv4();
const storeUS  = uuidv4();
const storeUK  = uuidv4();
const storeEU  = uuidv4();

const categoryId  = uuidv4();
const productId   = uuidv4();
const variantId   = uuidv4();

const now = new Date();

module.exports = {
    async up(queryInterface) {
        // Stores
        await queryInterface.bulkInsert({ tableName: 'commerce_stores', schema: 'commerce' }, [
            { id: storeUAE, organization_id: DEMO_ORG_ID, name: 'Amarise UAE',    code: 'UAE', country_code: 'AE', currency_code: 'AED', timezone: 'Asia/Dubai',    status: 'active', settings: '{}', tax_settings: '{}', payment_settings: '{}', shipping_settings: '{}', seo_settings: '{}', created_by: DEMO_USER_ID, created_at: now, updated_at: now },
            { id: storeIN,  organization_id: DEMO_ORG_ID, name: 'Amarise India',  code: 'IND', country_code: 'IN', currency_code: 'INR', timezone: 'Asia/Kolkata',  status: 'active', settings: '{}', tax_settings: '{}', payment_settings: '{}', shipping_settings: '{}', seo_settings: '{}', created_by: DEMO_USER_ID, created_at: now, updated_at: now },
            { id: storeUS,  organization_id: DEMO_ORG_ID, name: 'Amarise USA',    code: 'USA', country_code: 'US', currency_code: 'USD', timezone: 'America/New_York', status: 'active', settings: '{}', tax_settings: '{}', payment_settings: '{}', shipping_settings: '{}', seo_settings: '{}', created_by: DEMO_USER_ID, created_at: now, updated_at: now },
            { id: storeUK,  organization_id: DEMO_ORG_ID, name: 'Amarise UK',     code: 'GBR', country_code: 'GB', currency_code: 'GBP', timezone: 'Europe/London', status: 'active', settings: '{}', tax_settings: '{}', payment_settings: '{}', shipping_settings: '{}', seo_settings: '{}', created_by: DEMO_USER_ID, created_at: now, updated_at: now },
            { id: storeEU,  organization_id: DEMO_ORG_ID, name: 'Amarise Europe', code: 'EUR', country_code: 'DE', currency_code: 'EUR', timezone: 'Europe/Berlin', status: 'active', settings: '{}', tax_settings: '{}', payment_settings: '{}', shipping_settings: '{}', seo_settings: '{}', created_by: DEMO_USER_ID, created_at: now, updated_at: now },
        ]);

        // Store members — owner for each store
        await queryInterface.bulkInsert({ tableName: 'commerce_store_members', schema: 'commerce' }, [
            { id: uuidv4(), store_id: storeUAE, user_id: DEMO_USER_ID, role: 'store_admin', joined_at: now, created_at: now, updated_at: now },
            { id: uuidv4(), store_id: storeIN,  user_id: DEMO_USER_ID, role: 'store_admin', joined_at: now, created_at: now, updated_at: now },
            { id: uuidv4(), store_id: storeUS,  user_id: DEMO_USER_ID, role: 'store_admin', joined_at: now, created_at: now, updated_at: now },
            { id: uuidv4(), store_id: storeUK,  user_id: DEMO_USER_ID, role: 'store_admin', joined_at: now, created_at: now, updated_at: now },
            { id: uuidv4(), store_id: storeEU,  user_id: DEMO_USER_ID, role: 'store_admin', joined_at: now, created_at: now, updated_at: now },
        ]);

        // UAE category
        await queryInterface.bulkInsert({ tableName: 'commerce_categories', schema: 'commerce' }, [
            { id: categoryId, store_id: storeUAE, parent_id: null, name: 'Luxury Real Estate', slug: 'luxury-real-estate', description: 'Premium residential and commercial properties', depth: 0, sort_order: 0, product_count: 0, is_active: true, seo_metadata: '{}', created_at: now, updated_at: now },
        ]);

        // Demo product (UAE store)
        await queryInterface.bulkInsert({ tableName: 'commerce_products', schema: 'commerce' }, [
            {
                id: productId, store_id: storeUAE, category_id: categoryId,
                name: 'Marina Bay Penthouse', slug: 'marina-bay-penthouse',
                short_description: 'Exclusive 4-bedroom penthouse with panoramic Dubai Marina views',
                description: 'A world-class luxury penthouse spanning 5,000 sq ft with private pool and 24/7 concierge.',
                product_type: 'simple', status: 'published', sku: 'MBP-4BR-001',
                price: 12500000, currency_code: 'AED',
                weight: null, weight_unit: 'kg', dimensions: '{}', materials: '[]',
                specifications: JSON.stringify({ bedrooms: 4, bathrooms: 5, area_sqft: 5000, floor: 42 }),
                seo_metadata: JSON.stringify({ title: 'Marina Bay Penthouse — Luxury Dubai Marina', description: 'Exclusive 4-bedroom penthouse' }),
                tags: '["luxury","penthouse","dubai-marina"]', custom_fields: '{}',
                is_featured: true, is_digital: false, requires_shipping: false,
                view_count: 0, revision_count: 1, published_at: now,
                created_by: DEMO_USER_ID, last_edited_by: DEMO_USER_ID,
                created_at: now, updated_at: now,
            },
        ]);

        // Default variant
        await queryInterface.bulkInsert({ tableName: 'commerce_product_variants', schema: 'commerce' }, [
            {
                id: variantId, product_id: productId,
                sku: 'MBP-4BR-001-DEFAULT', name: 'Default', barcode: null,
                attribute_values: '[]', price: 12500000, compare_at_price: null, cost_price: null,
                currency_code: 'AED', weight: null, is_default: true, is_active: true,
                requires_shipping: false, sort_order: 0,
                created_at: now, updated_at: now,
            },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete({ tableName: 'commerce_product_variants', schema: 'commerce' }, { id: variantId });
        await queryInterface.bulkDelete({ tableName: 'commerce_products', schema: 'commerce' }, { id: productId });
        await queryInterface.bulkDelete({ tableName: 'commerce_categories', schema: 'commerce' }, { id: categoryId });
        await queryInterface.bulkDelete({ tableName: 'commerce_store_members', schema: 'commerce' }, { store_id: { in: [storeUAE, storeIN, storeUS, storeUK, storeEU] } });
        await queryInterface.bulkDelete({ tableName: 'commerce_stores', schema: 'commerce' }, { id: { in: [storeUAE, storeIN, storeUS, storeUK, storeEU] } });
    },
};
