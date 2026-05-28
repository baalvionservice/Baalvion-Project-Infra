'use strict';
const oauthService  = require('../service/oauthService');
const clientService = require('../service/clientService');
const { OAuthError, AppError } = require('../utils/errors');
const { buildJwks } = require('../utils/keys');
const { sendSuccess } = require('../utils/response');
const config        = require('../config/appConfig');
const { resolveSessionFromCookie } = require('../middleware/sessionCookie');
const { verifyToken } = require('../utils/keys');
const redis           = require('../config/redis');
const ssoRegistry     = require('../lib/ssoRegistry');
const backchannelLogout = require('../lib/backchannelLogout');

// ── Discovery & JWKS ──────────────────────────────────────────────────────────

exports.discovery = (_req, res) => {
    res.json(oauthService.buildDiscoveryDocument());
};

exports.jwks = (_req, res) => {
    res.json(buildJwks());
};

// ── Authorization endpoint ────────────────────────────────────────────────────

exports.authorize = async (req, res, next) => {
    try {
        const { response_type, client_id, redirect_uri, scope = 'openid', state,
                code_challenge, code_challenge_method, nonce, prompt } = req.query;

        if (response_type !== 'code') {
            return res.redirect(`${redirect_uri}?error=unsupported_response_type&state=${state || ''}`);
        }
        if (!client_id || !redirect_uri) {
            return next(new AppError('VALIDATION_ERROR', 'client_id and redirect_uri are required', 400));
        }

        const client = await clientService.getClientByClientId(client_id);
        if (!client || client.revoked_at) {
            return next(new AppError('NOT_FOUND', 'Unknown client', 400));
        }

        const allowedUris = typeof client.redirect_uris === 'string'
            ? JSON.parse(client.redirect_uris) : client.redirect_uris;
        if (!allowedUris.includes(redirect_uri)) {
            return next(new AppError('INVALID_REQUEST', 'Redirect URI not allowed for this client', 400));
        }

        const scopes = scope.split(' ').filter(s => config.oauth.supportedScopes.includes(s));

        // Resolve identity: Bearer (already on req.auth via the route middleware) OR — for browser
        // SSO redirects, which carry no Authorization header — the hub's first-party HttpOnly
        // access_token cookie. This is the keystone for silent cross-domain SSO: a satellite app
        // redirects here, the browser sends the hub session cookie, and we auto-approve.
        if (!req.auth) {
            req.auth = await resolveSessionFromCookie(req);
        }

        if (req.auth) {
            const code = await oauthService.createAuthorizationCode({
                clientId:      client_id,
                userId:        req.auth.userId,
                orgId:         req.auth.orgId,
                redirectUri:   redirect_uri,
                scopes,
                pkceChallenge: code_challenge     || null,
                pkceMethod:    code_challenge_method || 'S256',
                nonce,
            });
            // Register this RP against the hub session so a later logout cascades a back-channel
            // logout to it. Best-effort (no-op without Redis); never blocks issuing the code.
            await ssoRegistry.recordClientForSession(req.auth.sessionId, client_id, config.oauth.refreshTokenTtl);
            const params = new URLSearchParams({ code, ...(state && { state }) });
            return res.redirect(`${redirect_uri}?${params}`);
        }

        // Not authenticated. OIDC silent auth (prompt=none) MUST NOT render a login UI — return the
        // login_required error to the (already redirect_uri-validated) RP so it can fall back.
        if (prompt === 'none') {
            const params = new URLSearchParams({ error: 'login_required', ...(state && { state }) });
            return res.redirect(`${redirect_uri}?${params}`);
        }

        // Interactive auth: redirect to the central login UI, which returns here after login.
        const loginUrl = new URL(`${process.env.AUTH_UI_URL || 'http://localhost:3000'}/login`);
        loginUrl.searchParams.set('redirect', req.originalUrl);
        return res.redirect(loginUrl.toString());

    } catch (err) { next(err); }
};

// ── Authorize with pre-authenticated user (called after login redirect) ───────

exports.authorizePost = async (req, res, next) => {
    try {
        const { client_id, redirect_uri, scope = 'openid', state,
                code_challenge, code_challenge_method, nonce } = req.body;

        if (!req.auth) return next(new AppError('UNAUTHORIZED', 'Not authenticated', 401));

        const client = await clientService.getClientByClientId(client_id);
        if (!client || client.revoked_at) throw new AppError('NOT_FOUND', 'Unknown client', 400);

        const allowedUris = typeof client.redirect_uris === 'string'
            ? JSON.parse(client.redirect_uris) : client.redirect_uris;
        if (!allowedUris.includes(redirect_uri)) throw new AppError('INVALID_REQUEST', 'Redirect URI not allowed', 400);

        const scopes = (typeof scope === 'string' ? scope.split(' ') : scope)
            .filter(s => config.oauth.supportedScopes.includes(s));

        const code = await oauthService.createAuthorizationCode({
            clientId: client_id, userId: req.auth.userId, orgId: req.auth.orgId,
            redirectUri: redirect_uri, scopes,
            pkceChallenge: code_challenge || null, pkceMethod: code_challenge_method || 'S256',
            nonce,
        });

        sendSuccess(req, res, { code, redirect_uri, state });
    } catch (err) { next(err); }
};

// ── Token endpoint ────────────────────────────────────────────────────────────

exports.token = async (req, res, next) => {
    try {
        const { grant_type, code, redirect_uri, code_verifier, refresh_token, scope } = req.body;
        const { clientId, clientSecret } = req.clientCredentials || {};

        if (!clientId) throw new OAuthError('invalid_client', 'Client authentication required', 401);

        const client = await clientService.getClientByClientId(clientId);
        if (!client || client.revoked_at) throw new OAuthError('invalid_client', 'Unknown client', 401);

        const grantTypes = typeof client.grant_types === 'string'
            ? JSON.parse(client.grant_types) : client.grant_types;
        if (!grantTypes.includes(grant_type)) {
            throw new OAuthError('unsupported_grant_type', `Grant type '${grant_type}' not allowed for this client`);
        }

        if (client.is_confidential) {
            const valid = await clientService.verifyClientSecret(client, clientSecret);
            if (!valid) throw new OAuthError('invalid_client', 'Invalid client credentials', 401);
        }

        let result;
        if (grant_type === 'authorization_code') {
            result = await oauthService.exchangeCodeForTokens({ code, clientId, redirectUri: redirect_uri, codeVerifier: code_verifier });
        } else if (grant_type === 'client_credentials') {
            const clientScopes = typeof client.scopes === 'string' ? JSON.parse(client.scopes) : client.scopes;
            const requestedScopes = scope ? scope.split(' ').filter(s => clientScopes.includes(s)) : clientScopes;
            result = await oauthService.clientCredentialsGrant({ clientId, scopes: requestedScopes });
        } else if (grant_type === 'refresh_token') {
            result = await oauthService.refreshTokenGrant({ refreshToken: refresh_token, clientId });
        } else {
            throw new OAuthError('unsupported_grant_type', 'Unsupported grant type');
        }

        res.set('Cache-Control', 'no-store').json(result);
    } catch (err) { next(err); }
};

// ── Introspection ─────────────────────────────────────────────────────────────

exports.introspect = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) return res.json({ active: false });
        const result = await oauthService.introspectToken(token);
        res.json(result);
    } catch (err) { next(err); }
};

// ── Revocation ────────────────────────────────────────────────────────────────

exports.revoke = async (req, res, next) => {
    try {
        const { token, token_type_hint } = req.body;
        if (!token) return res.sendStatus(200);
        await oauthService.revokeToken(token, token_type_hint);
        res.sendStatus(200);
    } catch (err) { next(err); }
};

// ── UserInfo (OIDC) ───────────────────────────────────────────────────────────

exports.userinfo = async (req, res, next) => {
    try {
        if (!req.auth) return next(new AppError('UNAUTHORIZED', 'Bearer token required', 401));
        const scopes = (req.auth.scope || '').split(' ');
        const claims = await oauthService.getUserInfo(req.auth.userId, scopes);
        res.json(claims);
    } catch (err) { next(err); }
};

// ── RP-Initiated Logout + Back-Channel Logout (OIDC) ──────────────────────────
// GET/POST /oauth/logout — ends the OP (hub) session and cascades a back-channel logout to every
// RP that had a session under the same hub sid. This is the "log out everywhere" cascade.

exports.endSession = async (req, res, next) => {
    try {
        const p = { ...req.query, ...req.body };
        const { id_token_hint, post_logout_redirect_uri, state, client_id } = p;

        // Identify the session being ended: prefer the hub cookie; fall back to id_token_hint.
        let sid = null, sub = null;
        const cookieSession = await resolveSessionFromCookie(req);
        if (cookieSession) { sid = cookieSession.sessionId; sub = cookieSession.userId; }
        if ((!sid || !sub) && id_token_hint) {
            try { const d = verifyToken(id_token_hint); sub = sub || d.sub; sid = sid || d.sid; }
            catch { /* invalid hint ignored — we still clear cookies + cascade what we can */ }
        }

        // End the OP session: blacklist the hub access-token jti + clear the cookie.
        if (cookieSession?.jti) {
            try {
                const r = redis.getClient();
                if (r && redis.isAvailable()) {
                    const ttl = (cookieSession.exp || 0) - Math.floor(Date.now() / 1000);
                    await r.set(`auth:bl:${cookieSession.jti}`, '1', 'EX', ttl > 0 ? ttl : 900);
                }
            } catch { /* best-effort */ }
        }
        res.clearCookie(config.session.cookieName, { path: '/', domain: process.env.COOKIE_DOMAIN || undefined });

        // Cascade a back-channel logout to every RP registered under this sid.
        if (sid) {
            const clientIds = await ssoRegistry.getClientsForSession(sid);
            const targets = [];
            for (const cid of clientIds) {
                const cfg = await clientService.getClientLogoutConfig(cid);
                if (cfg.backchannelLogoutUri) targets.push({ clientId: cid, uri: cfg.backchannelLogoutUri });
            }
            await backchannelLogout.notifyClients({ sid, sub, targets });
            await ssoRegistry.clearSession(sid);
        }

        // Redirect to a client-registered post_logout_redirect_uri if supplied + allowlisted.
        if (post_logout_redirect_uri && client_id) {
            const cfg = await clientService.getClientLogoutConfig(client_id);
            if (cfg.postLogoutRedirectUris.includes(post_logout_redirect_uri)) {
                const u = new URL(post_logout_redirect_uri);
                if (state) u.searchParams.set('state', state);
                return res.redirect(u.toString());
            }
        }
        return res.json({ ok: true, logged_out: true });
    } catch (err) { next(err); }
};
