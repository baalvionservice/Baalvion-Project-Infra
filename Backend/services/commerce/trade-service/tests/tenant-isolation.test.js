'use strict';
const request = require('supertest');
const app = require('../index');
const { signAccessToken } = require('../utils/jwtserver');

const demo = signAccessToken({ id: 1, email: 'd@x', role: 'operator', tenantId: 'T-DEMO', orgCode: 'COMP-101' }, '1h');
const other = signAccessToken({ id: 7, email: 'o@x', role: 'operator', tenantId: 'T-JESTOTHER', orgCode: 'COMP-101' }, '1h');
const admin = signAccessToken({ id: 9, email: 'a@x', role: 'admin', tenantId: 'T-DEMO', orgCode: 'COMP-555' }, '1h');

describe('tenant isolation (orders)', () => {
    let orderId;

    it('creates an order under T-DEMO', async () => {
        const r = await request(app).post('/v1/orders').set('Authorization', `Bearer ${demo}`)
            .send({ deal_id: 'JT', product: 'JEST-ISO', quantity: 1, price: 1, total_value: 1, currency: 'USD', status: 'pending' });
        expect(r.status).toBe(201);
        expect(r.body.data.tenant_id).toBe('T-DEMO');
        orderId = r.body.data.id;
    });

    it('blocks anonymous reads (401)', async () => {
        const r = await request(app).get('/v1/orders');
        expect(r.status).toBe(401);
    });

    it('hides the order from another tenant (404)', async () => {
        const r = await request(app).get(`/v1/orders/${orderId}`).set('Authorization', `Bearer ${other}`);
        expect(r.status).toBe(404);
    });

    it('does not leak it in another tenant list', async () => {
        const r = await request(app).get('/v1/orders').set('Authorization', `Bearer ${other}`);
        expect(r.status).toBe(200);
        const leaked = (r.body.data.items || []).some((o) => String(o.id) === String(orderId));
        expect(leaked).toBe(false);
    });

    it('allows the owning tenant (200)', async () => {
        const r = await request(app).get(`/v1/orders/${orderId}`).set('Authorization', `Bearer ${demo}`);
        expect(r.status).toBe(200);
    });

    it('lets admin bypass and see it', async () => {
        const r = await request(app).get(`/v1/orders/${orderId}`).set('Authorization', `Bearer ${admin}`);
        expect(r.status).toBe(200);
    });

    afterAll(async () => {
        const db = require('../models');
        await db.Order.destroy({ where: { deal_id: 'JT' } });
    });
});
