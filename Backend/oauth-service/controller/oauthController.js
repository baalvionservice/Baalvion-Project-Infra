'use strict';
const oauthService  = require('../service/oauthService');
const clientService = require('../service/clientService');
const { OAuthError, AppError } = require('../utils/errors');
const { buildJwks } = require('../utils/keys');
const { sendSuccess } = require('../utils/response');
const config        = require('../config/appConfig');

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
                code_challenge, code_challenge_method, nonce } = req.query;

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

        // If user is already authenticated (Bearer token present), auto-approve
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
            const params = new URLSearchParams({ code, ...(state && { state }) });
            return res.redirect(`${redirect_uri}?${params}`);
        }

        // Redirect to login UI — auth-service login page passes back a token
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
