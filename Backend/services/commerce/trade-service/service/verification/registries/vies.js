'use strict';
/**
 * EU VIES — the European Commission's VAT number validation service.
 * Free, no key. https://ec.europa.eu/taxation_customs/vies/
 *
 * `valid: true` means the number is registered for VAT in that member state today.
 * Some states (Germany, Spain) withhold the registered name and address, so a
 * missing name is normal and is not a mismatch.
 */
const { getJson } = require('./http');

const BASE = 'https://ec.europa.eu/taxation_customs/vies/rest-api/ms';

// Member states VIES answers for. Greece is EL in VAT numbers (ISO is GR); Northern
// Ireland trades under XI.
const VIES_COUNTRIES = new Set(['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'XI']);

/** Split "DE811128135" / "DE 811 128 135" into { country, number }; null if it has no EU prefix. */
function splitVat(raw) {
    const s = String(raw || '').toUpperCase().replace(/[\s.-]+/g, '');
    const m = /^([A-Z]{2})([A-Z0-9]{2,14})$/.exec(s);
    if (!m) return null;
    const country = m[1] === 'GR' ? 'EL' : m[1];
    return VIES_COUNTRIES.has(country) ? { country, number: m[2] } : null;
}

/**
 * @returns {{ ok: boolean, valid?: boolean, name?: string|null, address?: string|null, error?: string }}
 *   ok:false means VIES could not answer (an outage is not a verdict on the number).
 */
async function validate(rawVat, opts = {}) {
    const parts = splitVat(rawVat);
    if (!parts) return { ok: true, applicable: false };
    const r = await getJson(`${BASE}/${parts.country}/vat/${parts.number}`, opts);
    if (!r.ok || !r.body || typeof r.body.isValid !== 'boolean') {
        return { ok: false, applicable: true, error: r.error || (r.body && r.body.userError) || `HTTP ${r.status}` };
    }
    // userError other than VALID/INVALID (e.g. MS_UNAVAILABLE, TIMEOUT) means no answer.
    const err = String(r.body.userError || '');
    if (err && !['VALID', 'INVALID'].includes(err)) return { ok: false, applicable: true, error: err };
    const clean = (v) => (v && v !== '---' ? String(v).trim() : null);
    return {
        ok: true,
        applicable: true,
        valid: r.body.isValid,
        country: parts.country,
        vat_number: `${parts.country}${parts.number}`,
        name: clean(r.body.name),
        address: clean(r.body.address),
        checked_at: r.body.requestDate || new Date().toISOString(),
    };
}

module.exports = { validate, splitVat, VIES_COUNTRIES };
