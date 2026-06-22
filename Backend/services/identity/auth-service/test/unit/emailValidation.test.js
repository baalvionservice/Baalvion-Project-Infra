'use strict';
import { describe, it, expect } from 'vitest';
import { isDisposableEmail, hasDeliverableDomain, domainOf } from '../../utils/emailValidation.js';

describe('domainOf', () => {
    it('extracts the lower-cased domain', () => {
        expect(domainOf('John.Doe@Example.COM')).toBe('example.com');
    });
    it('returns empty string for malformed input', () => {
        expect(domainOf('not-an-email')).toBe('');
        expect(domainOf('')).toBe('');
        expect(domainOf(null)).toBe('');
    });
});

describe('isDisposableEmail', () => {
    it('flags known disposable / temp providers', () => {
        for (const e of ['x@mailinator.com', 'y@10minutemail.com', 'z@guerrillamail.com', 'a@yopmail.com', 'b@temp-mail.org']) {
            expect(isDisposableEmail(e), e).toBe(true);
        }
    });
    it('allows genuine providers + legitimate business domains', () => {
        for (const e of ['a@gmail.com', 'b@outlook.com', 'c@proton.me', 'd@zoho.com', 'e@acme-corp.co']) {
            expect(isDisposableEmail(e), e).toBe(false);
        }
    });
    it('is case-insensitive on the domain', () => {
        expect(isDisposableEmail('A@Mailinator.COM')).toBe(true);
    });
});

describe('hasDeliverableDomain (known-good short-circuit — no network)', () => {
    it('returns true for known-good providers without a DNS lookup', async () => {
        expect(await hasDeliverableDomain('gmail.com')).toBe(true);
        expect(await hasDeliverableDomain('outlook.com')).toBe(true);
        expect(await hasDeliverableDomain('proton.me')).toBe(true);
    });
    it('returns false for an empty domain', async () => {
        expect(await hasDeliverableDomain('')).toBe(false);
    });
});
