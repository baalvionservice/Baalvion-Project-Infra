'use strict';

// Pure-logic unit tests for social-login helpers — runnable with `npm test` (node --test),
// no DB/Redis/config. The network + DB half (oauthService.js) needs a live DB and is
// exercised via the running app per docs/OAUTH-SOCIAL-LOGIN.md.

const { test } = require('node:test');
const assert = require('node:assert');

const {
  SUPPORTED,
  isSupportedProvider,
  buildAuthorizeUrl,
  createPkce,
  challengeFromVerifier,
  encodeTx,
  decodeTx,
  normalizeProfile,
} = require('../service/oauthProviders');

const REDIRECT = 'https://proxy.baalvionstack.com/auth-bff/oauth/google/callback';

test('isSupportedProvider: only google + github', () => {
  assert.deepStrictEqual(SUPPORTED, ['google', 'github']);
  assert.strictEqual(isSupportedProvider('google'), true);
  assert.strictEqual(isSupportedProvider('github'), true);
  assert.strictEqual(isSupportedProvider('facebook'), false);
  assert.strictEqual(isSupportedProvider(''), false);
});

test('buildAuthorizeUrl(google): carries client_id, redirect_uri, scope, state + PKCE', () => {
  const url = new URL(buildAuthorizeUrl('google', {
    clientId: 'gid.apps',
    redirectUri: REDIRECT,
    state: 'nonce123',
    codeChallenge: 'chal',
  }));
  assert.strictEqual(url.origin + url.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
  assert.strictEqual(url.searchParams.get('client_id'), 'gid.apps');
  assert.strictEqual(url.searchParams.get('redirect_uri'), REDIRECT);
  assert.strictEqual(url.searchParams.get('response_type'), 'code');
  assert.strictEqual(url.searchParams.get('scope'), 'openid email profile');
  assert.strictEqual(url.searchParams.get('state'), 'nonce123');
  assert.strictEqual(url.searchParams.get('code_challenge'), 'chal');
  assert.strictEqual(url.searchParams.get('code_challenge_method'), 'S256');
});

test('buildAuthorizeUrl(github): correct endpoint + scope, no PKCE params', () => {
  const url = new URL(buildAuthorizeUrl('github', {
    clientId: 'ghid',
    redirectUri: REDIRECT,
    state: 'n',
    codeChallenge: 'ignored',
  }));
  assert.strictEqual(url.origin + url.pathname, 'https://github.com/login/oauth/authorize');
  assert.strictEqual(url.searchParams.get('scope'), 'read:user user:email');
  assert.strictEqual(url.searchParams.get('code_challenge'), null); // GitHub: no PKCE
});

test('buildAuthorizeUrl: unsupported provider throws', () => {
  assert.throws(() => buildAuthorizeUrl('twitter', { clientId: 'x', redirectUri: REDIRECT, state: 's' }), /unsupported/);
});

test('PKCE: challenge is the S256 of the verifier (deterministic, known vector)', () => {
  // RFC 7636 Appendix B test vector.
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
  assert.strictEqual(challengeFromVerifier(verifier), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  const { verifier: v, challenge: c } = createPkce();
  assert.ok(v.length >= 43, 'verifier should be >= 43 chars');
  assert.strictEqual(c, challengeFromVerifier(v));
});

test('encodeTx/decodeTx: round-trips and rejects garbage', () => {
  const tx = { nonce: 'abc', provider: 'google', verifier: 'v' };
  const decoded = decodeTx(encodeTx(tx));
  assert.deepStrictEqual(decoded, tx);
  assert.strictEqual(decodeTx(''), null);
  assert.strictEqual(decodeTx('not-base64-json!!'), null);
  assert.strictEqual(decodeTx(encodeTx({ nonce: 'x' })), null); // missing provider
});

test('normalizeProfile(google): maps sub/email/name/picture + verified flag', () => {
  const p = normalizeProfile('google', {
    sub: '12345', email: 'Jane@Example.com', email_verified: true,
    name: 'Jane Doe', picture: 'https://x/y.png',
  });
  assert.deepStrictEqual(p, {
    provider: 'google', providerUserId: '12345', email: 'jane@example.com',
    fullName: 'Jane Doe', avatarUrl: 'https://x/y.png', emailVerified: true,
  });
});

test('normalizeProfile(google): unverified email surfaces emailVerified=false', () => {
  const p = normalizeProfile('google', { sub: '1', email: 'a@b.com', email_verified: false, name: 'A' });
  assert.strictEqual(p.emailVerified, false);
});

test('normalizeProfile(github): primary verified email from the emails list', () => {
  const raw = { id: 9, login: 'octocat', name: 'The Octocat', email: null, avatar_url: 'https://a/b.png' };
  const emails = [
    { email: 'secondary@x.com', primary: false, verified: true },
    { email: 'octo@github.com', primary: true, verified: true },
  ];
  const p = normalizeProfile('github', raw, emails);
  assert.strictEqual(p.providerUserId, '9');
  assert.strictEqual(p.email, 'octo@github.com');
  assert.strictEqual(p.emailVerified, true);
  assert.strictEqual(p.fullName, 'The Octocat');
});

test('normalizeProfile(github): no verified email → emailVerified=false', () => {
  const p = normalizeProfile('github', { id: 9, login: 'octocat' }, [
    { email: 'x@y.com', primary: true, verified: false },
  ]);
  assert.strictEqual(p.emailVerified, false);
});
