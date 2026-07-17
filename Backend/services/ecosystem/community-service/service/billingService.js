'use strict';
// Paid-tier community checkout: relays to payment-service's gateway-checkout vertical
// (provider=crypto — USDT-TRC20 or BTC, see PaymentGateway/CryptoGateway on that side) the
// same way insiders-service/billingRoutes.js does for its own paid tier. No payment logic or
// keys live here — payment-service owns the merchant wallet config and chain polling.
const crypto = require('crypto');
const db = require('../models');
const nodebb = require('./nodebbClient');
const moderation = require('./moderationService');
const { SECRET: INTERNAL_SECRET } = require('./internalSecret');
const { AppError } = require('../utils/errors');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://app-payments:3015';

async function checkout(community, userId, email, asset) {
    if (community.access_model !== 'paid') {
        throw new AppError('NOT_PAID_COMMUNITY', 'This community does not have a paid tier', 400);
    }
    if (!community.price_usd_cents || community.price_usd_cents <= 0) {
        throw new AppError('NOT_CONFIGURED', 'This community has no price configured yet', 503);
    }
    const normalizedAsset = String(asset || '').toUpperCase();
    if (!['USDT_TRC20', 'ETH_BEP20', 'BTC'].includes(normalizedAsset)) {
        throw new AppError('VALIDATION_ERROR', 'asset must be USDT_TRC20, ETH_BEP20, or BTC', 422);
    }

    const idempotencyKey = crypto.randomUUID();
    const orderRef = `community:${community.slug}:${userId}`;

    let response;
    try {
        response = await fetch(`${PAYMENT_SERVICE_URL}/v1/gateway/payments`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'idempotency-key': idempotencyKey,
                'x-internal-secret': INTERNAL_SECRET,
                'x-internal-service': 'community-service',
            },
            body: JSON.stringify({
                provider: 'crypto',
                amount: community.price_usd_cents,
                currency: 'USD',
                method: 'CRYPTO',
                orderRef,
                metadata: {
                    fulfillTarget: 'community',
                    userId,
                    email: email || '',
                    communitySlug: community.slug,
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
        chargeId: body.id,
        asset: clientParams.asset || normalizedAsset,
        network: clientParams.network,
        address: clientParams.address,
        amountValue: clientParams.amountValue,
        amountDisplay: clientParams.amountDisplay,
        expiresAt: clientParams.expiresAt,
    };
}

// Called by payment-service's BillingFulfillmentClient after a CAPTURED + amount-validated
// crypto webhook. Mirrors proxy-service/controller/internalFulfillController.js's contract:
// verify secret -> durable idempotency claim -> apply -> mark-applied. 200 = applied/duplicate
// (no retry); 400 = permanently malformed (no retry); 503 = transient (payment-service retries).
async function fulfill({ eventId, metadata, amountMinor, currency, providerRef }) {
    if (!eventId) {
        throw new AppError('VALIDATION_ERROR', 'eventId is required', 400);
    }
    const userId = metadata && metadata.userId;
    const communitySlug = metadata && metadata.communitySlug;
    if (!userId || !communitySlug) {
        // Not a community-billing event (shouldn't reach here given fulfillTarget routing on the
        // payment-service side, but stay defensive) — permanently malformed for this handler.
        throw new AppError('VALIDATION_ERROR', 'metadata.userId and metadata.communitySlug are required', 400);
    }

    const [claim, created] = await db.CommunityBillingWebhookEvent.findOrCreate({
        where: { provider: 'crypto', event_id: eventId },
        defaults: { provider: 'crypto', event_id: eventId, status: 'claimed', payload: { metadata, amountMinor, currency, providerRef } },
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
    await membership.update({
        status: 'paid',
        tier: 'paid',
        amount_usd: (amountMinor || 0) / 100,
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
    return { applied: true, duplicate: false };
}

module.exports = { checkout, fulfill };
