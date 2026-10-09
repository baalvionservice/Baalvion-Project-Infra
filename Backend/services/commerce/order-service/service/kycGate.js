'use strict';
// Opt-in KYC gate for products that must only be sold to verified people (e.g. creator
// investment listings). A product opts in by carrying customFields.requiresKyc = true; a cart
// with no such product never reaches the network and behaves exactly as before.
//
// Verification is "once": community-service holds the single KYC record per person and answers
// "approved and not expired?" over an internal, secret-authenticated call. The gate fails
// CLOSED: if that lookup is unconfigured or errors, the order is refused (503), never allowed.
const { AppError } = require('../utils/errors');

const TIMEOUT_MS = Number(process.env.KYC_LOOKUP_TIMEOUT_MS || 4000);

const itemRequiresKyc = (item) => item && item.requiresKyc === true;

// `fetchImpl` is injectable for tests.
async function assertKycForItems(items, actor, { fetchImpl = fetch, env = process.env } = {}) {
    if (!Array.isArray(items) || !items.some(itemRequiresKyc)) return;

    if (!actor || actor.userId == null) {
        throw new AppError('KYC_REQUIRED', 'Sign in and complete identity verification to buy this item', 403, { kycRequired: true });
    }

    const base = env.KYC_SERVICE_URL;
    const secret = env.INTERNAL_SERVICE_SECRET;
    if (!base || !secret) {
        throw new AppError('KYC_UNAVAILABLE', 'Identity verification is not available right now', 503);
    }

    let status;
    try {
        const res = await fetchImpl(`${base.replace(/\/$/, '')}/internal/kyc/${encodeURIComponent(String(actor.userId))}`, {
            headers: { 'x-internal-secret': secret },
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`kyc lookup ${res.status}`);
        status = (await res.json()).data;
    } catch (err) {
        throw new AppError('KYC_UNAVAILABLE', 'Identity verification could not be checked right now', 503);
    }

    if (!status || status.approved !== true) {
        throw new AppError('KYC_REQUIRED', 'Complete identity verification to buy this item', 403, { kycRequired: true, kycStatus: (status && status.status) || 'none' });
    }
}

module.exports = { assertKycForItems, itemRequiresKyc };
