'use strict';
/**
 * Corridor requirement matrix — PURE (Compression, Phase 2).
 *
 * Replaces the hardcoded global four-document list (service/readiness/scoring.js
 * REQUIRED_DOC_TYPES) with a resolved requirement set. What a consignment
 * actually needs is a function of (origin, destination, HS chapter, incoterm,
 * mode, value, party status) — a textile shipment into the EU and a foodstuff
 * into the UAE do not need the same paperwork, and pretending they do is how a
 * filing gets rejected for a document nobody knew was required.
 *
 * Rules are DATA. The built-in set below is the default corridor knowledge; the
 * DB table (migration 080) layers tenant- or corridor-specific rules on top
 * without a code change, mirroring the compliance engine's provider seam.
 *
 * `severity` matters: a `blocking` requirement stops a filing from being
 * submitted at all (the whole point of Phase 2 — never submit something that
 * will bounce), while a `warning` is surfaced but does not gate.
 *
 * PURE: no DB, no clock, no I/O.
 */

const MATRIX_VERSION = '1.0.0';

const SEVERITY = Object.freeze({ BLOCKING: 'blocking', WARNING: 'warning' });

// EU member states — a single destination test covering the union's shared
// customs territory, since CDS/EORI requirements are union-wide rather than
// per-country.
const EU = Object.freeze([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
    'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

// HS chapter groupings that drive document requirements. Chapters are the first
// two digits of the HS code.
const CHAPTERS = Object.freeze({
    LIVE_ANIMALS_FOOD: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14',
        '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'],
    CHEMICALS: ['28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38'],
    TEXTILES: ['50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63'],
    WOOD: ['44', '45', '46'],
    MACHINERY_ELECTRICAL: ['84', '85'],
    VEHICLES: ['86', '87', '88', '89'],
});

const chapterOf = (hsCode) => (hsCode ? String(hsCode).replace(/\D/g, '').slice(0, 2) : null);

/**
 * The built-in corridor ruleset.
 *
 * Every rule states WHY it exists. That matters operationally: when a filing is
 * blocked, the person unblocking it needs the reason, not a rule id — and an
 * unexplained requirement is the thing people work around, which puts the
 * rejection right back into the loop.
 */
const RULES = Object.freeze([
    // ── Universal ────────────────────────────────────────────────────────────
    {
        id: 'core.commercial_documents',
        scope: 'both',
        when: {},
        requires: {
            documents: ['commercial_invoice', 'packing_list'],
            fields: ['parties.exporter.name', 'parties.importer.name', 'commercial.invoice_no', 'totals.customs_value'],
        },
        severity: SEVERITY.BLOCKING,
        reason: 'No customs authority accepts a declaration without an invoice and a packing list.',
    },
    {
        id: 'core.hs_classification',
        scope: 'both',
        when: {},
        requires: { line_fields: ['hs_code', 'description', 'origin_country'] },
        severity: SEVERITY.BLOCKING,
        reason: 'Duty, licensing and the required-document set all key off the HS code — an unclassified line cannot be assessed.',
    },
    {
        id: 'core.transport_route',
        scope: 'both',
        when: { modes: ['sea'] },
        requires: { fields: ['transport.port_of_loading', 'transport.port_of_discharge'] },
        severity: SEVERITY.BLOCKING,
        reason: 'A sea declaration is filed against a specific loading and discharge port.',
    },

    // ── European Union ───────────────────────────────────────────────────────
    {
        id: 'eu.eori',
        scope: 'import',
        when: { destination: EU },
        requires: { fields: ['parties.importer.tax_id'], identifiers: [{ party: 'importer', type: 'EORI' }] },
        severity: SEVERITY.BLOCKING,
        reason: 'EU import declarations are filed against the importer’s EORI number; without it CDS rejects at submission.',
    },
    {
        id: 'eu.origin_evidence',
        scope: 'import',
        when: { destination: EU },
        requires: { documents: ['certificate_of_origin'] },
        severity: SEVERITY.BLOCKING,
        reason: 'Origin evidence is required to determine the duty rate and any preferential treatment.',
    },

    // ── United States ────────────────────────────────────────────────────────
    {
        id: 'us.importer_number',
        scope: 'import',
        when: { destination: ['US'] },
        requires: { fields: ['parties.importer.tax_id'], identifiers: [{ party: 'importer', type: 'EIN' }] },
        severity: SEVERITY.BLOCKING,
        reason: 'CBP entry requires an importer of record number (EIN/SSN/CBP-assigned).',
    },
    {
        id: 'us.isf_manufacturer',
        scope: 'import',
        when: { destination: ['US'], modes: ['sea'] },
        requires: { fields: ['parties.manufacturer.name'] },
        severity: SEVERITY.BLOCKING,
        reason: 'ISF (10+2) must name the manufacturer/supplier and is due 24h before lading — missing it is a liquidated-damages claim, not a delay.',
    },

    // ── India ────────────────────────────────────────────────────────────────
    {
        id: 'in.iec',
        scope: 'both',
        when: { destination: ['IN'] },
        requires: { fields: ['parties.importer.tax_id'], identifiers: [{ party: 'importer', type: 'GSTIN' }] },
        severity: SEVERITY.BLOCKING,
        reason: 'ICEGATE filings are keyed to the importer’s IEC/GSTIN registration.',
    },
    {
        id: 'in.export_iec',
        scope: 'export',
        when: { origin: ['IN'] },
        requires: { fields: ['parties.exporter.tax_id'], identifiers: [{ party: 'exporter', type: 'GSTIN' }] },
        severity: SEVERITY.BLOCKING,
        reason: 'An Indian shipping bill requires the exporter’s IEC/GSTIN.',
    },

    // ── Commodity-driven ─────────────────────────────────────────────────────
    {
        id: 'goods.food_health_certificate',
        scope: 'both',
        when: { hs_chapters: CHAPTERS.LIVE_ANIMALS_FOOD },
        requires: { documents: ['certificate_of_origin'], external_certificates: ['phytosanitary_or_health_certificate'] },
        severity: SEVERITY.BLOCKING,
        reason: 'Foodstuffs and live products need sanitary/phytosanitary clearance. This is issued by an authority after a physical or laboratory check — plan days, not hours.',
        adds_floor_hours: 48,
    },
    {
        id: 'goods.chemicals_dangerous',
        scope: 'both',
        when: { hs_chapters: CHAPTERS.CHEMICALS },
        requires: { external_certificates: ['safety_data_sheet'] },
        severity: SEVERITY.BLOCKING,
        reason: 'Chemical consignments require an MSDS/SDS, and a dangerous-goods declaration where classified.',
    },
    {
        id: 'goods.textiles_origin',
        scope: 'both',
        when: { hs_chapters: CHAPTERS.TEXTILES },
        requires: { documents: ['certificate_of_origin'] },
        severity: SEVERITY.BLOCKING,
        reason: 'Textile origin drives quota and preferential duty treatment and is routinely verified.',
    },
    {
        id: 'goods.wood_ispm15',
        scope: 'both',
        when: { hs_chapters: CHAPTERS.WOOD },
        requires: { external_certificates: ['ispm15_fumigation'] },
        severity: SEVERITY.BLOCKING,
        reason: 'Wood and wood packaging need ISPM-15 treatment evidence; untreated wood is refused entry, not merely delayed.',
        adds_floor_hours: 24,
    },

    // ── Value and mode ───────────────────────────────────────────────────────
    {
        id: 'value.insurance_evidence',
        scope: 'both',
        when: { min_customs_value: 50000 },
        requires: { external_certificates: ['insurance_certificate'] },
        severity: SEVERITY.WARNING,
        reason: 'High-value cargo moving uninsured is a commercial risk the platform should flag even where customs does not require it.',
    },
    {
        id: 'mode.air_awb_consignee',
        scope: 'both',
        when: { modes: ['air'] },
        requires: { fields: ['parties.importer.contact.phone'] },
        severity: SEVERITY.WARNING,
        reason: 'Air consignments clear in hours; without a reachable consignee contact the cargo sits at the airport and accrues demurrage.',
    },

    // ── Party status ─────────────────────────────────────────────────────────
    {
        id: 'party.unverified_counterparty',
        scope: 'both',
        when: { party_status: ['unverified'] },
        requires: { external_certificates: ['counterparty_kyc'] },
        severity: SEVERITY.BLOCKING,
        reason: 'An unverified counterparty cannot use a fast lane: bank screening and customs risk-scoring both key off the trader record.',
        adds_floor_hours: 72,
    },
]);

// ── Identifier format validators ─────────────────────────────────────────────
// Cheap, exact, and worth far more than they look: a malformed tax number is a
// same-day rejection that costs a full queue cycle, and it is detectable the
// moment it is typed rather than after a gateway round trip.
const IDENTIFIER_VALIDATORS = Object.freeze({
    EORI: {
        label: 'EU EORI number',
        test: (v) => /^[A-Z]{2}[A-Z0-9]{1,15}$/.test(String(v || '').toUpperCase()),
        hint: 'Two-letter country code followed by up to 15 alphanumeric characters, e.g. DE123456789012345.',
    },
    EIN: {
        label: 'US importer number (EIN)',
        test: (v) => /^\d{2}-?\d{7}$/.test(String(v || '').replace(/\s/g, '')),
        hint: 'Nine digits, optionally hyphenated as 12-3456789.',
    },
    GSTIN: {
        label: 'Indian GSTIN',
        // 2-digit state, 10-char PAN, entity digit, 'Z', checksum character.
        test: (v) => /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/.test(String(v || '').toUpperCase()),
        hint: '15 characters: 2-digit state code, 10-character PAN, entity code, Z, checksum.',
    },
});

/**
 * ISO 6346 container number check digit.
 *
 * Included because a mistyped container number is one of the most common causes
 * of a bounced filing and a mis-manifested box, and the standard makes it fully
 * detectable — there is no reason to let one reach a carrier or a gateway.
 */
const ISO6346_LETTER_VALUES = (() => {
    // A=10, then ascending, skipping every multiple of 11.
    const map = {};
    let value = 10;
    for (let i = 0; i < 26; i += 1) {
        if (value % 11 === 0) value += 1;
        map[String.fromCharCode(65 + i)] = value;
        value += 1;
    }
    return Object.freeze(map);
})();

function isValidContainerNumber(raw) {
    const v = String(raw || '').toUpperCase().replace(/[\s-]/g, '');
    if (!/^[A-Z]{4}\d{7}$/.test(v)) return false;
    let sum = 0;
    for (let i = 0; i < 10; i += 1) {
        const ch = v[i];
        const val = i < 4 ? ISO6346_LETTER_VALUES[ch] : Number(ch);
        sum += val * (2 ** i);
    }
    return (sum % 11) % 10 === Number(v[10]);
}

// ── Rule resolution ──────────────────────────────────────────────────────────

const asArray = (v) => (Array.isArray(v) ? v : (v == null ? [] : [v]));
const upper = (v) => String(v || '').toUpperCase();

/** Does a rule's `when` clause match this consignment's context? */
function matches(rule, ctx) {
    const w = rule.when || {};

    if (rule.scope && rule.scope !== 'both' && rule.scope !== ctx.direction) return false;
    if (w.destination && !asArray(w.destination).includes(upper(ctx.destination_country))) return false;
    if (w.origin && !asArray(w.origin).includes(upper(ctx.origin_country))) return false;
    if (w.modes && !asArray(w.modes).includes(ctx.mode)) return false;
    if (w.incoterms && !asArray(w.incoterms).includes(upper(ctx.incoterm))) return false;
    if (w.party_status && !asArray(w.party_status).includes(ctx.party_status)) return false;
    if (w.min_customs_value != null && Number(ctx.customs_value || 0) < Number(w.min_customs_value)) return false;
    if (w.hs_chapters && !asArray(w.hs_chapters).some((c) => (ctx.hs_chapters || []).includes(c))) return false;
    if (w.hs_prefix && !asArray(w.hs_prefix).some((p) => (ctx.hs_codes || []).some((h) => String(h).startsWith(p)))) return false;

    return true;
}

/** Build the resolution context from a normalized consignment. */
function contextOf(consignment, { partyStatus = 'verified' } = {}) {
    const lines = consignment.lines || [];
    return {
        direction: consignment.direction,
        origin_country: consignment.origin_country,
        destination_country: consignment.destination_country,
        incoterm: consignment.incoterm,
        mode: consignment.transport ? consignment.transport.mode : null,
        customs_value: consignment.totals ? Number(consignment.totals.customs_value) : 0,
        hs_codes: lines.map((l) => l.hs_code).filter(Boolean),
        hs_chapters: [...new Set(lines.map((l) => chapterOf(l.hs_code)).filter(Boolean))],
        party_status: partyStatus,
    };
}

/**
 * Resolve the requirement set for a consignment.
 *
 * @param {object} consignment  normalized consignment (service/consignment/schema.js)
 * @param {object} opts         { partyStatus, extraRules } — extraRules come from
 *                              the DB table so a corridor can be taught a new
 *                              requirement without a deploy.
 */
function resolve(consignment, { partyStatus = 'verified', extraRules = [] } = {}) {
    const ctx = contextOf(consignment, { partyStatus });
    const all = [...RULES, ...extraRules];
    const applied = all.filter((r) => matches(r, ctx));

    const collect = (key) => [...new Set(applied.flatMap((r) => asArray(r.requires && r.requires[key])))];
    const identifiers = applied.flatMap((r) => asArray(r.requires && r.requires.identifiers));

    return {
        matrix_version: MATRIX_VERSION,
        context: ctx,
        rules_applied: applied.map((r) => ({ id: r.id, severity: r.severity, reason: r.reason })),
        documents: collect('documents'),
        fields: collect('fields'),
        line_fields: collect('line_fields'),
        external_certificates: collect('external_certificates'),
        identifiers: identifiers.filter(Boolean),
        // Requirements that carry irreducible authority/lab time. Surfaced here so
        // a quote can say "this corridor cannot clear in a day" up front rather
        // than discovering it at the border.
        added_floor_hours: applied.reduce((a, r) => a + (r.adds_floor_hours || 0), 0),
        blocking_rule_ids: applied.filter((r) => r.severity === SEVERITY.BLOCKING).map((r) => r.id),
    };
}

module.exports = {
    MATRIX_VERSION,
    SEVERITY,
    EU,
    CHAPTERS,
    RULES,
    IDENTIFIER_VALIDATORS,
    ISO6346_LETTER_VALUES,
    isValidContainerNumber,
    chapterOf,
    matches,
    contextOf,
    resolve,
};
