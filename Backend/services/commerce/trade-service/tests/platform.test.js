'use strict';
const request = require('supertest');
const app = require('../index');
const { signAccessToken } = require('../utils/jwtserver');

const token = signAccessToken({ id: 1, email: 'p@x', role: 'operator', tenantId: 'T-DEMO', orgCode: 'COMP-101' }, '1h');

describe('platform endpoints (fx, stats, audit)', () => {
    it('GET /v1/fx/rates returns a numeric rate', async () => {
        const r = await request(app).get('/v1/fx/rates?base=USD&target=EUR');
        expect(r.status).toBe(200);
        expect(typeof r.body.data.rate).toBe('number');
        expect(r.body.data.rate).toBeGreaterThan(0);
    });

    it('GET /v1/platform_stats returns a real aggregate object', async () => {
        const r = await request(app).get('/v1/platform_stats');
        expect(r.status).toBe(200);
        expect(Array.isArray(r.body.data)).toBe(false);
        expect(r.body.data.counts).toBeDefined();
        expect(typeof r.body.data.activeTenants).toBe('number');
    });

    it('GET /v1/audit/verify reports an intact hash chain', async () => {
        const r = await request(app).get('/v1/audit/verify').set('Authorization', `Bearer ${token}`);
        expect(r.status).toBe(200);
        expect(r.body.data.valid).toBe(true);
    });

    it('GET /v1/marketplace_listings is public + paginated', async () => {
        const r = await request(app).get('/v1/marketplace_listings');
        expect(r.status).toBe(200);
        expect(Array.isArray(r.body.data.items)).toBe(true);
    });
});
