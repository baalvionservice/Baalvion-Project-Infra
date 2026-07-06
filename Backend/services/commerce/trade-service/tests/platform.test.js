'use strict';
const request = require('supertest');
const app = require('../index');
const { gatewayHeaders } = require('./helpers/gatewayAuth');

const auth = gatewayHeaders({ userId: 'u-platform', orgId: 'T-DEMO', roles: ['client'] });

describe('platform endpoints (fx, stats, audit)', () => {
    // FX is retired here too (routes/fxRoutes.js → 410 Gone): the Java fx-service
    // and order-execution-service's own provider are the real sources of truth —
    // trade-service must not be a second one. Mirrors orderRoutes.js/paymentRoutes.js.
    it('GET /v1/fx/rates is retired (410 GONE)', async () => {
        const r = await request(app).get('/v1/fx/rates?base=USD&target=EUR');
        expect(r.status).toBe(410);
        expect(r.body.error.code).toBe('GONE');
    });

    it('GET /v1/platform_stats returns a real aggregate object', async () => {
        const r = await request(app).get('/v1/platform_stats');
        expect(r.status).toBe(200);
        expect(Array.isArray(r.body.data)).toBe(false);
        expect(r.body.data.counts).toBeDefined();
        expect(typeof r.body.data.activeTenants).toBe('number');
    });

    it('GET /v1/audit/verify reports an intact hash chain', async () => {
        const r = await request(app).get('/v1/audit/verify').set(auth);
        expect(r.status).toBe(200);
        expect(r.body.data.valid).toBe(true);
    });

    it('GET /v1/marketplace_listings is public + paginated', async () => {
        const r = await request(app).get('/v1/marketplace_listings');
        expect(r.status).toBe(200);
        expect(Array.isArray(r.body.data.items)).toBe(true);
    });
});
