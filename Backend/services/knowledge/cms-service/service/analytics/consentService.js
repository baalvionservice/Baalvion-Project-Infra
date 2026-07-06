'use strict';
/**
 * Consent + privacy engine (GA-style consent mode).
 *
 * Every event carries a consent_state:
 *   { analytics_storage, ad_storage, personalization_storage }  each 'granted'|'denied'|'implied'
 *
 * Per-site policy (cms_websites.config.analytics.consentMode):
 *   'implied' (default) — track analytics unless the visitor explicitly denied it
 *   'strict'            — require explicit analytics_storage='granted' (GDPR/DPDP regions)
 *
 * IP is never stored (visitor ids are salted daily hashes) and DNT is honored in
 * the tracker, so this layer only decides whether an event is admissible and
 * normalizes the consent object stored alongside it for auditability.
 */
const PURPOSES = ['analytics_storage', 'ad_storage', 'personalization_storage'];

function normalize(raw) {
    const out = {};
    const r = raw && typeof raw === 'object' ? raw : {};
    for (const p of PURPOSES) {
        const v = r[p];
        out[p] = v === 'granted' || v === 'denied' || v === 'implied' ? v : 'implied';
    }
    return out;
}

/**
 * Is an analytics event admissible under the site's consent mode?
 * strict → analytics_storage must be 'granted'; implied → admit unless 'denied'.
 */
function isAdmissible(consentState, consentMode = 'implied') {
    const a = (consentState && consentState.analytics_storage) || 'implied';
    if (consentMode === 'strict') return a === 'granted';
    return a !== 'denied';
}

/** Whether ad/personalization signals may be retained (for ad-analytics joins). */
function adAllowed(consentState) {
    return (consentState && consentState.ad_storage) === 'granted';
}

module.exports = { normalize, isAdmissible, adAllowed, PURPOSES };
