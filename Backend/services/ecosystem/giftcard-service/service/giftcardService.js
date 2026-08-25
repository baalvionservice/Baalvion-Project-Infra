'use strict';
const crypto = require('crypto');
const db = require('../models');
const codeVault = require('./codeVault');
const { getSupplier } = require('./suppliers/supplierRegistry');
const { SECRET: INTERNAL_SECRET } = require('./internalSecret');
const { AppError } = require('../utils/errors');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://app-payments:3015';
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://app-wallet:3039';

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

function validateDenomination(brand, denominationValue) {
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
    return denom;
}

/**
 * Checkout: creates a crypto payment-service charge for the chosen denomination, exactly
 * mirroring community-service's billingService.checkout — payment-service owns the wallet
 * config and chain polling, this service only relays and later fulfills.
 */
async function checkout(brandSlug, userId, email, denominationValue, asset) {
    const brand = await db.GiftCardBrand.findOne({ where: { slug: brandSlug, is_active: true } });
    if (!brand) throw new AppError('NOT_FOUND', 'Gift card brand not found', 404);

    const denom = validateDenomination(brand, denominationValue);

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
 * Purchases the real card from the supplier and stores the encrypted code. Shared by the crypto
 * webhook path (fulfill(), below) and the wallet-pay path (checkoutWithWallet()) — the only
 * difference between them is what confirms the payment (an on-chain webhook vs. an already-placed
 * wallet hold), not what happens once it's confirmed.
 */
async function purchaseFromSupplier(order, metadata) {
    const supplier = getSupplier(order.supplier);
    try {
        await order.update({ status: 'fulfilling' });
        const { transactionId } = await supplier.createOrder({
            productId: order.brand.supplier_product_id,
            denomination: Number(order.denomination_value),
            customIdentifier: order.id,
            recipientEmail: (metadata && metadata.email) || undefined,
        });
        const { code, pin } = await supplier.fetchRedeemCode(transactionId);
        await order.update({
            status: 'fulfilled',
            supplier_transaction_id: transactionId,
            redeem_code_encrypted: code ? codeVault.encrypt(code) : null,
            redeem_pin_encrypted: pin ? codeVault.encrypt(pin) : null,
            fulfilled_at: new Date(),
        });
        return { ok: true };
    } catch (err) {
        await order.update({ status: 'failed', fulfillment_error: err.message });
        return { ok: false, fulfillmentFailed: true, error: err };
    }
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

    const result = await purchaseFromSupplier(order, metadata);
    // The payment WAS captured either way — never throw here (that would signal payment-service
    // to treat this as retryable and re-deliver forever), even on a supplier failure.
    await claim.update({ status: 'applied' });
    return result.ok
        ? { applied: true, duplicate: false }
        : { applied: true, duplicate: false, fulfillmentFailed: true };
}

/**
 * Checkout paid from the buyer's wallet balance instead of a fresh crypto charge. The balance
 * check IS the payment confirmation (nothing on-chain to wait for), so this places a hold, runs
 * fulfillment synchronously in-process, then captures the hold on success or releases it on
 * failure — unlike the crypto path, a supplier failure here auto-returns the buyer's funds
 * instead of leaving a captured-but-unfulfilled payment for manual reconciliation.
 */
async function checkoutWithWallet(brandSlug, userId, denominationValue) {
    const brand = await db.GiftCardBrand.findOne({ where: { slug: brandSlug, is_active: true } });
    if (!brand) throw new AppError('NOT_FOUND', 'Gift card brand not found', 404);

    const denom = validateDenomination(brand, denominationValue);
    const priceUsdCents = Math.round(denom * 100);
    const priceUsd = priceUsdCents / 100;

    const order = await db.GiftCardOrder.create({
        user_id: userId,
        brand_id: brand.id,
        supplier: brand.supplier,
        denomination_value: denom,
        currency_code: brand.currency_code,
        price_usd_cents: priceUsdCents,
        status: 'pending_payment',
        payment_method: 'WALLET',
    });
    // purchaseFromSupplier() reads order.brand.supplier_product_id (populated via the `brand`
    // include when fulfill() loads a crypto order) — this order is freshly created, not re-fetched
    // with that association, so it's attached directly from the brand already in scope.
    order.brand = brand;

    let wallet;
    try {
        const walletRes = await fetch(`${WALLET_SERVICE_URL}/api/v1/wallets/by-holder/${userId}`, {
            headers: { 'x-internal-secret': INTERNAL_SECRET, 'x-internal-service': 'giftcard-service' },
        });
        if (walletRes.status === 404) {
            // No wallet yet means no deposit has ever been made — that's just $0 available, not
            // an upstream failure.
            await order.update({ status: 'failed', fulfillment_error: 'Insufficient wallet balance' });
            throw new AppError('INSUFFICIENT_BALANCE', 'Insufficient wallet balance', 422);
        }
        if (!walletRes.ok) {
            throw new Error(`wallet-service returned HTTP ${walletRes.status}`);
        }
        wallet = await walletRes.json();
    } catch (err) {
        if (err instanceof AppError) throw err;
        await order.update({ status: 'failed', fulfillment_error: err.message });
        throw new AppError('WALLET_UPSTREAM', 'Could not reach your wallet', 502);
    }

    let hold;
    try {
        const holdRes = await fetch(`${WALLET_SERVICE_URL}/api/v1/wallets/${wallet.id}/holds`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-internal-secret': INTERNAL_SECRET,
                'x-internal-service': 'giftcard-service',
            },
            body: JSON.stringify({ currency: 'USD', amount: priceUsd, reference: `giftcard-order:${order.id}`, ttlMinutes: 30 }),
        });
        if (holdRes.status === 422) {
            await order.update({ status: 'failed', fulfillment_error: 'Insufficient wallet balance' });
            throw new AppError('INSUFFICIENT_BALANCE', 'Insufficient wallet balance', 422);
        }
        if (!holdRes.ok) {
            throw new Error(`wallet-service returned HTTP ${holdRes.status}`);
        }
        hold = await holdRes.json();
    } catch (err) {
        if (err instanceof AppError) throw err;
        await order.update({ status: 'failed', fulfillment_error: err.message });
        throw new AppError('WALLET_UPSTREAM', 'Could not reserve funds from your wallet', 502);
    }

    await order.update({ status: 'paid', wallet_hold_id: hold.id });

    const result = await purchaseFromSupplier(order, {});

    if (result.ok) {
        await fetch(`${WALLET_SERVICE_URL}/api/v1/wallets/holds/${hold.id}/capture`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-internal-secret': INTERNAL_SECRET,
                'x-internal-service': 'giftcard-service',
            },
            body: JSON.stringify({ reference: `giftcard-order:${order.id}` }),
        }).catch((err) => {
            // Fulfillment already succeeded and was recorded — a capture-call failure here is a
            // wallet-side bookkeeping issue, not a fulfillment issue. Log loudly, don't fail the order.
            console.error(`[giftcard-service] hold capture failed for order ${order.id}, hold ${hold.id}:`, err.message);
        });
    } else {
        await fetch(`${WALLET_SERVICE_URL}/api/v1/wallets/holds/${hold.id}/release`, {
            method: 'POST',
            headers: { 'x-internal-secret': INTERNAL_SECRET, 'x-internal-service': 'giftcard-service' },
        }).catch((err) => {
            console.error(`[giftcard-service] hold release failed for order ${order.id}, hold ${hold.id}:`, err.message);
        });
    }

    return { orderId: order.id, status: order.status };
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

async function listOrdersAdmin({ status, limit, offset } = {}) {
    const where = {};
    if (status) where.status = status;
    const { rows, count } = await db.GiftCardOrder.findAndCountAll({
        where,
        include: [{ model: db.GiftCardBrand, as: 'brand' }],
        order: [['created_at', 'DESC']],
        limit: Math.min(Number(limit) || 50, 200),
        offset: Number(offset) || 0,
    });
    return {
        total: count,
        orders: rows.map((o) => ({
            id: o.id,
            userId: o.user_id,
            brandName: o.brand && o.brand.name,
            brandLogoUrl: o.brand && o.brand.logo_url,
            supplier: o.supplier,
            denominationValue: o.denomination_value,
            currencyCode: o.currency_code,
            priceUsdCents: o.price_usd_cents,
            status: o.status,
            fulfillmentError: o.status === 'failed' ? o.fulfillment_error : undefined,
            createdAt: o.created_at,
            fulfilledAt: o.fulfilled_at,
        })),
    };
}

async function getMerchantStats() {
    const [totalOrders, fulfilledOrders, pendingOrders, failedOrders, revenueUsdCents, totalBrands, activeBrands] = await Promise.all([
        db.GiftCardOrder.count(),
        db.GiftCardOrder.count({ where: { status: 'fulfilled' } }),
        db.GiftCardOrder.count({ where: { status: ['pending_payment', 'paid', 'fulfilling'] } }),
        db.GiftCardOrder.count({ where: { status: 'failed' } }),
        db.GiftCardOrder.sum('price_usd_cents', { where: { status: 'fulfilled' } }),
        db.GiftCardBrand.count(),
        db.GiftCardBrand.count({ where: { is_active: true } }),
    ]);
    return {
        totalOrders,
        fulfilledOrders,
        pendingOrders,
        failedOrders,
        revenueUsdCents: revenueUsdCents || 0,
        totalBrands,
        activeBrands,
    };
}

async function listCatalogAdmin() {
    const brands = await db.GiftCardBrand.findAll({ order: [['country_code', 'ASC'], ['name', 'ASC']] });
    return brands.map((b) => ({
        ...toPublicBrand(b),
        supplier: b.supplier,
        isActive: b.is_active,
        lastSyncedAt: b.last_synced_at,
    }));
}

module.exports = {
    listCatalog, checkout, checkoutWithWallet, fulfill, listMyOrders,
    listOrdersAdmin, getMerchantStats, listCatalogAdmin,
};
