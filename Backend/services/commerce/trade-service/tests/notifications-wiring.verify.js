'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 17 (Notifications
 * wiring) standalone verification harness. jest is broken repo-wide, so this
 * exercises the real HTTP surface + DB via supertest.
 *
 *   node tests/notifications-wiring.verify.js
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
    let org;
    let taxRegId;

    await t('setup: org with a code (notifications key on org.code)', async () => {
        org = await db.Organization.create({ tenant_id: tenantId, code: `NOTIFY-${Date.now()}`, name: 'Notify Verify Co', type: 'seller', status: 'active' });
    });

    await t('submitting a tax registration fires a verification_requested notification', async () => {
        const gstin = await db.TaxIdType.findOne({ where: { country_code: 'IN', type_code: 'GSTIN' } });
        const res = await request(app).post('/v1/tax_registrations').set(buyerHeaders).send({ org_id: org.id, tax_id_type_id: gstin.id, tax_id_value: '27AAPFU0939F1ZV' });
        taxRegId = res.body.data.id;

        await wait(50);
        const notifs = await db.Notification.findAll({ where: { recipient_org_id: org.code, type: 'verification_requested' } });
        assert.ok(notifs.length >= 1, 'expected a verification_requested notification');
    });

    await t('repeated GET /v1/verification_center reads do NOT spam duplicate notifications (only real transitions notify)', async () => {
        await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        await wait(50);
        // 'documents' category recomputes on every read but has no docs, so it stays
        // not_started throughout — zero notifications for it, regardless of read count.
        const notifs = await db.Notification.findAll({ where: { recipient_org_id: org.code, entity_id: 'documents' } });
        assert.strictEqual(notifs.length, 0);
    });

    await t('approving the tax registration fires a verification_approved notification', async () => {
        await request(app).patch(`/v1/tax_registrations/${taxRegId}/approve`).set(adminHeaders);
        await wait(50);
        const notifs = await db.Notification.findAll({ where: { recipient_org_id: org.code, type: 'verification_approved', entity_id: 'tax' } });
        assert.ok(notifs.length >= 1, 'expected a verification_approved notification for tax');
    });

    await t('a rejected compliance rule evaluation fires a compliance_issue notification', async () => {
        await org.update({ country: 'KP' }); // triggers country_allowed + profile_complete failures
        await request(app).post('/v1/compliance_rules/evaluate').set(buyerHeaders).send({ org_id: org.id });
        await wait(50);
        const notifs = await db.Notification.findAll({ where: { recipient_org_id: org.code, type: 'compliance_issue' } });
        assert.ok(notifs.length >= 1, 'expected a compliance_issue notification');
    });

    await t('computing the trust score fires a trust_score_updated notification', async () => {
        const res = await request(app).post('/v1/trust_scores/compute').set(buyerHeaders).send({ org_id: org.id });
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        await wait(50);
        const notifs = await db.Notification.findAll({ where: { recipient_org_id: org.code, type: 'trust_score_updated' } });
        assert.strictEqual(notifs.length, 1); // exactly once for this one compute call
        assert.ok(notifs[0].message.includes(String(res.body.data.score)));
    });

    await t('teardown', async () => {
        await db.Notification.destroy({ where: { recipient_org_id: org.code } });
        await db.TrustScore.destroy({ where: { org_id: org.id } });
        await db.ComplianceRuleEvaluation.destroy({ where: { org_id: org.id } });
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        await db.TaxRegistration.destroy({ where: { org_id: org.id }, force: true });
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
