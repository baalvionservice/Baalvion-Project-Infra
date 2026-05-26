'use strict';

// Public SSO endpoints (the auth entry point — no session required).
const express = require('express');
const c = require('../controller/ssoController');

const router = express.Router();

// SAML SP
router.get('/saml/:orgId/metadata', c.samlMetadata);
router.get('/saml/:orgId/login', c.samlLogin);
router.post('/saml/:orgId/acs', c.samlAcs);       // IdP POSTs SAMLResponse (urlencoded)

// OIDC
router.get('/oidc/:orgId/login', c.oidcLogin);
router.get('/oidc/:orgId/callback', c.oidcCallback);

module.exports = router;
