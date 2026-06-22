'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { scoreOne, MODEL_VERSION } = require('../modules/matching/service');

const opp = (over = {}) => ({
    min_ticket: 50000,
    published_at: new Date().toISOString(),
    company: { industry_code: 'fintech', stage: 'seed', country: 'IN' },
    ...over,
});

test('scoreOne: a full preference match scores high with reasons', () => {
    const pref = { industries: ['fintech'], stages: ['seed'], geographies: ['IN'], ticket_min: 10000, ticket_max: 100000 };
    const { score, reasons } = scoreOne(pref, opp());
    assert.ok(score > 80, `expected a high score, got ${score}`);
    assert.ok(reasons.some((r) => r.includes('Industry match')));
    assert.ok(reasons.some((r) => r.includes('Ticket size fits')));
});

test('scoreOne: an empty preference profile yields a neutral partial score', () => {
    const { score, reasons } = scoreOne({}, opp());
    assert.ok(score > 0 && score < 80, `expected a partial score, got ${score}`);
    assert.equal(reasons.length, 0);
});

test('scoreOne: a mismatched industry earns no industry reason', () => {
    const pref = { industries: ['biotech'], stages: [], geographies: [] };
    const { reasons } = scoreOne(pref, opp());
    assert.ok(!reasons.some((r) => r.includes('Industry match')));
});

test('scoreOne: score is capped at 100', () => {
    const pref = { industries: ['fintech'], stages: ['seed'], geographies: ['IN'], ticket_min: 0, ticket_max: 1000000 };
    const { score } = scoreOne(pref, opp());
    assert.ok(score <= 100);
});

test('matching: exposes a model version tag', () => {
    assert.equal(typeof MODEL_VERSION, 'string');
});
