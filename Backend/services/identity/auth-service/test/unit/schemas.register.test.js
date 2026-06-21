'use strict';
import { describe, it, expect } from 'vitest';
import schemas from '../../validators/schemas.js';

describe('register schema — public buyer/seller self-service', () => {
    it('accepts a minimal email + password registration', () => {
        const r = schemas.register.safeParse({ email: 'jane@acme.com', password: 'sup3rsecret' });
        expect(r.success).toBe(true);
    });

    it('accepts accountType buyer/seller and an optional phone', () => {
        for (const accountType of ['buyer', 'seller']) {
            const r = schemas.register.safeParse({ email: 'a@b.com', password: 'sup3rsecret', accountType, phone: '+1 555 0100' });
            expect(r.success).toBe(true);
            expect(r.data.accountType).toBe(accountType);
            expect(r.data.phone).toBe('+1 555 0100');
        }
    });

    it('rejects an accountType outside buyer/seller (no self-service privilege escalation)', () => {
        const r = schemas.register.safeParse({ email: 'a@b.com', password: 'sup3rsecret', accountType: 'platform_owner' });
        expect(r.success).toBe(false);
    });

    it('rejects an obviously invalid phone', () => {
        const r = schemas.register.safeParse({ email: 'a@b.com', password: 'sup3rsecret', phone: 'not-a-number' });
        expect(r.success).toBe(false);
    });
});

describe('phone OTP schemas', () => {
    it('request accepts an optional phone', () => {
        expect(schemas.phoneOtpRequest.safeParse({}).success).toBe(true);
        expect(schemas.phoneOtpRequest.safeParse({ phone: '+15550100' }).success).toBe(true);
    });

    it('verify requires a 4–8 digit numeric code', () => {
        expect(schemas.phoneOtpVerify.safeParse({ code: '123456' }).success).toBe(true);
        expect(schemas.phoneOtpVerify.safeParse({ code: '12' }).success).toBe(false);
        expect(schemas.phoneOtpVerify.safeParse({ code: 'abcdef' }).success).toBe(false);
    });
});
