'use strict';
const request = require('supertest');
const app = require('../index');
const db = require('../models');

const email = `jest_refresh_${Date.now()}@test.demo`;
const password = 'refresh1234';

const login = async () => {
    const r = await request(app).post('/v1/auth/login').send({ email, password });
    return r.body.data;
};

describe('refresh-token sessions (rotation + reuse detection)', () => {
    beforeAll(async () => {
        await request(app).post('/v1/auth/register').send({ email, password, name: 'Refresh User' });
    });

    afterAll(async () => {
        const u = await db.User.findOne({ where: { email } });
        if (u) {
            await db.RefreshToken.destroy({ where: { user_id: u.id } });
            await db.User.destroy({ where: { email } });
        }
    });

    it('login issues both an access token and a refresh token', async () => {
        const r = await request(app).post('/v1/auth/login').send({ email, password });
        expect(r.status).toBe(200);
        expect(r.body.data.accessToken).toBeTruthy();
        expect(r.body.data.refreshToken).toBeTruthy();
        expect(String(r.body.data.refreshToken)).toContain('.'); // "<id>.<secret>"
        // Refresh cookie is set httpOnly.
        const cookie = (r.headers['set-cookie'] || []).join(';');
        expect(cookie).toMatch(/refresh_token=/);
        expect(cookie).toMatch(/HttpOnly/i);
    });

    it('rotates the refresh token (single-use) into a fresh pair', async () => {
        const { refreshToken } = await login();
        const r = await request(app).post('/v1/auth/refresh').send({ refreshToken });
        expect(r.status).toBe(200);
        expect(r.body.data.accessToken).toBeTruthy();
        expect(r.body.data.refreshToken).toBeTruthy();
        expect(r.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('detects reuse of a spent token and revokes the entire family', async () => {
        const { refreshToken: t1 } = await login();
        const r1 = await request(app).post('/v1/auth/refresh').send({ refreshToken: t1 });
        expect(r1.status).toBe(200);
        const t2 = r1.body.data.refreshToken;

        // Replaying the already-rotated t1 is a breach signal -> 401.
        const reuse = await request(app).post('/v1/auth/refresh').send({ refreshToken: t1 });
        expect(reuse.status).toBe(401);

        // ...and the legitimate successor t2 is now revoked too (family burned).
        const after = await request(app).post('/v1/auth/refresh').send({ refreshToken: t2 });
        expect(after.status).toBe(401);
    });

    it('logout revokes the session so it can no longer refresh', async () => {
        const { refreshToken } = await login();
        const out = await request(app).post('/v1/auth/logout').send({ refreshToken });
        expect(out.status).toBe(200);
        const r = await request(app).post('/v1/auth/refresh').send({ refreshToken });
        expect(r.status).toBe(401);
    });

    it('lists active sessions and revokes a specific one by id', async () => {
        const { accessToken, refreshToken } = await login();
        const list = await request(app)
            .get('/v1/auth/sessions')
            .set('Authorization', `Bearer ${accessToken}`);
        expect(list.status).toBe(200);
        expect(Array.isArray(list.body.data)).toBe(true);
        expect(list.body.data.length).toBeGreaterThan(0);
        expect(list.body.data[0]).toHaveProperty('id');
        expect(list.body.data[0]).toHaveProperty('expiresAt');
        expect(list.body.data[0].createdAt).toBeTruthy();
        expect(list.body.data[0].expiresAt).toBeTruthy();

        const sessionId = refreshToken.split('.')[0];
        const del = await request(app)
            .delete(`/v1/auth/sessions/${sessionId}`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(del.status).toBe(200);
        expect(del.body.data.revoked).toBe(true);

        const r = await request(app).post('/v1/auth/refresh').send({ refreshToken });
        expect(r.status).toBe(401);
    });

    it('rejects malformed / unknown refresh tokens', async () => {
        const bad = await request(app).post('/v1/auth/refresh').send({ refreshToken: 'not-a-real-token' });
        expect(bad.status).toBe(401);
        const unknown = await request(app).post('/v1/auth/refresh').send({ refreshToken: '00000000-0000-0000-0000-000000000000.deadbeef' });
        expect(unknown.status).toBe(401);
        const none = await request(app).post('/v1/auth/refresh').send({});
        expect(none.status).toBe(401);
    });
});
