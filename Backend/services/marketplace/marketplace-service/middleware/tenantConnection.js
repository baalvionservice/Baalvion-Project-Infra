'use strict';
/**
 * Request-scoped tenant transaction — the runtime half of RLS (migrations 002/004/005/006).
 *
 * THE PROBLEM
 * The policies are driven by two session GUCs (app.current_tenant / app.tenant_bypass) and fail
 * closed: under FORCE RLS and a non-superuser role, a query on a connection where the GUC is
 * unset returns ZERO rows. Controllers here run ordinary non-transactional reads
 * (findAll/findByPk/findAndCountAll); each takes an arbitrary pooled connection with no GUC set.
 * So flipping DB_USER to baalvion_app without this would empty the whole service.
 *
 * THE MECHANISM (same as trade-service/middleware/tenantConnection.js, the proven pattern)
 * Open ONE unmanaged transaction per request, set the GUCs LOCAL to it (they vanish on commit,
 * so they cannot leak onto the next request that reuses the connection), and pin it in
 * AsyncLocalStorage. A single monkeypatch of sequelize.query routes any query without an
 * explicit transaction onto the pinned one, so unmodified service code runs with the right GUC
 * on the transaction's pinned backend. Commit on a clean response, roll back if the socket died.
 *
 * A bare dedicated connection does not work: sequelize.query({ connection }) is not guaranteed
 * to run on the supplied connection, so a session-level GUC set there is not seen by the query.
 * A transaction IS honoured, and SET LOCAL is inherently leak-proof.
 *
 * Under the current superuser owner role this is a no-op — RLS is bypassed for superusers, so
 * reads behave exactly as before. Behaviour changes only at the DB_USER=baalvion_app cutover.
 */
const { AsyncLocalStorage } = require('async_hooks');

const txAls = new AsyncLocalStorage();
// Reentrancy guard so our own BEGIN / SET LOCAL / COMMIT are not routed back into the pinned
// transaction (which would recurse).
const bypassRouting = new AsyncLocalStorage();

// Roles that legitimately read across orgs (compliance review, platform admin).
//
// NOTE the CR-8 hardening in the policies: app.tenant_bypass is honoured only for a login role
// OTHER than baalvion_app, so while the service runs as baalvion_app this flag is INERT and
// staff see only their own org at the database. Cross-org staff access therefore has to be an
// application-layer decision (utils/authz isStaff), or run over a separate admin role. We still
// stamp the GUC so the intent is explicit and so it works if the service is ever moved to one.
const BYPASS_ROLES = ['super_admin', 'owner', 'platform_admin', 'compliance'];

let _patched = false;

function installQueryRouter(sequelize) {
    if (_patched) return;
    _patched = true;
    const origQuery = sequelize.query.bind(sequelize);
    sequelize.__origQuery = origQuery;
    sequelize.query = function tenantRoutedQuery(sql, options) {
        if (bypassRouting.getStore()) return origQuery(sql, options);
        const slot = txAls.getStore();
        const tx = slot && slot.transaction;
        if (tx && (!options || !options.transaction)) {
            return origQuery(sql, { ...(options || {}), transaction: tx });
        }
        return origQuery(sql, options);
    };
}

async function setTenantGuc(sequelize, tx, tenant, bypass) {
    await bypassRouting.run(true, () =>
        sequelize.__origQuery(
            "SELECT set_config('app.current_tenant', $tenant, true), set_config('app.tenant_bypass', $bypass, true)",
            { bind: { tenant, bypass }, transaction: tx },
        ));
}

/**
 * Express middleware. Mount AFTER the auth middleware that populates req.user, so the tenant is
 * the caller's verified org — anonymous requests get no tenant and legitimately see nothing.
 */
function tenantConnection(sequelize) {
    installQueryRouter(sequelize);
    return function tenantConnectionMiddleware(req, res, next) {
        const user = req.user || {};
        const tenant = user.orgId == null ? '' : String(user.orgId);
        const roles = Array.isArray(user.roles) ? user.roles : [];
        const bypass = roles.some((r) => BYPASS_ROLES.includes(r)) ? 'on' : 'off';

        bypassRouting.run(true, () => sequelize.transaction())
            .then(async (tx) => {
                await setTenantGuc(sequelize, tx, tenant, bypass);
                const slot = { transaction: tx, settled: false };
                const settle = (rollback) => {
                    if (slot.settled) return Promise.resolve();
                    slot.settled = true;
                    return (rollback ? tx.rollback() : tx.commit()).catch(() => {});
                };
                res.on('finish', () => { settle(false); });
                res.on('close', () => { settle(res.writableFinished ? false : true); });
                txAls.run(slot, () => next());
            })
            .catch((err) => next(err));
    };
}

module.exports = { tenantConnection, txAls, BYPASS_ROLES };
