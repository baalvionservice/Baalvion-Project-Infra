'use strict';

/**
 * Consumer social login (Google / Facebook) for the central identity stack.
 *
 * Amarisé (and any frontend that talks to auth-service directly) uses this. Mirrors the
 * proxy-service OAuth design, adapted to auth-service repos + issuance:
 *   - credentials resolved per-site from the CMS vault (admin panel) → env fallback
 *   - returning user matched by social identity, then linked by VERIFIED email
 *   - new user → fresh org + owner membership provisioned exactly like register()
 *   - session minted via authService.issueTokenPair (RS256) — same tokens as password login
 */

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const config = require('../config/appConfig');
const providers = require('./oauthProviders');
const vault = require('./oauthCmsVault');
const { userRepo, orgRepo, sessionRepo, auditRepo } = require('../repositories');
const password = require('../utils/password');
const { issueTokenPair, presentUser } = require('./authService');
const { AppError } = require('../utils/errors');

const VAULT_PROVIDER = { google: 'google-oauth', facebook: 'facebook-oauth', github: 'github-oauth' };
const envClientFor = (p) => (p === 'google' ? config.oauth.google : p === 'facebook' ? config.oauth.facebook : null);

async function resolveClient(provider) {
  try {
    const entry = await vault.getProvider(VAULT_PROVIDER[provider]);
    if (entry && entry.enabled !== false) {
      const clientId = (entry.config && entry.config.clientId) || (entry.secrets && entry.secrets.clientId);
      const clientSecret = entry.secrets && entry.secrets.clientSecret;
      if (clientId && clientSecret) return { clientId, clientSecret };
    }
  } catch {
    /* vault unavailable → env fallback */
  }
  const c = envClientFor(provider);
  return c && c.clientId && c.clientSecret ? { clientId: c.clientId, clientSecret: c.clientSecret } : null;
}

async function isConfigured(provider) {
  return !!(await resolveClient(provider));
}

const redirectUri = (provider) =>
  `${String(config.oauth.publicBaseUrl).replace(/\/$/, '')}/auth-bff/oauth/${provider}/callback`;

async function authorizeUrl(provider, { state, codeChallenge } = {}) {
  const c = await resolveClient(provider);
  if (!c) throw new AppError('OAUTH_NOT_CONFIGURED', 'Provider is not configured', 400);
  return providers.buildAuthorizeUrl(provider, { clientId: c.clientId, redirectUri: redirectUri(provider), state, codeChallenge });
}

async function exchangeCode(provider, { code, codeVerifier } = {}) {
  const c = await resolveClient(provider);
  if (!c) throw new AppError('OAUTH_NOT_CONFIGURED', 'Provider is not configured', 400);
  const ep = providers.ENDPOINTS[provider];
  const body = new URLSearchParams({
    client_id: c.clientId,
    client_secret: c.clientSecret,
    code,
    redirect_uri: redirectUri(provider),
    grant_type: 'authorization_code',
  });
  if (codeVerifier && (provider === 'google' || provider === 'facebook')) body.set('code_verifier', codeVerifier);
  const res = await fetch(ep.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  });
  if (!res.ok) throw new AppError('OAUTH_TOKEN_EXCHANGE_FAILED', 'Token exchange with provider failed', 502);
  const json = await res.json().catch(() => null);
  if (!json || !json.access_token) throw new AppError('OAUTH_TOKEN_EXCHANGE_FAILED', 'Provider returned no access token', 502);
  return json.access_token;
}

async function fetchProfile(provider, accessToken) {
  const ep = providers.ENDPOINTS[provider];
  const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'User-Agent': 'baalvion-auth-oauth' };
  const res = await fetch(ep.userInfo, { headers });
  if (!res.ok) throw new AppError('OAUTH_PROFILE_FAILED', 'Could not fetch your profile from the provider', 502);
  const raw = await res.json().catch(() => ({}));
  let emails = null;
  if (provider === 'github') {
    try {
      const er = await fetch(ep.emails, { headers });
      if (er.ok) emails = await er.json();
    } catch {
      /* normalizeProfile rejects if no verified email */
    }
  }
  const profile = providers.normalizeProfile(provider, raw, emails);
  if (!profile.providerUserId) throw new AppError('OAUTH_NO_ID', 'Provider did not return a user id', 400);
  if (!profile.email) throw new AppError('OAUTH_NO_EMAIL', 'Provider did not return an email address', 400);
  if (!profile.emailVerified) throw new AppError('OAUTH_EMAIL_UNVERIFIED', 'Your provider email is not verified', 400);
  if (profile.providerUserId.length > 255 || profile.email.length > 255) {
    throw new AppError('OAUTH_PROFILE_INVALID', 'Provider returned an invalid profile', 400);
  }
  if (profile.fullName && profile.fullName.length > 200) profile.fullName = profile.fullName.slice(0, 200);
  if (profile.avatarUrl && profile.avatarUrl.length > 1024) profile.avatarUrl = null;
  return profile;
}

async function exchangeAndFetchProfile(provider, { code, codeVerifier } = {}) {
  return fetchProfile(provider, await exchangeCode(provider, { code, codeVerifier }));
}

/**
 * Find-or-create the user, provision an org for new users, enforce the same gates as
 * login (status / org-suspension / MFA), and mint an RS256 session.
 * Returns { accessToken, refreshToken, expiresAt, user, isNewUser }.
 */
async function loginWithProfile(profile, { ipAddress, userAgent } = {}) {
  const db = require('../models');
  const normEmail = String(profile.email).toLowerCase().trim();

  // 1 — existing social identity
  let user = await db.User.findOne({ where: { oauth_provider: profile.provider, oauth_provider_id: profile.providerUserId } });

  // 2 — else by email → link this provider (without clobbering a different linked id)
  if (!user) {
    user = await userRepo.findByEmail(normEmail);
    if (user) {
      const patch = {};
      if (!user.oauth_provider_id) {
        patch.oauth_provider = profile.provider;
        patch.oauth_provider_id = profile.providerUserId;
      }
      if (!user.avatar_url && profile.avatarUrl) patch.avatar_url = profile.avatarUrl;
      if (!user.email_verified_at) patch.email_verified_at = new Date();
      if (Object.keys(patch).length) await db.User.update(patch, { where: { id: user.id } });
    }
  }

  let isNewUser = false;
  let orgId = null;

  // 3 — new user → create (passwordless) + provision org + owner membership (mirrors register)
  if (!user) {
    const randomHash = await password.hash('oauth:' + crypto.randomBytes(24).toString('hex'));
    user = await userRepo.create({ email: normEmail, passwordHash: randomHash, fullName: profile.fullName });
    await db.User.update(
      { oauth_provider: profile.provider, oauth_provider_id: profile.providerUserId, avatar_url: profile.avatarUrl || null, email_verified_at: new Date() },
      { where: { id: user.id } },
    );
    const org = await orgRepo.create({ name: `${(profile.fullName || normEmail).split('@')[0]}'s Workspace`, ownerId: user.id, type: 'buyer' });
    await orgRepo.addMember({ orgId: org.id, userId: user.id, role: 'owner' });
    orgId = org.id;
    isNewUser = true;
  }

  if (user.status && user.status !== 'active') throw new AppError('ACCOUNT_DISABLED', 'Account is suspended or inactive', 403);

  // derive org for existing users; provision one if somehow absent
  if (!orgId) {
    const membership = await orgRepo.getPrimaryMembership(user.id);
    if (membership && membership.organization && membership.organization.status === 'suspended') {
      throw new AppError('ORG_SUSPENDED', 'Your organization is suspended. Contact the platform administrator.', 403);
    }
    orgId = membership ? membership.org_id : null;
    if (!orgId) {
      const org = await orgRepo.create({ name: `${(profile.fullName || normEmail).split('@')[0]}'s Workspace`, ownerId: user.id, type: 'buyer' });
      await orgRepo.addMember({ orgId: org.id, userId: user.id, role: 'owner' });
      orgId = org.id;
    }
  }

  // MFA gate — the OAuth fast-path must NOT bypass MFA (mirrors login/issueOnBehalf).
  const fresh = await userRepo.findById(user.id);
  if (fresh && (fresh.mfa_enabled || (fresh.mfa_required && !fresh.mfa_enabled))) {
    throw new AppError('MFA_REQUIRED', 'This account uses multi-factor authentication. Please sign in with your email and password.', 409);
  }

  const session = await sessionRepo.create({ userId: user.id, orgId, ipAddress, userAgent });
  const tokens = await issueTokenPair(fresh || user, orgId, session.id, uuidv4());
  await userRepo.setLastLogin(user.id).catch(() => {});
  await auditRepo
    .append({ userId: user.id, orgId, action: isNewUser ? 'user.oauth_register' : 'user.oauth_login', ipAddress, metadata: { provider: profile.provider } })
    .catch(() => {});

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    user: presentUser(fresh || user, { orgId, orgType: tokens.orgType, role: tokens.role }),
    isNewUser,
  };
}

module.exports = {
  isSupportedProvider: providers.isSupportedProvider,
  createPkce: providers.createPkce,
  encodeTx: providers.encodeTx,
  decodeTx: providers.decodeTx,
  isConfigured,
  redirectUri,
  authorizeUrl,
  exchangeAndFetchProfile,
  loginWithProfile,
};
