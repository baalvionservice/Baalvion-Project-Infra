'use strict';
// Unit test for the read-param bound (Fix #5). getStatus is awkward to unit-test (DB layer), so we
// assert the length guard via the extracted predicate it uses.

const { isSubjectRefTooLong, MAX_SUBJECT_REF_LEN } = require('./kycController');

describe('isSubjectRefTooLong (GET read-param bound)', () => {
    test(`a ref of exactly ${MAX_SUBJECT_REF_LEN} chars is allowed`, () => {
        expect(isSubjectRefTooLong('x'.repeat(MAX_SUBJECT_REF_LEN))).toBe(false);
    });

    test(`a ref of ${MAX_SUBJECT_REF_LEN + 1} chars is rejected (-> 422 in getStatus)`, () => {
        expect(isSubjectRefTooLong('x'.repeat(MAX_SUBJECT_REF_LEN + 1))).toBe(true);
    });

    test('a short / empty ref is allowed', () => {
        expect(isSubjectRefTooLong('org-9')).toBe(false);
        expect(isSubjectRefTooLong('')).toBe(false);
        expect(isSubjectRefTooLong(undefined)).toBe(false);
    });
});
