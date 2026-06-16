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
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

/**
 * SQL to enable tenant-isolation RLS on a table.
 *
 * The bypass escape hatch (`app.tenant_bypass='on'`) is, by default, HARDENED so it
 * only works for roles OTHER than the runtime application role (CR-8): a SQL injection
 * that flips `app.tenant_bypass` on the app connection can no longer defeat isolation,
 * because the policy additionally requires `current_user <> '<appRole>'`. Only out-of-band
 * admin/superuser tooling (a different login role) can use the bypass. Set
 * `hardenBypass: false` to emit the legacy unconditional bypass.
 *
 * @param {string} schema
 * @param {string} table
 * @param {object} [opts]
 * @param {string} [opts.tenantColumn='tenant_id']
 * @param {string} [opts.policyName='tenant_isolation']
 * @param {string} [opts.appRole='baalvion_app']  runtime app role the bypass is denied to
 * @param {boolean} [opts.hardenBypass=true]       require a non-app role to use the bypass
 * @returns {string} runnable SQL
 */
function enableRlsSql(schema, table, opts = {}) {
    const {
        tenantColumn = 'tenant_id',
        policyName = 'tenant_isolation',
        appRole = 'baalvion_app',
        hardenBypass = true,
    } = opts;
    const tbl = `${ident(schema)}.${ident(table)}`;
    const tenant = `current_setting('${SESSION.tenant}', true)`;
    const bypassOn = `current_setting('${SESSION.bypass}', true) = 'on'`;
    // CR-8: the runtime app role must NOT be able to bypass isolation even if it sets
    // app.tenant_bypass (e.g. via SQL injection); only other login roles may.
    const bypass = hardenBypass ? `(${bypassOn} AND current_user <> ${lit(appRole)})` : `(${bypassOn})`;
    // Cast the column to text so the policy works for uuid / bigint / varchar alike.
    const match = `(${bypass} OR (${tenant} IS NOT NULL AND ${tenant} <> '' AND ${ident(tenantColumn)}::text = ${tenant}))`;
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
