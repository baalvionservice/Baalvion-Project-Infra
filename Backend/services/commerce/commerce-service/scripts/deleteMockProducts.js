'use strict';
/**
 * Delete every MOCK filler product (customFields.isMock === true) for the Amarisé store, along with
 * its media / variants / pricing / collection links. The companion teardown for seedMockCatalog.js
 * — run it anytime to clear placeholders once real products are in.
 *
 * Run:  node scripts/deleteMockProducts.js --dry-run     (report only)
 *       node scripts/deleteMockProducts.js                (delete)
 */
const db = require('../models');
const {
    sequelize, CommerceProduct, CommerceProductVariant, CommerceProductPricing,
    CommerceProductMedia, CommerceCollectionProduct,
} = db;

const STORE_ID = process.env.AMARISE_STORE_ID || 'a0a00000-0000-4000-8000-000000000001';
const DRY_RUN = process.argv.includes('--dry-run');

// A placeholder image is a picsum seed URL. Any other media URL is a real (uploaded/CDN) photo.
const isPlaceholderUrl = (url) => /picsum\.photos/i.test(String(url || ''));

async function run() {
    await sequelize.authenticate();

    // The catalog is small; fetch the store's products and filter on the jsonb flag in JS so we
    // don't depend on a dialect-specific jsonb where-clause.
    const all = await CommerceProduct.findAll({ where: { storeId: STORE_ID }, attributes: ['id', 'name', 'slug', 'customFields'] });
    const flagged = all.filter((p) => p.customFields && p.customFields.isMock === true);

    // SAFETY NET: never delete a flagged product that already has a real photo (its mock flag
    // should have been cleared on upload, but we double-check the imagery so curated work is never
    // lost even if the flag lingers). Only still-placeholder mocks are eligible.
    const mocks = [];
    const spared = [];
    for (const p of flagged) {
        // eslint-disable-next-line no-await-in-loop
        const media = await CommerceProductMedia.findAll({ where: { productId: p.id }, attributes: ['url'] });
        const hasRealPhoto = media.some((m) => !isPlaceholderUrl(m.url));
        (hasRealPhoto ? spared : mocks).push(p);
    }
    const ids = mocks.map((p) => p.id);

    console.log(`[deleteMockProducts] store=${STORE_ID} dryRun=${DRY_RUN} — ${mocks.length} deletable mock(s), ${spared.length} spared (real photo):`);
    mocks.forEach((p) => console.log(`  - ${p.slug}  (${p.name})`));
    spared.forEach((p) => console.log(`  ~ SPARED ${p.slug}  (has a real photo)`));

    if (DRY_RUN || ids.length === 0) {
        console.log(`[deleteMockProducts] ${DRY_RUN ? 'dry-run — nothing deleted' : 'no mock products found'}`);
        await sequelize.close();
        return;
    }

    await sequelize.transaction(async (t) => {
        await CommerceProductMedia.destroy({ where: { productId: ids }, transaction: t });
        await CommerceProductPricing.destroy({ where: { productId: ids }, transaction: t });
        await CommerceProductVariant.destroy({ where: { productId: ids }, transaction: t });
        await CommerceCollectionProduct.destroy({ where: { productId: ids }, transaction: t });
        await CommerceProduct.destroy({ where: { id: ids }, transaction: t });
    });

    console.log(`[deleteMockProducts] deleted ${ids.length} mock product(s)`);
    await sequelize.close();
}

run().then(() => process.exit(0)).catch((err) => { console.error('[deleteMockProducts] FAILED:', err); process.exit(1); });
