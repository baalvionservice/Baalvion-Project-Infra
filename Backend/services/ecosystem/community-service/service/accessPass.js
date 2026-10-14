'use strict';
const { QueryTypes } = require('sequelize');
const config = require('../config/appConfig');

const ADMIN_ROLES = new Set(['super_admin', 'platform_admin', 'country_admin']);
const CACHE_MS = 60 * 1000;
const cache = new Map();

/**
 * Whether this user may post, register or demand things: platform admins, or anyone holding an active
 * access pass or seller category bond (confirmed by an admin in commerce-service). Same rule order-service
 * applies to buying, so one payment unlocks both. A pass only turns on after an admin confirms it, so the
 * short cache delays a freshly paid user by at most a minute and never keeps a lapsed pass alive for long.
 */
async function hasAccessPass(userId, roles = []) {
    if (userId == null) return false;
    if (roles.some((r) => ADMIN_ROLES.has(String(r).toLowerCase()))) return true;

    const key = String(userId);
    const hit = cache.get(key);
    if (hit && hit.until > Date.now()) return hit.ok;

    const { sequelize } = require('../models');
    const rows = await sequelize.query(
        `SELECT 1 FROM commerce.commerce_seller_category_bonds WHERE seller_user_id::text = :u AND status = 'active' LIMIT 1`,
        { type: QueryTypes.SELECT, replacements: { u: key } },
    );
    const ok = rows.length > 0;
    cache.set(key, { ok, until: Date.now() + CACHE_MS });
    return ok;
}

const clearCache = () => cache.clear();

module.exports = { hasAccessPass, clearCache, priceUsd: () => config.accessPass.priceUsd };
