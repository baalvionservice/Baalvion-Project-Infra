'use strict';
const request = require('supertest');
const app = require('../index');
const { gatewayHeaders } = require('./helpers/gatewayAuth');

// Dual-party authorization (participantAuth.js::callerOrg) reads orgCode/orgId
// off req.auth — gatewayHeaders' orgId maps straight onto it, so passing the
// counterparty org code (COMP-101/COMP-102/COMP-999) as orgId reproduces the
// same buyer/seller/outsider identities the old raw HS256 tokens forged.
const buyer = gatewayHeaders({ userId: 'u-buyer', orgId: 'COMP-101', roles: ['client'] });
const seller = gatewayHeaders({ userId: 'u-seller', orgId: 'COMP-102', roles: ['client'] });
const outsider = gatewayHeaders({ userId: 'u-outsider', orgId: 'COMP-999', roles: ['client'] });

describe('dual-party (participant) authorization (deals + rooms)', () => {
    let dealId;

    it('buyer creates a deal (COMP-101 <-> COMP-102)', async () => {
        const r = await request(app).post('/v1/deals').set(buyer)
            .send({ rfq_id: 'JP', buyer_org_id: 'COMP-101', seller_org_id: 'COMP-102', commodity: 'JEST-PART', quantity: 1, unit_price: 1, total_value: 1, currency: 'USD', status: 'negotiation' });
        expect(r.status).toBe(201);
        dealId = r.body.data.id;
    });

    it('seller (participant) can GET the deal', async () => {
        const r = await request(app).get(`/v1/deals/${dealId}`).set(seller);
        expect(r.status).toBe(200);
    });

    it('outsider cannot GET the deal (404)', async () => {
        const r = await request(app).get(`/v1/deals/${dealId}`).set(outsider);
        expect(r.status).toBe(404);
    });

    it('outsider cannot post to the deal room (404)', async () => {
        const r = await request(app).post('/v1/chat_messages').set(outsider)
            .send({ dealId: String(dealId), sender: 'buyer', content: 'intrusion', type: 'text' });
        expect(r.status).toBe(404);
    });

    it('participant can post to the deal room (201)', async () => {
        const r = await request(app).post('/v1/chat_messages').set(buyer)
            .send({ dealId: String(dealId), sender: 'buyer', content: 'hello', type: 'text' });
        expect(r.status).toBe(201);
    });

    afterAll(async () => {
        const db = require('../models');
        await db.Message.destroy({ where: { dealId: String(dealId) } });
        await db.Deal.destroy({ where: { rfq_id: 'JP' } });
    });
});
