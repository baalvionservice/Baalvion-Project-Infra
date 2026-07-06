'use strict';
/**
 * Shared Google OAuth2 refresh-token exchange, used by every connector that
 * calls a Google API with a stored refresh token (GA4, GTM, Google Ads,
 * Merchant Center, Google News). GSC/AdSense keep their own inline copy
 * (shipped first, already tested) — this is the shared version for connectors
 * added afterward so they don't each duplicate the token-exchange call.
 */
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

async function accessTokenFrom(creds) {
    const body = new URLSearchParams({
        client_id: creds.oauthClientId,
        client_secret: creds.oauthClientSecret,
        refresh_token: creds.refreshToken,
        grant_type: 'refresh_token',
    });
    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });
    if (!res.ok) throw new Error(`Google token exchange failed: HTTP ${res.status}`);
    const json = await res.json();
    if (!json.access_token) throw new Error('Google token exchange returned no access_token');
    return json.access_token;
}

/** Throw a uniform "<Label> connector missing credential: <key>" for the first absent key. */
function requireCreds(creds, keys, label) {
    for (const k of keys) {
        if (!creds || !creds[k]) throw new Error(`${label} connector missing credential: ${k}`);
    }
}

module.exports = { accessTokenFrom, requireCreds, TOKEN_URL };
