'use strict';
/**
 * Raw `pg` Pool integration (for services not on Sequelize). Checks out a client,
 * opens a transaction, sets the tenant GUCs LOCAL, runs fn(client), commits.
 */
const { getTenantContext } = require('./context');
const { SET_TENANT_SQL } = require('./sql');

/**
 *   withTenantClient(pool, async (client) => {...})
 *   withTenantClient(pool, { tenantId, bypass }, async (client) => {...})
 */
async function withTenantClient(pool, fnOrOpts, maybeFn) {
    let ctx; let fn;
    if (typeof fnOrOpts === 'function') { ctx = getTenantContext(); fn = fnOrOpts; }
    else { ctx = { ...getTenantContext(), ...(fnOrOpts || {}) }; fn = maybeFn; }
    if (typeof fn !== 'function') throw new TypeError('withTenantClient: callback function required');

    const tenant = ctx.tenantId == null ? '' : String(ctx.tenantId);
    const bypass = ctx.bypass ? 'on' : 'off';
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(SET_TENANT_SQL, [tenant, bypass]);
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch { /* ignore */ }
        throw err;
    } finally {
        client.release();
    }
}

module.exports = { withTenantClient };
