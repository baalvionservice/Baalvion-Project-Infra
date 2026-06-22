'use strict';

/**
 * Pure provider metadata + helpers for consumer social login (Google / Facebook).
 * Dependency-free (crypto only) so it unit-tests without the DB/config chain.
 * Network + DB work lives in oauthLogin.js. ('github' is retained but dormant.)
 */

const crypto = require('crypto');

const SUPPORTED = ['google', 'facebook', 'github'];
const isSupportedProvider = (provider) => SUPPORTED.includes(provider);

const ENDPOINTS = {
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    userInfo: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid email profile',
  },
  facebook: {
    authorize: 'https://www.facebook.com/v19.0/dialog/oauth',
    token: 'https://graph.facebook.com/v19.0/oauth/access_token',
    userInfo: 'https://graph.facebook.com/me?fields=id,name,email,picture.type(large)',
    scope: 'email public_profile',
  },
  github: {
    authorize: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    userInfo: 'https://api.github.com/user',
    emails: 'https://api.github.com/user/emails',
    scope: 'read:user user:email',
  },
};

function buildAuthorizeUrl(provider, { clientId, redirectUri, state, codeChallenge } = {}) {
  const ep = ENDPOINTS[provider];
  if (!ep) throw new Error(`unsupported provider: ${provider}`);

  const url = new URL(ep.authorize);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', ep.scope);
  url.searchParams.set('state', state);

  if (provider === 'google') {
    url.searchParams.set('access_type', 'online');
    url.searchParams.set('prompt', 'select_account');
    url.searchParams.set('include_granted_scopes', 'true');
    if (codeChallenge) {
      url.searchParams.set('code_challenge', codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
    }
  }
  if (provider === 'facebook' && codeChallenge) {
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
  }
  if (provider === 'github') {
    url.searchParams.set('allow_signup', 'true');
  }
  return url.toString();
}

// ── PKCE (RFC 7636) — verifier stays server-side (tx cookie); never sent to provider. ──
// Node's native 'base64url' = URL-safe + unpadded; no regex (avoids the ReDoS on replaces).
const b64url = (buf) => buf.toString('base64url');
const challengeFromVerifier = (verifier) => b64url(crypto.createHash('sha256').update(verifier).digest());
function createPkce() {
  const verifier = b64url(crypto.randomBytes(32));
  return { verifier, challenge: challengeFromVerifier(verifier) };
}

// ── Transaction cookie (state nonce + provider + PKCE verifier) — base64url JSON. ──
function encodeTx(obj) {
  return b64url(Buffer.from(JSON.stringify(obj), 'utf8'));
}
function decodeTx(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    const json = Buffer.from(value, 'base64url').toString('utf8');
    const obj = JSON.parse(json);
    return obj && typeof obj === 'object' && obj.nonce && obj.provider ? obj : null;
  } catch {
    return null;
  }
}

/** Normalize → { provider, providerUserId, email, fullName, avatarUrl, emailVerified }. */
function normalizeProfile(provider, raw = {}, emails = null) {
  if (provider === 'google') {
    return {
      provider,
      providerUserId: raw.sub ? String(raw.sub) : '',
      email: raw.email ? String(raw.email).toLowerCase() : '',
      fullName: raw.name || [raw.given_name, raw.family_name].filter(Boolean).join(' ') || '',
      avatarUrl: raw.picture || null,
      emailVerified: raw.email_verified === true || raw.email_verified === 'true',
    };
  }
  if (provider === 'facebook') {
    const pic = raw.picture && raw.picture.data ? raw.picture.data.url : (typeof raw.picture === 'string' ? raw.picture : null);
    return {
      provider,
      providerUserId: raw.id ? String(raw.id) : '',
      email: raw.email ? String(raw.email).toLowerCase() : '',
      fullName: raw.name || '',
      avatarUrl: pic || null,
      emailVerified: !!raw.email, // Facebook only returns verified emails
    };
  }
  if (provider === 'github') {
    let email = raw.email ? String(raw.email).toLowerCase() : '';
    let emailVerified = false;
    if (Array.isArray(emails)) {
      const primary = emails.find((e) => e && e.primary && e.verified) || emails.find((e) => e && e.verified);
      if (primary && primary.email) {
        email = String(primary.email).toLowerCase();
        emailVerified = true;
      }
    }
    return {
      provider,
      providerUserId: raw.id ? String(raw.id) : '',
      email,
      fullName: raw.name || raw.login || '',
      avatarUrl: raw.avatar_url || null,
      emailVerified,
    };
  }
  throw new Error(`unsupported provider: ${provider}`);
}

module.exports = {
  SUPPORTED,
  ENDPOINTS,
  isSupportedProvider,
  buildAuthorizeUrl,
  createPkce,
  challengeFromVerifier,
  encodeTx,
  decodeTx,
  normalizeProfile,
};
