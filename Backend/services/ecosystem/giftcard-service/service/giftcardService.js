'use strict';
const crypto = require('crypto');
const db = require('../models');
const codeVault = require('./codeVault');
const { getSupplier } = require('./suppliers/supplierRegistry');
const { SECRET: INTERNAL_SECRET } = require('./internalSecret');
const { AppError } = require('../utils/errors');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://app-payments:3015';

async function listCatalog({ countryCode } = {}) {
    const where = { is_active: true };
    if (countryCode) where.country_code = String(countryCode).toUpperCase();
    const brands = await db.GiftCardBrand.findAll({ where, order: [['name', 'ASC']] });
    return brands.map(toPublicBrand);
}

function toPublicBrand(b) {
    return {
        slug: b.slug,
        name: b.name,
        countryCode: b.country_code,
        currencyCode: b.currency_code,
        denominationType: b.denomination_type,
        fixedDenominations: b.fixed_denominations,
        minDenomination: b.min_denomination,
        maxDenomination: b.max_denomination,
        logoUrl: b.logo_url,
        description: b.description,
    };
}

/**
 * Checkout: creates a crypto payment-service charge for the chosen denomination, exactly
 * mirroring community-service's billingService.checkout — payment-service owns the wallet
 * config and chain polling, this service only relays and later fulfills.
 */
async function checkout(brandSlug, userId, email, denominationValue, asset) {
    const brand = await db.GiftCardBrand.findOne({ where: { slug: brandSlug, is_active: true } });
    if (!brand) throw new AppError('NOT_FOUND', 'Gift card brand not found', 404);

    const denom = Number(denominationValue);
    if (brand.denomination_type === 'FIXED') {
        const allowed = (brand.fixed_denominations || []).map(Number);
        if (!allowed.includes(denom)) {
            throw new AppError('VALIDATION_ERROR', `denomination must be one of: ${allowed.join(', ')}`, 422);
        }
    } else {
        if (!(denom >= Number(brand.min_denomination) && denom <= Number(brand.max_denomination))) {
            throw new AppError('VALIDATION_ERROR', `denomination must be between ${brand.min_denomination} and ${brand.max_denomination}`, 422);
        }
    }

    const normalizedAsset = String(asset || '').toUpperCase();
    if (!['USDT_TRC20', 'ETH_BEP20', 'BTC'].includes(normalizedAsset)) {
        throw new AppError('VALIDATION_ERROR', 'asset must be USDT_TRC20, ETH_BEP20, or BTC', 422);
    }

    // priceUsdCents assumes the brand's currency is USD or a 1:1 display peg for now — real
    // multi-currency FX conversion is a follow-up once non-USD brands are synced for real.
    const priceUsdCents = Math.round(denom * 100);

    const order = await db.GiftCardOrder.create({
        user_id: userId,
        brand_id: brand.id,
        supplier: brand.supplier,
        denomination_value: denom,
        currency_code: brand.currency_code,
        price_usd_cents: priceUsdCents,
        status: 'pending_payment',
    });

    const idempotencyKey = crypto.randomUUID();
    const orderRef = `giftcard:${order.id}`;

    let response;
    try {
        response = await fetch(`${PAYMENT_SERVICE_URL}/v1/gateway/payments`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'idempotency-key': idempotencyKey,
                'x-internal-secret': INTERNAL_SECRET,
                'x-internal-service': 'giftcard-service',
            },
            body: JSON.stringify({
                provider: 'crypto',
                amount: priceUsdCents,
                currency: 'USD',
                method: 'CRYPTO',
                orderRef,
                metadata: {
                    fulfillTarget: 'giftcard',
                    userId,
                    email: email || '',
                    orderId: order.id,
                    cryptoAsset: normalizedAsset,
                },
            }),
        });
    } catch {
        throw new AppError('PAYMENT_UPSTREAM', 'payment-service unreachable', 502);
    }

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new AppError('PAYMENT_UPSTREAM', body.message || 'Failed to create checkout', response.status);
    }

    const clientParams = body.clientParams || {};
    return {
        orderId: order.id,
        chargeId: body.id,
        asset: clientParams.asset || normalizedAsset,
        network: clientParams.network,
        address: clientParams.address,
        amountValue: clientParams.amountValue,
        amountDisplay: clientParams.amountDisplay,
        expiresAt: clientParams.expiresAt,
    };
}

/**
 * Fulfillment: called by payment-service's BillingFulfillmentClient after a CAPTURED +
 * amount-validated crypto webhook. Idempotent claim (mirrors community-service's fulfill),
 * then actually purchases the real card from the supplier and stores the encrypted code.
 * A supplier failure here leaves the order 'failed' with a real error message, not a fake
 * success — the user's payment is still captured, so this needs manual reconciliation
 * (matching payment-service's own BillingFulfillmentClient 4xx-vs-5xx contract).
 */
async function fulfill({ eventId, metadata, amountMinor, currency, providerRef }) {
    if (!eventId) throw new AppError('VALIDATION_ERROR', 'eventId is required', 400);
    const userId = metadata && metadata.userId;
    const orderId = metadata && metadata.orderId;
    if (!userId || !orderId) {
        throw new AppError('VALIDATION_ERROR', 'metadata.userId and metadata.orderId are required', 400);
    }

    const [claim, created] = await db.GiftCardBillingWebhookEvent.findOrCreate({
        where: { provider: 'crypto', event_id: eventId },
        defaults: { provider: 'crypto', event_id: eventId, status: 'claimed', payload: { metadata, amountMinor, currency, providerRef } },
    });
    if (!created && claim.status === 'applied') {
        return { applied: true, duplicate: true };
    }

    const order = await db.GiftCardOrder.findByPk(orderId, { include: [{ model: db.GiftCardBrand, as: 'brand' }] });
    if (!order || String(order.user_id) !== String(userId)) {
        throw new AppError('NOT_FOUND', 'Gift card order not found', 400);
    }

    await order.update({ status: 'paid', payment_ref: providerRef || null });

    const supplier = getSupplier(order.supplier);
    try {
        await order.update({ status: 'fulfilling' });
        const { transactionId } = await supplier.createOrder({
            productId: order.brand.supplier_product_id,
            denomination: Number(order.denomination_value),
            customIdentifier: order.id,
            recipientEmail: metadata.email || undefined,
        });
        const { code, pin } = await supplier.fetchRedeemCode(transactionId);
        await order.update({
            status: 'fulfilled',
            supplier_transaction_id: transactionId,
            redeem_code_encrypted: code ? codeVault.encrypt(code) : null,
            redeem_pin_encrypted: pin ? codeVault.encrypt(pin) : null,
            fulfilled_at: new Date(),
        });
    } catch (err) {
        await order.update({ status: 'failed', fulfillment_error: err.message });
        // The payment WAS captured — do not throw here (that would signal payment-service to
        // treat this as retryable and re-deliver forever). Log loudly for manual reconciliation.
        await claim.update({ status: 'applied' });
        return { applied: true, duplicate: false, fulfillmentFailed: true };
    }

    await claim.update({ status: 'applied' });
    return { applied: true, duplicate: false };
}

async function listMyOrders(userId) {
    const orders = await db.GiftCardOrder.findAll({
        where: { user_id: userId },
        include: [{ model: db.GiftCardBrand, as: 'brand' }],
        order: [['created_at', 'DESC']],
    });
    return orders.map((o) => ({
        id: o.id,
        brandName: o.brand && o.brand.name,
        brandLogoUrl: o.brand && o.brand.logo_url,
        denominationValue: o.denomination_value,
        currencyCode: o.currency_code,
        status: o.status,
        fulfillmentError: o.status === 'failed' ? o.fulfillment_error : undefined,
        redeemCode: o.status === 'fulfilled' && o.redeem_code_encrypted ? codeVault.decrypt(o.redeem_code_encrypted) : null,
        redeemPin: o.status === 'fulfilled' && o.redeem_pin_encrypted ? codeVault.decrypt(o.redeem_pin_encrypted) : null,
        createdAt: o.created_at,
        fulfilledAt: o.fulfilled_at,
    }));
}

module.exports = { listCatalog, checkout, fulfill, listMyOrders };
