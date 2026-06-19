'use strict';
// Pure-Zod validation of the consignment intake + admin schemas. No DB.
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';
process.env.CART_SESSION_SECRET = process.env.CART_SESSION_SECRET || 'test';

const { test } = require('node:test');
const assert = require('node:assert');

const {
    submitConsignmentSchema,
    updateConsignmentStatusSchema,
    recordAuthenticationSchema,
    issueCertificateSchema,
} = require('../validators/consignmentSchemas');

const VALID_SUBMIT = {
    contactEmail: 'seller@example.com',
    contactName: 'Jane Seller',
    items: [{ brand: 'Hermès', model: 'Birkin 30', conditionGrade: 'excellent', askingPrice: 12000, currency: 'USD' }],
};

test('submitConsignmentSchema accepts a valid request and defaults photoUrls/accessories to []', () => {
    const r = submitConsignmentSchema.safeParse(VALID_SUBMIT);
    assert.equal(r.success, true, r.success ? '' : JSON.stringify(r.error.flatten()));
    assert.deepEqual(r.data.items[0].photoUrls, []);
    assert.deepEqual(r.data.items[0].accessories, []);
});

test('submitConsignmentSchema requires contactEmail (valid email)', () => {
    assert.equal(submitConsignmentSchema.safeParse({ items: VALID_SUBMIT.items }).success, false);
    assert.equal(submitConsignmentSchema.safeParse({ ...VALID_SUBMIT, contactEmail: 'not-an-email' }).success, false);
});

test('submitConsignmentSchema requires at least one item, each with a brand', () => {
    assert.equal(submitConsignmentSchema.safeParse({ ...VALID_SUBMIT, items: [] }).success, false);
    assert.equal(submitConsignmentSchema.safeParse({ ...VALID_SUBMIT, items: [{ model: 'no brand' }] }).success, false);
});

test('submitConsignmentSchema rejects an unknown conditionGrade and bad currency length', () => {
    assert.equal(submitConsignmentSchema.safeParse({ ...VALID_SUBMIT, items: [{ brand: 'X', conditionGrade: 'mint' }] }).success, false);
    assert.equal(submitConsignmentSchema.safeParse({ ...VALID_SUBMIT, items: [{ brand: 'X', currency: 'DOLLARS' }] }).success, false);
});

test('submitConsignmentSchema caps photoUrls at 12 and requires valid URLs', () => {
    const tooMany = Array.from({ length: 13 }, (_, i) => `https://cdn.example.com/${i}.jpg`);
    assert.equal(submitConsignmentSchema.safeParse({ ...VALID_SUBMIT, items: [{ brand: 'X', photoUrls: tooMany }] }).success, false);
    assert.equal(submitConsignmentSchema.safeParse({ ...VALID_SUBMIT, items: [{ brand: 'X', photoUrls: ['not a url'] }] }).success, false);
});

test('submitConsignmentSchema never accepts server-authoritative fields (reference/userId ignored)', () => {
    const r = submitConsignmentSchema.safeParse({ ...VALID_SUBMIT, reference: 'CSN-HACK', userId: 999, ownerSessionId: 'forged' });
    assert.equal(r.success, true);
    assert.equal(r.data.reference, undefined);
    assert.equal(r.data.userId, undefined);
    assert.equal(r.data.ownerSessionId, undefined);
});

test('updateConsignmentStatusSchema requires a known status and bounds optionals', () => {
    assert.equal(updateConsignmentStatusSchema.safeParse({ status: 'quoted', quoteAmount: 5000, quoteCurrency: 'USD', payoutType: 'consignment', commissionRate: 25 }).success, true);
    assert.equal(updateConsignmentStatusSchema.safeParse({ status: 'frozen' }).success, false);
    assert.equal(updateConsignmentStatusSchema.safeParse({ status: 'quoted', payoutType: 'gift' }).success, false);
    assert.equal(updateConsignmentStatusSchema.safeParse({ status: 'quoted', commissionRate: 200 }).success, false);
    assert.equal(updateConsignmentStatusSchema.safeParse({ status: 'listed', listedProductId: 'not-a-uuid' }).success, false);
});

test('recordAuthenticationSchema enforces status enum + confidence enum', () => {
    assert.equal(recordAuthenticationSchema.safeParse({ status: 'authenticated', confidence: 'high' }).success, true);
    assert.equal(recordAuthenticationSchema.safeParse({ status: 'maybe' }).success, false);
    assert.equal(recordAuthenticationSchema.safeParse({ status: 'authenticated', confidence: 'certain' }).success, false);
});

test('issueCertificateSchema never accepts a client code or verificationHash', () => {
    const r = issueCertificateSchema.safeParse({ issuerName: 'Expert A', code: 'COA-FORGED', verificationHash: 'deadbeef' });
    assert.equal(r.success, true);
    assert.equal(r.data.code, undefined);
    assert.equal(r.data.verificationHash, undefined);
});
