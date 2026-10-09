'use strict';
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const { AppError } = require('../utils/errors');
const config = require('../config/appConfig');

const ADMIN_ROLES = ['super_admin', 'country_admin'];

/**
 * On the marketplace store, only members may buy: someone who paid the one-time buyer access pass, a
 * seller with an active category, or a platform admin. Enforced here, on the server, so it holds
 * whatever the frontend does. Other stores are untouched.
 */
async function assertCanBuy(storeId, actor, { query } = {}) {
    const market = config.marketplace || {};
    if (!market.storeId || storeId !== market.storeId) return; // no marketplace configured → no gate
    if (!actor || actor.userId == null) {
        throw new AppError('UNAUTHORIZED', 'Sign in and get your access pass to buy on this marketplace', 401);
    }
    if ((actor.roles || []).some((r) => ADMIN_ROLES.includes(r))) return;
    const run = query || ((...args) => sequelize.query(...args));
    const rows = await run(
        `SELECT 1 FROM commerce.commerce_seller_category_bonds WHERE seller_user_id::text = :u AND status = 'active' LIMIT 1`,
        { type: QueryTypes.SELECT, replacements: { u: String(actor.userId) } },
    );
    if (rows.length === 0) {
        throw new AppError('ACCESS_PASS_REQUIRED', `Buying here needs the one-time $${market.buyerAccessUsd} access pass`, 402, { priceUsd: market.buyerAccessUsd });
    }
}

module.exports = { assertCanBuy };
