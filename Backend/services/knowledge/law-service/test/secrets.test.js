'use strict';
const { test } = require('node:test');
const assert = require('node:assert');

const { validateProductionSecrets, getSecret } = require('../config/secrets');

test('getSecret prefers process.env', () => {
    process.env.__TEST_SECRET__ = 'from-env';
    assert.strictEqual(getSecret('__TEST_SECRET__'), 'from-env');
    delete process.env.__TEST_SECRET__;
    assert.strictEqual(getSecret('__TEST_SECRET__', 'fallback'), 'fallback');
});

test('validateProductionSecrets is a no-op outside production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    assert.doesNotThrow(() => validateProductionSecrets(['DEFINITELY_MISSING_KEY']));
    process.env.NODE_ENV = prev;
});

test('validateProductionSecrets throws on missing secret in production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    delete process.env.__REQUIRED__;
    assert.throws(() => validateProductionSecrets(['__REQUIRED__']), /__REQUIRED__ is missing/);
    process.env.NODE_ENV = prev;
});

test('validateProductionSecrets rejects placeholder values in production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.__REQUIRED__ = 'changeme';
    assert.throws(() => validateProductionSecrets(['__REQUIRED__']), /insecure placeholder/);
    delete process.env.__REQUIRED__;
    process.env.NODE_ENV = prev;
});

test('validateProductionSecrets passes with a real value in production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.__REQUIRED__ = 's0me-rea1-strong-secret-value';
    assert.doesNotThrow(() => validateProductionSecrets(['__REQUIRED__']));
    delete process.env.__REQUIRED__;
    process.env.NODE_ENV = prev;
});
