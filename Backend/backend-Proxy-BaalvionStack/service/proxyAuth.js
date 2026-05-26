'use strict';

/**
 * Proxy-gateway authentication.
 *
 * Customers authenticate to the proxy network with Basic credentials where the
 * USERNAME encodes routing directives and the PASSWORD is a bvl_proxy_ key:
 *
 *   username:  customer-123-zone-us-session-abc123-rotation-sticky
 *   password:  bvl_proxy_xxxxxxxxxxxxxxxxxxxxxxxx
 *
 * This module is transport-agnostic: it is consumed by the HTTP proxy-auth
 * middleware today and by the SOCKS5 / HTTPS-CONNECT gateway once the data
 * plane exists. It performs ONLY authentication + directive parsing; it does
 * not forward traffic.
 */

const apiKeyService = require('./apiKeyService');
const { hasPermission } = require('./rbac');

const KNOWN_KEYS = new Set(['customer', 'zone', 'country', 'city', 'state', 'session', 'sess', 'rotate', 'rotation']);

/**
 * Parse a structured proxy username into routing directives.
 * Tokens are '-' separated key/value pairs; unknown leading tokens are ignored.
 */
function parseProxyUsername(username = '') {
  const tokens = String(username).split('-');
  const out = { customer: null, zone: null, country: null, city: null, state: null, session: null, rotation: null };

  for (let i = 0; i < tokens.length; i += 1) {
    const key = tokens[i].toLowerCase();
    if (KNOWN_KEYS.has(key) && i + 1 < tokens.length) {
      const value = tokens[i + 1];
      if (key === 'sess') out.session = value;
      else if (key === 'rotate') out.rotation = value;
      else out[key] = value;
      i += 1;
    }
  }

  // Rotation policy: explicit value wins; otherwise a session id implies sticky.
  if (!out.rotation) out.rotation = out.session ? 'sticky' : 'rotating';
  if (out.country) out.country = out.country.toLowerCase();
  return out;
}

/**
 * Authenticate a proxy connection.
 * @returns {{ok:true, organizationId, apiKeyId, scopes, directives}|{ok:false, reason}}
 */
async function authenticateProxy({ username, password, ip }) {
  const directives = parseProxyUsername(username);

  const ctx = await apiKeyService.verifyKey(password, { ip });
  if (!ctx) return { ok: false, reason: 'invalid_credentials', directives };
  if (ctx.keyType !== 'proxy') return { ok: false, reason: 'not_a_proxy_key', directives };
  if (!hasPermission(ctx.permissions, 'proxy:connect')) {
    return { ok: false, reason: 'missing_scope', directives };
  }

  // Sticky sessions require the proxy:sticky scope.
  if (directives.rotation === 'sticky' && !hasPermission(ctx.permissions, 'proxy:sticky')) {
    directives.rotation = 'rotating';
  }

  return {
    ok: true,
    organizationId: ctx.organizationId,
    apiKeyId: ctx.apiKeyId,
    scopes: ctx.scopes,
    permissions: ctx.permissions,
    directives,
  };
}

module.exports = { parseProxyUsername, authenticateProxy };
