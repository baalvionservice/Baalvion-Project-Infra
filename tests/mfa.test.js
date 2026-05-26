'use strict';
const request = require('supertest');
const app = require('../index');
const totp = require('../utils/totp');

describe('MFA (TOTP) enrollment + step-up', () => {
    const email = `jest_mfa_${Date.now()}@test.demo`;
    let token; let secret; let backupCodes;

    it('register -> enroll -> verify -> login step-up -> backup code', async () => {
        const reg = await request(app).post('/v1/auth/register').send({ email, password: 'demo1234' });
        token = reg.body.data.accessToken;

        const enroll = await request(app).post('/v1/auth/mfa/enroll').set('Authorization', `Bearer ${token}`);
        expect(enroll.status).toBe(200);
        secret = enroll.body.data.secret;
        backupCodes = enroll.body.data.backupCodes;
        expect(secret).toBeTruthy();
        expect(backupCodes).toHaveLength(8);

        const verify = await request(app).post('/v1/auth/mfa/verify').set('Authorization', `Bearer ${token}`).send({ code: totp.totp(secret) });
        expect(verify.status).toBe(200);
        expect(verify.body.data.mfaEnabled).toBe(true);

        const noCode = await request(app).post('/v1/auth/login').send({ email, password: 'demo1234' });
        expect(noCode.status).toBe(401); // MFA required

        const withCode = await request(app).post('/v1/auth/login').send({ email, password: 'demo1234', mfaCode: totp.totp(secret) });
        expect(withCode.status).toBe(200);

        const withBackup = await request(app).post('/v1/auth/login').send({ email, password: 'demo1234', mfaCode: backupCodes[0] });
        expect(withBackup.status).toBe(200);

        const reuse = await request(app).post('/v1/auth/login').send({ email, password: 'demo1234', mfaCode: backupCodes[0] });
        expect(reuse.status).toBe(401); // one-time backup code burned
    });

    afterAll(async () => {
        const db = require('../models');
        await db.User.destroy({ where: { email } });
    });
});
