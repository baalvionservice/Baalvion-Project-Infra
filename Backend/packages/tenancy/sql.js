'use strict';
/**
 * SQL builders for Postgres Row-Level Security (RLS) tenant isolation.
 *
 * The policy is FAIL-CLOSED: with no tenant set and no bypass, zero rows are
 * visible and inserts are rejected. Two session GUCs drive it:
 *   - app.current_tenant : the active tenant id (text)
 *   - app.tenant_bypass  : 'on' to see across tenants (super_admin / migrations)
 *
 * CRITICAL: RLS is ignored for SUPERUSERS and (without FORCE) for the table OWNER.
 * We emit FORCE ROW LEVEL SECURITY so it applies to the owner, but the application
 * MUST connect as a NON-SUPERUSER role (see README). Superuser connections bypass
 * RLS entirely no matter what.
 */

const SESSION = Object.freeze({
    tenant: 'app.current_tenant',
    bypass: 'app.tenant_bypass',
});

const ident = (s) => `"${String(s).replace(/"/g, '""')}"`;

/**
 * SQL to enable tenant-isolation RLS on a table.
 * @param {string} schema
 * @param {string} table
 * @param {object} [opts]
 * @param {string} [opts.tenantColumn='tenant_id']
 * @param {string} [opts.policyName='tenant_isolation']
 * @returns {string} runnable SQL
 */
function enableRlsSql(schema, table, opts = {}) {
    const { tenantColumn = 'tenant_id', policyName = 'tenant_isolation' } = opts;
    const tbl = `${ident(schema)}.${ident(table)}`;
    const tenant = `current_setting('${SESSION.tenant}', true)`;
    const bypass = `current_setting('${SESSION.bypass}', true) = 'on'`;
    // Cast the column to text so the policy works for uuid / bigint / varchar alike.
    const match = `((${bypass}) OR (${tenant} IS NOT NULL AND ${tenant} <> '' AND ${ident(tenantColumn)}::text = ${tenant}))`;
    return [
        `ALTER TABLE ${tbl} ENABLE ROW LEVEL SECURITY;`,
        `ALTER TABLE ${tbl} FORCE ROW LEVEL SECURITY;`,
        `DROP POLICY IF EXISTS ${ident(policyName)} ON ${tbl};`,
        `CREATE POLICY ${ident(policyName)} ON ${tbl}`,
        `    USING ${match}`,
        `    WITH CHECK ${match};`,
    ].join('\n');
}

/** SQL to remove the RLS policy (rollback). */
function disableRlsSql(schema, table, opts = {}) {
    const { policyName = 'tenant_isolation' } = opts;
    const tbl = `${ident(schema)}.${ident(table)}`;
    return [
        `DROP POLICY IF EXISTS ${ident(policyName)} ON ${tbl};`,
        `ALTER TABLE ${tbl} NO FORCE ROW LEVEL SECURITY;`,
        `ALTER TABLE ${tbl} DISABLE ROW LEVEL SECURITY;`,
    ].join('\n');
}

/**
 * Parameterized statement (1 row) to set the tenant GUCs LOCAL to the current
 * transaction. Bind [tenantText, bypassText] where bypassText is 'on' | 'off'.
 */
const SET_TENANT_SQL = `SELECT set_config('${SESSION.tenant}', $1, true), set_config('${SESSION.bypass}', $2, true)`;

module.exports = { SESSION, enableRlsSql, disableRlsSql, SET_TENANT_SQL, ident };
