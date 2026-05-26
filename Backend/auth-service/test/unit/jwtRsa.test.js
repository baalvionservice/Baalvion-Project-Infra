'use strict';
import { describe, it, expect, beforeAll } from 'vitest';
import jwt from '../../utils/jwtRsa.js';

// The JWT module generates an ephemeral RSA key pair on first call in dev.
// These tests exercise sign + verify without any external key files.

describe('jwtRsa', () => {
    describe('access token', () => {
        let token;

        beforeAll(() => {
            token = jwt.signAccessToken({
                sub:         42,
                email:       'alice@example.com',
                orgId:       'org-uuid',
                role:        'admin',
                permissions: ['jobs', 'market'],
                sid:         'session-uuid',
            });
        });

        it('returns a string with three JWT segments', () => {
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        });

        it('verifies successfully', () => {
            const decoded = jwt.verifyAccessToken(token);
            expect(decoded.sub).toBe('42');
            expect(decoded.email).toBe('alice@example.com');
            expect(decoded.org_id).toBe('org-uuid');
            expect(decoded.role).toBe('admin');
            expect(decoded.permissions).toEqual(['jobs', 'market']);
            expect(decoded.sid).toBe('session-uuid');
        });

        it('carries a jti', () => {
            const decoded = jwt.verifyAccessToken(token);
            expect(decoded.jti).toBeTruthy();
        });

        it('rejects a tampered token', () => {
            const parts   = token.split('.');
            parts[1]      = Buffer.from('{"sub":"HACKER"}').toString('base64url');
            expect(() => jwt.verifyAccessToken(parts.join('.'))).toThrow();
        });
    });

    describe('refresh token', () => {
        let token;

        beforeAll(() => {
            token = jwt.signRefreshToken({ sub: 42, sid: 'session-uuid', familyId: 'family-uuid' });
        });

        it('verifies successfully', () => {
            const decoded = jwt.verifyRefreshToken(token);
            expect(decoded.sub).toBe('42');
            expect(decoded.family_id).toBe('family-uuid');
        });

        it('has a unique jti each call', () => {
            const t1 = jwt.signRefreshToken({ sub: 1, sid: 's1', familyId: 'f1' });
            const t2 = jwt.signRefreshToken({ sub: 1, sid: 's1', familyId: 'f1' });
            const d1 = jwt.verifyRefreshToken(t1);
            const d2 = jwt.verifyRefreshToken(t2);
            expect(d1.jti).not.toBe(d2.jti);
        });
    });

    describe('hashToken', () => {
        it('returns a 64-char hex string', () => {
            expect(jwt.hashToken('some.jwt.token')).toHaveLength(64);
        });

        it('is deterministic', () => {
            expect(jwt.hashToken('x')).toBe(jwt.hashToken('x'));
        });
    });

    describe('getJwks', () => {
        it('returns a JWKS with one RSA key', () => {
            const jwks = jwt.getJwks();
            expect(jwks.keys).toHaveLength(1);
            expect(jwks.keys[0].kty).toBe('RSA');
            expect(jwks.keys[0].alg).toBe('RS256');
            expect(jwks.keys[0].use).toBe('sig');
            expect(jwks.keys[0].n).toBeTruthy();
            expect(jwks.keys[0].e).toBeTruthy();
        });
    });
});
