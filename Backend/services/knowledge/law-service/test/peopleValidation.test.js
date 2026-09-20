'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { isAllowedLicense, validatePerson, validatePhoto, validateLink } = require('../utils/peopleValidation');

test('only display-friendly licences are accepted', () => {
    for (const ok of ['Public domain', 'CC0', 'CC BY 4.0', 'CC BY-SA 3.0', 'LEN-owned', 'Licensed']) assert.ok(isAllowedLicense(ok), ok);
    for (const bad of ['CC BY-NC 4.0', 'CC BY-ND 2.0', 'All rights reserved', '', undefined, 'Fair use']) assert.ok(!isAllowedLicense(bad), String(bad));
});

test('a person needs a clean slug, a name and a known category', () => {
    assert.doesNotThrow(() => validatePerson({ slug: 'tom-hanks', full_name: 'Tom Hanks', category: 'actors' }, true));
    assert.throws(() => validatePerson({ slug: 'Tom Hanks', full_name: 'x', category: 'actors' }, true));
    assert.throws(() => validatePerson({ slug: 'a', full_name: 'A', category: 'politicians' }, true));
    assert.throws(() => validatePerson({ slug: 'a', full_name: 'A', category: 'actors', country_code: 'USA' }, true));
});

test('an unpublished profile cannot be made indexable', () => {
    assert.throws(() => validatePerson({ indexable: true, published: false }, false));
    assert.doesNotThrow(() => validatePerson({ indexable: true, published: true }, false));
});

test('photos need a licence and a credit; links need a known kind', () => {
    assert.throws(() => validatePhoto({ license: 'CC BY-NC 4.0' }));
    assert.throws(() => validatePhoto({ credit: '  ' }));
    assert.doesNotThrow(() => validatePhoto({ license: 'CC0', credit: 'Someone' }));
    assert.throws(() => validateLink({ kind: 'party', target_slug: 'x' }, true));
    assert.doesNotThrow(() => validateLink({ kind: 'topic', target_slug: 'olympics' }, true));
});
