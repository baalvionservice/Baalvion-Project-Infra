'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const registry = require('../../connectors/registry');
const internalCms = require('../../connectors/internalCms');

test('register + get + list a connector', () => {
    const before = registry.list().length;
    registry.register(internalCms);
    assert.equal(registry.get('internal_cms').provider, 'internal_cms');
    assert.ok(registry.list().length >= before);
});

test('register rejects a connector without a sync()', () => {
    assert.throws(() => registry.register({ provider: 'broken' }), /must implement sync/);
});

test('register rejects a connector without a provider', () => {
    assert.throws(() => registry.register({ sync() {} }), /provider is required/);
});

test('PROVIDER_CATALOG advertises the flagship providers with required creds', () => {
    const ga4 = registry.PROVIDER_CATALOG.find((p) => p.provider === 'ga4');
    assert.ok(ga4);
    assert.equal(ga4.category, 'traffic');
    assert.ok(ga4.requiredCreds.includes('refreshToken'));
    // Every catalog entry has the required shape.
    for (const p of registry.PROVIDER_CATALOG) {
        assert.equal(typeof p.provider, 'string');
        assert.equal(typeof p.category, 'string');
        assert.ok(Array.isArray(p.requiredCreds));
    }
});

test('internalCms connector has the CMS-module shape', () => {
    assert.equal(internalCms.provider, 'internal_cms');
    assert.equal(internalCms.category, 'cms');
    assert.deepEqual(internalCms.requiredCreds, []);
    assert.equal(typeof internalCms.sync, 'function');
});
