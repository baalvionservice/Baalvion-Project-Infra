'use strict';
// Quote verification in the charter gate, offline: models are stubbed like the other tests here.
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const stub = (rel, exports) => { require.cache[require.resolve(path.join(__dirname, rel))] = { id: rel, filename: rel, loaded: true, exports }; };
stub('../models', { CmsStoryBrief: {}, CmsArticleDraft: {}, CmsArticleArt: {}, CmsCategory: {}, CmsContent: {}, CmsWebsite: {} });
const { evaluateCharterGates } = require('../service/editorial/gateService');

const charter = { requireQuoteVerification: true, minSources: 2, bannedClaims: [], requiredSections: [], minCitationCoveragePct: 50, maxSimilarityPct: 30 };
const brief = {
    sources: [{ name: 'A', url: 'https://a.test/1' }, { name: 'B', url: 'https://b.test/2', title: 'Tomlinson brings ‘Nobody Asked You To Do That’ tour to Rochester' }],
    facts: [{ statement: 'She has released the Netflix special "Have It All Together" in 2024.', sourceUrl: 'https://a.test/1' }],
    quotes: [{ text: 'We are thrilled to announce these new dates', sourceUrl: 'https://a.test/1' }],
};
const draftWith = (text) => ({ title: 't', dek: 'd', contentBlocks: [{ type: 'html', content: { html: `<p>${text}</p>` } }] });
const quoteResult = (text) => evaluateCharterGates(charter, brief, draftWith(text)).find((r) => r.rule === 'quoteVerification');

test('a quoted title that stands in the brief\'s facts or source headlines is not treated as an invented quote', () => {
    assert.strictEqual(quoteResult('Her tour, "Nobody Asked You To Do That", stops in Rochester.').status, 'passed');
    assert.strictEqual(quoteResult('She released "Have It All Together" in 2024.').status, 'passed');
});

test('a verbatim quote from the brief still passes', () => {
    assert.strictEqual(quoteResult('The team said "We are thrilled to announce these new dates" this week.').status, 'passed');
});

test('words in quotation marks that appear nowhere in the brief still fail', () => {
    const r = quoteResult('She told reporters "this is the best tour I have ever done in my whole career".');
    assert.strictEqual(r.status, 'failed');
});

test('short quoted titles do not make the words between them look like a quotation', () => {
    const b = { ...brief, facts: [{ statement: 'Her Netflix specials are "Quarter-Life Crisis", "Look At You", "Have It All Together" and "Prodigal Daughter".', sourceUrl: 'https://a.test/1' }] };
    const text = 'Her specials are "Quarter-Life Crisis" in 2020, "Look At You" in 2022, "Have It All Together" in 2024, and "Prodigal Daughter" in 2026.';
    const r = evaluateCharterGates(charter, b, draftWith(text)).find((x) => x.rule === 'quoteVerification');
    assert.strictEqual(r.status, 'passed', r.message);
});

test('trailing punctuation inside the quotation marks does not stop a title from matching', () => {
    const b = { ...brief, facts: [{ statement: 'She hosted the CBS late-night show After Midnight, which ran until June 2025.', sourceUrl: 'https://a.test/1' }] };
    const r = evaluateCharterGates(charter, b, draftWith('She also hosted "After Midnight."')).find((x) => x.rule === 'quoteVerification');
    assert.strictEqual(r.status, 'passed', r.message);
});
