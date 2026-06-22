'use strict';
// Zero-dependency tests (node:test). Run with `npm test` (node --test) from the service root.
// A dummy JWT_PUBLIC_KEY lets us require the service (which transitively loads appConfig)
// without a real keypair; no DB connection is opened (models only construct on require).
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'test-dummy-public-key';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    createBusinessApplicationSchema,
    reviewBusinessApplicationSchema,
    reviewBusinessDocumentSchema,
    businessDocumentInputSchema,
} = require('../validators/schemas');
const { resolveNextStatus, STATUS } = require('../service/businessOnboardingService');

const validBase = () => ({
    legal_name: 'Acme Exports Pvt Ltd',
    entity_type: 'private_limited',
    incorporation_country: 'India',
    contact_name: 'Asha Rao',
    contact_email: 'asha@acme.test',
    gstin: '22AAAAA0000A1Z5',
});

test('createBusinessApplicationSchema accepts a valid company and applies defaults', () => {
    const parsed = createBusinessApplicationSchema.safeParse(validBase());
    assert.equal(parsed.success, true);
    assert.deepEqual(parsed.data.beneficial_owners, []);
    assert.deepEqual(parsed.data.documents, []);
});

test('requires at least one of IEC / GSTIN / VAT', () => {
    const { gstin, ...noTax } = validBase();
    const parsed = createBusinessApplicationSchema.safeParse(noTax);
    assert.equal(parsed.success, false);
    assert.match(JSON.stringify(parsed.error.flatten()), /trade\/tax registration/);
});

test('IEC alone satisfies the tax-registration requirement', () => {
    const { gstin, ...rest } = validBase();
    const parsed = createBusinessApplicationSchema.safeParse({ ...rest, iec_code: 'AAAAA1234A' });
    assert.equal(parsed.success, true);
    assert.equal(parsed.data.iec_code, 'AAAAA1234A');
});

test('lower-case GSTIN is normalised to upper-case', () => {
    const parsed = createBusinessApplicationSchema.safeParse({ ...validBase(), gstin: '22aaaaa0000a1z5' });
    assert.equal(parsed.success, true);
    assert.equal(parsed.data.gstin, '22AAAAA0000A1Z5');
});

test('rejects a malformed GSTIN', () => {
    const parsed = createBusinessApplicationSchema.safeParse({ ...validBase(), gstin: 'NOT-A-GSTIN' });
    assert.equal(parsed.success, false);
});

test('rejects an invalid contact email', () => {
    const parsed = createBusinessApplicationSchema.safeParse({ ...validBase(), contact_email: 'nope' });
    assert.equal(parsed.success, false);
});

test('rejects an unknown entity_type', () => {
    const parsed = createBusinessApplicationSchema.safeParse({ ...validBase(), entity_type: 'galactic_empire' });
    assert.equal(parsed.success, false);
});

test('businessDocumentInputSchema requires a known type, title and file_url', () => {
    assert.equal(businessDocumentInputSchema.safeParse({
        document_type: 'gst_certificate', title: 'GST cert', file_url: 'https://x.test/gst.pdf',
    }).success, true);
    assert.equal(businessDocumentInputSchema.safeParse({
        document_type: 'unknown_kind', title: 'x', file_url: 'https://x.test/a',
    }).success, false);
    assert.equal(businessDocumentInputSchema.safeParse({
        document_type: 'gst_certificate', title: 'x', file_url: '',
    }).success, false);
});

test('reviewBusinessApplicationSchema validates the action enum', () => {
    assert.equal(reviewBusinessApplicationSchema.safeParse({ action: 'approve' }).success, true);
    assert.equal(reviewBusinessApplicationSchema.safeParse({ action: 'nope' }).success, false);
});

test('reviewBusinessDocumentSchema validates verify/reject', () => {
    assert.equal(reviewBusinessDocumentSchema.safeParse({ action: 'verify' }).success, true);
    assert.equal(reviewBusinessDocumentSchema.safeParse({ action: 'approve' }).success, false);
});

test('resolveNextStatus advances the approval workflow', () => {
    assert.equal(resolveNextStatus(STATUS.SUBMITTED, 'start_review'), STATUS.UNDER_REVIEW);
    assert.equal(resolveNextStatus(STATUS.SUBMITTED, 'approve'), STATUS.APPROVED);
    assert.equal(resolveNextStatus(STATUS.UNDER_REVIEW, 'reject'), STATUS.REJECTED);
});

test('resolveNextStatus blocks transitions out of terminal states', () => {
    assert.throws(() => resolveNextStatus(STATUS.APPROVED, 'approve'), /already approved/);
    assert.throws(() => resolveNextStatus(STATUS.REJECTED, 'start_review'), /already rejected/);
});

test('resolveNextStatus rejects unknown actions', () => {
    assert.throws(() => resolveNextStatus(STATUS.SUBMITTED, 'frobnicate'), /Unknown review action/);
});
