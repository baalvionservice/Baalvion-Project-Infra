'use strict';
/**
 * Canonical Consignment — schema, normalization and money (Compression, Phase 1).
 *
 * The re-keying problem: the same ~40 facts get typed into ~25 documents by 6
 * parties, and every retype is a fresh error surface that turns into a rejection
 * loop, which costs a whole human queue cycle. This module defines the ONE place
 * those facts live. Every document is derived from here (derive.js) and nothing
 * is ever typed twice.
 *
 * MONEY — all arithmetic runs in integer minor units. Unit price × quantity in
 * floats drifts, and a customs value that disagrees with the invoice by one cent
 * is a rejected declaration, so the drift is not cosmetic. Callers pass and read
 * decimal strings/numbers; internally it is integers only.
 *
 * VALUATION — customs value is NOT the invoice total. It depends on the
 * incoterm and on the importing country's valuation basis (CIF for most of the
 * world, FOB for the US), so it is computed explicitly rather than assumed.
 *
 * PURE: no DB, no clock, no I/O.
 */

const SCHEMA_VERSION = '1.0.0';

const MODES = Object.freeze(['sea', 'air', 'road', 'rail', 'multimodal']);
const DIRECTIONS = Object.freeze(['import', 'export']);

// Incoterms 2020. `includes_freight` / `includes_insurance` say what the seller
// already priced into the invoice — which is exactly what the customs value
// build-up needs to know so it neither double-counts nor omits.
const INCOTERMS = Object.freeze({
    EXW: { includes_freight: false, includes_insurance: false, label: 'Ex Works' },
    FCA: { includes_freight: false, includes_insurance: false, label: 'Free Carrier' },
    FAS: { includes_freight: false, includes_insurance: false, label: 'Free Alongside Ship' },
    FOB: { includes_freight: false, includes_insurance: false, label: 'Free On Board' },
    CFR: { includes_freight: true, includes_insurance: false, label: 'Cost and Freight' },
    CIF: { includes_freight: true, includes_insurance: true, label: 'Cost, Insurance and Freight' },
    CPT: { includes_freight: true, includes_insurance: false, label: 'Carriage Paid To' },
    CIP: { includes_freight: true, includes_insurance: true, label: 'Carriage and Insurance Paid To' },
    DAP: { includes_freight: true, includes_insurance: false, label: 'Delivered at Place' },
    DPU: { includes_freight: true, includes_insurance: false, label: 'Delivered at Place Unloaded' },
    DDP: { includes_freight: true, includes_insurance: true, label: 'Delivered Duty Paid' },
});

// Importing-country valuation basis. Most of the world assesses duty on the
// landed (CIF) value; the US assesses on the FOB transaction value. Getting this
// wrong misstates duty on every single line, so it is data, not a guess.
const FOB_BASIS_COUNTRIES = Object.freeze(['US']);
const valuationBasis = (destCountry) => (FOB_BASIS_COUNTRIES.includes(String(destCountry || '').toUpperCase()) ? 'FOB' : 'CIF');

// Currencies whose minor unit is not 1/100. A JPY amount scaled by 100 is a
// hundred-fold overstatement on the declaration.
const MINOR_UNITS = Object.freeze({
    JPY: 0, KRW: 0, VND: 0, CLP: 0, ISK: 0, XOF: 0, XAF: 0, XPF: 0, UGX: 0, RWF: 0,
    BHD: 3, IQD: 3, JOD: 3, KWD: 3, LYD: 3, OMR: 3, TND: 3,
});
const minorUnits = (currency) => {
    const c = String(currency || 'USD').toUpperCase();
    return Object.prototype.hasOwnProperty.call(MINOR_UNITS, c) ? MINOR_UNITS[c] : 2;
};

/** Decimal amount → integer minor units. Rounds half-up on the boundary. */
function toMinor(amount, currency) {
    const scale = 10 ** minorUnits(currency);
    const n = Number(amount || 0);
    if (!Number.isFinite(n)) return 0;
    // Nudge past binary representation error (2.675 * 100 === 267.49999…) before
    // rounding, so a price ending in 5 rounds up rather than silently down.
    return Math.round((n * scale) + (n >= 0 ? Number.EPSILON * Math.abs(n) * scale : 0));
}

/** Integer minor units → fixed-precision decimal string for display/output. */
function fromMinor(minor, currency) {
    const digits = minorUnits(currency);
    const scale = 10 ** digits;
    return (Number(minor || 0) / scale).toFixed(digits);
}

const upper = (v) => (v == null ? null : String(v).trim().toUpperCase());
const trim = (v) => (v == null ? null : String(v).trim());
const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

function normalizeAddress(a = {}) {
    return {
        line1: trim(a.line1),
        line2: trim(a.line2),
        city: trim(a.city),
        state: trim(a.state),
        postal_code: trim(a.postal_code),
        country: upper(a.country),
    };
}

function normalizeParty(p = {}) {
    return {
        org_id: trim(p.org_id),
        name: trim(p.name),
        address: normalizeAddress(p.address),
        tax_id: upper(p.tax_id),
        tax_id_type: trim(p.tax_id_type),
        contact: {
            email: p.contact && p.contact.email ? String(p.contact.email).trim().toLowerCase() : null,
            phone: trim(p.contact && p.contact.phone),
        },
    };
}

/**
 * Normalize one goods line and compute its money in minor units.
 *
 * `line_total_minor` is authoritative; the decimal `line_total` is a projection
 * of it. Deriving the other way round is how a packing list and an invoice end
 * up disagreeing by a cent.
 */
function normalizeLine(line = {}, index = 0, currency = 'USD') {
    const quantity = num(line.quantity);
    const unitPriceMinor = toMinor(line.unit_price, currency);
    const lineTotalMinor = Math.round(unitPriceMinor * quantity);
    return {
        line_no: Number(line.line_no) || index + 1,
        description: trim(line.description),
        hs_code: line.hs_code ? String(line.hs_code).replace(/\D/g, '') : null,
        origin_country: upper(line.origin_country),
        quantity,
        uom: trim(line.uom) || 'PCS',
        unit_price_minor: unitPriceMinor,
        unit_price: fromMinor(unitPriceMinor, currency),
        line_total_minor: lineTotalMinor,
        line_total: fromMinor(lineTotalMinor, currency),
        net_weight_kg: num(line.net_weight_kg),
        gross_weight_kg: num(line.gross_weight_kg),
        volume_cbm: num(line.volume_cbm),
        package_count: Number(line.package_count) || 0,
        package_type: trim(line.package_type) || 'CTN',
        marks: trim(line.marks),
    };
}

/**
 * Flatten an already-canonical record back to the flat input shape.
 *
 * normalize() reads flat keys (`exporter`, `port_of_loading`, `invoice_no`) but
 * emits them nested under `parties` / `transport` / `commercial`. Without this,
 * re-normalizing its own output would silently blank every nested field — which
 * is exactly what a partial amendment does. Making normalize() idempotent is
 * cheaper than making every caller remember the asymmetry.
 */
function flattenCanonical(c) {
    return {
        // Nested blocks FIRST, the record's own keys last: an explicitly supplied
        // flat key (a caller amending `importer` or `port_of_loading` directly)
        // must win over the stored nested value, not be silently overwritten by it.
        ...(c.commercial || {}),
        ...(c.transport || {}),
        ...(c.parties || {}),
        // Totals are always recomputed from the lines, but the charge inputs that
        // produced them are not otherwise recoverable from the nested shape.
        ...(c.totals ? {
            freight_amount: c.totals.freight,
            insurance_amount: c.totals.insurance,
            other_charges: c.totals.other_charges,
        } : {}),
        ...c,
    };
}

/**
 * Normalize a whole consignment into the canonical shape + compute every total.
 *
 * Deterministic AND idempotent: same input → identical output, and normalizing
 * an already-normalized record is a no-op. That is what lets derive.js hash the
 * result and detect when a derived document has gone stale.
 */
function normalize(rawInput = {}) {
    const input = rawInput && rawInput.schema_version && rawInput.parties
        ? flattenCanonical(rawInput)
        : rawInput;
    const currency = upper(input.currency) || 'USD';
    const incoterm = upper(input.incoterm) || 'FOB';
    const lines = (Array.isArray(input.lines) ? input.lines : []).map((l, i) => normalizeLine(l, i, currency));

    const goodsMinor = lines.reduce((a, l) => a + l.line_total_minor, 0);
    const freightMinor = toMinor(input.freight_amount, currency);
    const insuranceMinor = toMinor(input.insurance_amount, currency);
    const otherMinor = toMinor(input.other_charges, currency);

    const term = INCOTERMS[incoterm] || INCOTERMS.FOB;
    // Invoice total is what the seller bills: goods plus any charge the incoterm
    // says the seller carries.
    const invoiceMinor = goodsMinor
        + (term.includes_freight ? freightMinor : 0)
        + (term.includes_insurance ? insuranceMinor : 0)
        + otherMinor;

    const destination = upper(input.destination_country);
    const basis = valuationBasis(destination);
    // Customs value: on a CIF basis, freight and insurance are dutiable whether
    // or not the seller invoiced them, so add whatever the incoterm left out. On
    // an FOB basis they are excluded even when the seller did invoice them.
    const customsMinor = basis === 'CIF'
        ? goodsMinor + freightMinor + insuranceMinor + otherMinor
        : goodsMinor + otherMinor;

    return {
        schema_version: SCHEMA_VERSION,
        reference: trim(input.reference),
        direction: DIRECTIONS.includes(input.direction) ? input.direction : 'export',
        currency,
        incoterm,
        incoterm_place: trim(input.incoterm_place),
        origin_country: upper(input.origin_country),
        destination_country: destination,

        parties: {
            exporter: normalizeParty(input.exporter),
            importer: normalizeParty(input.importer),
            notify_party: input.notify_party ? normalizeParty(input.notify_party) : null,
            manufacturer: input.manufacturer ? normalizeParty(input.manufacturer) : null,
        },

        commercial: {
            invoice_no: trim(input.invoice_no),
            invoice_date: trim(input.invoice_date),
            po_number: trim(input.po_number),
            lc_number: trim(input.lc_number),
            payment_terms: trim(input.payment_terms),
        },

        transport: {
            mode: MODES.includes(input.mode) ? input.mode : 'sea',
            carrier: trim(input.carrier),
            vessel_name: trim(input.vessel_name),
            voyage_no: trim(input.voyage_no),
            port_of_loading: upper(input.port_of_loading),
            port_of_discharge: upper(input.port_of_discharge),
            place_of_receipt: trim(input.place_of_receipt),
            place_of_delivery: trim(input.place_of_delivery),
            etd: trim(input.etd),
            eta: trim(input.eta),
            container_numbers: (input.container_numbers || []).map(upper).filter(Boolean),
            seal_numbers: (input.seal_numbers || []).map(upper).filter(Boolean),
        },

        lines,

        totals: {
            currency,
            line_count: lines.length,
            goods_value_minor: goodsMinor,
            goods_value: fromMinor(goodsMinor, currency),
            freight_minor: freightMinor,
            freight: fromMinor(freightMinor, currency),
            insurance_minor: insuranceMinor,
            insurance: fromMinor(insuranceMinor, currency),
            other_charges_minor: otherMinor,
            other_charges: fromMinor(otherMinor, currency),
            invoice_total_minor: invoiceMinor,
            invoice_total: fromMinor(invoiceMinor, currency),
            valuation_basis: basis,
            customs_value_minor: customsMinor,
            customs_value: fromMinor(customsMinor, currency),
            net_weight_kg: Math.round(lines.reduce((a, l) => a + l.net_weight_kg, 0) * 1000) / 1000,
            gross_weight_kg: Math.round(lines.reduce((a, l) => a + l.gross_weight_kg, 0) * 1000) / 1000,
            volume_cbm: Math.round(lines.reduce((a, l) => a + l.volume_cbm, 0) * 1000) / 1000,
            package_count: lines.reduce((a, l) => a + l.package_count, 0),
        },
    };
}

module.exports = {
    SCHEMA_VERSION,
    MODES,
    DIRECTIONS,
    INCOTERMS,
    FOB_BASIS_COUNTRIES,
    MINOR_UNITS,
    minorUnits,
    valuationBasis,
    toMinor,
    fromMinor,
    normalizeParty,
    normalizeAddress,
    normalizeLine,
    flattenCanonical,
    normalize,
};
