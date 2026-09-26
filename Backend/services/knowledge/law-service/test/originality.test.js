'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { overlap, passes } = require('../utils/originality');

const source = 'She was an American lawyer and jurist who served as an associate justice of the Supreme Court of the United States from 1993 until her death.';

test('a copied sentence fails', () => {
    const r = overlap(source, source);
    assert.ok(!passes(r));
    assert.ok(r.longestRun >= 20);
});

test('facts restated in new words pass', () => {
    const r = overlap('Her 27 years on the nation’s highest court began in 1993 and ended with her death.', source);
    assert.ok(passes(r), JSON.stringify(r));
});
