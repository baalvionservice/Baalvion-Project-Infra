'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { claimReport } = require('../service/editorial/claimCheck');
const metrics = require('../service/editorial/textMetrics');

const body = 'Taylor Tomlinson has released four Netflix stand-up specials since 2020. She hosted the late-night show After Midnight for a period. The tour stops in Rochester in October 2026. Tickets are on sale now.';
const citations = [
    { claim: 'Taylor Tomlinson has released four Netflix stand-up specials since 2020', sourceName: 'Wikipedia', sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Tomlinson' },
];

test('every sentence is listed in order, with the source that backs it', () => {
    const r = claimReport(body, citations);
    assert.strictEqual(r.sentences.length, 4);
    assert.strictEqual(r.sentences[0].source.name, 'Wikipedia');
    assert.strictEqual(r.sentences[0].source.url, 'https://en.wikipedia.org/wiki/Taylor_Tomlinson');
});

test('a sentence with a figure and no matching citation is counted as an uncited claim', () => {
    const r = claimReport(body, citations);
    assert.strictEqual(r.sentences[2].checkable, true);
    assert.strictEqual(r.sentences[2].source, null);
    assert.strictEqual(r.uncited, 1);
    assert.strictEqual(r.checkable, 2);
});

test('plain sentences with no figure are shown but never counted as claims', () => {
    const r = claimReport(body, citations);
    assert.strictEqual(r.sentences[1].checkable, false);
    assert.strictEqual(r.sentences[3].checkable, false);
});

test('the panel agrees with the gate: its uncited share matches citationCoveragePct', () => {
    const r = claimReport(body, citations);
    const coverage = Math.round(((r.checkable - r.uncited) / r.checkable) * 10000) / 100;
    assert.strictEqual(coverage, metrics.citationCoveragePct(body, citations));
});

test('no citations at all means every claim is uncited, and no claims means nothing to flag', () => {
    assert.strictEqual(claimReport(body, []).uncited, 2);
    assert.strictEqual(claimReport('Nothing here has a figure or a quotation in it at all.', []).uncited, 0);
});

test('a plain statement with no source is reported as unsourced, but a "we do not know" line is not', () => {
    const text = 'The festival is considered one of the most prestigious in the world. The dates for the return have not yet been announced. The film won the top prize in 2026.';
    const r = claimReport(text, [{ claim: 'The film won the top prize in 2026', sourceName: 'Variety', sourceUrl: 'https://v.test/1' }]);
    assert.strictEqual(r.sentences[0].disclaimer, false);
    assert.strictEqual(r.sentences[1].disclaimer, true);
    assert.strictEqual(r.unsourced, 1, 'only the "most prestigious" sentence');
    assert.strictEqual(r.uncited, 0);
});
