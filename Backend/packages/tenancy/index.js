'use strict';
/**
 * @baalvion/tenancy — platform-wide multi-tenant isolation via Postgres RLS.
 *
 * The mechanism (one consistent pattern for every service):
 *   1. migration: run enableRlsSql(schema, table) on each tenant table.
 *   2. app boots connected as a NON-SUPERUSER role (RLS is ignored for superusers).
 *   3. tenantMiddleware sets the per-request tenant context from req.auth.
 *   4. DB work runs in withTenantTransaction / withTenantClient → RLS auto-filters
 *      every row by tenant; super_admin / migrations use bypass.
 */
module.exports = {
    ...require('./sql'),
    ...require('./context'),
    ...require('./middleware'),
    ...require('./sequelize'),
    ...require('./pg'),
};
