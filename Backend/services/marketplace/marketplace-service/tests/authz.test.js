'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isStaff, isPlatform, assertOwnerOrStaff } = require('../utils/authz');

test('isStaff: true for a compliance role, false otherwise', () => {
    assert.equal(isStaff({ roles: ['compliance'] }), true);
    assert.equal(isStaff({ roles: ['investor'] }), false);
    assert.equal(isStaff({}), false);
    assert.equal(isStaff(undefined), false);
});

test('isPlatform: only platform-tier roles qualify', () => {
    assert.equal(isPlatform({ roles: ['platform_admin'] }), true);
    assert.equal(isPlatform({ roles: ['admin'] }), false); // staff but not platform
});

test('assertOwnerOrStaff: staff may modify any org', () => {
    assert.doesNotThrow(() => assertOwnerOrStaff('org-a', { orgId: 'org-z', roles: ['admin'] }));
});

test('assertOwnerOrStaff: owner of the same org may modify', () => {
    assert.doesNotThrow(() => assertOwnerOrStaff('org-a', { orgId: 'org-a', roles: [] }));
});

test('assertOwnerOrStaff: a different org without staff is forbidden', () => {
    assert.throws(
        () => assertOwnerOrStaff('org-a', { orgId: 'org-b', roles: ['investor'] }),
        (err) => err.code === 'FORBIDDEN' && err.statusCode === 403,
    );
});

test('assertOwnerOrStaff: missing user is forbidden', () => {
    assert.throws(() => assertOwnerOrStaff('org-a', undefined), (err) => err.statusCode === 403);
});
