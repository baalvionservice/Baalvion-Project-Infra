'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 2 (Identity Verification)
 * standalone verification harness. jest is broken repo-wide (see other *.verify.js
 * files), so this exercises the real HTTP surface + DB via supertest.
 *
 *   node tests/identity-verification.verify.js
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
    let org;
    let user;
    let identityId;

    await t('setup: create org + user', async () => {
        org = await db.Organization.create({ tenant_id: tenantId, name: 'Identity Co', type: 'buyer', status: 'active' });
        user = await db.User.create({
            email: `identity-${Date.now()}@example.com`, password_hash: 'x', full_name: 'Jane Trader',
            role: 'buyer', tenant_id: tenantId,
        });
    });

    await t('POST /v1/identity_verifications rejects missing full_name', async () => {
        const res = await request(app)
            .post('/v1/identity_verifications')
            .set(gatewayHeaders({ userId: String(user.id), orgId: tenantId, roles: ['buyer'] }))
            .send({ id_type: 'passport' });
        assert.strictEqual(res.status, 422, JSON.stringify(res.body));
    });

    await t('POST /v1/identity_verifications submits identity tagged with org context', async () => {
        const res = await request(app)
            .post('/v1/identity_verifications')
            .set(gatewayHeaders({ userId: String(user.id), orgId: tenantId, roles: ['buyer'] }))
            .send({ org_id: org.id, full_name: 'Jane Trader', id_type: 'passport', nationality: 'IN' });
        assert.strictEqual(res.status, 201, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.status, 'submitted');
        identityId = res.body.data.id;
    });

    await t('Verification Center identity category flips to submitted', async () => {
        const res = await request(app)
            .get(`/v1/verification_center/${org.id}`)
            .set(gatewayHeaders({ userId: String(user.id), orgId: tenantId, roles: ['buyer'] }));
        const identity = res.body.data.checklist.find((i) => i.category === 'identity');
        assert.strictEqual(identity.status, 'submitted');
        assert.strictEqual(identity.item_count, 1);
    });

    await t('a different user cannot read someone else\'s identity verification (404, no leak)', async () => {
        const res = await request(app)
            .get(`/v1/identity_verifications/${identityId}`)
            .set(gatewayHeaders({ userId: '999999', orgId: 'T-OTHER', roles: ['buyer'] }));
        assert.strictEqual(res.status, 404, JSON.stringify(res.body));
    });

    await t('the owning user can read their own identity verification', async () => {
        const res = await request(app)
            .get(`/v1/identity_verifications/${identityId}`)
            .set(gatewayHeaders({ userId: String(user.id), orgId: tenantId, roles: ['buyer'] }));
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
    });

    await t('non-admin cannot approve an identity verification', async () => {
        const res = await request(app)
            .patch(`/v1/identity_verifications/${identityId}/approve`)
            .set(gatewayHeaders({ userId: String(user.id), orgId: tenantId, roles: ['buyer'] }));
        assert.strictEqual(res.status, 403, JSON.stringify(res.body));
    });

    await t('admin approves the identity verification, checklist category flips to approved', async () => {
        const res = await request(app)
            .patch(`/v1/identity_verifications/${identityId}/approve`)
            .set(gatewayHeaders({ userId: 'reviewer-1', orgId: 'T-ADMIN', roles: ['admin'] }));
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.status, 'approved');

        const center = await request(app)
            .get(`/v1/verification_center/${org.id}`)
            .set(gatewayHeaders({ userId: 'reviewer-1', orgId: 'T-ADMIN', roles: ['admin'] }));
        const identity = center.body.data.checklist.find((i) => i.category === 'identity');
        assert.strictEqual(identity.status, 'approved');
        assert.strictEqual(identity.approved_count, 1);
    });

    await t('resubmission after approval updates the same row (unique per user)', async () => {
        const res = await request(app)
            .post('/v1/identity_verifications')
            .set(gatewayHeaders({ userId: String(user.id), orgId: tenantId, roles: ['buyer'] }))
            .send({ org_id: org.id, full_name: 'Jane Trader', id_type: 'driving_license' });
        assert.strictEqual(res.status, 201, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.id, identityId);
        assert.strictEqual(res.body.data.status, 'submitted');
        const count = await db.IdentityVerification.count({ where: { user_id: user.id } });
        assert.strictEqual(count, 1);
    });

    await t('teardown', async () => {
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        await db.IdentityVerification.destroy({ where: { user_id: user.id }, force: true });
        await user.destroy();
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
