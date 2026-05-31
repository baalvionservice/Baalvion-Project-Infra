'use strict';
/**
 * Sequelize integration. RLS GUCs must be set LOCAL to a transaction (pooled
 * connections are shared), so tenant-scoped DB work runs inside withTenantTransaction.
 */
const { getTenantContext } = require('./context');
const { SESSION } = require('./sql');

/** Set the tenant GUCs LOCAL to an existing Sequelize transaction. */
async function setTenantOnTransaction(sequelize, t, ctx) {
    const c = ctx || getTenantContext();
    const tenant = c.tenantId == null ? '' : String(c.tenantId);
    const bypass = c.bypass ? 'on' : 'off';
    await sequelize.query(
        `SELECT set_config('${SESSION.tenant}', :tenant, true), set_config('${SESSION.bypass}', :bypass, true)`,
        { replacements: { tenant, bypass }, transaction: t },
    );
}

/**
 * Run `fn(t)` inside a transaction with the tenant GUCs applied so RLS filters
 * every query. Tenant defaults to the AsyncLocalStorage context; override per-call.
 *
 *   withTenantTransaction(sequelize, async (t) => {...})
 *   withTenantTransaction(sequelize, { tenantId, bypass }, async (t) => {...})
 */
async function withTenantTransaction(sequelize, fnOrOpts, maybeFn) {
    let ctx; let fn;
    if (typeof fnOrOpts === 'function') { ctx = getTenantContext(); fn = fnOrOpts; }
    else { ctx = { ...getTenantContext(), ...(fnOrOpts || {}) }; fn = maybeFn; }
    if (typeof fn !== 'function') throw new TypeError('withTenantTransaction: callback function required');
    return sequelize.transaction(async (t) => {
        await setTenantOnTransaction(sequelize, t, ctx);
        return fn(t);
    });
}

module.exports = { withTenantTransaction, setTenantOnTransaction };
