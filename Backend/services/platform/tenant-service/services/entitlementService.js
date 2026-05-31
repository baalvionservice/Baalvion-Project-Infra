'use strict';

/**
 * Feature entitlements + quotas per tenant. set() upserts a feature flag/limit;
 * check() is the gate other services call — returns whether a feature is enabled
 * and, for quotas, whether there is remaining headroom. consume() atomically
 * increments usage and refuses to exceed the limit.
 */

const db = require('../models');
const { Errors } = require('../utils/errors');

async function list(tenantId) {
    const rows = await db.TenantEntitlement.findAll({ where: { tenant_id: tenantId }, order: [['feature_key', 'ASC']] });
    return rows.map((r) => r.toJSON());
}

async function set(tenantId, { featureKey, enabled = true, limitValue = null, metadata = {} }) {
    if (!featureKey) throw Errors.badRequest('featureKey is required');
    const [row, created] = await db.TenantEntitlement.findOrCreate({
        where: { tenant_id: tenantId, feature_key: featureKey },
        defaults: { tenant_id: tenantId, feature_key: featureKey, enabled, limit_value: limitValue, metadata },
    });
    if (!created) await row.update({ enabled, limit_value: limitValue, metadata, updated_at: new Date() });
    return row.toJSON();
}

async function check(tenantId, featureKey) {
    const row = await db.TenantEntitlement.findOne({ where: { tenant_id: tenantId, feature_key: featureKey } });
    if (!row) return { featureKey, enabled: false, found: false };
    const remaining = row.limit_value == null ? null : Math.max(0, Number(row.limit_value) - Number(row.used_value));
    return {
        featureKey, found: true, enabled: row.enabled,
        limit: row.limit_value == null ? null : Number(row.limit_value),
        used: Number(row.used_value), remaining,
        allowed: row.enabled && (row.limit_value == null || remaining > 0),
    };
}

/** Atomically consume `amount` of a quota; refuses if it would exceed the limit. */
async function consume(tenantId, featureKey, amount = 1) {
    return db.sequelize.transaction(async (tx) => {
        const row = await db.TenantEntitlement.findOne({ where: { tenant_id: tenantId, feature_key: featureKey }, transaction: tx, lock: tx.LOCK.UPDATE });
        if (!row) throw Errors.notFound(`Entitlement '${featureKey}' not set for tenant`);
        if (!row.enabled) throw Errors.forbidden(`Feature '${featureKey}' is disabled for this tenant`);
        if (row.limit_value != null && Number(row.used_value) + Number(amount) > Number(row.limit_value)) {
            throw new (require('../utils/errors').AppError)('QUOTA_EXCEEDED', `Quota exceeded for '${featureKey}'`, 429, { limit: Number(row.limit_value), used: Number(row.used_value) });
        }
        await row.update({ used_value: Number(row.used_value) + Number(amount), updated_at: new Date() }, { transaction: tx });
        return { featureKey, used: Number(row.used_value), limit: row.limit_value == null ? null : Number(row.limit_value) };
    });
}

async function resetUsage(tenantId, featureKey) {
    const row = await db.TenantEntitlement.findOne({ where: { tenant_id: tenantId, feature_key: featureKey } });
    if (!row) throw Errors.notFound('Entitlement not found');
    await row.update({ used_value: 0, updated_at: new Date() });
    return row.toJSON();
}

async function remove(tenantId, featureKey) {
    const n = await db.TenantEntitlement.destroy({ where: { tenant_id: tenantId, feature_key: featureKey } });
    if (!n) throw Errors.notFound('Entitlement not found');
    return { featureKey, deleted: true };
}

module.exports = { list, set, check, consume, resetUsage, remove };
