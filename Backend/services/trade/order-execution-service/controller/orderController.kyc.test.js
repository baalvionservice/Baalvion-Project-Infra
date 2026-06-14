'use strict';
// Unit tests for the PURE KYC-gate decision helper (Fix #7). No DB/Express — requireApproved is a
// plain injected closure (the caller binds it to the order's tenant, preserving tenant scoping).

const { evaluateKycGate } = require('./orderController');

const approved = { approved: true, status: 'APPROVED' };
const review = { approved: false, status: 'REVIEW' };

describe('evaluateKycGate (fail-closed)', () => {
    test('disabled gate -> never blocks (empty array)', async () => {
        const fn = jest.fn();
        const blocked = await evaluateKycGate({ enabled: false, failOpen: false, refs: [{ role: 'buyer', subjectRef: 'a' }] }, fn);
        expect(blocked).toEqual([]);
        expect(fn).not.toHaveBeenCalled();
    });

    test('both APPROVED -> no block', async () => {
        const fn = jest.fn(async () => approved);
        const blocked = await evaluateKycGate({
            enabled: true, failOpen: false,
            refs: [{ role: 'buyer', subjectRef: 'b' }, { role: 'seller', subjectRef: 's' }],
        }, fn);
        expect(blocked).toEqual([]);
        expect(fn).toHaveBeenCalledTimes(2);
    });

    test('one non-APPROVED -> blocks that role with its status', async () => {
        const fn = jest.fn(async ({ subjectRef }) => (subjectRef === 'b' ? approved : review));
        const blocked = await evaluateKycGate({
            enabled: true, failOpen: false,
            refs: [{ role: 'buyer', subjectRef: 'b' }, { role: 'seller', subjectRef: 's' }],
        }, fn);
        expect(blocked).toEqual(['seller:KYC_REVIEW']);
    });

    test('missing ref -> KYC_MISSING when fail-closed (and requireApproved not called for it)', async () => {
        const fn = jest.fn(async () => approved);
        const blocked = await evaluateKycGate({
            enabled: true, failOpen: false,
            refs: [{ role: 'buyer', subjectRef: undefined }, { role: 'seller', subjectRef: 's' }],
        }, fn);
        expect(blocked).toEqual(['buyer:KYC_MISSING']);
        expect(fn).toHaveBeenCalledTimes(1); // only the seller had a ref
    });

    test('missing ref -> allowed when failOpen', async () => {
        const fn = jest.fn(async () => approved);
        const blocked = await evaluateKycGate({
            enabled: true, failOpen: true,
            refs: [{ role: 'buyer', subjectRef: undefined }],
        }, fn);
        expect(blocked).toEqual([]);
    });

    test('requireApproved throws -> KYC_UNAVAILABLE when fail-closed', async () => {
        const fn = jest.fn(async () => { throw new Error('registry down'); });
        const blocked = await evaluateKycGate({
            enabled: true, failOpen: false,
            refs: [{ role: 'buyer', subjectRef: 'b' }],
        }, fn);
        expect(blocked).toEqual(['buyer:KYC_UNAVAILABLE']);
    });

    test('requireApproved throws -> allowed when failOpen', async () => {
        const fn = jest.fn(async () => { throw new Error('registry down'); });
        const blocked = await evaluateKycGate({
            enabled: true, failOpen: true,
            refs: [{ role: 'buyer', subjectRef: 'b' }],
        }, fn);
        expect(blocked).toEqual([]);
    });
});
