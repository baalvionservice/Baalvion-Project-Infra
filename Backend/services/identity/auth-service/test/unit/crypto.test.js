'use strict';
import { describe, it, expect } from 'vitest';
import { generateToken, hashToken } from '../../utils/crypto.js';

describe('crypto utility', () => {
    it('generates a hex token of the specified byte length', () => {
        const t = generateToken(16);
        expect(t).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('defaults to 32 bytes (64 hex chars)', () => {
        expect(generateToken()).toHaveLength(64);
    });

    it('generates unique tokens', () => {
        const tokens = new Set(Array.from({ length: 20 }, () => generateToken()));
        expect(tokens.size).toBe(20);
    });

    it('produces a stable SHA-256 hash', () => {
        const h1 = hashToken('abc');
        const h2 = hashToken('abc');
        expect(h1).toBe(h2);
        expect(h1).toHaveLength(64);
    });

    it('produces different hashes for different inputs', () => {
        expect(hashToken('aaa')).not.toBe(hashToken('bbb'));
    });
});
