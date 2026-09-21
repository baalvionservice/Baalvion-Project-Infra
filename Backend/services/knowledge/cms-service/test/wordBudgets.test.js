'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { ruleFor, DEFAULTS } = require('../service/editorial/wordBudgets');

test('the site\'s own word rule always wins over a built-in default', () => {
    assert.deepStrictEqual(ruleFor([{ format: 'news', min: 400, max: 1200 }], 'news'), { min: 400, max: 1200 });
    assert.deepStrictEqual(ruleFor([{ format: 'brief', min: 200, max: 300 }], 'brief'), { min: 200, max: 300 });
});

test('a brief has a built-in 150 to 350 word budget when the site sets none, and news has none', () => {
    assert.deepStrictEqual(ruleFor([], 'brief'), DEFAULTS.brief);
    assert.deepStrictEqual(ruleFor(undefined, 'brief'), { min: 150, max: 350 });
    assert.strictEqual(ruleFor([], 'news'), null, 'news is only checked when the site defines a rule, as before');
});

test('a partial rule keeps the side it states and leaves the other open', () => {
    assert.deepStrictEqual(ruleFor([{ format: 'news', min: 500 }], 'news'), { min: 500, max: null });
    assert.strictEqual(ruleFor([{ format: 'news' }], 'news'), null);
});
