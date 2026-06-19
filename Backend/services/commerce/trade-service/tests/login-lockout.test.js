'use strict';
const request = require('supertest');
const app = require('../index');
const db = require('../models');

// Threshold is forced to 3 in tests/setup.js (LOGIN_MAX_ATTEMPTS).
const MAX = Number(process.env.LOGIN_MAX_ATTEMPTS || 3);
const email = `jest_lockout_${Date.now()}@test.demo`;
const password = 'lockout1234';

const login = (pw) => request(app).post('/v1/auth/login').send({ email, password: pw });

describe('login brute-force lockout', () => {
    beforeAll(async () => {
        await request(app).post('/v1/auth/register').send({ email, password, name: 'Lockout User' });
        // Registration auto-logs-in; ensure a clean counter for the test.
        await db.User.update({ failed_login_attempts: 0, locked_until: null }, { where: { email } });
    });

    afterAll(async () => {
        await db.User.destroy({ where: { email } });
    });

    it('locks the account (423) after the configured number of failures', async () => {
        // The first MAX-1 wrong attempts are plain 401s.
        for (let i = 0; i < MAX - 1; i += 1) {
            const r = await login('wrong-pass');
            expect(r.status).toBe(401);
        }
        // The MAX-th failure trips the lockout.
        const locked = await login('wrong-pass');
        expect(locked.status).toBe(423);
        expect(locked.body.error.code).toBe('ACCOUNT_LOCKED');
        expect(locked.body.error.details.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('blocks even a correct password while locked', async () => {
        const r = await login(password);
        expect(r.status).toBe(423);
        expect(r.body.error.code).toBe('ACCOUNT_LOCKED');
    });

    it('resets the counter and allows login once the lock is cleared', async () => {
        // Simulate the cooldown elapsing (clear lock; counter already 0 post-lock).
        await db.User.update({ locked_until: null, failed_login_attempts: 0 }, { where: { email } });
        const ok = await login(password);
        expect(ok.status).toBe(200);
        expect(ok.body.data.accessToken).toBeTruthy();

        // After a success the counter is clean, so a single later failure is a 401 (not a lingering lock).
        const oneMiss = await login('wrong-pass');
        expect(oneMiss.status).toBe(401);

        const fresh = await db.User.findOne({ where: { email } });
        expect(fresh.failed_login_attempts).toBe(1);
    });
});
