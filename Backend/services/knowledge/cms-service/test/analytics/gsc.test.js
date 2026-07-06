'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const gsc = require('../../connectors/gsc');

test('gsc connector has the expected shape', () => {
    assert.equal(gsc.provider, 'gsc');
    assert.equal(gsc.category, 'seo');
    assert.ok(gsc.requiredCreds.includes('siteUrl'));
    assert.ok(gsc.requiredCreds.includes('refreshToken'));
    assert.equal(typeof gsc.sync, 'function');
});

test('gsc.validate throws when a credential is missing', () => {
    assert.throws(() => gsc.validate({ siteUrl: 'https://x/', oauthClientId: 'a' }), /missing credential/);
});

test('gsc.validate passes with all credentials present', () => {
    assert.doesNotThrow(() => gsc.validate({
        siteUrl: 'https://x/', oauthClientId: 'a', oauthClientSecret: 'b', refreshToken: 'c',
    }));
});
