/**
 * @file server/__tests__/identity-hardening.test.ts
 * @description Exercises the hardening added to the identity envelope flow: single-use
 * replay protection on mutating requests, audience/issuer scoping, role-vocabulary
 * validation, envelope lifetime capping, and secret-rotation grace windows. These
 * complement (not replace) the pre-existing authentication.test.ts contract.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyIdentity, signIdentity, identitySecret, UnauthorizedError, Principal } from '../http/identity';
import { USER_ROLES, UserRole } from '@/core/roles';

const ORG = '11111111-1111-1111-1111-111111111111';
const PRINCIPAL: Principal = { actorId: 'u-1', actorRole: USER_ROLES.BUYER as UserRole, organizationId: ORG };

function reqWith(headers: Record<string, string>, method = 'GET'): Request {
  return new Request('http://localhost/api/trades', { method, headers });
}

/** Hand-crafts an envelope+signature the same way production signIdentity() would, so tests
 * can exercise claim shapes signIdentity()'s public API deliberately does not allow (bad aud,
 * unknown role, etc.) while still producing a signature that passes HMAC verification. */
function craftEnvelope(claims: Record<string, unknown>, secret: string = identitySecret()): Record<string, string> {
  const b64 = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url');
  const sig = createHmac('sha256', secret).update(b64).digest('hex');
  return { 'x-identity-envelope': b64, 'x-identity-signature': sig };
}

function validClaims(overrides: Record<string, unknown> = {}) {
  const now = Date.now();
  return {
    sub: PRINCIPAL.actorId,
    role: PRINCIPAL.actorRole,
    org: PRINCIPAL.organizationId,
    iat: now,
    exp: now + 60_000,
    jti: `jti-${Math.random()}`,
    aud: 'gti-local-api',
    iss: 'gti-session-bridge',
    ...overrides,
  };
}

describe('identity envelope hardening', () => {
  afterEach(() => {
    delete process.env.GATEWAY_SIGNING_SECRET;
    delete process.env.GATEWAY_SIGNING_SECRET_PREVIOUS;
  });

  describe('replay protection (unsafe methods only)', () => {
    it('rejects the SAME envelope reused for a second POST (single-use nonce)', () => {
      const headers = signIdentity(PRINCIPAL);
      const first = verifyIdentity(reqWith(headers, 'POST'));
      expect(first.actorId).toBe(PRINCIPAL.actorId);
      expect(() => verifyIdentity(reqWith(headers, 'POST'))).toThrow(UnauthorizedError);
      expect(() => verifyIdentity(reqWith(headers, 'POST'))).toThrow(/already used/i);
    });

    it('allows the SAME cached envelope to be reused across many GETs (by design)', () => {
      const headers = signIdentity(PRINCIPAL);
      expect(() => verifyIdentity(reqWith(headers, 'GET'))).not.toThrow();
      expect(() => verifyIdentity(reqWith(headers, 'GET'))).not.toThrow();
      expect(() => verifyIdentity(reqWith(headers, 'GET'))).not.toThrow();
    });

    it('does not let a GET-consumed envelope leak replay immunity to a POST', () => {
      const headers = signIdentity(PRINCIPAL);
      verifyIdentity(reqWith(headers, 'GET'));
      expect(() => verifyIdentity(reqWith(headers, 'POST'))).not.toThrow();
      // ...but the SAME envelope cannot then be used for a second POST.
      expect(() => verifyIdentity(reqWith(headers, 'POST'))).toThrow(/already used/i);
    });

    it('two independently-minted envelopes (distinct jti) each authorize one POST', () => {
      const a = signIdentity(PRINCIPAL);
      const b = signIdentity(PRINCIPAL);
      expect(() => verifyIdentity(reqWith(a, 'POST'))).not.toThrow();
      expect(() => verifyIdentity(reqWith(b, 'POST'))).not.toThrow();
    });
  });

  describe('audience / issuer scoping', () => {
    it('rejects an otherwise-valid, correctly-signed envelope with the wrong audience', () => {
      const headers = craftEnvelope(validClaims({ aud: 'some-other-service' }));
      expect(() => verifyIdentity(reqWith(headers))).toThrow(/not scoped to this API/i);
    });

    it('rejects an otherwise-valid, correctly-signed envelope with the wrong issuer', () => {
      const headers = craftEnvelope(validClaims({ iss: 'attacker-minted' }));
      expect(() => verifyIdentity(reqWith(headers))).toThrow(/not scoped to this API/i);
    });
  });

  describe('claim vocabulary / shape validation', () => {
    it('rejects a role outside the known role vocabulary', () => {
      const headers = craftEnvelope(validClaims({ role: 'super_hacker_admin' }));
      expect(() => verifyIdentity(reqWith(headers))).toThrow(/role is not recognized/i);
    });

    it('rejects a malformed (non-UUID) organization id even with a valid signature', () => {
      const headers = craftEnvelope(validClaims({ org: 'not-a-uuid; DROP TABLE trades;' }));
      expect(() => verifyIdentity(reqWith(headers))).toThrow(/valid tenant id/i);
    });

    it('rejects an actor id containing control/oversized content', () => {
      const headers = craftEnvelope(validClaims({ sub: 'a'.repeat(500) }));
      expect(() => verifyIdentity(reqWith(headers))).toThrow(/actor id is malformed/i);
    });

    it('rejects an envelope whose exp precedes its iat', () => {
      const now = Date.now();
      const headers = craftEnvelope(validClaims({ iat: now, exp: now - 1000 }));
      expect(() => verifyIdentity(reqWith(headers))).toThrow(/invalid lifetime/i);
    });
  });

  describe('lifetime capping', () => {
    it('caps an absurdly long requested ttl to the server-side maximum', () => {
      const headers = signIdentity(PRINCIPAL, { ttlMs: 999_999_999 });
      const claims = JSON.parse(Buffer.from(headers['x-identity-envelope'], 'base64url').toString('utf8'));
      expect(claims.exp - claims.iat).toBeLessThanOrEqual(10 * 60_000);
      // Still verifies fine — capping isn't rejection, just a ceiling.
      expect(() => verifyIdentity(reqWith(headers))).not.toThrow();
    });

    it('rejects a hand-crafted envelope whose lifetime exceeds the server-side maximum', () => {
      const now = Date.now();
      const headers = craftEnvelope(validClaims({ iat: now, exp: now + 60 * 60_000 })); // 1 hour
      expect(() => verifyIdentity(reqWith(headers))).toThrow(/invalid lifetime/i);
    });
  });

  describe('secret rotation', () => {
    it('accepts an envelope signed with the PREVIOUS secret during a rotation window', () => {
      const oldSecret = 'old_secret_before_rotation_min_32_characters!';
      const newSecret = 'new_secret_after_rotation_min_32_characters!!';

      process.env.GATEWAY_SIGNING_SECRET = oldSecret;
      const headers = signIdentity(PRINCIPAL);

      // Rotate: new secret is now primary, old one is kept only for verification grace.
      process.env.GATEWAY_SIGNING_SECRET = newSecret;
      process.env.GATEWAY_SIGNING_SECRET_PREVIOUS = oldSecret;

      expect(() => verifyIdentity(reqWith(headers))).not.toThrow();
    });

    it('new envelopes are always signed with the CURRENT secret, never the previous one', () => {
      const oldSecret = 'old_secret_before_rotation_min_32_characters!';
      const newSecret = 'new_secret_after_rotation_min_32_characters!!';

      process.env.GATEWAY_SIGNING_SECRET = newSecret;
      process.env.GATEWAY_SIGNING_SECRET_PREVIOUS = oldSecret;
      const headers = signIdentity(PRINCIPAL);

      // Verifying against ONLY the old secret (simulate a verifier that hasn't rotated) fails —
      // proves the new envelope was not signed with the old secret.
      process.env.GATEWAY_SIGNING_SECRET = oldSecret;
      delete process.env.GATEWAY_SIGNING_SECRET_PREVIOUS;
      expect(() => verifyIdentity(reqWith(headers))).toThrow(UnauthorizedError);
    });

    it('rejects an envelope signed with a secret from neither rotation slot', () => {
      process.env.GATEWAY_SIGNING_SECRET = 'current_secret_min_32_characters_long!!';
      process.env.GATEWAY_SIGNING_SECRET_PREVIOUS = 'previous_secret_min_32_characters_long!';
      const headers = craftEnvelope(validClaims(), 'a_totally_unrelated_secret_min_32_chars!');
      expect(() => verifyIdentity(reqWith(headers))).toThrow(/Invalid identity signature/i);
    });
  });
});
