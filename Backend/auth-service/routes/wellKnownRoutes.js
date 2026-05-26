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
        issuer:                  base,
        jwks_uri:                `${base}/.well-known/jwks.json`,
        token_endpoint:          `${base}/v1/auth/login`,
        userinfo_endpoint:       `${base}/v1/auth/me`,
        token_endpoint_auth_methods_supported: ['client_secret_post'],
        id_token_signing_alg_values_supported: ['RS256'],
        response_types_supported: ['token'],
        subject_types_supported:  ['public'],
    });
});

module.exports = router;
