'use strict';
// Pure unit tests for the admin product CREATE/UPDATE Zod schemas — the luxury-resale
// condition + authenticity provenance fields. Asserts the schemas accept the new optional
// fields (and stay backward compatible without them) and reject an invalid `condition` grade.
// No DB, no network.

const { test } = require('node:test');
const assert = require('node:assert');

const { createProductSchema, updateProductSchema, PRODUCT_CONDITIONS } = require('../validators/productSchemas');

const RESALE = {
    condition: 'very_good',
    conditionGrade: 'A / Excellent vintage',
    conditionNotes: 'Light hairline scratches on the clasp; no structural wear.',
    authenticityStatus: 'authenticated',
    authenticityCertificateCode: 'COA-AMARISE-2026-00042',
    isOneOfAKind: true,
    serialNumber: 'HER-BK25-0001',
};

test('createProductSchema accepts the full condition/authenticity provenance block', () => {
    const result = createProductSchema.safeParse({ name: 'Hermès Birkin 25', ...RESALE });
    assert.equal(result.success, true);
    assert.equal(result.data.condition, 'very_good');
    assert.equal(result.data.authenticityCertificateCode, 'COA-AMARISE-2026-00042');
    assert.equal(result.data.isOneOfAKind, true);
    assert.equal(result.data.serialNumber, 'HER-BK25-0001');
});

test('updateProductSchema accepts the condition/authenticity provenance block', () => {
    const result = updateProductSchema.safeParse(RESALE);
    assert.equal(result.success, true);
    assert.equal(result.data.conditionGrade, 'A / Excellent vintage');
    assert.equal(result.data.conditionNotes, RESALE.conditionNotes);
    assert.equal(result.data.authenticityStatus, 'authenticated');
});

test('every documented condition grade is accepted', () => {
    for (const condition of PRODUCT_CONDITIONS) {
        const result = createProductSchema.safeParse({ name: 'X', condition });
        assert.equal(result.success, true, `expected '${condition}' to be a valid condition`);
    }
});

test('schemas stay backward compatible — resale fields are fully optional', () => {
    const created = createProductSchema.safeParse({ name: 'Plain catalog product' });
    assert.equal(created.success, true);
    assert.equal(created.data.condition, undefined);
    assert.equal(created.data.isOneOfAKind, undefined);

    const updated = updateProductSchema.safeParse({ name: 'Renamed' });
    assert.equal(updated.success, true);
});

test('createProductSchema rejects an invalid condition grade', () => {
    const result = createProductSchema.safeParse({ name: 'X', condition: 'mint' });
    assert.equal(result.success, false);
    const flat = result.error.flatten();
    assert.ok(flat.fieldErrors.condition, 'expected a field error on `condition`');
});

test('updateProductSchema rejects an invalid condition grade', () => {
    const result = updateProductSchema.safeParse({ condition: 'brand_new' });
    assert.equal(result.success, false);
    assert.ok(result.error.flatten().fieldErrors.condition);
});
