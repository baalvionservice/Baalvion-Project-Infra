'use strict';
const request = require('supertest');
const app = require('../index');
const { gatewayHeaders } = require('./helpers/gatewayAuth');

// orders' own HTTP surface is retired (routes/orderRoutes.js → 410 Gone; fulfillment
// moved to order-execution-service). The mount is a path-less catch-all middleware
// that runs BEFORE any auth check, so every method/path/identity combination gets
// the same 410 — that auth-independence is itself the property worth asserting.
// The dual-party/tenant-scoping concern this suite used to cover for orders is now
// covered for the live entity in purchase-orders.test.js.
const demo = gatewayHeaders({ userId: 'u-demo', orgId: 'T-DEMO', roles: ['client'] });
const admin = gatewayHeaders({ userId: 'u-admin', orgId: 'T-DEMO', roles: ['admin'] });

describe('orders HTTP surface is retired (410 GONE)', () => {
    it('GONE for anonymous callers', async () => {
        const r = await request(app).get('/v1/orders');
        expect(r.status).toBe(410);
        expect(r.body.error.code).toBe('GONE');
    });

    it('GONE for an authenticated caller (list)', async () => {
        const r = await request(app).get('/v1/orders').set(demo);
        expect(r.status).toBe(410);
    });

    it('GONE for an admin caller (get by id)', async () => {
        const r = await request(app).get('/v1/orders/1').set(admin);
        expect(r.status).toBe(410);
    });

    it('GONE on write attempts (create) — no order is ever persisted', async () => {
        const r = await request(app).post('/v1/orders').set(demo)
            .send({ deal_id: 'JT', product: 'JEST-ISO', quantity: 1, price: 1, total_value: 1, currency: 'USD', status: 'pending' });
        expect(r.status).toBe(410);
        const db = require('../models');
        const leaked = await db.Order.findOne({ where: { deal_id: 'JT' } });
        expect(leaked).toBeNull();
    });
});
