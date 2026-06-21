'use strict';
import { describe, it, expect } from 'vitest';
import { hashToken } from '../../utils/crypto.js';
import phoneVerification from '../../service/phoneVerificationService.js';

const { classifyOtpAttempt, generateNumericCode } = phoneVerification;

// Build a live OTP row the way the Sequelize model would (only the fields the classifier reads).
function row({ code = '123456', attempts = 0, ttlMs = 60_000 } = {}) {
    return { code_hash: hashToken(code), attempts, expires_at: new Date(Date.now() + ttlMs) };
}

describe('classifyOtpAttempt (pure decision logic)', () => {
    it('returns no_code when there is no active code', () => {
        expect(classifyOtpAttempt(null, '123456', { maxAttempts: 3 }))
            .toEqual({ outcome: 'no_code', attempts: 0, exhausted: false });
    });

    it('returns expired for a past expiry (before checking the code)', () => {
        const r = row({ ttlMs: -1000 });
        const d = classifyOtpAttempt(r, '123456', { maxAttempts: 3 });
        expect(d.outcome).toBe('expired');
    });

    it('returns locked once attempts have reached the max', () => {
        const r = row({ attempts: 3 });
        const d = classifyOtpAttempt(r, '123456', { maxAttempts: 3 });
        expect(d).toMatchObject({ outcome: 'locked', exhausted: true });
    });

    it('returns ok for a correct code and counts the attempt', () => {
        const r = row({ code: '123456', attempts: 0 });
        const d = classifyOtpAttempt(r, '123456', { maxAttempts: 3 });
        expect(d).toEqual({ outcome: 'ok', attempts: 1, exhausted: false });
    });

    it('returns invalid for a wrong code and burns one attempt (still live below max)', () => {
        const r = row({ code: '123456', attempts: 0 });
        const d = classifyOtpAttempt(r, '000000', { maxAttempts: 3 });
        expect(d).toEqual({ outcome: 'invalid', attempts: 1, exhausted: false });
    });

    it('marks the final wrong attempt as exhausted (locks the code)', () => {
        const r = row({ code: '123456', attempts: 2 }); // 3rd try with maxAttempts=3
        const d = classifyOtpAttempt(r, '000000', { maxAttempts: 3 });
        expect(d).toEqual({ outcome: 'invalid', attempts: 3, exhausted: true });
    });

    it('checks expiry before the attempt counter', () => {
        const r = row({ attempts: 99, ttlMs: -1 });
        expect(classifyOtpAttempt(r, '123456', { maxAttempts: 3 }).outcome).toBe('expired');
    });
});

describe('generateNumericCode', () => {
    it('produces a digits-only code of the requested length', () => {
        for (const len of [4, 6, 8]) {
            expect(generateNumericCode(len)).toMatch(new RegExp(`^[0-9]{${len}}$`));
        }
    });

    it('does not return a constant value across calls', () => {
        const codes = new Set(Array.from({ length: 20 }, () => generateNumericCode(6)));
        expect(codes.size).toBeGreaterThan(1); // overwhelmingly likely; guards a hard-coded stub
    });
});
