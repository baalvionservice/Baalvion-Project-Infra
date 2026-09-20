'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { validateCourt, validateCase } = require('../utils/legalValidation');

const okCase = { slug: 'marbury-v-madison', case_name: 'Marbury v. Madison', court_slug: 'supreme-court-of-the-united-states', status: 'concluded' };

test('a court needs a clean slug, a name and a known level', () => {
    assert.doesNotThrow(() => validateCourt({ slug: 'cairo-criminal-court', name: 'Cairo Criminal Court', level: 'trial' }, true));
    assert.throws(() => validateCourt({ slug: 'Cairo Court', name: 'x' }, true));
    assert.throws(() => validateCourt({ slug: 'a', name: 'A', level: 'galactic' }, true));
    assert.throws(() => validateCourt({ slug: 'a', name: 'A', url: 'http://insecure.example' }, true));
});

test('a case needs a slug, name and court, and a known status', () => {
    assert.doesNotThrow(() => validateCase(okCase, true));
    assert.throws(() => validateCase({ ...okCase, court_slug: '' }, true));
    assert.throws(() => validateCase({ ...okCase, status: 'won' }, true));
});

test('participants, dates and documents are checked row by row', () => {
    assert.doesNotThrow(() => validateCase({ ...okCase, parties: [{ name: 'William Marbury', role: 'Plaintiff' }], important_dates: [{ date: '1803-02-24', label: 'Decided' }] }, true));
    assert.throws(() => validateCase({ ...okCase, parties: [{ name: '', role: 'Plaintiff' }] }, true), /parties row 1/);
    assert.throws(() => validateCase({ ...okCase, judges: [{ name: 'X', role: 'Judge', personSlug: 'Bad Slug' }] }, true));
    assert.throws(() => validateCase({ ...okCase, important_dates: [{ date: 'yesterday', label: 'x' }] }, true), /date/);
    assert.throws(() => validateCase({ ...okCase, parties: 'not a list' }, true));
});

test('documents must be https links to a real source', () => {
    assert.doesNotThrow(() => validateCase({ ...okCase, documents: [{ title: 'Opinion', url: 'https://www.law.cornell.edu/x' }] }, true));
    assert.throws(() => validateCase({ ...okCase, documents: [{ title: 'Opinion', url: 'javascript:alert(1)' }] }, true));
    assert.throws(() => validateCase({ ...okCase, documents: [{ title: 'Opinion', url: 'http://plain.example' }] }, true));
});

test('an unpublished case or court cannot be indexable', () => {
    assert.throws(() => validateCase({ indexable: true, published: false }, false));
    assert.throws(() => validateCourt({ indexable: true, published: false }, false));
});
