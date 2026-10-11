'use strict';
// Paid community tiers: pay the admin, attach a screenshot, an admin confirms, and the membership is granted.
const { CommerceSellerCategoryBond } = require('../models');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');
const sellerBondService = require('./sellerBondService');

async function statusFor(userId) {
    const rows = await CommerceSellerCategoryBond.findAll({ where: { sellerUserId: userId, kind: 'community_tier' }, order: [['createdAt', 'DESC']] });
    const latest = {};
    for (const r of rows) if (!latest[r.tierSlug]) latest[r.tierSlug] = r;
    const tiers = [];
    for (const [slug, t] of Object.entries(config.communityTiers)) {
        tiers.push({ slug, name: t.name, priceUsd: t.amountUsd, payment: latest[slug] ? await sellerBondService.presentBond(latest[slug]) : null });
    }
    return { tiers };
}

const start = (authCtx, body) => sellerBondService.createCommunityTier(authCtx, body);

// Called when an admin confirms the payment. Idempotent on the community side (the event id is the payment id).
async function grant(bond) {
    const secret = process.env.INTERNAL_SERVICE_SECRET;
    if (!secret) throw new AppError('UNAVAILABLE', 'Access cannot be granted right now (service secret missing)', 503);
    let res;
    try {
        res = await fetch(`${config.communityServiceUrl}/api/v1/community/billing/fulfill`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-internal-secret': secret },
            body: JSON.stringify({
                provider: 'crypto',
                eventId: `manual-${bond.id}`,
                metadata: { userId: String(bond.sellerUserId), communitySlug: bond.tierSlug },
                amountMinor: Math.round(Number(bond.amountUsd) * 100),
                currency: 'USD',
                providerRef: bond.id,
            }),
            signal: AbortSignal.timeout(15000),
        });
    } catch (err) {
        throw new AppError('UNAVAILABLE', `Could not reach the community service: ${err.message}`, 503);
    }
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new AppError('UNAVAILABLE', `The community service refused the grant (${res.status}) ${text.slice(0, 120)}`, 502);
    }
}

module.exports = { statusFor, start, grant };
