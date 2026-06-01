'use strict';
/**
 * Discount/promo resolution for checkout.
 *
 * order-service and commerce-service share one Postgres database (different schemas), so the
 * authoritative discount definition is read directly from commerce.commerce_discounts (the same
 * pattern createOrder already uses for products/pricing). The client-supplied discount amount is
 * IGNORED — the discount is recomputed server-side from the code.
 *
 * Runs INSIDE the order transaction so the usage-limit claim is atomic with order creation: if the
 * order later rolls back (e.g. out-of-stock), the usage slot is released too. A code that fails
 * validation throws (the client must remove/fix it) rather than being silently dropped — silently
 * dropping a shown discount would overcharge the customer.
 *
 * Supported now: percentage, fixed_amount, free_shipping (appliesTo='all'). buy_x_get_y and
 * item-restricted discounts need line-level targeting and are rejected with a clear message.
 */
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const { AppError } = require('../utils/errors');

function computeAmount(type, value, subtotal, shippingAmount) {
    if (type === 'percentage') return subtotal * (Number(value) / 100);
    if (type === 'fixed_amount') return Number(value);
    if (type === 'free_shipping') return Number(shippingAmount) || 0;
    return null; // buy_x_get_y / unknown → caller rejects
}

/**
 * @param {Transaction} t  active order transaction
 * @returns {Promise<{discountId: string|null, code: string|null, type: string|null, discountAmount: number}>}
 */
async function applyDiscount(t, storeId, code, subtotal, shippingAmount) {
    if (!code) return { discountId: null, code: null, type: null, discountAmount: 0 };

    const [d] = await sequelize.query(
        `SELECT id, code, type, value,
                min_purchase_amount AS "minPurchase", max_discount_amount AS "maxDiscount",
                usage_limit AS "usageLimit", usage_count AS "usageCount", is_active AS "isActive",
                starts_at AS "startsAt", ends_at AS "endsAt", applies_to AS "appliesTo"
           FROM commerce.commerce_discounts
          WHERE store_id = :storeId AND lower(code) = lower(:code)
          LIMIT 1`,
        { replacements: { storeId, code }, type: QueryTypes.SELECT, transaction: t },
    );

    if (!d) throw new AppError('INVALID_DISCOUNT', `Discount code '${code}' is not valid`, 400);
    if (!d.isActive) throw new AppError('INVALID_DISCOUNT', `Discount code '${code}' is inactive`, 400);

    const now = new Date();
    if (d.startsAt && new Date(d.startsAt) > now) throw new AppError('INVALID_DISCOUNT', `Discount '${code}' is not active yet`, 400);
    if (d.endsAt && new Date(d.endsAt) < now) throw new AppError('INVALID_DISCOUNT', `Discount code '${code}' has expired`, 400);
    if (d.minPurchase != null && subtotal < Number(d.minPurchase)) {
        throw new AppError('INVALID_DISCOUNT', `Order subtotal is below the minimum for '${code}'`, 400);
    }
    if (d.appliesTo && d.appliesTo !== 'all') {
        throw new AppError('UNSUPPORTED_DISCOUNT', `Discount '${code}' applies to specific items and is not supported at checkout yet`, 400);
    }

    let amount = computeAmount(d.type, d.value, subtotal, shippingAmount);
    if (amount == null) throw new AppError('UNSUPPORTED_DISCOUNT', `Discount type '${d.type}' is not supported at checkout yet`, 400);

    if (d.maxDiscount != null) amount = Math.min(amount, Number(d.maxDiscount));
    const cap = d.type === 'free_shipping' ? (Number(shippingAmount) || 0) : subtotal;
    amount = Math.max(0, Math.min(amount, cap));
    amount = Number(amount.toFixed(2));

    // Atomically claim a usage slot. RETURNING gives us the row only if the limit guard passes.
    const claimed = await sequelize.query(
        `UPDATE commerce.commerce_discounts
            SET usage_count = usage_count + 1, updated_at = now()
          WHERE id = :id AND (usage_limit IS NULL OR usage_count < usage_limit)
          RETURNING id`,
        { replacements: { id: d.id }, type: QueryTypes.SELECT, transaction: t },
    );
    if (!claimed.length) throw new AppError('DISCOUNT_EXHAUSTED', `Discount code '${code}' has reached its usage limit`, 409);

    return { discountId: d.id, code: d.code, type: d.type, discountAmount: amount };
}

module.exports = { applyDiscount, computeAmount };
