'use strict';

// Pure-logic unit tests for the CMS -> glossary term block transform.
// No live database, no network — just word-count and block-mapping behaviour.
// Run: node --test  (built-in runner, no extra dependency)

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    wordCount,
    isGlossaryEligible,
    slugifyHeadingId,
    cmsBlocksToTermBlocks,
} = require('../utils/termBlockTransform');

test('wordCount counts whitespace-separated words', () => {
    assert.equal(wordCount('Bond'), 1);
    assert.equal(wordCount('GDP'), 1);
    assert.equal(wordCount('Interest Rate'), 2);
    assert.equal(wordCount('Compound Annual Growth Rate'), 4);
    assert.equal(wordCount('  Bond  '), 1);
    assert.equal(wordCount(''), 0);
});

test('wordCount treats a hyphenated compound as one word (whitespace-split rule)', () => {
    assert.equal(wordCount('T-Bill'), 1);
});

test('wordCount ignores trailing punctuation', () => {
    assert.equal(wordCount('Bond:'), 1);
});

test('isGlossaryEligible accepts 1-2 word titles by default and rejects longer ones', () => {
    assert.equal(isGlossaryEligible('Bond'), true);
    assert.equal(isGlossaryEligible('Interest Rate'), true);
    assert.equal(isGlossaryEligible('Compound Annual Growth Rate'), false);
    assert.equal(isGlossaryEligible(''), false);
});

test('isGlossaryEligible respects a custom maxWords threshold', () => {
    assert.equal(isGlossaryEligible('Compound Annual Growth Rate', 4), true);
    assert.equal(isGlossaryEligible('Interest Rate', 1), false);
});

test('slugifyHeadingId lowercases and hyphenates', () => {
    assert.equal(slugifyHeadingId('How Bonds Work'), 'how-bonds-work');
    assert.equal(slugifyHeadingId('  Extra  Spaces! '), 'extra-spaces');
});

test('cmsBlocksToTermBlocks maps paragraph via content.text', () => {
    const blocks = cmsBlocksToTermBlocks([
        { id: '1', type: 'paragraph', order: 0, content: { text: 'A bond is a loan.' } },
    ]);
    assert.deepEqual(blocks, [
        { type: 'paragraph', content: [{ type: 'text', content: 'A bond is a loan.' }] },
    ]);
});

test('cmsBlocksToTermBlocks reads content.value when content.text is absent', () => {
    const blocks = cmsBlocksToTermBlocks([
        { id: '1', type: 'paragraph', order: 0, content: { value: 'Alt-shaped block.' } },
    ]);
    assert.deepEqual(blocks, [
        { type: 'paragraph', content: [{ type: 'text', content: 'Alt-shaped block.' }] },
    ]);
});

test('cmsBlocksToTermBlocks skips a block with no usable text key, without throwing', () => {
    const blocks = cmsBlocksToTermBlocks([
        { id: '1', type: 'paragraph', order: 0, content: {} },
    ]);
    assert.deepEqual(blocks, []);
});

test('cmsBlocksToTermBlocks drops unmapped block types (e.g. video)', () => {
    const blocks = cmsBlocksToTermBlocks([
        { id: '1', type: 'paragraph', order: 0, content: { text: 'Kept.' } },
        { id: '2', type: 'video', order: 1, content: { url: 'https://example.com/v.mp4' } },
    ]);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, 'paragraph');
});

test('cmsBlocksToTermBlocks maps heading with a slugified id', () => {
    const blocks = cmsBlocksToTermBlocks([
        { id: '1', type: 'heading', order: 0, content: { text: 'How Bonds Work' } },
    ]);
    assert.deepEqual(blocks, [
        { type: 'heading', text: 'How Bonds Work', id: 'how-bonds-work' },
    ]);
});

test('cmsBlocksToTermBlocks maps image with url and optional caption', () => {
    const blocks = cmsBlocksToTermBlocks([
        { id: '1', type: 'image', order: 0, content: { url: 'https://example.com/bond.png', caption: 'A bond certificate' } },
    ]);
    assert.deepEqual(blocks, [
        { type: 'image', url: 'https://example.com/bond.png', caption: 'A bond certificate' },
    ]);
});

test('cmsBlocksToTermBlocks returns [] for non-array input', () => {
    assert.deepEqual(cmsBlocksToTermBlocks(undefined), []);
    assert.deepEqual(cmsBlocksToTermBlocks(null), []);
});
