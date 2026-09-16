'use strict';
/**
 * Corridor matrix + pre-submit gate — verification harness (Phase 2).
 *
 * The property under test: nothing that would bounce can be submitted, and
 * nothing that would pass is blocked. Both directions matter — a gate that
 * blocks clean filings just moves the queue somewhere else.
 *
 *   node tests/corridor-precheck.verify.js
 */
const assert = require('assert');
const { normalize } = require('../service/consignment/schema');
const matrix = require('../service/corridor/matrix');
const { precheck } = require('../service/corridor/precheck');

let pass = 0;
let fail = 0;
const failures = [];
function t(name, fn) {
    try { fn(); pass += 1; console.log(`  ✓ ${name}`); }
    catch (err) { fail += 1; failures.push({ name, message: err.message }); console.log(`  ✗ ${name}\n      ${err.message}`); }
}
function section(title) { console.log(`\n${title}`); }

// A clean EU-bound textile import that should sail through the gate.
const CLEAN = normalize({
    direction: 'import', origin_country: 'IN', destination_country: 'DE',
    mode: 'sea', incoterm: 'FOB', invoice_no: 'INV-1', invoice_date: '2026-09-01',
    port_of_loading: 'INNSA', port_of_discharge: 'DEHAM',
    container_numbers: ['CSQU3054383'],
    freight_amount: 800,
    exporter: { name: 'Acme Exports', tax_id: '27AAAPL1234C1ZV', address: { country: 'IN' } },
    importer: { name: 'Bauer GmbH', tax_id: 'DE123456789012', address: { country: 'DE' }, contact: { phone: '+49 40 1234' } },
    lines: [{ description: 'Cotton shirts', hs_code: '620520', origin_country: 'IN', quantity: 500, unit_price: 12, net_weight_kg: 250, gross_weight_kg: 280, package_count: 20 }],
});
const ALL_DOCS = ['commercial_invoice', 'packing_list', 'certificate_of_origin'];

const run = (c, opts = {}) => precheck(c, { documentsPresent: ALL_DOCS, ...opts });
const codes = (r) => r.findings.map((f) => f.code);

(() => {
    // ── the clean path ───────────────────────────────────────────────────────
    section('a complete filing passes');
    t('a fully-papered EU textile import is submittable', () => {
        const r = run(CLEAN);
        assert.strictEqual(r.submittable, true, JSON.stringify(r.findings, null, 1));
        assert.strictEqual(r.blocking_count, 0);
    });
    t('a clean filing predicts a high first-pass probability', () => {
        assert.ok(run(CLEAN).first_pass_probability > 0.85);
    });
    t('a clean corridor carries no extra irreducible hours', () => {
        assert.strictEqual(run(CLEAN).corridor_floor_hours, 0);
    });

    // ── requirement resolution is corridor-specific ──────────────────────────
    section('requirements resolve per corridor, not from a fixed list');
    t('an EU import requires an EORI and origin evidence', () => {
        const req = matrix.resolve(CLEAN);
        assert.ok(req.documents.includes('certificate_of_origin'));
        assert.ok(req.identifiers.some((i) => i.type === 'EORI'));
    });
    t('a US import requires an EIN and an ISF manufacturer instead', () => {
        const req = matrix.resolve(normalize({ ...CLEAN, destination_country: 'US' }));
        assert.ok(req.identifiers.some((i) => i.type === 'EIN'));
        assert.ok(req.fields.includes('parties.manufacturer.name'));
        assert.ok(!req.identifiers.some((i) => i.type === 'EORI'));
    });
    t('an Indian import requires a GSTIN', () => {
        const req = matrix.resolve(normalize({ ...CLEAN, destination_country: 'IN', origin_country: 'DE' }));
        assert.ok(req.identifiers.some((i) => i.type === 'GSTIN'));
    });
    t('a foodstuff pulls in a sanitary certificate and declares its own floor time', () => {
        const food = normalize({ ...CLEAN, lines: [{ ...CLEAN.lines[0], hs_code: '090111' }] });
        const req = matrix.resolve(food);
        assert.ok(req.external_certificates.includes('phytosanitary_or_health_certificate'));
        assert.ok(req.added_floor_hours >= 48, 'a corridor with lab testing must not claim a one-day floor');
    });
    t('wood requires ISPM-15 evidence', () => {
        const wood = normalize({ ...CLEAN, lines: [{ ...CLEAN.lines[0], hs_code: '440710' }] });
        assert.ok(matrix.resolve(wood).external_certificates.includes('ispm15_fumigation'));
    });
    t('chemicals require a safety data sheet', () => {
        const chem = normalize({ ...CLEAN, lines: [{ ...CLEAN.lines[0], hs_code: '290511' }] });
        assert.ok(matrix.resolve(chem).external_certificates.includes('safety_data_sheet'));
    });
    t('an unverified counterparty cannot use the fast lane', () => {
        const req = matrix.resolve(CLEAN, { partyStatus: 'unverified' });
        assert.ok(req.external_certificates.includes('counterparty_kyc'));
        assert.ok(req.added_floor_hours >= 72);
    });
    t('a high-value consignment raises an insurance warning, not a block', () => {
        const big = normalize({ ...CLEAN, lines: [{ ...CLEAN.lines[0], quantity: 10000, unit_price: 50 }] });
        const r = run(big);
        assert.ok(codes(r).includes('MISSING_CERTIFICATE'));
        assert.strictEqual(r.submittable, true, 'a commercial risk warning must not block a lawful filing');
    });
    t('sea filings need ports; other modes are not held to it', () => {
        assert.ok(matrix.resolve(CLEAN).fields.includes('transport.port_of_loading'));
        const air = normalize({ ...CLEAN, mode: 'air' });
        assert.ok(!matrix.resolve(air).fields.includes('transport.port_of_loading'));
    });

    // ── structural catches ───────────────────────────────────────────────────
    section('structural defects are caught before submission');
    const broken = (over) => run(normalize({ ...CLEAN, ...over }));

    t('a short HS code is blocked', () => {
        const r = broken({ lines: [{ ...CLEAN.lines[0], hs_code: '6205' }] });
        assert.ok(codes(r).includes('HS_TOO_SHORT'));
        assert.strictEqual(r.submittable, false);
    });
    t('gross weight below net is blocked as a swapped-fields error', () => {
        const r = broken({ lines: [{ ...CLEAN.lines[0], net_weight_kg: 300, gross_weight_kg: 280 }] });
        assert.ok(codes(r).includes('GROSS_BELOW_NET'));
    });
    t('a container number failing its check digit is blocked', () => {
        const r = broken({ container_numbers: ['CSQU3054384'] });
        assert.ok(codes(r).includes('BAD_CONTAINER_NUMBER'));
    });
    t('a valid container number is accepted', () => {
        assert.ok(!codes(broken({ container_numbers: ['CSQU3054383'] })).includes('BAD_CONTAINER_NUMBER'));
    });
    t('a zero declared value is blocked as a valuation-fraud signal', () => {
        const r = broken({ lines: [{ ...CLEAN.lines[0], unit_price: 0 }], freight_amount: 0 });
        assert.ok(codes(r).includes('ZERO_CUSTOMS_VALUE'));
    });
    t('departure after arrival is blocked — it breaks pre-arrival scheduling', () => {
        const r = broken({ etd: '2026-10-10', eta: '2026-09-10' });
        assert.ok(codes(r).includes('ETD_AFTER_ETA'));
    });
    t('a sane ETD/ETA pair passes', () => {
        assert.ok(!codes(broken({ etd: '2026-09-10', eta: '2026-10-10' })).includes('ETD_AFTER_ETA'));
    });
    t('duplicate line numbers are blocked', () => {
        const r = broken({ lines: [{ ...CLEAN.lines[0], line_no: 1 }, { ...CLEAN.lines[0], line_no: 1 }] });
        assert.ok(codes(r).includes('DUPLICATE_LINE_NO'));
    });
    t('a consignment with no lines is blocked', () => {
        const r = broken({ lines: [] });
        assert.ok(codes(r).includes('NO_LINES'));
    });
    t('a zero quantity line is blocked', () => {
        const r = broken({ lines: [{ ...CLEAN.lines[0], quantity: 0 }] });
        assert.ok(codes(r).includes('NON_POSITIVE_QUANTITY'));
    });

    // ── identifier formats ───────────────────────────────────────────────────
    section('identifier formats');
    t('a malformed EORI is blocked before the gateway sees it', () => {
        const r = broken({ importer: { ...CLEAN.parties.importer, tax_id: 'NOPE!!' } });
        assert.ok(codes(r).includes('INVALID_IDENTIFIER'));
    });
    t('a valid EORI passes', () => {
        assert.ok(matrix.IDENTIFIER_VALIDATORS.EORI.test('DE123456789012345'));
    });
    t('EIN accepts both hyphenated and plain forms', () => {
        assert.ok(matrix.IDENTIFIER_VALIDATORS.EIN.test('12-3456789'));
        assert.ok(matrix.IDENTIFIER_VALIDATORS.EIN.test('123456789'));
        assert.ok(!matrix.IDENTIFIER_VALIDATORS.EIN.test('12345'));
    });
    t('GSTIN enforces the full 15-character shape', () => {
        assert.ok(matrix.IDENTIFIER_VALIDATORS.GSTIN.test('27AAAPL1234C1ZV'));
        assert.ok(!matrix.IDENTIFIER_VALIDATORS.GSTIN.test('27AAAPL1234C1Z'));
    });
    t('a missing identifier is reported once as a missing field, not twice', () => {
        const r = broken({ importer: { ...CLEAN.parties.importer, tax_id: null } });
        assert.strictEqual(codes(r).filter((c) => c === 'INVALID_IDENTIFIER').length, 0);
        assert.ok(codes(r).includes('MISSING_FIELD'));
    });

    // ── missing paperwork ────────────────────────────────────────────────────
    section('missing paperwork');
    t('a missing required document blocks the filing', () => {
        const r = precheck(CLEAN, { documentsPresent: ['commercial_invoice'] });
        assert.strictEqual(r.submittable, false);
        assert.ok(r.findings.some((f) => f.code === 'MISSING_DOCUMENT' && f.field === 'packing_list'));
    });
    t('every finding carries an actionable fix', () => {
        const r = precheck(CLEAN, { documentsPresent: [] });
        assert.ok(r.findings.length > 0);
        for (const f of r.findings) {
            assert.ok(f.fix && f.fix.length > 10, `finding ${f.code} has no usable fix`);
        }
    });
    t('any blocking finding drives the first-pass probability to zero', () => {
        assert.strictEqual(precheck(CLEAN, { documentsPresent: [] }).first_pass_probability, 0);
    });
    t('blocking findings are listed before warnings', () => {
        const r = precheck(normalize({ ...CLEAN, lines: [{ ...CLEAN.lines[0], hs_code: '6205', package_count: 0 }] }), { documentsPresent: ALL_DOCS });
        const firstWarning = r.findings.findIndex((f) => f.severity === 'warning');
        const lastBlocking = r.findings.map((f) => f.severity).lastIndexOf('blocking');
        assert.ok(lastBlocking < firstWarning, 'blocking findings must sort first');
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) {
        console.log('\nFailures:');
        failures.forEach((f) => console.log(`  • ${f.name}: ${f.message}`));
        process.exit(1);
    }
})();
