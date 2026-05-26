'use strict';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Redis so tests don't need a running instance
vi.mock('../../config/redis.js', () => ({
    default: { getClient: () => null, isAvailable: () => false, connect: vi.fn() },
}));

import mfaService from '../../service/mfaService.js';

const MOCK_USER = {
    id:         1,
    email:      'bob@example.com',
    mfa_secret: null, // filled in after initiateSetup
};

describe('mfaService', () => {
    describe('initiateSetup', () => {
        it('returns a QR code URL, base32 secret and 8 recovery codes', async () => {
            const result = await mfaService.initiateSetup(MOCK_USER);
            expect(result.qrCodeUrl).toMatch(/^data:image\/png/);
            expect(result.secret).toBeTruthy();
            expect(result.recoveryCodes).toHaveLength(8);
            expect(result.recoveryCodes[0]).toBeTruthy();
        });
    });

    describe('confirmSetup', () => {
        it('throws an AppError with code INVALID_MFA_CODE on a wrong code', () => {
            expect(() => mfaService.confirmSetup('JBSWY3DPEHPK3PXP', '000000'))
                .toThrow(expect.objectContaining({ code: 'INVALID_MFA_CODE' }));
        });
    });

    describe('challenge lifecycle (in-memory fallback)', () => {
        it('creates, peeks, verifies and deletes a challenge', async () => {
            const speakeasy = (await import('speakeasy')).default;

            // Generate a real TOTP secret so we can produce a valid code
            const secret = speakeasy.generateSecret({ length: 20 });

            // Patch the user with the real secret
            const user = { ...MOCK_USER, mfa_secret: secret.base32 };

            const token = await mfaService.createChallenge({
                userId:    user.id,
                orgId:     'org-1',
                ipAddress: '127.0.0.1',
                userAgent: 'test',
            });
            expect(token).toBeTruthy();

            // peekChallenge should return the payload without consuming
            const peeked = await mfaService.peekChallenge(token);
            expect(peeked).not.toBeNull();
            expect(peeked.userId).toBe(user.id);

            // Generate a valid TOTP code for the secret
            const code = speakeasy.totp({ secret: secret.base32, encoding: 'base32' });

            const challenge = await mfaService.verifyChallenge(token, code, user);
            expect(challenge.userId).toBe(user.id);

            // Challenge should be consumed — peek returns null
            const gone = await mfaService.peekChallenge(token);
            expect(gone).toBeNull();
        });

        it('throws MFA_LOCKED after MAX_MFA_ATTEMPTS consecutive wrong codes', async () => {
            const token = await mfaService.createChallenge({
                userId: 99, orgId: 'org-x', ipAddress: '1.2.3.4', userAgent: 'ua',
            });
            const fakeUser = { id: 99, mfa_secret: 'JBSWY3DPEHPK3PXP' };

            for (let i = 0; i < 5; i++) {
                await expect(
                    mfaService.verifyChallenge(token, '000000', fakeUser)
                ).rejects.toThrow();
            }

            // 6th attempt: challenge should be revoked → MFA_LOCKED
            await expect(
                mfaService.verifyChallenge(token, '000000', fakeUser)
            ).rejects.toMatchObject({ code: 'MFA_LOCKED' });
        });
    });
});
