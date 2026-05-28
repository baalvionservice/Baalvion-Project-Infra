'use strict';
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getPrivateKey, getPublicKey, getKeyId } = require('../utils/keys');
const config = require('../config/appConfig');

const BACKCHANNEL_EVENT = 'http://schemas.openid.net/event/backchannel-logout';

/**
 * Build an OIDC Back-Channel Logout 1.0 `logout_token`.
 * Note: `aud` MUST be the recipient client_id, so the shared signToken() (which pins a fixed
 * audience) can't be used — we sign directly with the OP key. Includes sub and/or sid; never a nonce.
 */
function buildLogoutToken({ clientId, sub, sid }) {
    if (!sub && !sid) throw new Error('logout_token requires sub or sid');
    const payload = {
        iss:    config.oauth.baseUrl,
        aud:    clientId,
        iat:    Math.floor(Date.now() / 1000),
        jti:    uuidv4(),
        events: { [BACKCHANNEL_EVENT]: {} },
    };
    if (sub != null) payload.sub = String(sub);
    if (sid)         payload.sid = sid;
    return jwt.sign(payload, getPrivateKey(), { algorithm: 'RS256', keyid: getKeyId(), expiresIn: '2m' });
}

/** Verify a logout_token (RP-side helper; also used by tests). Throws on any spec violation. */
function verifyLogoutToken(token, { clientId } = {}) {
    const decoded = jwt.verify(token, getPublicKey(), {
        algorithms: ['RS256'],
        issuer:     config.oauth.baseUrl,
        ...(clientId && { audience: clientId }),
    });
    if (!decoded.events || !decoded.events[BACKCHANNEL_EVENT]) throw new Error('missing backchannel-logout event');
    if (decoded.nonce) throw new Error('logout_token must not contain a nonce');
    if (!decoded.sub && !decoded.sid) throw new Error('logout_token requires sub or sid');
    return decoded;
}

module.exports = { buildLogoutToken, verifyLogoutToken, BACKCHANNEL_EVENT };
