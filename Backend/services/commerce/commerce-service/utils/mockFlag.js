'use strict';

// Mock filler products (seeded by scripts/seedMockCatalog.js) carry customFields.isMock + a
// 'mock' tag. The moment an operator curates one into a real listing — uploads a real photo or
// edits its details — we clear those markers so scripts/deleteMockProducts.js can never delete
// the now-real product. Idempotent: a no-op on products that were never mock.

/** True if a loaded product instance still bears any mock marker. */
function isMockProduct(product) {
    if (!product) return false;
    const cf = (product.customFields && typeof product.customFields === 'object') ? product.customFields : {};
    const tags = Array.isArray(product.tags) ? product.tags : [];
    return cf.isMock === true || cf.isSample === true || tags.includes('mock');
}

/**
 * Clear the mock markers on a loaded CommerceProduct instance (and persist).
 * @param {object} product a loaded CommerceProduct instance
 * @param {object} [t] optional Sequelize transaction
 * @returns {Promise<boolean>} true if the product was demoted from mock, false if it was not mock
 */
async function demoteFromMock(product, t) {
    if (!isMockProduct(product)) return false;
    const cf = (product.customFields && typeof product.customFields === 'object') ? product.customFields : {};
    const tags = Array.isArray(product.tags) ? product.tags : [];
    await product.update(
        {
            customFields: { ...cf, isMock: false, isSample: false },
            tags: tags.filter((tag) => tag !== 'mock'),
        },
        t ? { transaction: t } : undefined,
    );
    return true;
}

module.exports = { isMockProduct, demoteFromMock };
