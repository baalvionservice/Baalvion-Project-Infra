'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { isEntityType, isSlug } = require('../utils/memberValidation');

test('isEntityType accepts only known entity types', () => {
    assert.ok(isEntityType('person'));
    assert.ok(isEntityType('sports-team'));
    assert.ok(!isEntityType('politician'));
    assert.ok(!isEntityType(undefined));
});

test('isSlug rejects anything that is not a lowercase slug', () => {
    assert.ok(isSlug('tom-hanks'));
    assert.ok(!isSlug('Tom Hanks'));
    assert.ok(!isSlug('../etc/passwd'));
    assert.ok(!isSlug('-leading'));
    assert.ok(!isSlug('a'.repeat(201)));
    assert.ok(!isSlug(42));
});
