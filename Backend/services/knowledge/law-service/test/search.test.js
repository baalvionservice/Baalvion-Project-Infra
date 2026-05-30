'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { toPrefixTsQuery } = require('../utils/search');

test('builds prefix tsquery from multi-word input', () => {
    assert.strictEqual(toPrefixTsQuery('ame sto'), 'ame:* & sto:*');
});

test('single token', () => {
    assert.strictEqual(toPrefixTsQuery('immigration'), 'immigration:*');
});

test('strips punctuation / tsquery operators (no injection)', () => {
    assert.strictEqual(toPrefixTsQuery("o'brien & co | x:"), 'o:* & brien:* & co:* & x:*');
});

test('empty / whitespace / null -> null', () => {
    assert.strictEqual(toPrefixTsQuery(''), null);
    assert.strictEqual(toPrefixTsQuery('   '), null);
    assert.strictEqual(toPrefixTsQuery(null), null);
    assert.strictEqual(toPrefixTsQuery(undefined), null);
});

test('caps token count at 10', () => {
    const q = toPrefixTsQuery('a b c d e f g h i j k l m');
    assert.strictEqual(q.split('&').length, 10);
});

test('handles unicode letters', () => {
    assert.strictEqual(toPrefixTsQuery('José Müller'), 'josé:* & müller:*');
});
