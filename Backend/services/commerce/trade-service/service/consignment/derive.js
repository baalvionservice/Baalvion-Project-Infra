'use strict';
/**
 * Document derivation — PURE (Compression, Phase 1).
 *
 * Enter once, generate everything. Each of the five documents below is a
 * PROJECTION of the canonical consignment, never a separately-authored record.
 * That is the whole point: a field that appears on the invoice, the packing list
 * and the declaration is physically the same value, so the three can no longer
 * disagree — and a mismatch between them is the most common reason a filing gets
 * rejected, which costs a full queue cycle rather than a minute.
 *
 * DETERMINISM — derivation is a pure function of the normalized consignment, and
 * every output carries `source_hash`, a sha256 over the canonical record. If the
 * consignment changes, the hash changes and every derived document is provably
 * stale, so drift is detected instead of discovered at the border.
 *
 * PURE: no DB, no clock, no I/O. `generated_at` is injected by the caller.
 */

const crypto = require('crypto');
const schema = require('./schema');

const DERIVER_VERSION = '1.0.0';

const DOC_TYPES = Object.freeze([
    'commercial_invoice',
    'packing_list',
    'certificate_of_origin',
    'shipping_instruction',
    'customs_declaration',
]);

/**
 * Stable JSON: object keys sorted recursively so the hash depends on the VALUES
 * and not on key insertion order. Without this, two identical consignments built
 * by different code paths would hash differently and every document would look
 * permanently stale.
 */
function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

const sourceHash = (consignment) => crypto.createHash('sha256').update(stableStringify(consignment)).digest('hex');

/** Single-line address rendering shared by every document that prints a party. */
function formatAddress(addr = {}) {
    return [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country]
        .filter(Boolean)
        .join(', ');
}

function partyBlock(party) {
    if (!party) return null;
    return {
        name: party.name,
        address: formatAddress(party.address),
        country: party.address ? party.address.country : null,
        tax_id: party.tax_id,
        tax_id_type: party.tax_id_type,
        email: party.contact ? party.contact.email : null,
        phone: party.contact ? party.contact.phone : null,
    };
}

// ── The five projections ─────────────────────────────────────────────────────

function commercialInvoice(c) {
    return {
        invoice_no: c.commercial.invoice_no,
        invoice_date: c.commercial.invoice_date,
        po_number: c.commercial.po_number,
        payment_terms: c.commercial.payment_terms,
        lc_number: c.commercial.lc_number,
        seller: partyBlock(c.parties.exporter),
        buyer: partyBlock(c.parties.importer),
        incoterm: c.incoterm,
        incoterm_place: c.incoterm_place,
        currency: c.currency,
        country_of_origin: c.origin_country,
        country_of_destination: c.destination_country,
        lines: c.lines.map((l) => ({
            line_no: l.line_no,
            description: l.description,
            hs_code: l.hs_code,
            origin_country: l.origin_country,
            quantity: l.quantity,
            uom: l.uom,
            unit_price: l.unit_price,
            amount: l.line_total,
        })),
        subtotal: c.totals.goods_value,
        freight: c.totals.freight,
        insurance: c.totals.insurance,
        other_charges: c.totals.other_charges,
        total: c.totals.invoice_total,
    };
}

function packingList(c) {
    return {
        invoice_no: c.commercial.invoice_no,
        invoice_date: c.commercial.invoice_date,
        shipper: partyBlock(c.parties.exporter),
        consignee: partyBlock(c.parties.importer),
        port_of_loading: c.transport.port_of_loading,
        port_of_discharge: c.transport.port_of_discharge,
        container_numbers: c.transport.container_numbers,
        seal_numbers: c.transport.seal_numbers,
        lines: c.lines.map((l) => ({
            line_no: l.line_no,
            description: l.description,
            hs_code: l.hs_code,
            marks: l.marks,
            package_count: l.package_count,
            package_type: l.package_type,
            quantity: l.quantity,
            uom: l.uom,
            net_weight_kg: l.net_weight_kg,
            gross_weight_kg: l.gross_weight_kg,
            volume_cbm: l.volume_cbm,
        })),
        total_packages: c.totals.package_count,
        total_net_weight_kg: c.totals.net_weight_kg,
        total_gross_weight_kg: c.totals.gross_weight_kg,
        total_volume_cbm: c.totals.volume_cbm,
    };
}

function certificateOfOrigin(c) {
    // Per-line origin can differ from the consignment's origin (goods sourced in
    // one country, exported from another). The certificate must state each line's
    // actual origin, so it is carried per line rather than flattened.
    const origins = [...new Set(c.lines.map((l) => l.origin_country || c.origin_country).filter(Boolean))];
    return {
        exporter: partyBlock(c.parties.exporter),
        consignee: partyBlock(c.parties.importer),
        manufacturer: partyBlock(c.parties.manufacturer) || partyBlock(c.parties.exporter),
        country_of_origin: c.origin_country,
        declared_origins: origins,
        // A mixed-origin consignment cannot carry one blanket origin statement —
        // flag it so the chamber application is filed per origin, not rejected.
        mixed_origin: origins.length > 1,
        country_of_destination: c.destination_country,
        transport_mode: c.transport.mode,
        port_of_loading: c.transport.port_of_loading,
        port_of_discharge: c.transport.port_of_discharge,
        invoice_no: c.commercial.invoice_no,
        invoice_date: c.commercial.invoice_date,
        lines: c.lines.map((l) => ({
            line_no: l.line_no,
            description: l.description,
            hs_code: l.hs_code,
            origin_country: l.origin_country || c.origin_country,
            marks: l.marks,
            package_count: l.package_count,
            gross_weight_kg: l.gross_weight_kg,
            invoice_value: l.line_total,
        })),
        total_value: c.totals.invoice_total,
        currency: c.currency,
    };
}

function shippingInstruction(c) {
    return {
        shipper: partyBlock(c.parties.exporter),
        consignee: partyBlock(c.parties.importer),
        notify_party: partyBlock(c.parties.notify_party) || partyBlock(c.parties.importer),
        carrier: c.transport.carrier,
        vessel_name: c.transport.vessel_name,
        voyage_no: c.transport.voyage_no,
        mode: c.transport.mode,
        place_of_receipt: c.transport.place_of_receipt,
        port_of_loading: c.transport.port_of_loading,
        port_of_discharge: c.transport.port_of_discharge,
        place_of_delivery: c.transport.place_of_delivery,
        etd: c.transport.etd,
        eta: c.transport.eta,
        freight_terms: schema.INCOTERMS[c.incoterm] && schema.INCOTERMS[c.incoterm].includes_freight ? 'prepaid' : 'collect',
        container_numbers: c.transport.container_numbers,
        seal_numbers: c.transport.seal_numbers,
        cargo_description: c.lines.map((l) => l.description).filter(Boolean).join('; '),
        marks_and_numbers: [...new Set(c.lines.map((l) => l.marks).filter(Boolean))].join(' / '),
        total_packages: c.totals.package_count,
        gross_weight_kg: c.totals.gross_weight_kg,
        volume_cbm: c.totals.volume_cbm,
    };
}

function customsDeclaration(c) {
    // The payload handed to service/customs/customsGateway. Built from the same
    // canonical record as the invoice, so the declaration cannot contradict the
    // paperwork supporting it.
    return {
        direction: c.direction,
        origin_country: c.origin_country,
        destination_country: c.destination_country,
        incoterm: c.incoterm,
        currency: c.currency,
        valuation_basis: c.totals.valuation_basis,
        customs_value: c.totals.customs_value,
        invoice_total: c.totals.invoice_total,
        freight: c.totals.freight,
        insurance: c.totals.insurance,
        exporter: partyBlock(c.parties.exporter),
        importer: partyBlock(c.parties.importer),
        transport: {
            mode: c.transport.mode,
            vessel_name: c.transport.vessel_name,
            voyage_no: c.transport.voyage_no,
            port_of_loading: c.transport.port_of_loading,
            port_of_discharge: c.transport.port_of_discharge,
            eta: c.transport.eta,
            container_numbers: c.transport.container_numbers,
        },
        line_items: c.lines.map((l) => ({
            line_no: l.line_no,
            description: l.description,
            hs_code: l.hs_code,
            origin_country: l.origin_country || c.origin_country,
            quantity: l.quantity,
            uom: l.uom,
            unit_price: l.unit_price,
            line_value: l.line_total,
            net_weight_kg: l.net_weight_kg,
        })),
        supporting_documents: ['commercial_invoice', 'packing_list', 'certificate_of_origin'],
        references: {
            invoice_no: c.commercial.invoice_no,
            po_number: c.commercial.po_number,
            reference: c.reference,
        },
    };
}

const BUILDERS = Object.freeze({
    commercial_invoice: commercialInvoice,
    packing_list: packingList,
    certificate_of_origin: certificateOfOrigin,
    shipping_instruction: shippingInstruction,
    customs_declaration: customsDeclaration,
});

/**
 * Derive one document. Returns the payload plus the provenance that makes
 * staleness detectable.
 */
function deriveOne(consignmentInput, docType, { generatedAt = null } = {}) {
    if (!BUILDERS[docType]) {
        throw new Error(`Unknown derived document type: ${docType}`);
    }
    const c = consignmentInput.schema_version ? consignmentInput : schema.normalize(consignmentInput);
    const hash = sourceHash(c);
    const payload = BUILDERS[docType](c);
    return {
        doc_type: docType,
        deriver_version: DERIVER_VERSION,
        schema_version: c.schema_version,
        source_hash: hash,
        content_hash: crypto.createHash('sha256').update(stableStringify(payload)).digest('hex'),
        generated_at: generatedAt,
        payload,
    };
}

/** Derive the whole document set from one canonical record. */
function deriveAll(consignmentInput, { generatedAt = null, only = null } = {}) {
    const c = consignmentInput.schema_version ? consignmentInput : schema.normalize(consignmentInput);
    const types = only && only.length ? only.filter((t) => BUILDERS[t]) : DOC_TYPES;
    return {
        source_hash: sourceHash(c),
        deriver_version: DERIVER_VERSION,
        consignment: c,
        documents: types.map((t) => deriveOne(c, t, { generatedAt })),
    };
}

/** Has the consignment moved on since this document was generated? */
const isStale = (derivedDoc, consignment) => derivedDoc.source_hash !== sourceHash(
    consignment.schema_version ? consignment : schema.normalize(consignment),
);

/**
 * Cross-document consistency check.
 *
 * Derivation makes agreement structural, so in normal operation this always
 * passes — it exists to catch a REGRESSION in a builder (someone recomputing a
 * total locally instead of reading it off the canonical record) before that
 * regression reaches a border and costs a customer a rejection cycle.
 */
function crossCheck(derived) {
    const byType = Object.fromEntries(derived.documents.map((d) => [d.doc_type, d.payload]));
    const issues = [];
    const compare = (field, a, b, docA, docB) => {
        if (a === undefined || b === undefined) return;
        if (String(a) !== String(b)) {
            issues.push({ field, [docA]: a, [docB]: b, message: `${field} disagrees between ${docA} and ${docB}` });
        }
    };

    const inv = byType.commercial_invoice;
    const pl = byType.packing_list;
    const coo = byType.certificate_of_origin;
    const si = byType.shipping_instruction;
    const dec = byType.customs_declaration;

    if (inv && pl) {
        compare('invoice_no', inv.invoice_no, pl.invoice_no, 'commercial_invoice', 'packing_list');
        compare('seller.name', inv.seller && inv.seller.name, pl.shipper && pl.shipper.name, 'commercial_invoice', 'packing_list');
        compare('buyer.name', inv.buyer && inv.buyer.name, pl.consignee && pl.consignee.name, 'commercial_invoice', 'packing_list');
        compare('line_count', inv.lines.length, pl.lines.length, 'commercial_invoice', 'packing_list');
    }
    if (inv && coo) {
        compare('total_value', inv.total, coo.total_value, 'commercial_invoice', 'certificate_of_origin');
        compare('currency', inv.currency, coo.currency, 'commercial_invoice', 'certificate_of_origin');
    }
    if (inv && dec) {
        compare('invoice_total', inv.total, dec.invoice_total, 'commercial_invoice', 'customs_declaration');
        compare('incoterm', inv.incoterm, dec.incoterm, 'commercial_invoice', 'customs_declaration');
        compare('line_count', inv.lines.length, dec.line_items.length, 'commercial_invoice', 'customs_declaration');
    }
    if (pl && si) {
        compare('gross_weight_kg', pl.total_gross_weight_kg, si.gross_weight_kg, 'packing_list', 'shipping_instruction');
        compare('total_packages', pl.total_packages, si.total_packages, 'packing_list', 'shipping_instruction');
        compare('port_of_loading', pl.port_of_loading, si.port_of_loading, 'packing_list', 'shipping_instruction');
    }
    if (pl && dec) {
        compare('port_of_discharge', pl.port_of_discharge, dec.transport.port_of_discharge, 'packing_list', 'customs_declaration');
    }

    return { consistent: issues.length === 0, issues };
}

module.exports = {
    DERIVER_VERSION,
    DOC_TYPES,
    BUILDERS,
    stableStringify,
    sourceHash,
    formatAddress,
    partyBlock,
    deriveOne,
    deriveAll,
    isStale,
    crossCheck,
};
