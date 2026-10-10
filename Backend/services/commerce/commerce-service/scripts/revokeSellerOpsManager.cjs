'use strict';
/**
 * Removes the store-wide `ops_manager` role from marketplace sellers who were granted it by the
 * old approval flow. That role let any seller list and change every order in the shared store.
 *
 * A user is touched only if ALL of these hold: they have an approved seller application, they
 * hold `product_manager` on the marketplace store, and they hold no store role other than
 * `product_manager`/`ops_manager` (so real staff and admins keep their access).
 *
 * Dry run by default. Nothing changes unless --apply is passed.
 *
 *   RBAC_PROVISION_TOKEN="<admin RS256 access token>" node scripts/revokeSellerOpsManager.cjs
 *   RBAC_PROVISION_TOKEN="..." node scripts/revokeSellerOpsManager.cjs --apply
 */
const rbacClient = require('../service/rbacClient');
const commerceAuthz = require('../service/commerceAuthz');
const config = require('../config/appConfig');
const { CommerceSellerApplication, connectDB, sequelize } = require('../models');

const APPLY = process.argv.includes('--apply');
const TOKEN = process.env.RBAC_PROVISION_TOKEN || '';

(async () => {
    if (!TOKEN) throw new Error('RBAC_PROVISION_TOKEN is required');
    await connectDB();
    const storeId = config.marketplace.defaultStoreId;

    const rows = await rbacClient.listAssignments({ scopeId: storeId, status: 'active' }, { token: TOKEN });
    const list = (Array.isArray(rows) ? rows : (rows && rows.data) || []).filter((a) => a.role);

    const byUser = new Map();
    for (const a of list) {
        const k = String(a.userId);
        if (!byUser.has(k)) byUser.set(k, []);
        byUser.get(k).push(a);
    }

    const approved = new Set((await CommerceSellerApplication.findAll({ where: { status: 'approved' }, attributes: ['applicantUserId'] })).map((r) => String(r.applicantUserId)));

    let revoked = 0;
    for (const [userId, assignments] of byUser) {
        const keys = new Set(assignments.map((a) => a.role.key));
        const ops = assignments.find((a) => a.role.key === 'ops_manager');
        const sellerOnly = approved.has(userId) && keys.has('product_manager') && [...keys].every((k) => k === 'product_manager' || k === 'ops_manager');
        if (!ops || !sellerOnly) continue;
        console.log(`${APPLY ? 'revoking' : 'would revoke'} ops_manager from seller ${userId} (assignment ${ops.id})`);
        if (APPLY) {
            await rbacClient.revokeAssignment(ops.id, { token: TOKEN });
            await commerceAuthz.invalidateUser(userId);
        }
        revoked += 1;
    }
    console.log(`${APPLY ? 'revoked' : 'would revoke'} ${revoked} assignment(s)`);
    await sequelize.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
