'use strict';
/**
 * Public identity CONTRACT — Phase 0 freeze.
 *
 * Locks the externally-observable identity contract so the centralization migration cannot
 * SILENTLY break the 10+ downstream consumers behind unchanged-looking paths. These are pure
 * assertions — NO live Postgres/Redis required, so this runs as a fast CI gate on every change.
 *
 * What is frozen here (a failure means a consumer-visible contract changed — stop and re-pin it):
 *   1. Canonical JTI blacklist namespace `auth:blacklist:<jti>` — the gateway reads this on EVERY
 *      request and auth-service writes it on logout/suspension. A format change breaks revocation
 *      platform-wide while looking like a harmless refactor.
 *   2. The core public auth endpoints stay registered (login/register/refresh/logout/me) AND the
 *      whole MFA surface stays present (hard constraint: never remove MFA).
 *   3. JWKS discovery path stays `/.well-known/jwks.json` — every downstream RS256 verifier's
 *      JWKS_URI points at it.
 *   4. Refresh cookie name + JWT issuer/audience claims are frozen — every verifier depends on them.
 *   5. The startup landmine stays removed — appConfig must NEVER `requireEnv()` the dead HS256
 *      secrets again (that crash-on-boot blocked clean redeploys).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { blacklistKey, BLACKLIST_PREFIX } from '@baalvion/auth-node';

import authRoutes from '../../routes/authRoutes.js';
import wellKnownRoutes from '../../routes/wellKnownRoutes.js';
import config from '../../config/appConfig.js';

// Walk an Express router's stack into a Set of "METHOD path" strings.
function registeredRoutes(router) {
    const out = new Set();
    for (const layer of router.stack || []) {
        if (!layer.route) continue;
        for (const method of Object.keys(layer.route.methods)) {
            out.add(`${method.toUpperCase()} ${layer.route.path}`);
        }
    }
    return out;
}

describe('Public identity contract (Phase 0 freeze)', () => {
    it('1. JTI blacklist namespace is frozen at auth:blacklist:<jti>', () => {
        expect(BLACKLIST_PREFIX).toBe('auth:blacklist:');
        expect(blacklistKey('JTI-123')).toBe('auth:blacklist:JTI-123');
    });

    it('2. core public auth + MFA endpoints stay registered', () => {
        const routes = registeredRoutes(authRoutes);

        for (const r of ['POST /register', 'POST /login', 'POST /refresh', 'POST /logout', 'GET /me']) {
            expect(routes, `${r} must remain on the auth router`).toContain(r);
        }
        // MFA must never disappear (hard constraint: do not remove MFA).
        for (const r of ['POST /mfa/challenge', 'POST /mfa/enroll/start', 'POST /mfa/enroll', 'POST /mfa/verify', 'DELETE /mfa/disable']) {
            expect(routes, `${r} (MFA surface) must remain`).toContain(r);
        }
        // Invite acceptance + service-to-service token verification stay available.
        expect(routes).toContain('POST /accept-invite');
        expect(routes).toContain('POST /verify-token');
    });

    it('3. JWKS discovery path stays /.well-known/jwks.json', () => {
        const routes = registeredRoutes(wellKnownRoutes);
        // Router is mounted at /.well-known in index.js, so its own path is /jwks.json.
        expect(routes).toContain('GET /jwks.json');
    });

    it('4. refresh cookie name + JWT issuer/audience claims are frozen', () => {
        expect(config.refreshCookieName).toBe('baalvion_refresh');
        expect(config.jwt.issuer).toBe('baalvion-auth');
        expect(config.jwt.audience).toBe('baalvion-platform');
    });

    it('5. startup landmine stays removed — appConfig never requireEnv()s the dead HS256 secrets', () => {
        const src = readFileSync(resolve(process.cwd(), 'config/appConfig.js'), 'utf8');
        expect(
            src,
            'requireEnv(JWT_ACCESS_SECRET) must not return — it crashes boot when the secret is absent (Phase 0 landmine)',
        ).not.toMatch(/requireEnv\(\s*['"]JWT_ACCESS_SECRET['"]\s*\)/);
        expect(src).not.toMatch(/requireEnv\(\s*['"]JWT_REFRESH_SECRET['"]\s*\)/);
    });
});
