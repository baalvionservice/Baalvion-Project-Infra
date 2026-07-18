'use strict';
// Syncs the real Reloadly catalog into gift_card_brands, scoped to a fixed country list
// (per the "7 countries, Target first" requirement) rather than pulling Reloadly's entire
// global catalog (thousands of products) on every sync. Run via POST /admin/catalog/sync
// (platform-admin only) or a scheduled job once one exists.
const db = require('../models');
const { getSupplier } = require('./suppliers/supplierRegistry');
const { AppError } = require('../utils/errors');

// ISO-3166 alpha-2. Order matters only for sync priority logging, not for product ordering.
const TARGET_COUNTRIES = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IN'];
const PRIORITY_BRAND_NAMES = ['Target']; // synced/logged first within each country

function slugify(name, countryCode) {
    return `${name}-${countryCode}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

async function syncCountry(supplierKey, countryCode) {
    const supplier = getSupplier(supplierKey);
    if (!supplier.isConfigured()) {
        throw new AppError('SUPPLIER_NOT_CONFIGURED', `${supplier.displayName} is not configured — set its credentials before syncing.`, 503);
    }
    const products = await supplier.listProducts(countryCode);
    // Priority brands (Target) first so a partial/interrupted sync still has them.
    products.sort((a, b) => {
        const aP = PRIORITY_BRAND_NAMES.some((n) => a.name.includes(n)) ? 0 : 1;
        const bP = PRIORITY_BRAND_NAMES.some((n) => b.name.includes(n)) ? 0 : 1;
        return aP - bP;
    });

    let created = 0, updated = 0;
    for (const p of products) {
        const slug = slugify(p.name, p.countryCode || countryCode);
        const [row, wasCreated] = await db.GiftCardBrand.findOrCreate({
            where: { supplier: p.supplier, supplier_product_id: p.supplierProductId },
            defaults: {
                supplier: p.supplier,
                supplier_product_id: p.supplierProductId,
                name: p.name,
                slug,
                country_code: p.countryCode || countryCode,
                currency_code: p.currencyCode,
                denomination_type: p.denominationType,
                fixed_denominations: p.fixedDenominations,
                min_denomination: p.minDenomination,
                max_denomination: p.maxDenomination,
                logo_url: p.logoUrl,
                redeem_instruction: p.redeemInstruction,
                last_synced_at: new Date(),
            },
        });
        if (wasCreated) { created += 1; continue; }
        await row.update({
            name: p.name,
            currency_code: p.currencyCode,
            denomination_type: p.denominationType,
            fixed_denominations: p.fixedDenominations,
            min_denomination: p.minDenomination,
            max_denomination: p.maxDenomination,
            logo_url: p.logoUrl,
            redeem_instruction: p.redeemInstruction,
            last_synced_at: new Date(),
        });
        updated += 1;
    }
    return { countryCode, created, updated, total: products.length };
}

async function syncAllTargetCountries(supplierKey = 'reloadly') {
    const results = [];
    for (const cc of TARGET_COUNTRIES) {
        results.push(await syncCountry(supplierKey, cc));
    }
    return results;
}

module.exports = { syncCountry, syncAllTargetCountries, TARGET_COUNTRIES };
