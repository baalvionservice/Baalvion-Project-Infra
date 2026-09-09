'use strict';
/**
 * Path parameters that cannot be identifiers.
 *
 * Found by an SSRF probe rather than by reading the code: `/cases/<a url-encoded url>` reached
 * Postgres, which refused it with `invalid input syntax for type uuid`, and the service
 * answered 500. Junk traffic is not a fault in the service, and answering as though it were
 * both filled the log with unhandled errors and made a malformed id distinguishable from a
 * well-formed unknown one.
 *
 * The other half of this file matters just as much: several parameters here are deliberately
 * NOT uuids, and a guard that rejected those would break real routes.
 */
const { uuidParams, UUID_PARAMS } = require('../middleware/uuidParams');

const run = (params) => {
    const req = { params };
    let passed = false;
    let error = null;
    uuidParams(req, {}, (e) => { if (e) error = e; else passed = true; });
    return { passed, error };
};

const VALID = '7f3a1c2e-0000-4000-8000-00000000abcd';

describe('a well-formed identifier passes', () => {
    test.each(UUID_PARAMS)('%s accepts a uuid', (name) => {
        expect(run({ [name]: VALID }).passed).toBe(true);
    });

    test('uppercase is accepted — a uuid is case-insensitive', () => {
        expect(run({ id: VALID.toUpperCase() }).passed).toBe(true);
    });

    test('no parameters at all is fine', () => {
        expect(run({}).passed).toBe(true);
    });
});

describe('anything that cannot be an identifier is answered 404', () => {
    const junk = [
        ['a bare word', 'not-a-uuid'],
        ['a url', 'http://169.254.169.254/latest'],
        ['path traversal', '../../etc/passwd'],
        ['sql', "' OR 1=1 --"],
        ['a number', '12345'],
        ['empty-ish', ' '],
        ['a uuid with a suffix', `${VALID}x`],
        ['a uuid with a prefix', `x${VALID}`],
        ['a uuid missing a section', '7f3a1c2e-0000-4000-00000000abcd'],
    ];

    test.each(junk)('%s is refused', (_label, value) => {
        const { passed, error } = run({ id: value });
        expect(passed).toBe(false);
        expect(error.statusCode).toBe(404);
    });

    test('the refusal is the SAME 404 a well-formed unknown id gets', () => {
        // Distinguishing "malformed" from "not found" would be a small, free oracle.
        const { error } = run({ id: 'not-a-uuid' });
        expect(error.code).toBe('NOT_FOUND');
        expect(error.message).toBe('Resource not found');
    });

    test('one bad parameter is enough, even beside a good one', () => {
        expect(run({ id: VALID, updateId: 'nonsense' }).passed).toBe(false);
    });
});

describe('parameters that are deliberately not uuids are left alone', () => {
    // A guard that rejected these would break the invitation, resource, profile and
    // case-reference routes — all of which carry identifiers of their own kind.
    test.each([
        // Deliberately low-entropy and self-describing. The previous placeholder was a
        // random-looking 16-character string, which the secret scanner matched against the
        // word "token" beside it and failed the build on. Nothing here depends on the value
        // beyond its not being a uuid.
        ['an invitation token', 'token', 'example-invite-token'],
        ['a community slug', 'slug', 'general-support'],
        ['a profile handle', 'handle', 'someone'],
        ['a case reference', 'reference', 'CWM-AAA001'],
        ['a resource slug', 'slug', 'legal-help-in-india'],
        ['a reaction target type', 'targetType', 'CASE'],
    ])('%s passes through', (_label, name, value) => {
        expect(run({ [name]: value }).passed).toBe(true);
    });

    test('the guarded list does not accidentally include them', () => {
        for (const name of ['token', 'slug', 'handle', 'reference', 'targetType']) {
            expect(UUID_PARAMS).not.toContain(name);
        }
    });
});
