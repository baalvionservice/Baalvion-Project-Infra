'use strict';
import { describe, it, expect } from 'vitest';
import password from '../../utils/password.js';

describe('password utility', () => {
    it('hashes a plaintext password', async () => {
        const hash = await password.hash('SuperSecret123!');
        expect(hash).toBeTruthy();
        expect(hash).not.toBe('SuperSecret123!');
    });

    it('verifies a correct password', async () => {
        const hash = await password.hash('MyPassword');
        const ok   = await password.verify(hash, 'MyPassword');
        expect(ok).toBe(true);
    });

    it('rejects a wrong password', async () => {
        const hash = await password.hash('CorrectHorseBattery');
        const ok   = await password.verify(hash, 'WrongPassword');
        expect(ok).toBe(false);
    });

    it('reports the active algorithm', () => {
        const alg = password.algorithm();
        expect(['argon2id', 'bcrypt']).toContain(alg);
    });
});
