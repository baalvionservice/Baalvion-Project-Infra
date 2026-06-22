'use strict';

/**
 * Consumer social login (Google / GitHub) — the network + DB half.
 *
 * Unlike enterprise SSO (per-org IdP rows in `sso_connections`, see ssoService.js),
 * this is platform-level "Continue with Google/GitHub" for the public proxy login page.
 * A returning user is matched first by social identity, then linked by VERIFIED email;
 * a brand-new user gets a fresh org + owner membership + trial subscription provisioned
 * exactly like email/password signup (signupService.provisionOAuthAccount).
 *
 * The controller (oauthController) reuses ssoService.completeLogin to mint the session,
 * so OAuth, SAML and OIDC all issue identical Baalvion sessions.
 */

const db = require('../models');
const config = require('../config/appConfig');
const providers = require('./oauthProviders');
const signupService = require('./signupService');
const { AppError } = require('../utils/errors');

const Q = db.Sequelize.QueryTypes;

const clientFor = (provider) =>
  provider === 'google' ? config.oauth.google : provider === 'github' ? config.oauth.github : null;

/** True only when both the client id AND secret are configured for the provider. */
const isConfigured = (provider) => {
  const c = clientFor(provider);
  return !!(c && c.clientId && c.clientSecret);
};

/**
 * The public callback URL handed to the provider. Must be reachable by the browser and
 * registered verbatim in the provider console. In this stack `/auth-bff/*` is reverse-
 * proxied to proxy-service `/v1/auth/*` (Caddy in prod, Vite in dev), so both the SPA
 * and these routes are same-origin.
 */
const redirectUri = (provider) =>
  `${String(config.oauth.publicBaseUrl).replace(/\/$/, '')}/auth-bff/oauth/${provider}/callback`;

function authorizeUrl(provider, { state, codeChallenge } = {}) {
  const c = clientFor(provider);
  return providers.buildAuthorizeUrl(provider, {
    clientId: c.clientId,
    redirectUri: redirectUri(provider),
    state,
    codeChallenge,
  });
}

async function exchangeCode(provider, { code, codeVerifier } = {}) {
  const c = clientFor(provider);
  const ep = providers.ENDPOINTS[provider];
  const body = new URLSearchParams({
    client_id: c.clientId,
    client_secret: c.clientSecret,
    code,
    redirect_uri: redirectUri(provider),
    grant_type: 'authorization_code',
  });
  // PKCE verifier only applies to Google here; GitHub ignores it.
  if (codeVerifier && provider === 'google') body.set('code_verifier', codeVerifier);

  const res = await fetch(ep.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  });
  if (!res.ok) throw new AppError('OAUTH_TOKEN_EXCHANGE_FAILED', 'Token exchange with provider failed', 502);
  const json = await res.json().catch(() => null);
  if (!json || !json.access_token) {
    throw new AppError('OAUTH_TOKEN_EXCHANGE_FAILED', 'Provider returned no access token', 502);
  }
  return json.access_token;
}

async function fetchProfile(provider, accessToken) {
  const ep = providers.ENDPOINTS[provider];
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
    'User-Agent': 'baalvion-proxy-oauth',
  };

  const res = await fetch(ep.userInfo, { headers });
  if (!res.ok) throw new AppError('OAUTH_PROFILE_FAILED', 'Could not fetch your profile from the provider', 502);
  const raw = await res.json().catch(() => ({}));

  let emails = null;
  if (provider === 'github') {
    // Best-effort: the primary verified email lives on a separate endpoint.
    try {
      const er = await fetch(ep.emails, { headers });
      if (er.ok) emails = await er.json();
    } catch {
      /* fall through — normalizeProfile will reject if no verified email is found */
    }
  }

  const profile = providers.normalizeProfile(provider, raw, emails);
  if (!profile.providerUserId) throw new AppError('OAUTH_NO_ID', 'Provider did not return a user id', 400);
  if (!profile.email) throw new AppError('OAUTH_NO_EMAIL', 'Provider did not return an email address', 400);
  // Refuse unverified emails — linking by an unverified email is an account-takeover vector.
  if (!profile.emailVerified) throw new AppError('OAUTH_EMAIL_UNVERIFIED', 'Your provider email is not verified', 400);
  // Defense-in-depth length caps on attacker-influenced fields (a compromised provider
  // response should never bloat a row). Real provider ids/emails are far under these.
  if (profile.providerUserId.length > 255 || profile.email.length > 255) {
    throw new AppError('OAUTH_PROFILE_INVALID', 'Provider returned an invalid profile', 400);
  }
  if (profile.fullName && profile.fullName.length > 200) profile.fullName = profile.fullName.slice(0, 200);
  if (profile.avatarUrl && profile.avatarUrl.length > 1024) profile.avatarUrl = null;
  return profile;
}

async function exchangeAndFetchProfile(provider, { code, codeVerifier } = {}) {
  const accessToken = await exchangeCode(provider, { code, codeVerifier });
  return fetchProfile(provider, accessToken);
}

/**
 * Resolve the social profile to a local user, in priority order:
 *   1. existing social identity  (oauth_provider + oauth_provider_id)
 *   2. existing account by verified email → link this provider (without clobbering a
 *      different already-linked id), stamp email_verified_at if absent
 *   3. new user → provision org + owner membership + trial subscription
 * Returns { user: { id, org_id, email, status, role }, role, isNewUser }.
 */
async function findOrCreateUser(profile, ctx = {}) {
  const normEmail = String(profile.email).toLowerCase().trim();

  // 1 — existing social identity
  const [byIdentity] = await db.sequelize.query(
    'SELECT id, org_id, email, status, role FROM users WHERE oauth_provider = :p AND oauth_provider_id = :pid LIMIT 1',
    { replacements: { p: profile.provider, pid: profile.providerUserId }, type: Q.SELECT },
  );
  if (byIdentity) {
    if (byIdentity.status !== 'active') throw new AppError('ACCOUNT_DISABLED', 'Your account is not active', 403);
    return { user: byIdentity, role: byIdentity.role, isNewUser: false };
  }

  // 2 — existing account by verified email → link
  const [byEmail] = await db.sequelize.query(
    'SELECT id, org_id, email, status, role, oauth_provider, oauth_provider_id FROM users WHERE email = :e LIMIT 1',
    { replacements: { e: normEmail }, type: Q.SELECT },
  );
  if (byEmail) {
    if (byEmail.status !== 'active') throw new AppError('ACCOUNT_DISABLED', 'Your account is not active', 403);
    // Link only when the social-identity slot is free, so we never overwrite a different
    // provider id already attached to this account.
    if (!byEmail.oauth_provider_id) {
      await db.users
        .update(
          {
            oauth_provider: profile.provider,
            oauth_provider_id: profile.providerUserId,
            ...(profile.avatarUrl ? { avatar_url: profile.avatarUrl } : {}),
          },
          { where: { id: byEmail.id, oauth_provider_id: null } },
        )
        .catch(() => {});
    }
    await db.sequelize
      .query('UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = :id', {
        replacements: { id: byEmail.id },
        type: Q.UPDATE,
      })
      .catch(() => {});
    return { user: byEmail, role: byEmail.role, isNewUser: false };
  }

  // 3 — brand-new social user → provision org + owner + trial subscription
  const { user, org } = await signupService.provisionOAuthAccount(
    {
      email: normEmail,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      provider: profile.provider,
      providerUserId: profile.providerUserId,
    },
    ctx,
  );
  return {
    user: { id: user.id, org_id: org.id, email: normEmail, status: 'active', role: 'owner' },
    role: 'owner',
    isNewUser: true,
  };
}

module.exports = {
  // re-exported pure helpers (so the controller imports a single module)
  isSupportedProvider: providers.isSupportedProvider,
  createPkce: providers.createPkce,
  encodeTx: providers.encodeTx,
  decodeTx: providers.decodeTx,
  // impure surface
  isConfigured,
  redirectUri,
  authorizeUrl,
  exchangeAndFetchProfile,
  findOrCreateUser,
};
