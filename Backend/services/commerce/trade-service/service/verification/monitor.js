'use strict';
// Continuous Monitoring (Phase 2, Step 19). Re-runs compliance/risk/trust-score
// and expiry/fraud checks on a schedule (queue/workers.js registers a BullMQ
// repeatable job that calls `runCycle`; POST /v1/monitoring/run triggers one cycle
// on demand — same underlying function either way).
const db = require('../../models');
const documentsSvc = require('./documents');
const complianceRulesSvc = require('./complianceRules');
const riskSvc = require('./risk');
const trustScoreSvc = require('./trustScore');
const fraudSvc = require('./fraud');

/**
 * Expire anything past its validity window.
 *
 * Source records first, then the rollup: an approved identity/company verification
 * whose expiry has passed is flipped to 'expired' and its category recomputed, so the
 * checklist follows the source of truth rather than drifting from it (the source
 * record is what `GET /identity_verifications/me` and the KYC status screen read —
 * expiring only the rollup would leave a stale "verified" showing to the applicant).
 * The rollup sweep still runs afterwards to catch categories whose expiry was set
 * directly on the checklist item by a module that has no dated source record.
 */
async function expireOverdueVerifications() {
    const now = new Date();
    const identitySvc = require('./identity');
    const companySvc = require('./company');
    let expired = 0;

    const staleIdentities = await db.IdentityVerification.findAll({
        where: { status: 'approved', expires_at: { [db.Sequelize.Op.lt]: now } },
    });
    for (const record of staleIdentities) {
        await record.update({ status: 'expired' });
        if (record.org_id) await identitySvc.recomputeForOrg(record.org_id, record.tenant_id);
        expired += 1;
    }

    const staleCompanies = await db.CompanyVerification.findAll({
        where: { status: 'approved', renewal_due_at: { [db.Sequelize.Op.lt]: now } },
    });
    for (const record of staleCompanies) {
        await record.update({ status: 'expired' });
        await companySvc.recomputeCompany(record.org_id, record.tenant_id);
        expired += 1;
    }

    return expired;
}

/** Flip any checklist item whose expires_at has passed to 'expired'. */
async function expireOverdueItems() {
    const overdue = await db.VerificationChecklistItem.findAll({
        where: { expires_at: { [db.Sequelize.Op.lt]: new Date() }, status: { [db.Sequelize.Op.ne]: 'expired' } },
    });
    for (const item of overdue) {
        await item.update({ status: 'expired' });
    }
    return overdue.length;
}

/** Orgs with any verification activity (skip orgs nobody has touched yet). */
async function activeOrgIds() {
    const rows = await db.VerificationChecklistItem.findAll({
        where: { status: { [db.Sequelize.Op.ne]: 'not_started' } },
        attributes: ['org_id'],
        group: ['org_id'],
    });
    return rows.map((r) => r.org_id);
}

async function recomputeOrg(orgId) {
    const org = await db.Organization.findByPk(orgId);
    if (!org) return;
    await documentsSvc.recomputeDocuments(orgId, org.tenant_id);
    await complianceRulesSvc.evaluateAll(orgId, org.tenant_id);
    await riskSvc.computeRisk(orgId, org.tenant_id);
    await trustScoreSvc.computeTrustScore(orgId, org.tenant_id);
}

async function scanFraud() {
    const users = await db.User.findAll({ where: { failed_login_attempts: { [db.Sequelize.Op.gte]: fraudSvc.FAILED_LOGIN_THRESHOLD } } });
    let flagged = 0;
    for (const user of users) {
        if (await fraudSvc.checkExcessiveFailedLogins(user)) flagged += 1;
    }
    return flagged;
}

async function runCycle() {
    const startedAt = new Date();
    const expiredVerifications = await expireOverdueVerifications();
    const expiredCount = await expireOverdueItems();
    const orgIds = await activeOrgIds();
    for (const orgId of orgIds) {
        // eslint-disable-next-line no-await-in-loop
        await recomputeOrg(orgId);
    }
    const flaggedUsers = await scanFraud();
    return {
        started_at: startedAt.toISOString(),
        finished_at: new Date().toISOString(),
        expired_verifications: expiredVerifications,
        expired_items: expiredCount,
        orgs_recomputed: orgIds.length,
        users_flagged: flaggedUsers,
    };
}

module.exports = { runCycle, expireOverdueVerifications, expireOverdueItems, activeOrgIds, recomputeOrg, scanFraud };
