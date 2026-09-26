'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { validateTopic } = require('../utils/topicValidation');

test('a topic needs a clean slug, a name the tagger can match and a known pillar', () => {
    assert.doesNotThrow(() => validateTopic({ slug: 'olympics', name: 'Olympics', pillar: 'sports', aliases: ['Olympic Games'] }, true));
    assert.throws(() => validateTopic({ slug: 'Olympics', name: 'Olympics' }, true));
    assert.throws(() => validateTopic({ slug: 'law', name: 'Law' }, true), /never matched/);
    assert.throws(() => validateTopic({ slug: 'x-topic', name: 'X Topic', pillar: 'politics' }, true));
});

test('aliases must be long enough to ever match', () => {
    assert.throws(() => validateTopic({ slug: 'x-topic', name: 'X Topic', aliases: ['ab'] }, true), /alias 1/);
    assert.throws(() => validateTopic({ slug: 'x-topic', name: 'X Topic', aliases: 'nope' }, true));
});

test('an unpublished topic cannot be indexable', () => {
    assert.throws(() => validateTopic({ indexable: true, published: false }, false));
});
