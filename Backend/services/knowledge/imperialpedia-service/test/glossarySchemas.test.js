'use strict';

// Pure-logic unit tests for the glossary Zod schemas.
// No live database, no network — just schema parse/validate behaviour.
// Run: node --test  (built-in runner, no extra dependency)

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    createTermSchema,
    updateTermSchema,
    listQuerySchema,
    exampleSchema,
    relationInputSchema,
} = require('../validators/glossarySchemas');

test('createTermSchema accepts a minimal valid term and applies defaults', () => {
    const result = createTermSchema.safeParse({
        term: 'Compound Interest',
        short_def: 'Interest on interest.',
        full_def: 'Interest calculated on the initial principal and accumulated interest.',
    });

    assert.equal(result.success, true);
    // Defaults fill in for the optional collections + difficulty/status.
    assert.deepEqual(result.data.aliases, []);
    assert.deepEqual(result.data.references, []);
    assert.deepEqual(result.data.examples, []);
    assert.deepEqual(result.data.relations, []);
    assert.equal(result.data.difficulty, 'beginner');
    assert.equal(result.data.status, 'draft');
});

test('createTermSchema rejects a term missing required fields', () => {
    const result = createTermSchema.safeParse({ term: 'Orphan' });
    assert.equal(result.success, false);
    const fields = result.error.flatten().fieldErrors;
    assert.ok(fields.short_def, 'short_def should be required');
    assert.ok(fields.full_def, 'full_def should be required');
});

test('createTermSchema rejects an invalid slug pattern', () => {
    const result = createTermSchema.safeParse({
        term: 'Bad Slug',
        slug: 'Not A Slug!',
        short_def: 'x',
        full_def: 'y',
    });
    assert.equal(result.success, false);
});

test('reference URLs are restricted to http/https (blocks javascript: stored XSS)', () => {
    const ok = createTermSchema.safeParse({
        term: 'Linked',
        short_def: 'x',
        full_def: 'y',
        references: [{ title: 'Source', url: 'https://example.com', kind: 'web' }],
    });
    assert.equal(ok.success, true);

    const bad = createTermSchema.safeParse({
        term: 'Linked',
        short_def: 'x',
        full_def: 'y',
        references: [{ title: 'Bad', url: 'javascript:alert(1)', kind: 'web' }],
    });
    assert.equal(bad.success, false);
});

test('updateTermSchema is a permissive partial of createTermSchema', () => {
    // Empty patch is valid; a single-field patch is valid.
    assert.equal(updateTermSchema.safeParse({}).success, true);
    assert.equal(updateTermSchema.safeParse({ status: 'published' }).success, true);
    // But field-level validation still applies.
    assert.equal(updateTermSchema.safeParse({ status: 'not-a-status' }).success, false);
});

test('listQuerySchema coerces query strings and caps limit at 200', () => {
    const result = listQuerySchema.safeParse({ page: '2', limit: '50' });
    assert.equal(result.success, true);
    assert.equal(result.data.page, 2);
    assert.equal(result.data.limit, 50);

    // Above the cap is rejected (the pagination ceiling holds).
    assert.equal(listQuerySchema.safeParse({ limit: '5000' }).success, false);
});

test('listQuerySchema supplies page/limit defaults when omitted', () => {
    const result = listQuerySchema.safeParse({});
    assert.equal(result.success, true);
    assert.equal(result.data.page, 1);
    assert.equal(result.data.limit, 50);
});

test('exampleSchema requires a body and defaults sort_order to 0', () => {
    const result = exampleSchema.safeParse({ body: 'An example.' });
    assert.equal(result.success, true);
    assert.equal(result.data.sort_order, 0);

    assert.equal(exampleSchema.safeParse({ title: 'No body' }).success, false);
});

test('relationInputSchema requires a uuid related_id and defaults relation', () => {
    const result = relationInputSchema.safeParse({
        related_id: '11111111-1111-1111-1111-111111111111',
    });
    assert.equal(result.success, true);
    assert.equal(result.data.relation, 'related');

    assert.equal(relationInputSchema.safeParse({ related_id: 'not-a-uuid' }).success, false);
});
