'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 9 (Document Verification
 * wiring) standalone verification harness. jest is broken repo-wide, so this
 * exercises the real HTTP surface + DB via supertest.
 *
 *   node tests/document-verification-wiring.verify.js
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
    let org;
    let doc;

    await t('setup: org + a draft government_id document', async () => {
        org = await db.Organization.create({ tenant_id: tenantId, name: 'Doc Wiring Co', type: 'seller', status: 'active' });
        doc = await db.TradeDocument.create({ tenant_id: tenantId, doc_type: 'government_id', title: 'Passport scan', status: 'draft' });
    });

    await t('documents category is not_started before any reference exists', async () => {
        const res = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const documents = res.body.data.checklist.find((i) => i.category === 'documents');
        assert.strictEqual(documents.status, 'not_started');
    });

    await t('linking the document via a tax registration flips documents to submitted', async () => {
        const gstin = await db.TaxIdType.findOne({ where: { country_code: 'IN', type_code: 'GSTIN' } });
        await request(app)
            .post('/v1/tax_registrations')
            .set(buyerHeaders)
            .send({ org_id: org.id, tax_id_type_id: gstin.id, tax_id_value: '27AAPFU0939F1ZV', document_id: doc.id });

        const res = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const documents = res.body.data.checklist.find((i) => i.category === 'documents');
        assert.strictEqual(documents.status, 'submitted');
        assert.strictEqual(documents.item_count, 1);
    });

    await t('marking the underlying document verified flips documents to approved on next read', async () => {
        await doc.update({ status: 'verified' });
        const res = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const documents = res.body.data.checklist.find((i) => i.category === 'documents');
        assert.strictEqual(documents.status, 'approved');
    });

    await t('a quarantined document rolls up as rejected', async () => {
        await doc.update({ status: 'quarantined' });
        const res = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const documents = res.body.data.checklist.find((i) => i.category === 'documents');
        assert.strictEqual(documents.status, 'rejected');
    });

    await t('teardown', async () => {
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        await db.TaxRegistration.destroy({ where: { org_id: org.id }, force: true });
        await doc.destroy({ force: true });
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
