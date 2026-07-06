'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 5 (Bank Verification)
 * standalone verification harness. jest is broken repo-wide, so this exercises the
 * real HTTP surface + DB via supertest.
 *
 *   node tests/bank-verification.verify.js
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
    let firstId;
    let secondId;

    await t('setup: create org', async () => {
        org = await db.Organization.create({ tenant_id: tenantId, name: 'Bank Verify Co', type: 'seller', status: 'active' });
    });

    await t('POST /v1/bank_accounts never echoes the raw account number', async () => {
        const res = await request(app)
            .post('/v1/bank_accounts')
            .set(buyerHeaders)
            .send({ org_id: org.id, bank_name: 'HDFC Bank', account_holder_name: 'Bank Verify Co', account_number: '1234567890123456', is_primary: true });
        assert.strictEqual(res.status, 201, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.account_number_last4, '3456');
        assert.strictEqual(res.body.data.account_number_ciphertext, undefined);
        assert.strictEqual(res.body.data.is_primary, true);
        firstId = res.body.data.id;
    });

    await t('the ciphertext is genuinely encrypted at rest (not a copy of the plaintext)', async () => {
        const raw = await db.BankAccount.unscoped().findByPk(firstId);
        assert.ok(raw.account_number_ciphertext);
        assert.notStrictEqual(raw.account_number_ciphertext, '1234567890123456');
    });

    await t('checklist bank category is submitted', async () => {
        const res = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const bank = res.body.data.checklist.find((i) => i.category === 'bank');
        assert.strictEqual(bank.status, 'submitted');
        assert.strictEqual(bank.item_count, 1);
    });

    await t('a second primary account demotes the first (unique primary per org)', async () => {
        const res = await request(app)
            .post('/v1/bank_accounts')
            .set(buyerHeaders)
            .send({ org_id: org.id, bank_name: 'ICICI Bank', account_holder_name: 'Bank Verify Co', account_number: '9988776655443322', is_primary: true });
        assert.strictEqual(res.status, 201, JSON.stringify(res.body));
        secondId = res.body.data.id;

        const list = await request(app).get(`/v1/bank_accounts?org_id=${org.id}`).set(buyerHeaders);
        const primaries = list.body.data.items.filter((a) => a.is_primary);
        assert.strictEqual(primaries.length, 1);
        assert.strictEqual(primaries[0].id, secondId);
    });

    await t('rejects a submission missing required fields', async () => {
        const res = await request(app)
            .post('/v1/bank_accounts')
            .set(buyerHeaders)
            .send({ org_id: org.id, bank_name: 'No Account Number Bank' });
        assert.strictEqual(res.status, 422, JSON.stringify(res.body));
    });

    await t('admin approves both accounts, bank checklist category flips to approved', async () => {
        await request(app).patch(`/v1/bank_accounts/${firstId}/approve`).set(adminHeaders);
        await request(app).patch(`/v1/bank_accounts/${secondId}/approve`).set(adminHeaders);
        const center = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const bank = center.body.data.checklist.find((i) => i.category === 'bank');
        assert.strictEqual(bank.status, 'approved');
        assert.strictEqual(bank.approved_count, 2);
    });

    await t('deleting an account recomputes the bank checklist category', async () => {
        await request(app).delete(`/v1/bank_accounts/${firstId}`).set(adminHeaders);
        const center = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const bank = center.body.data.checklist.find((i) => i.category === 'bank');
        assert.strictEqual(bank.item_count, 1);
        assert.strictEqual(bank.status, 'approved');
    });

    await t('teardown', async () => {
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        await db.BankAccount.destroy({ where: { org_id: org.id }, force: true });
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
