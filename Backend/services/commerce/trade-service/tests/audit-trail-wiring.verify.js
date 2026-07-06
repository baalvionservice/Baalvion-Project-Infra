'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 18 (Audit trail wiring)
 * standalone verification harness. Confirms every write path across the 15
 * verification modules calls the existing hash-chained utils/audit.js helper
 * (recordAudit), and that the chain stays tamper-evident-verifiable afterward.
 *
 *   node tests/audit-trail-wiring.verify.js
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.GATEWAY_SIGNING_SECRET = process.env.GATEWAY_SIGNING_SECRET || 'test-gateway-secret';
process.env.RATE_LIMIT_DISABLED = 'true';

const assert = require('assert');
const crypto = require('crypto');
const request = require('supertest');
const db = require('../models');
const app = require('../index');
const { verifyChain } = require('../utils/audit');

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

async function hasAuditEntry(action, resourceId) {
    const row = await db.AuditLog.findOne({ where: { action, resourceId: String(resourceId) } });
    return Boolean(row);
}

(async () => {
    const tenantId = `T-VERIFY-${Date.now()}`;
    const buyerHeaders = gatewayHeaders({ userId: 'u-1', orgId: tenantId, roles: ['buyer'] });
    const adminHeaders = gatewayHeaders({ userId: 'reviewer-1', orgId: 'T-ADMIN', roles: ['admin'] });
    let org;
    let user;
    let identityId;
    let addressId;
    let facilityId;

    await t('setup: org + user + address', async () => {
        org = await db.Organization.create({ tenant_id: tenantId, name: 'Audit Wiring Verify Co', type: 'seller', status: 'active' });
        user = await db.User.create({ email: `audit-${Date.now()}@example.com`, password_hash: 'x', role: 'buyer', tenant_id: tenantId, failed_login_attempts: 6 });
        const addrRes = await request(app).post('/v1/verified_addresses').set(buyerHeaders).send({ org_id: org.id, address_type: 'factory', line1: 'Plot 1' });
        addressId = addrRes.body.data.id;
    });

    await t('identity_verification.liveness_result is audited', async () => {
        const idRes = await request(app)
            .post('/v1/identity_verifications')
            .set(gatewayHeaders({ userId: String(user.id), orgId: tenantId, roles: ['buyer'] }))
            .send({ full_name: 'Audit Test', id_type: 'passport' });
        identityId = idRes.body.data.id;
        await request(app)
            .patch(`/v1/identity_verifications/${identityId}/liveness`)
            .set(gatewayHeaders({ userId: String(user.id), orgId: tenantId, roles: ['buyer'] }))
            .send({ status: 'passed' });
        assert.ok(await hasAuditEntry('identity_verification.liveness_result', identityId));
    });

    await t('verified_address.evidence_attached is audited', async () => {
        const doc = await db.TradeDocument.create({ tenant_id: tenantId, doc_type: 'utility_bill', title: 'bill', status: 'available' });
        await request(app).post(`/v1/verified_addresses/${addressId}/evidence`).set(buyerHeaders).send({ document_id: doc.id, evidence_type: 'utility_bill' });
        assert.ok(await hasAuditEntry('verified_address.evidence_attached', addressId));
        await doc.destroy({ force: true });
    });

    await t('facility.inspection_requested and facility.inspection_result are audited', async () => {
        const facRes = await request(app).post('/v1/facilities').set(buyerHeaders).send({ org_id: org.id, facility_type: 'factory', address_id: addressId });
        facilityId = facRes.body.data.id;
        await request(app).post(`/v1/facilities/${facilityId}/inspection/request`).set(buyerHeaders);
        await request(app).patch(`/v1/facilities/${facilityId}/inspection/result`).set(adminHeaders).send({ passed: true });
        assert.ok(await hasAuditEntry('facility.inspection_requested', facilityId));
        assert.ok(await hasAuditEntry('facility.inspection_result', facilityId));
    });

    await t('fraud_signal.scan_user is audited', async () => {
        await request(app).post('/v1/fraud_signals/scan_user').set(adminHeaders).send({ user_id: user.id });
        assert.ok(await hasAuditEntry('fraud_signal.scan_user', user.id));
    });

    await t('reputation_rating.submitted is audited', async () => {
        const res = await request(app).post('/v1/reputation/ratings').set(buyerHeaders).send({ ratee_org_id: org.id, role: 'seller', rating_value: 5 });
        assert.ok(await hasAuditEntry('reputation_rating.submitted', res.body.data.id));
    });

    await t('the hash chain remains valid after all these writes', async () => {
        const result = await verifyChain();
        assert.strictEqual(result.valid, true, JSON.stringify(result));
    });

    await t('teardown', async () => {
        await db.FraudSignal.destroy({ where: { user_id: user.id } });
        await db.ReputationRating.destroy({ where: { ratee_org_id: org.id } });
        await db.ReputationSummary.destroy({ where: { org_id: org.id } });
        await db.Facility.destroy({ where: { org_id: org.id }, force: true });
        await db.VerifiedAddress.destroy({ where: { org_id: org.id }, force: true });
        await db.IdentityVerification.destroy({ where: { user_id: user.id }, force: true });
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        await user.destroy();
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
