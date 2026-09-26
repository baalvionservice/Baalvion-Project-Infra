'use strict';
// Paid-tier community checkout: relays to payment-service's gateway-checkout vertical
// (provider=crypto, see PaymentGateway/CryptoGateway on that side) the same way
// insiders-service/billingRoutes.js does for its own paid tier. No payment logic or keys live
// here — payment-service owns the merchant wallet config and chain polling.
const crypto = require('crypto');
const db = require('../models');
const { Money } = require('@baalvion/money');
const paymentSpine = require('./paymentSpine');
const nodebb = require('./nodebbClient');
const moderation = require('./moderationService');
const { SECRET: INTERNAL_SECRET } = require('./internalSecret');
const { AppError } = require('../utils/errors');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://app-payments:3015';

// This site's CMS "Integrations & Keys" vault tenant — payment-service resolves per-provider
// Razorpay/PayU/Cashfree credentials for THIS slug via its own CmsIntegrationsClient (same vault
// every other payment-spine service reads). Crypto needs no vault entry — the merchant wallet
// config lives on the payment-service side, unrelated to per-site PSP keys.
const SITE_SLUG = process.env.PAYMENT_SITE_SLUG || 'baalvion-communities';

// Must stay in sync with CryptoGateway's ASSET_SPECS keys on the payment-service side
// (Backend/services/commerce/financial-services-java/payment-service/.../CryptoGateway.java) —
// this is just the client-facing validation gate, not the source of truth for what's supported.
const SUPPORTED_CRYPTO_ASSETS = [
    'USDT_TRC20', 'ETH_BEP20', 'BTC',
    'USDT_ERC20', 'USDC_ERC20', 'ETH', 'BNB', 'USDT_BEP20',
];

// Card/UPI/bank-transfer providers, added alongside crypto (not replacing it) so members can pay
// with whichever rail is convenient. Each resolves its own keys from the CMS vault by SITE_SLUG.
const SUPPORTED_CARD_PROVIDERS = ['razorpay', 'payu', 'cashfree'];

async function checkout(community, userId, email, provider, asset) {
    if (community.access_model !== 'paid') {
        throw new AppError('NOT_PAID_COMMUNITY', 'This community does not have a paid tier', 400);
    }
    if (!community.price_usd_cents || community.price_usd_cents <= 0) {
        throw new AppError('NOT_CONFIGURED', 'This community has no price configured yet', 503);
    }

    const normalizedProvider = String(provider || 'crypto').toLowerCase();
    const isCrypto = normalizedProvider === 'crypto';
    if (!isCrypto && !SUPPORTED_CARD_PROVIDERS.includes(normalizedProvider)) {
        throw new AppError('VALIDATION_ERROR', `provider must be one of: crypto, ${SUPPORTED_CARD_PROVIDERS.join(', ')}`, 422);
    }

    let normalizedAsset = null;
    if (isCrypto) {
        normalizedAsset = String(asset || '').toUpperCase();
        if (!SUPPORTED_CRYPTO_ASSETS.includes(normalizedAsset)) {
            throw new AppError('VALIDATION_ERROR', `asset must be one of: ${SUPPORTED_CRYPTO_ASSETS.join(', ')}`, 422);
        }
    }

    const idempotencyKey = crypto.randomUUID();
    const orderRef = `community:${community.slug}:${userId}`;
    const url = `${PAYMENT_SERVICE_URL}/v1/gateway/payments${isCrypto ? '' : `?site=${encodeURIComponent(SITE_SLUG)}`}`;

    // This Cashfree account is domestic-only (no IPG/international approval yet), so a USD-priced
    // community must be charged in INR through Cashfree specifically — Razorpay/PayU stay USD.
    // The rate is an operator-set env var, not fabricated; drop this once IPG is approved.
    const CASHFREE_USD_TO_INR_RATE = Number(process.env.CASHFREE_USD_TO_INR_RATE || 88);
    const isCashfree = normalizedProvider === 'cashfree';
    const chargeAmount = isCashfree ? Math.round(community.price_usd_cents * CASHFREE_USD_TO_INR_RATE) : community.price_usd_cents;
    const chargeCurrency = isCashfree ? 'INR' : 'USD';

    let response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'idempotency-key': idempotencyKey,
                'x-internal-secret': INTERNAL_SECRET,
                'x-internal-service': 'community-service',
            },
            body: JSON.stringify({
                provider: normalizedProvider,
                amount: chargeAmount,
                currency: chargeCurrency,
                method: isCrypto ? 'CRYPTO' : 'CARD',
                orderRef,
                metadata: {
                    fulfillTarget: 'community',
                    userId,
                    email: email || '',
                    communitySlug: community.slug,
                    // The webhook reports what the community actually earns in USD, never re-derived
                    // from the INR conversion (which would drift from the price the member saw).
                    ...(isCashfree ? { usdMinor: String(community.price_usd_cents) } : {}),
                    ...(isCrypto ? { cryptoAsset: normalizedAsset } : {}),
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
    if (isCrypto) {
        return {
            chargeId: body.id,
            provider: normalizedProvider,
            asset: clientParams.asset || normalizedAsset,
            network: clientParams.network,
            address: clientParams.address,
            amountValue: clientParams.amountValue,
            amountDisplay: clientParams.amountDisplay,
            expiresAt: clientParams.expiresAt,
        };
    }
    // Card/UPI providers return gateway-specific checkout params (e.g. Razorpay orderId + keyId
    // for opening Razorpay Checkout client-side) — pass them through rather than guessing shape.
    return { chargeId: body.id, provider: normalizedProvider, ...clientParams };
}

// Called by payment-service's BillingFulfillmentClient after a CAPTURED + amount-validated
// crypto webhook. Mirrors proxy-service/controller/internalFulfillController.js's contract:
// verify secret -> durable idempotency claim -> apply -> mark-applied. 200 = applied/duplicate
// (no retry); 400 = permanently malformed (no retry); 503 = transient (payment-service retries).
async function fulfill({ provider, eventId, metadata, amountMinor: rawAmountMinor, currency: rawCurrency, providerRef }) {
    if (!eventId) {
        throw new AppError('VALIDATION_ERROR', 'eventId is required', 400);
    }
    const normalizedProvider = String(provider || 'crypto').toLowerCase();
    // Cashfree charged the INR conversion, not the community's marketed USD price — report the
    // original amount (carried through as metadata.usdMinor) rather than the converted figure.
    const usdMinor = metadata && metadata.usdMinor;
    const amountMinor = normalizedProvider === 'cashfree' && usdMinor != null ? Number(usdMinor) : rawAmountMinor;
    const currency = normalizedProvider === 'cashfree' && usdMinor != null ? 'USD' : rawCurrency;
    const userId = metadata && metadata.userId;
    const communitySlug = metadata && metadata.communitySlug;
    if (!userId || !communitySlug) {
        // Not a community-billing event (shouldn't reach here given fulfillTarget routing on the
        // payment-service side, but stay defensive) — permanently malformed for this handler.
        throw new AppError('VALIDATION_ERROR', 'metadata.userId and metadata.communitySlug are required', 400);
    }

    const [claim, created] = await db.CommunityBillingWebhookEvent.findOrCreate({
        where: { provider: normalizedProvider, event_id: eventId },
        defaults: { provider: normalizedProvider, event_id: eventId, status: 'claimed', payload: { metadata, amountMinor, currency, providerRef } },
    });
    if (!created && claim.status === 'applied') {
        return { applied: true, duplicate: true };
    }

    const community = await db.Community.findOne({ where: { slug: communitySlug, is_active: true } });
    if (!community) {
        throw new AppError('NOT_FOUND', 'Community not found', 400);
    }

    const [membership] = await db.CommunityMembership.findOrCreate({
        where: { community_id: community.id, user_id: userId },
        defaults: { community_id: community.id, user_id: userId, role: 'member' },
    });
    // Exact: the currency's own exponent, not a hardcoded /100, and no float hop. The column
    // is a decimal, so it takes the exact string rather than a divided double.
    const paid = Money.of(amountMinor || 0, currency || 'USD');
    await membership.update({
        status: 'paid',
        tier: 'paid',
        amount_usd: paid.toDecimalString(),
        currency: currency || 'USD',
        payment_ref: providerRef || null,
        started_at: new Date(),
    });

    // Best-effort — see membershipService.syncNodeBBAccess's header for why NodeBB sync degrades
    // gracefully (email resolution can fail) without blocking the (authoritative) membership write.
    try {
        const uid = await nodebb.resolveUidByEmail(metadata.email || null);
        if (uid && community.nodebb_group_paid) {
            await nodebb.addUserToGroup(uid, community.nodebb_group_paid);
        }
    } catch { /* non-fatal */ }

    await moderation.log({
        communityId: community.id,
        actorUserId: userId,
        action: 'member.paid',
        targetUserId: userId,
        details: { providerRef, amountMinor, currency },
    });

    await claim.update({ status: 'applied' });

    // Report onto the platform spine so this payment appears on the cross-estate panel,
    // attributed to this site and to the community that earned it. Never fatal: a spine
    // failure must not turn a paid membership into a 503 that payment-service retries.
    await paymentSpine.reportMembershipPayment({
        eventId, communitySlug, userId, amountMinor, currency, providerRef,
        provider: normalizedProvider,
        email: metadata && metadata.email,
    }).catch((err) => {
        console.warn(JSON.stringify({ evt: 'payment_spine.report_failed', eventId, msg: err.message }));
    });

    return { applied: true, duplicate: false };
}

module.exports = { checkout, fulfill };
