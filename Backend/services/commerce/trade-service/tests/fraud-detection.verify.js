'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 11 (Fraud Detection)
 * standalone verification harness. jest is broken repo-wide, so this exercises the
 * real HTTP surface + DB via supertest.
 *
 *   node tests/fraud-detection.verify.js
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

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

(async () => {
    const tenantId = `T-VERIFY-${Date.now()}`;
    const buyerHeaders = gatewayHeaders({ userId: 'u-1', orgId: tenantId, roles: ['buyer'] });
    const adminHeaders = gatewayHeaders({ userId: 'reviewer-1', orgId: 'T-ADMIN', roles: ['admin'] });
    let orgA;
    let orgB;
    let gstin;
    let signalId;
    let user;

    await t('setup: two orgs + GSTIN type', async () => {
        orgA = await db.Organization.create({ tenant_id: tenantId, name: 'Fraud Verify Co A', type: 'seller', status: 'active' });
        orgB = await db.Organization.create({ tenant_id: `${tenantId}-B`, name: 'Fraud Verify Co B', type: 'seller', status: 'active' });
        gstin = await db.TaxIdType.findOne({ where: { country_code: 'IN', type_code: 'GSTIN' } });
    });

    await t('two orgs submitting the same GSTIN raises a duplicate_tax_id fraud signal', async () => {
        await request(app).post('/v1/tax_registrations').set(buyerHeaders).send({ org_id: orgA.id, tax_id_type_id: gstin.id, tax_id_value: '27AAPFU0939F1ZV' });
        await request(app)
            .post('/v1/tax_registrations')
            .set(gatewayHeaders({ userId: 'u-2', orgId: `${tenantId}-B`, roles: ['buyer'] }))
            .send({ org_id: orgB.id, tax_id_type_id: gstin.id, tax_id_value: '27AAPFU0939F1ZV' });

        await wait(50); // fraud check runs fire-and-forget after the response
        const res = await request(app).get('/v1/fraud_signals?signal_type=duplicate_tax_id').set(adminHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        const match = res.body.data.items.find((s) => s.org_id === orgB.id);
        assert.ok(match, 'expected a duplicate_tax_id signal for orgB');
        signalId = match.id;
    });

    await t('a non-admin cannot list fraud signals', async () => {
        const res = await request(app).get('/v1/fraud_signals').set(buyerHeaders);
        assert.strictEqual(res.status, 403, JSON.stringify(res.body));
    });

    await t('admin confirms the signal', async () => {
        const res = await request(app).patch(`/v1/fraud_signals/${signalId}/confirm`).set(adminHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.status, 'confirmed');
    });

    await t('duplicate bank accounts across orgs raise duplicate_bank_account', async () => {
        await request(app).post('/v1/bank_accounts').set(buyerHeaders).send({ org_id: orgA.id, bank_name: 'HDFC', account_holder_name: 'A', account_number: '1111222233334444' });
        await request(app)
            .post('/v1/bank_accounts')
            .set(gatewayHeaders({ userId: 'u-2', orgId: `${tenantId}-B`, roles: ['buyer'] }))
            .send({ org_id: orgB.id, bank_name: 'HDFC', account_holder_name: 'B', account_number: '1111222233334444' });

        await wait(50);
        const res = await request(app).get('/v1/fraud_signals?signal_type=duplicate_bank_account').set(adminHeaders);
        const match = res.body.data.items.find((s) => s.org_id === orgB.id);
        assert.ok(match, 'expected a duplicate_bank_account signal for orgB');
    });

    await t('setup excessive-failed-logins user + manual scan flags them', async () => {
        user = await db.User.create({ email: `fraudscan-${Date.now()}@example.com`, password_hash: 'x', role: 'buyer', tenant_id: tenantId, failed_login_attempts: 7 });
        const res = await request(app).post('/v1/fraud_signals/scan_user').set(adminHeaders).send({ user_id: user.id });
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.flagged, true);
    });

    await t('teardown', async () => {
        await db.FraudSignal.destroy({ where: { org_id: [orgA.id, orgB.id] } });
        await db.FraudSignal.destroy({ where: { user_id: user.id } });
        await db.VerificationChecklistItem.destroy({ where: { org_id: [orgA.id, orgB.id] } });
        await db.TaxRegistration.destroy({ where: { org_id: [orgA.id, orgB.id] }, force: true });
        await db.BankAccount.unscoped().destroy({ where: { org_id: [orgA.id, orgB.id] }, force: true });
        await user.destroy();
        await orgA.destroy();
        await orgB.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
