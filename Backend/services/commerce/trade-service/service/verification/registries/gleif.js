'use strict';
/**
 * GLEIF — the Global Legal Entity Identifier Foundation's public register.
 * Free, no key. https://www.gleif.org/en/lei-data/gleif-api
 *
 * It only covers legal entities that hold an LEI, which is mostly larger and
 * financially active companies. So a hit is strong positive evidence and a miss
 * proves nothing: callers must never treat "not found" as "does not exist".
 */
const { getJson } = require('./http');

const BASE = 'https://api.gleif.org/api/v1';
const JSONAPI = { Accept: 'application/vnd.api+json' };

// GLEIF filters on an ISO-2 code. A country typed as a word ("India") would match nothing
// and wrongly read as "not in the register", so anything else is not sent as a filter.
const iso2 = (c) => (/^[A-Za-z]{2}$/.test(String(c || '').trim()) ? String(c).trim().toUpperCase() : null);

function normalize(record) {
    const a = (record && record.attributes) || {};
    const e = a.entity || {};
    const addr = e.legalAddress || {};
    return {
        lei: record.id,
        legal_name: (e.legalName || {}).name || null,
        country: addr.country || e.jurisdiction || null,
        jurisdiction: e.jurisdiction || null,
        entity_status: e.status || null,                          // ACTIVE / INACTIVE / ...
        registration_status: (a.registration || {}).status || null, // ISSUED / LAPSED / ...
        registered_as: e.registeredAs || null,                    // the company's national registry number
        legal_address: {
            lines: addr.addressLines || [],
            city: addr.city || null,
            region: addr.region || null,
            postal_code: addr.postalCode || null,
            country: addr.country || null,
        },
    };
}

/** Look up one LEI. */
async function byLei(lei, opts = {}) {
    const r = await getJson(`${BASE}/lei-records/${encodeURIComponent(lei)}`, { headers: JSONAPI, ...opts });
    if (r.status === 404) return { ok: true, found: false };
    if (!r.ok || !r.body || !r.body.data) return { ok: false, error: r.error || `HTTP ${r.status}` };
    return { ok: true, found: true, entity: normalize(r.body.data) };
}

/** Find entities by legal name. Returns up to `limit` candidates. */
async function searchByName(name, { limit = 5, country = null, ...opts } = {}) {
    if (!name || String(name).trim().length < 3) return { ok: true, entities: [] };
    const qs = new URLSearchParams({ 'filter[entity.legalName]': String(name).trim(), 'page[size]': String(limit) });
    if (iso2(country)) qs.set('filter[entity.legalAddress.country]', iso2(country));
    const r = await getJson(`${BASE}/lei-records?${qs}`, { headers: JSONAPI, ...opts });
    if (!r.ok || !r.body) return { ok: false, error: r.error || `HTTP ${r.status}` };
    return { ok: true, entities: (r.body.data || []).map(normalize) };
}

/** Find entities by their national registry number (GLEIF's registeredAs). */
async function searchByRegistration(number, { country = null, limit = 5, ...opts } = {}) {
    if (!number) return { ok: true, entities: [] };
    const qs = new URLSearchParams({ 'filter[entity.registeredAs]': String(number).trim(), 'page[size]': String(limit) });
    if (iso2(country)) qs.set('filter[entity.legalAddress.country]', iso2(country));
    const r = await getJson(`${BASE}/lei-records?${qs}`, { headers: JSONAPI, ...opts });
    if (!r.ok || !r.body) return { ok: false, error: r.error || `HTTP ${r.status}` };
    return { ok: true, entities: (r.body.data || []).map(normalize) };
}

/** Type-ahead suggestions for a half-typed company name. */
async function suggest(text, { limit = 6, ...opts } = {}) {
    if (!text || String(text).trim().length < 3) return { ok: true, suggestions: [] };
    const qs = new URLSearchParams({ field: 'fulltext', q: String(text).trim() });
    const r = await getJson(`${BASE}/autocompletions?${qs}`, { headers: JSONAPI, ...opts });
    if (!r.ok || !r.body) return { ok: false, error: r.error || `HTTP ${r.status}` };
    const suggestions = (r.body.data || []).slice(0, limit).map((d) => ({
        name: String((d.attributes || {}).value || '').replace(/<\/?b>/g, ''),
        lei: ((((d.relationships || {})['lei-records'] || {}).data) || {}).id || null,
    })).filter((s) => s.name && s.lei);
    return { ok: true, suggestions };
}

module.exports = { byLei, searchByName, searchByRegistration, suggest, normalize };
