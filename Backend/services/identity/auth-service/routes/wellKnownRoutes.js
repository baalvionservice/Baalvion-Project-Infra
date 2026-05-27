'use strict';
const express = require('express');
const { getJwks } = require('../utils/jwtRsa');

const router = express.Router();

// /.well-known/jwks.json — consumed by other Baalvion services for RS256 verification
router.get('/jwks.json', (req, res) => {
    res.set('Cache-Control', 'public, max-age=3600');
    res.json(getJwks());
});

// /.well-known/openid-configuration — minimal OIDC discovery doc
router.get('/openid-configuration', (req, res) => {
    const base = process.env.API_BASE_URL || 'http://localhost:3001';
    res.set('Cache-Control', 'public, max-age=3600');
    res.json({
        // NOTE: token `iss` is the canonical string issuer (JWT_ISSUER, default
        // 'baalvion-auth'); `jwks_uri` is this service's URL. The system is not yet
        // a fully-compliant OIDC provider — this doc is future-proofed for it.
        issuer:                   process.env.JWT_ISSUER || 'baalvion-auth',
        authority_url:            base,
        jwks_uri:                 `${base}/.well-known/jwks.json`,
        authorization_endpoint:   `${base}/v1/auth/login`,
        token_endpoint:           `${base}/v1/auth/login`,
        userinfo_endpoint:        `${base}/v1/auth/me`,
        end_session_endpoint:     `${base}/v1/auth/logout`,
        token_endpoint_auth_methods_supported:           ['client_secret_post'],
        id_token_signing_alg_values_supported:           ['RS256'],
        token_endpoint_auth_signing_alg_values_supported:['RS256'],
        response_types_supported: ['token', 'code'],
        grant_types_supported:    ['password', 'refresh_token', 'authorization_code'],
        subject_types_supported:  ['public'],
        scopes_supported:         ['openid', 'profile', 'email', 'org'],
        claims_supported:         ['sub', 'org_id', 'sid', 'roles', 'permissions', 'jti', 'iss', 'aud', 'exp', 'iat', 'email'],
    });
});

module.exports = router;
