'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 19 (Continuous
 * Monitoring) standalone verification harness. jest is broken repo-wide, so this
 * exercises the real HTTP surface + DB via supertest.
 *
 *   node tests/continuous-monitoring.verify.js
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.GATEWAY_SIGNING_SECRET = process.env.GATEWAY_SIGNING_SECRET || 'test-gateway-secret';
process.env.RATE_LIMIT_DISABLED = 'true';

const assert = require('assert');
const crypto = require('crypto');
const request = require('supertest');
const db = require('../models');
const app = require('../index');

let pass = 0;
let fail = 0;
const failures = [];
async function t(name, fn) {
    try { await fn(); pass += 1; console.log(`  ✓ ${name}`); }
    catch (err) { fail += 1; failures.push({ name, message: err.message }); console.log(`  ✗ ${name}\n      ${err.message}`); }
}

function gatewayHeaders({ userId, orgId, roles }) {
    const secret = process.env.GATEWAY_SIGNING_SECRET;
    const sig = crypto.createHmac('sha256', secret).update(`${userId}.${orgId}.${roles.join(',')}`).digest('hex');
    return { 'x-user-id': userId, 'x-org-id': orgId, 'x-roles': JSON.stringify(roles), 'x-gateway-signature': sig };
}

(async () => {
    const tenantId = `T-VERIFY-${Date.now()}`;
    const buyerHeaders = gatewayHeaders({ userId: 'u-1', orgId: tenantId, roles: ['buyer'] });
    const adminHeaders = gatewayHeaders({ userId: 'reviewer-1', orgId: 'T-ADMIN', roles: ['admin'] });
    let org;
    let user;

    await t('setup: org with an expired checklist item + a user with excessive failed logins', async () => {
        org = await db.Organization.create({ tenant_id: tenantId, name: 'Monitor Verify Co', type: 'seller', status: 'active' });
        const gstin = await db.TaxIdType.findOne({ where: { country_code: 'IN', type_code: 'GSTIN' } });
        await request(app).post('/v1/tax_registrations').set(buyerHeaders).send({ org_id: org.id, tax_id_type_id: gstin.id, tax_id_value: '27AAPFU0939F1ZV' });
        // Force the 'tax' checklist item into an overdue state to exercise expiry sweeping.
        await db.VerificationChecklistItem.update(
            { expires_at: new Date(Date.now() - 86400000) },
            { where: { org_id: org.id, category: 'tax' } },
        );
        user = await db.User.create({ email: `monitor-${Date.now()}@example.com`, password_hash: 'x', role: 'buyer', tenant_id: tenantId, failed_login_attempts: 9 });
    });

    await t('a non-admin cannot trigger a monitoring cycle', async () => {
        const res = await request(app).post('/v1/monitoring/run').set(buyerHeaders);
        assert.strictEqual(res.status, 403, JSON.stringify(res.body));
    });

    await t('POST /v1/monitoring/run expires overdue items, recomputes the org, and flags the user', async () => {
        const res = await request(app).post('/v1/monitoring/run').set(adminHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.ok(res.body.data.expired_items >= 1, 'expected at least one expired item');
        assert.ok(res.body.data.orgs_recomputed >= 1);
        assert.ok(res.body.data.users_flagged >= 1);

        const taxItem = await db.VerificationChecklistItem.findOne({ where: { org_id: org.id, category: 'tax' } });
        assert.strictEqual(taxItem.status, 'expired');

        const trustScore = await db.TrustScore.findOne({ where: { org_id: org.id, is_current: true } });
        assert.ok(trustScore, 'expected the monitoring cycle to have computed a trust score');

        const fraudSignal = await db.FraudSignal.findOne({ where: { user_id: user.id, signal_type: 'excessive_failed_logins' } });
        assert.ok(fraudSignal, 'expected an excessive_failed_logins signal for the flagged user');
    });

    await t('teardown', async () => {
        await db.FraudSignal.destroy({ where: { user_id: user.id } });
        await db.TrustScore.destroy({ where: { org_id: org.id } });
        await db.OrgRiskAssessment.destroy({ where: { org_id: org.id } });
        await db.ComplianceRuleEvaluation.destroy({ where: { org_id: org.id } });
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        await db.TaxRegistration.destroy({ where: { org_id: org.id }, force: true });
        await user.destroy();
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
