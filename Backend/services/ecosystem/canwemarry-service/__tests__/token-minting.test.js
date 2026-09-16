'use strict';
/**
 * Invitation tokens.
 *
 * A token is a bearer credential — whoever holds it can accept on behalf of the person it
 * was sent to — so the only thing between an attacker and someone else's case is that every
 * symbol is equally likely.
 *
 * Mapping random bytes onto an alphabet with `%` is uniform only while the alphabet length
 * divides 256. At 32 symbols it does, so the original was in fact correct, and would have
 * silently stopped being correct the first time anybody added or removed a character. These
 * tests hold the property rather than the implementation.
 */
jest.mock('../models', () => ({}));

const { mintToken: mint } = require('../service/invitationService');

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

describe('an invitation token', () => {
    test('is 16 characters, all from the Crockford alphabet', () => {
        for (let i = 0; i < 200; i += 1) {
            const t = mint();
            expect(t).toHaveLength(16);
            expect(t).toMatch(/^[0-9A-HJKMNP-TV-Z]{16}$/);
        }
    });

    test('never contains the characters people mistype', () => {
        // I, L, O and U are absent so a code read aloud comes back the same.
        expect(Array.from({ length: 400 }, mint).join('')).not.toMatch(/[ILOU]/);
    });

    test('can produce every symbol in the alphabet', () => {
        // 400 tokens is 6,400 draws over 32 symbols. A symbol missing from that is not bad
        // luck; it is a mapping that cannot reach it.
        const seen = new Set(Array.from({ length: 400 }, mint).join(''));
        for (const ch of ALPHABET) expect(seen.has(ch)).toBe(true);
    });

    test('is not biased toward the front of the alphabet', () => {
        /*
         * The specific failure a modulo mapping produces: with an alphabet that does not
         * divide 256, the first `256 % n` symbols come up one time in 256 more often than
         * the rest. Comparing the two halves catches that without asserting an exact
         * distribution — over 160,000 draws the halves land within a few per cent, and a
         * one-in-256 skew across sixteen symbols is far outside this bound.
         */
        const sample = Array.from({ length: 10000 }, mint).join('');
        const firstHalf = ALPHABET.slice(0, 16);
        let front = 0;
        for (const ch of sample) if (firstHalf.includes(ch)) front += 1;
        const share = front / sample.length;
        expect(share).toBeGreaterThan(0.47);
        expect(share).toBeLessThan(0.53);
    });

    test('does not repeat', () => {
        expect(new Set(Array.from({ length: 500 }, mint)).size).toBe(500);
    });
});
