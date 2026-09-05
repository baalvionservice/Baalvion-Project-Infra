'use strict';
/**
 * Canonical consignment + document derivation — verification harness (Phase 1).
 *
 * Covers the two properties the whole phase rests on: money is exact (integer
 * minor units, incoterm-aware valuation), and every document is a projection of
 * one record so they cannot disagree.
 *
 *   node tests/consignment-derivation.verify.js
 */
const assert = require('assert');
const schema = require('../service/consignment/schema');
const derive = require('../service/consignment/derive');

let pass = 0;
let fail = 0;
const failures = [];
function t(name, fn) {
    try { fn(); pass += 1; console.log(`  ✓ ${name}`); }
    catch (err) { fail += 1; failures.push({ name, message: err.message }); console.log(`  ✗ ${name}\n      ${err.message}`); }
}
function section(title) { console.log(`\n${title}`); }

const BASE = {
    reference: 'CNS-1', invoice_no: 'INV-77', invoice_date: '2026-09-01',
    currency: 'USD', incoterm: 'FOB', origin_country: 'in', destination_country: 'de',
    freight_amount: 1200, insurance_amount: 300,
    port_of_loading: 'innsa', port_of_discharge: 'dehaM', mode: 'sea',
    exporter: { name: 'Acme Exports', address: { line1: '1 Dock Rd', city: 'Mumbai', country: 'in' }, tax_id: '27aaapl1234c1zv' },
    importer: { name: 'Bauer GmbH', address: { line1: '5 Hafenstr', city: 'Hamburg', country: 'de' }, tax_id: 'de123456789' },
    lines: [
        { description: 'Cotton shirts', hs_code: '6205.20', origin_country: 'IN', quantity: 500, unit_price: 12.675, net_weight_kg: 250, gross_weight_kg: 280, package_count: 20, volume_cbm: 4.2 },
        { description: 'Linen trousers', hs_code: '6203.49', origin_country: 'BD', quantity: 200, unit_price: 20, net_weight_kg: 120, gross_weight_kg: 140, package_count: 10, volume_cbm: 2.1 },
    ],
};

(() => {
    // ── money ────────────────────────────────────────────────────────────────
    section('money — integer minor units');
    t('minor-unit conversion round-trips', () => {
        assert.strictEqual(schema.fromMinor(schema.toMinor('1234.56', 'USD'), 'USD'), '1234.56');
    });
    t('a price ending in 5 rounds up, not down through float error', () => {
        assert.strictEqual(schema.toMinor(2.675, 'USD'), 268);
        assert.strictEqual(schema.toMinor(12.675, 'USD'), 1268);
    });
    t('zero-decimal currencies are not scaled by 100', () => {
        assert.strictEqual(schema.minorUnits('JPY'), 0);
        assert.strictEqual(schema.toMinor(1500, 'JPY'), 1500);
        assert.strictEqual(schema.fromMinor(1500, 'JPY'), '1500');
    });
    t('three-decimal currencies keep their third digit', () => {
        assert.strictEqual(schema.minorUnits('KWD'), 3);
        assert.strictEqual(schema.fromMinor(schema.toMinor('12.345', 'KWD'), 'KWD'), '12.345');
    });
    t('an unknown currency falls back to two decimals rather than throwing', () => {
        assert.strictEqual(schema.minorUnits('ZZZ'), 2);
    });
    t('line totals sum exactly with no float drift over many lines', () => {
        const many = { ...BASE, lines: Array.from({ length: 300 }, () => ({ description: 'x', quantity: 3, unit_price: 0.07 })) };
        const c = schema.normalize(many);
        assert.strictEqual(c.totals.goods_value, '63.00'); // 300 × 3 × 0.07
    });
    t('a missing or non-numeric price contributes zero, not NaN', () => {
        const c = schema.normalize({ ...BASE, lines: [{ description: 'x', quantity: 5 }, { description: 'y', quantity: 2, unit_price: 'abc' }] });
        assert.strictEqual(c.totals.goods_value, '0.00');
    });

    // ── valuation ────────────────────────────────────────────────────────────
    section('customs valuation');
    t('FOB sale into a CIF-basis country adds freight and insurance to the customs value', () => {
        const c = schema.normalize(BASE); // FOB → DE
        assert.strictEqual(c.totals.goods_value, '10340.00');
        assert.strictEqual(c.totals.invoice_total, '10340.00');   // FOB: seller bills goods only
        assert.strictEqual(c.totals.valuation_basis, 'CIF');
        assert.strictEqual(c.totals.customs_value, '11840.00');   // + 1200 freight + 300 insurance
    });
    t('CIF sale into an FOB-basis country strips freight and insurance back out', () => {
        const c = schema.normalize({ ...BASE, incoterm: 'CIF', destination_country: 'US' });
        assert.strictEqual(c.totals.invoice_total, '11840.00');   // CIF: seller billed freight + insurance
        assert.strictEqual(c.totals.valuation_basis, 'FOB');
        assert.strictEqual(c.totals.customs_value, '10340.00');   // US assesses on goods alone
    });
    t('a CIF sale into a CIF-basis country does not double-count freight', () => {
        const c = schema.normalize({ ...BASE, incoterm: 'CIF' });
        assert.strictEqual(c.totals.customs_value, '11840.00');
        assert.strictEqual(c.totals.invoice_total, '11840.00');
    });
    t('an unknown incoterm falls back to FOB terms rather than dropping charges', () => {
        const c = schema.normalize({ ...BASE, incoterm: 'XXX' });
        assert.strictEqual(c.incoterm, 'XXX');
        assert.strictEqual(c.totals.invoice_total, '10340.00');
    });

    // ── normalization ────────────────────────────────────────────────────────
    section('normalization');
    t('country codes and ports are upper-cased consistently', () => {
        const c = schema.normalize(BASE);
        assert.strictEqual(c.origin_country, 'IN');
        assert.strictEqual(c.destination_country, 'DE');
        assert.strictEqual(c.transport.port_of_discharge, 'DEHAM');
        assert.strictEqual(c.parties.exporter.address.country, 'IN');
    });
    t('HS codes are stripped to digits so 6205.20 and 620520 are one value', () => {
        const c = schema.normalize(BASE);
        assert.strictEqual(c.lines[0].hs_code, '620520');
    });
    t('weights and volumes roll up across lines', () => {
        const c = schema.normalize(BASE);
        assert.strictEqual(c.totals.net_weight_kg, 370);
        assert.strictEqual(c.totals.gross_weight_kg, 420);
        assert.strictEqual(c.totals.volume_cbm, 6.3);
        assert.strictEqual(c.totals.package_count, 30);
    });
    t('an empty consignment normalizes to zeroes rather than throwing', () => {
        const c = schema.normalize({});
        assert.strictEqual(c.totals.line_count, 0);
        assert.strictEqual(c.totals.invoice_total, '0.00');
    });

    // ── derivation ───────────────────────────────────────────────────────────
    section('derivation');
    t('all five documents derive from one record', () => {
        const d = derive.deriveAll(BASE);
        assert.deepStrictEqual(d.documents.map((x) => x.doc_type).sort(), [...derive.DOC_TYPES].sort());
    });
    t('derivation is deterministic — same input, same hashes', () => {
        const a = derive.deriveAll(BASE);
        const b = derive.deriveAll(BASE);
        assert.strictEqual(a.source_hash, b.source_hash);
        assert.deepStrictEqual(a.documents.map((d) => d.content_hash), b.documents.map((d) => d.content_hash));
    });
    t('key insertion order does not change the hash', () => {
        const reordered = { lines: BASE.lines, importer: BASE.importer, exporter: BASE.exporter, ...BASE };
        assert.strictEqual(derive.sourceHash(schema.normalize(BASE)), derive.sourceHash(schema.normalize(reordered)));
    });
    t('normalizing an already-normalized record is a no-op', () => {
        // A partial amendment re-normalizes the stored record; if that were not
        // idempotent every nested party and transport field would silently blank.
        const once = schema.normalize(BASE);
        const twice = schema.normalize(once);
        assert.strictEqual(derive.sourceHash(once), derive.sourceHash(twice));
        assert.strictEqual(twice.parties.importer.name, 'Bauer GmbH');
        assert.strictEqual(twice.transport.port_of_loading, 'INNSA');
        assert.strictEqual(twice.totals.freight, '1200.00');
    });
    t('changing any fact changes the hash', () => {
        const before = derive.deriveAll(BASE).source_hash;
        const after = derive.deriveAll({ ...BASE, freight_amount: 1201 }).source_hash;
        assert.notStrictEqual(before, after);
    });
    t('every document agrees with every other — the anti-rejection guarantee', () => {
        const check = derive.crossCheck(derive.deriveAll(BASE));
        assert.strictEqual(check.consistent, true, JSON.stringify(check.issues));
    });
    t('cross-check still holds under a CIF/US valuation split', () => {
        const check = derive.crossCheck(derive.deriveAll({ ...BASE, incoterm: 'CIF', destination_country: 'US' }));
        assert.strictEqual(check.consistent, true, JSON.stringify(check.issues));
    });
    t('cross-check actually fails when a builder drifts', () => {
        // Simulate the regression this guard exists to catch: a document that
        // recomputes a total locally instead of reading the canonical record.
        const d = derive.deriveAll(BASE);
        d.documents.find((x) => x.doc_type === 'customs_declaration').payload.invoice_total = '9999.00';
        const check = derive.crossCheck(d);
        assert.strictEqual(check.consistent, false);
        assert.ok(check.issues.some((i) => i.field === 'invoice_total'));
    });
    t('a mixed-origin consignment is flagged, not silently blanket-certified', () => {
        const coo = derive.deriveOne(BASE, 'certificate_of_origin').payload;
        assert.strictEqual(coo.mixed_origin, true);
        assert.deepStrictEqual(coo.declared_origins, ['IN', 'BD']);
    });
    t('a single-origin consignment is not flagged', () => {
        const single = { ...BASE, lines: BASE.lines.map((l) => ({ ...l, origin_country: 'IN' })) };
        assert.strictEqual(derive.deriveOne(single, 'certificate_of_origin').payload.mixed_origin, false);
    });
    t('freight terms follow the incoterm, not a hand-set flag', () => {
        assert.strictEqual(derive.deriveOne(BASE, 'shipping_instruction').payload.freight_terms, 'collect');
        assert.strictEqual(derive.deriveOne({ ...BASE, incoterm: 'CIF' }, 'shipping_instruction').payload.freight_terms, 'prepaid');
    });
    t('notify party defaults to the importer when not given', () => {
        const si = derive.deriveOne(BASE, 'shipping_instruction').payload;
        assert.strictEqual(si.notify_party.name, 'Bauer GmbH');
    });
    t('the declaration carries the customs value, not the invoice total', () => {
        const dec = derive.deriveOne(BASE, 'customs_declaration').payload;
        assert.strictEqual(dec.customs_value, '11840.00');
        assert.strictEqual(dec.invoice_total, '10340.00');
    });
    t('staleness is detected when the consignment moves on', () => {
        const doc = derive.deriveOne(BASE, 'commercial_invoice');
        assert.strictEqual(derive.isStale(doc, BASE), false);
        assert.strictEqual(derive.isStale(doc, { ...BASE, freight_amount: 999 }), true);
    });
    t('an unknown document type throws rather than deriving an empty one', () => {
        assert.throws(() => derive.deriveOne(BASE, 'bill_of_sale'), /Unknown derived document type/);
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) {
        console.log('\nFailures:');
        failures.forEach((f) => console.log(`  • ${f.name}: ${f.message}`));
        process.exit(1);
    }
})();
