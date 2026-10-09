'use strict';
const { CommerceSellerCategoryBond, CommerceSellerApplication } = require('../models');
const config = require('../config/appConfig');
const sellerBondService = require('./sellerBondService');

const ADMIN_ROLES = ['super_admin', 'country_admin'];

/**
 * Who may enter the marketplace and buy:
 *  - anyone who paid the one-time buyer access pass (confirmed by an admin),
 *  - platform admins,
 *  - sellers who have an active category (they already paid far more, and need to see the shop).
 * Everyone else sees the paywall.
 */
async function accessFor(userId, jwtRoles = []) {
    if (!userId) return { hasAccess: false, reason: null };
    if (jwtRoles.some((r) => ADMIN_ROLES.includes(r))) return { hasAccess: true, reason: 'admin' };

    const pass = await CommerceSellerCategoryBond.findOne({ where: { sellerUserId: userId, kind: 'buyer_access', status: 'active' }, attributes: ['id'] });
    if (pass) return { hasAccess: true, reason: 'paid' };

    const seller = await CommerceSellerApplication.findOne({ where: { applicantUserId: userId, status: 'approved' }, attributes: ['id'] });
    if (seller) {
        const category = await CommerceSellerCategoryBond.findOne({ where: { sellerUserId: userId, kind: 'category', status: 'active' }, attributes: ['id'] });
        if (category) return { hasAccess: true, reason: 'seller' };
    }
    return { hasAccess: false, reason: null };
}

// Access plus the buyer's latest pass payment (so the paywall can show "waiting for confirmation" etc.).
async function statusFor(userId, jwtRoles) {
    const access = await accessFor(userId, jwtRoles);
    const latest = await CommerceSellerCategoryBond.findOne({ where: { sellerUserId: userId, kind: 'buyer_access' }, order: [['createdAt', 'DESC']] });
    return { ...access, priceUsd: config.buyerAccess.amountUsd, payment: latest ? await sellerBondService.presentBond(latest) : null };
}

const startPass = (authCtx, body) => sellerBondService.createAccessPass(authCtx, body);

module.exports = { accessFor, statusFor, startPass };
