'use strict';
const request = require('supertest');
const app = require('../index');

const email = `jest_auth_${Date.now()}@test.demo`;

describe('auth + password policy', () => {
    it('rejects weak password (<8)', async () => {
        const r = await request(app).post('/v1/auth/register').send({ email: `weak_${Date.now()}@test.demo`, password: '123' });
        expect(r.status).toBe(400);
    });

    it('registers and returns a token + tenant', async () => {
        const r = await request(app).post('/v1/auth/register').send({ email, password: 'demo1234', name: 'Jest User' });
        expect(r.status).toBe(201);
        expect(r.body.data.accessToken).toBeTruthy();
        expect(r.body.data.tenantId).toBe('T-DEMO');
    });

    it('rejects duplicate email', async () => {
        const r = await request(app).post('/v1/auth/register').send({ email, password: 'demo1234' });
        expect(r.status).toBe(409);
    });

    it('logs in with correct credentials', async () => {
        const r = await request(app).post('/v1/auth/login').send({ email, password: 'demo1234' });
        expect(r.status).toBe(200);
        expect(r.body.data.accessToken).toBeTruthy();
    });

    it('rejects wrong password', async () => {
        const r = await request(app).post('/v1/auth/login').send({ email, password: 'wrongpass9' });
        expect(r.status).toBe(401);
    });

    afterAll(async () => {
        const db = require('../models');
        await db.User.destroy({ where: { email } });
    });
});
