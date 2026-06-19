'use strict';
const request = require('supertest');
const app = require('../index');
const { signAccessToken } = require('../utils/jwtserver');

const buyer = signAccessToken({ id: 1, email: 'b@x', role: 'operator', tenantId: 'T-DEMO', orgCode: 'COMP-101' }, '1h');
const seller = signAccessToken({ id: 2, email: 's@x', role: 'operator', tenantId: 'T-DEMO', orgCode: 'COMP-102' }, '1h');
const outsider = signAccessToken({ id: 3, email: 'x@x', role: 'operator', tenantId: 'T-DEMO', orgCode: 'COMP-999' }, '1h');

describe('dual-party (participant) authorization (deals + rooms)', () => {
    let dealId;

    it('buyer creates a deal (COMP-101 <-> COMP-102)', async () => {
        const r = await request(app).post('/v1/deals').set('Authorization', `Bearer ${buyer}`)
            .send({ rfq_id: 'JP', buyer_org_id: 'COMP-101', seller_org_id: 'COMP-102', commodity: 'JEST-PART', quantity: 1, unit_price: 1, total_value: 1, currency: 'USD', status: 'negotiation' });
        expect(r.status).toBe(201);
        dealId = r.body.data.id;
    });

    it('seller (participant) can GET the deal', async () => {
        const r = await request(app).get(`/v1/deals/${dealId}`).set('Authorization', `Bearer ${seller}`);
        expect(r.status).toBe(200);
    });

    it('outsider cannot GET the deal (404)', async () => {
        const r = await request(app).get(`/v1/deals/${dealId}`).set('Authorization', `Bearer ${outsider}`);
        expect(r.status).toBe(404);
    });

    it('outsider cannot post to the deal room (404)', async () => {
        const r = await request(app).post('/v1/chat_messages').set('Authorization', `Bearer ${outsider}`)
            .send({ dealId: String(dealId), sender: 'buyer', content: 'intrusion', type: 'text' });
        expect(r.status).toBe(404);
    });

    it('participant can post to the deal room (201)', async () => {
        const r = await request(app).post('/v1/chat_messages').set('Authorization', `Bearer ${buyer}`)
            .send({ dealId: String(dealId), sender: 'buyer', content: 'hello', type: 'text' });
        expect(r.status).toBe(201);
    });

    afterAll(async () => {
        const db = require('../models');
        await db.Message.destroy({ where: { dealId: String(dealId) } });
        await db.Deal.destroy({ where: { rfq_id: 'JP' } });
    });
});
