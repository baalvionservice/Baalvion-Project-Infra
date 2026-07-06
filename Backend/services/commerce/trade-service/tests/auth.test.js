'use strict';
const request = require('supertest');
const app = require('../index');
const db = require('../models');
const { gatewayHeaders } = require('./helpers/gatewayAuth');
const totp = require('../utils/totp');

const email = `jest_auth_${Date.now()}@test.demo`;

describe('auth: register/login/refresh are retired (410 GONE)', () => {
    // Phase 6E-8 / auth-node R2: access-token issuance is RS256-only and the
    // private key lives only in the central identity/auth-service. trade-service
    // holds no key material (see config/appConfig.js jwt.accessSecret — HS256
    // only, never passed to createAuthServer as an RS256 key), so it structurally
    // cannot mint a token; these three actions now fail fast with 410 instead of
    // 500ing after a partial DB write. The real GTI frontend never hits these —
    // it goes through /trade-bff/auth/* → auth-gateway → auth-service instead.
    it('POST /v1/auth/register is retired', async () => {
        const r = await request(app).post('/v1/auth/register').send({ email, password: 'demo1234', name: 'Jest User' });
        expect(r.status).toBe(410);
        expect(r.body.error.code).toBe('GONE');
    });

    it('does not leave a half-created user behind on the retired path', async () => {
        const user = await db.User.findOne({ where: { email } });
        expect(user).toBeNull();
    });

    it('POST /v1/auth/login is retired', async () => {
        const r = await request(app).post('/v1/auth/login').send({ email, password: 'demo1234' });
        expect(r.status).toBe(410);
        expect(r.body.error.code).toBe('GONE');
    });

    it('POST /v1/auth/refresh is retired', async () => {
        const r = await request(app).post('/v1/auth/refresh').send({ refreshToken: 'whatever' });
        expect(r.status).toBe(410);
        expect(r.body.error.code).toBe('GONE');
    });
});

describe('auth: /me, MFA + session management still work for a gateway-verified identity', () => {
    let user;
    const auth = () => gatewayHeaders({ userId: String(user.id), orgId: user.tenant_id, roles: ['client'] });

    beforeAll(async () => {
        // Seed the user directly — register is retired, but everything downstream
        // of a gateway-verified identity (which never goes through register/login
        // in production either) should still work against a real User row.
        user = await db.User.create({
            email, password_hash: 'not-a-real-hash', full_name: 'Jest User',
            role: 'buyer', tenant_id: 'T-DEMO',
        });
    });

    afterAll(async () => {
        await db.User.destroy({ where: { email } });
    });

    it('blocks anonymous /me (401)', async () => {
        const r = await request(app).get('/v1/auth/me');
        expect(r.status).toBe(401);
    });

    it('GET /v1/auth/me resolves the gateway-verified user, hiding secrets', async () => {
        const r = await request(app).get('/v1/auth/me').set(auth());
        expect(r.status).toBe(200);
        expect(r.body.data.email).toBe(email);
        expect(r.body.data.role).toBe('buyer');
        expect(r.body.data.password_hash).toBeUndefined();
    });

    it('MFA: enroll -> verify -> step-up-required disable with a backup code', async () => {
        const enroll = await request(app).post('/v1/auth/mfa/enroll').set(auth());
        expect(enroll.status).toBe(200);
        const { secret, backupCodes } = enroll.body.data;
        expect(secret).toBeTruthy();
        expect(backupCodes).toHaveLength(8);

        const verify = await request(app).post('/v1/auth/mfa/verify').set(auth()).send({ code: totp.totp(secret) });
        expect(verify.status).toBe(200);
        expect(verify.body.data.mfaEnabled).toBe(true);

        const badDisable = await request(app).post('/v1/auth/mfa/disable').set(auth()).send({ code: 'wrong' });
        expect(badDisable.status).toBe(401);

        const disable = await request(app).post('/v1/auth/mfa/disable').set(auth()).send({ code: backupCodes[0] });
        expect(disable.status).toBe(200);
        expect(disable.body.data.mfaEnabled).toBe(false);
    });

    it('logout is idempotent and does not require a refresh token', async () => {
        const r = await request(app).post('/v1/auth/logout').set(auth()).send({});
        expect(r.status).toBe(200);
        expect(r.body.data.loggedOut).toBe(true);
    });

    it('lists sessions (empty — no refresh session was ever issued via the retired login)', async () => {
        const r = await request(app).get('/v1/auth/sessions').set(auth());
        expect(r.status).toBe(200);
        expect(Array.isArray(r.body.data)).toBe(true);
    });
});
