'use strict';
// Phase 7 — edge geo policy (CDN/Cloudflare Workers compatible).
// Evaluates country-based allow/deny rules before proxying to origin.
// Returns { allowed, blocked, reason, country, mode } — does NOT throw; caller decides action.
// For Cloudflare Workers deployment: convert module.exports → export { evaluate, detectCountry }.

const UNKNOWN = 'unknown';
const ISO2 = /^[A-Z]{2}$/;

/**
 * Detect country from request headers (CDN-injected).
 * Works identically to lib/geoDetect.js but self-contained for edge deployment.
 */
function detectCountry(headers) {
  const h = headers || {};
  const cf = (h['cf-ipcountry'] || '').trim().toUpperCase();
  if (cf && cf !== 'XX' && cf !== 'T1' && ISO2.test(cf)) return cf;
  const xcc = (h['x-country-code'] || '').trim().toUpperCase();
  if (xcc && ISO2.test(xcc)) return xcc;
  const fastly = (h['x-fastly-country-code'] || '').trim().toUpperCase();
  if (fastly && ISO2.test(fastly)) return fastly;
  const edge = h['x-akamai-edgescape'] || '';
  const ak = edge.match(/country_code=([A-Z]{2})/);
  if (ak) return ak[1];
  return UNKNOWN;
}

/**
 * Evaluate a request against a geo policy.
 * @param {object} request   { headers: Record<string,string> }
 * @param {object} policy    { mode: 'log'|'warn'|'enforce', allowedCountries?: string[], blockedCountries?: string[] }
 * @returns {{ allowed: boolean, blocked: boolean, reason: string, country: string, mode: string }}
 */
function evaluate(request, policy = {}) {
  const { mode = 'log', allowedCountries = [], blockedCountries = [] } = policy;
  const country = detectCountry(request.headers);

  if (blockedCountries.length > 0 && country !== UNKNOWN && blockedCountries.includes(country)) {
    return { allowed: mode !== 'enforce', blocked: mode === 'enforce', reason: 'country_blocked', country, mode };
  }

  if (allowedCountries.length > 0 && country !== UNKNOWN && !allowedCountries.includes(country)) {
    return { allowed: mode !== 'enforce', blocked: mode === 'enforce', reason: 'country_not_allowed', country, mode };
  }

  return { allowed: true, blocked: false, reason: 'pass', country, mode };
}

module.exports = { evaluate, detectCountry, UNKNOWN };
