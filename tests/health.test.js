'use strict';
const request = require('supertest');
const app = require('../index');

describe('health probes', () => {
    it('GET /health -> 200 ok', async () => {
        const r = await request(app).get('/health');
        expect(r.status).toBe(200);
        expect(r.body.status).toBe('ok');
    });

    it('GET /health/live -> 200 alive', async () => {
        const r = await request(app).get('/health/live');
        expect(r.status).toBe(200);
        expect(r.body.status).toBe('alive');
    });

    it('GET /health/ready -> 200 db connected', async () => {
        const r = await request(app).get('/health/ready');
        expect(r.status).toBe(200);
        expect(r.body.db).toBe('connected');
    });
});
