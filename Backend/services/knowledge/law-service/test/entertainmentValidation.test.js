'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { validateEntertainment } = require('../utils/entertainmentValidation');

const ok = { slug: 'forrest-gump', title: 'Forrest Gump', type: 'movie', release_date: '1994-07-06' };

test('an entry needs a slug, a title and a known type', () => {
    assert.doesNotThrow(() => validateEntertainment(ok, true));
    assert.throws(() => validateEntertainment({ ...ok, type: 'podcast' }, true));
    assert.throws(() => validateEntertainment({ ...ok, slug: 'Forrest Gump' }, true));
    assert.throws(() => validateEntertainment({ ...ok, release_date: 'summer 1994' }, true));
});

test('credits, related entries and links are checked row by row', () => {
    assert.doesNotThrow(() => validateEntertainment({ ...ok, people_involved: [{ personSlug: 'tom-hanks', role: 'Actor', character: 'Forrest Gump' }], related_entities: [{ slug: 'jaws', relationship: 'Same director' }] }, true));
    assert.throws(() => validateEntertainment({ ...ok, people_involved: [{ personSlug: 'Tom Hanks', role: 'Actor' }] }, true), /credits row 1/);
    assert.throws(() => validateEntertainment({ ...ok, people_involved: [{ personSlug: 'tom-hanks', role: '' }] }, true));
    assert.throws(() => validateEntertainment({ ...ok, related_entities: [{}] }, true));
});

test('videos and interviews must be https links with a title', () => {
    assert.doesNotThrow(() => validateEntertainment({ ...ok, videos: [{ title: 'Trailer', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', publishedAt: '1994' }] }, true));
    assert.throws(() => validateEntertainment({ ...ok, videos: [{ title: 'Trailer', url: 'http://plain.example' }] }, true));
    assert.throws(() => validateEntertainment({ ...ok, interviews: [{ title: '', url: 'https://x.example' }] }, true));
    assert.throws(() => validateEntertainment({ ...ok, videos: [{ title: 'T', url: 'javascript:alert(1)' }] }, true));
});

test('an unpublished entry cannot be indexable', () => {
    assert.throws(() => validateEntertainment({ indexable: true, published: false }, false));
});
