'use strict';
/**
 * Fixture identifiers, as real uuids.
 *
 * Two reasons this is a module rather than a handful of consts in each test file.
 *
 * The service now refuses a path parameter that cannot be an identifier (see
 * middleware/uuidParams.js), so a fixture using `'private-case'` as an id would be
 * exercising a request the database could never have produced.
 *
 * And jest hoists `jest.mock()` calls above top-level `const` declarations, so a factory —
 * or a token registry built beside one — that closes over such a const reads it inside the
 * temporal dead zone. A `require` is evaluated eagerly with the hoisted mocks, so these are
 * always initialised by the time anything asks for them.
 */
module.exports = Object.freeze({
    PRIVATE_CASE: '11111111-1111-4111-8111-111111111101',
    PUBLIC_CASE:  '11111111-1111-4111-8111-111111111102',
    DRAFT_CASE:   '11111111-1111-4111-8111-111111111103',
    OPEN_CASE:    '11111111-1111-4111-8111-111111111104',

    OWNER:        '22222222-2222-4222-8222-222222222201',
    MEMBER:       '22222222-2222-4222-8222-222222222202',
    SUPPORTER:    '22222222-2222-4222-8222-222222222203',
    MODERATOR:    '22222222-2222-4222-8222-222222222204',
    ADMIN:        '22222222-2222-4222-8222-222222222205',
    VERIFIED:     '22222222-2222-4222-8222-222222222206',
    UNVERIFIED:   '22222222-2222-4222-8222-222222222207',
    CLAIMLESS:    '22222222-2222-4222-8222-222222222208',

    PARTICIPANT:  '33333333-3333-4333-8333-333333333301',
    SUPPORT_ROW:  '33333333-3333-4333-8333-333333333302',
    REPORT:       '33333333-3333-4333-8333-333333333303',
    ACTION:       '33333333-3333-4333-8333-333333333304',
});
