'use strict';
/**
 * Privileged connection for cross-org platform review.
 *
 * THE PROBLEM
 * The RLS policies fail closed and — by the CR-8 hardening — deny `app.tenant_bypass` to the
 * runtime role itself, so a query on the baalvion_app connection can never see another org's
 * rows no matter what the application layer decides. That is the point: a SQL injection on the
 * app connection must not be able to switch tenant isolation off.
 *
 * But platform review is inherently cross-org. A reviewer approving a company they do not belong
 * to is the marketplace's core workflow, and on the app connection it fails with "Company not
 * found" — the row is invisible, so the flow is impossible rather than merely forbidden.
 *
 * THE MECHANISM
 * The policies allow the bypass for any login role OTHER than baalvion_app. So this opens a
 * SEPARATE pool as a different role (DB_ADMIN_USER) and sets the bypass on it. Deliberately a
 * narrow raw-SQL surface rather than a second model registry: everything reachable from here is
 * visible in this file, and it cannot be reached accidentally from ordinary service code.
 *
 * Every caller must already have passed the staff guard in modules/admin/routes.js — this module
 * grants database reach, not authorization.
 *
 * Unset DB_ADMIN_USER and it returns null: the admin routes then answer 503 rather than silently
 * degrading to the app connection, where they would report perfectly good records as missing.
 */
const { Pool } = require('pg');
const { buildPgPoolSsl } = require('@baalvion/auth-node');
const config = require('../config/appConfig');

let pool = null;
let checked = false;

function getAdminPool() {
    if (checked) return pool;
    checked = true;
    const user = process.env.DB_ADMIN_USER;
    const password = process.env.DB_ADMIN_PASSWORD;
    if (!user) return null;
    pool = new Pool({
        host: config.db.host,
        port: config.db.port,
        database: config.db.name,
        user,
        password,
        ssl: buildPgPoolSsl(),
        max: Number(process.env.DB_ADMIN_POOL_MAX || 4),
    });
    return pool;
}

/**
 * Run `fn(client)` on the privileged connection with the tenant bypass set LOCAL to a
 * transaction, so it cannot leak onto a pooled connection afterwards.
 */
async function withPlatformScope(fn) {
    const p = getAdminPool();
    if (!p) {
        const err = new Error('Platform review is not configured on this environment (DB_ADMIN_USER unset)');
        err.statusCode = 503;
        err.code = 'ADMIN_DB_UNCONFIGURED';
        throw err;
    }
    const client = await p.connect();
    try {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.tenant_bypass', 'on', true)");
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        client.release();
    }
}

const close = async () => { if (pool) await pool.end().catch(() => {}); };

module.exports = { getAdminPool, withPlatformScope, close };
