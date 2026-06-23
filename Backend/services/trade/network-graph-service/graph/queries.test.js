'use strict';
/**
 * Pure-logic tests for the allowlisted Cypher template registry.
 * No live Neo4j or network — these exercise template construction and the
 * hop-clamping that keeps variable-length bounds injection-safe.
 *   node --test
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const { NODE_LABELS, EDGE_TYPES, TEMPLATES, clampHops } = require('./queries');

test('clampHops returns the fallback for non-numeric input', () => {
    assert.equal(clampHops(undefined, 6, 10), 6);
    assert.equal(clampHops('abc', 4, 8), 4);
    assert.equal(clampHops(null, 5, 9), 5);
});

test('clampHops returns the fallback for values below 1', () => {
    assert.equal(clampHops('0', 6, 10), 6);
    assert.equal(clampHops('-3', 6, 10), 6);
});

test('clampHops caps values at the maximum', () => {
    assert.equal(clampHops('99', 6, 10), 10);
    assert.equal(clampHops('8', 4, 8), 8);
});

test('clampHops passes through in-range integers', () => {
    assert.equal(clampHops('3', 6, 10), 3);
    assert.equal(clampHops('1', 6, 10), 1);
});

test('NODE_LABELS / EDGE_TYPES allowlists gate membership', () => {
    assert.ok(NODE_LABELS.has('Organization'));
    assert.ok(NODE_LABELS.has('SanctionedEntity'));
    assert.equal(NODE_LABELS.has('Dropped'), false);
    assert.ok(EDGE_TYPES.has('SUPPLIES'));
    assert.ok(EDGE_TYPES.has('MATCHES_SANCTION'));
    assert.equal(EDGE_TYPES.has('DELETE'), false);
});

test('neighbors template honors direction and never inlines $id', () => {
    const out = TEMPLATES.neighbors({ id: 'n1', direction: 'out' });
    assert.match(out.cypher, /-\[r\]->\(m\)/);
    const inn = TEMPLATES.neighbors({ id: 'n1', direction: 'in' });
    assert.match(inn.cypher, /<-\[r\]-\(m\)/);
    const both = TEMPLATES.neighbors({ id: 'n1' });
    assert.match(both.cypher, /\(n \{id:\$id\}\)-\[r\]-\(m\)/);
    // id is always a Cypher parameter, never string-concatenated.
    assert.ok(both.cypher.includes('$id'));
    assert.equal(both.cypher.includes('n1'), false);
});

test('shortestPath inlines a clamped literal hop bound', () => {
    const clamped = TEMPLATES.shortestPath({ maxHops: '999' });
    assert.match(clamped.cypher, /\[\*\.\.10\]/);
    const fallback = TEMPLATES.shortestPath({});
    assert.match(fallback.cypher, /\[\*\.\.6\]/);
});

test('sanctionPath inlines a clamped literal hop bound and orders by score', () => {
    const t = TEMPLATES.sanctionPath({ maxHops: '999' });
    assert.match(t.cypher, /\[\*\.\.8\]/);
    assert.match(t.cypher, /ORDER BY score DESC/);
});

test('TEMPLATES registry is frozen and contains only allowlisted keys', () => {
    assert.ok(Object.isFrozen(TEMPLATES));
    assert.deepEqual(Object.keys(TEMPLATES).sort(), ['neighbors', 'sanctionPath', 'shortestPath']);
    assert.equal(TEMPLATES.maliciousKey, undefined);
});
