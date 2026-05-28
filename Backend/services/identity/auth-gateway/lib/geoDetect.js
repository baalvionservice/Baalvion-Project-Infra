'use strict';
// Phase 7 — geo detection from CDN/reverse-proxy headers. Zero external dependencies.
// Priority: Cloudflare CF-IPCountry → X-Country-Code → Fastly → Akamai Edgescape.
// Always returns { country: ISO-3166-1-alpha-2 | 'unknown', source: string }.

const UNKNOWN = 'unknown';
const ISO2 = /^[A-Z]{2}$/;

/**
 * Detect the request's country from CDN-injected headers.
 * Returns { country: 'US' | 'unknown', source: 'cf-ipcountry' | 'x-country-code' | ... | 'none' }.
 */
function detectGeo(req) {
  const h = req.headers || {};

  // Cloudflare: CF-IPCountry (T1=Tor, XX=test/unknown — skip both)
  const cf = (h['cf-ipcountry'] || '').trim().toUpperCase();
  if (cf && cf !== 'XX' && cf !== 'T1' && ISO2.test(cf)) return { country: cf, source: 'cf-ipcountry' };

  // Generic CDN / nginx: X-Country-Code
  const xcc = (h['x-country-code'] || '').trim().toUpperCase();
  if (xcc && ISO2.test(xcc)) return { country: xcc, source: 'x-country-code' };

  // Fastly: X-Fastly-Country-Code
  const fastly = (h['x-fastly-country-code'] || '').trim().toUpperCase();
  if (fastly && ISO2.test(fastly)) return { country: fastly, source: 'x-fastly-country-code' };

  // Akamai: X-Akamai-Edgescape: country_code=IN,city=MUMBAI,...
  const edge = h['x-akamai-edgescape'] || '';
  const ak = edge.match(/country_code=([A-Z]{2})/);
  if (ak) return { country: ak[1], source: 'x-akamai-edgescape' };

  return { country: UNKNOWN, source: 'none' };
}

/**
 * Geo continuity check: session-recorded country vs current request country.
 * @returns {{ match: true }} | {{ match: false, sessionGeo, requestGeo }} | {{ match: null, reason: 'indeterminate' }}
 */
function geoMatch(sessionGeo, requestGeo) {
  if (!sessionGeo || sessionGeo === UNKNOWN || !requestGeo || requestGeo === UNKNOWN) {
    return { match: null, reason: 'indeterminate' };
  }
  if (sessionGeo === requestGeo) return { match: true };
  return { match: false, sessionGeo, requestGeo };
}

module.exports = { detectGeo, geoMatch, UNKNOWN };
