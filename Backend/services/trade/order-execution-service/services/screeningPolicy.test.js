'use strict';
const { decide, decideForResult } = require('./screeningPolicy');

const confirmed = { status: 'CONFIRMED_MATCH', confidence: 1, matches: [{ name: 'X' }] };
const potential = { status: 'POTENTIAL_MATCH', confidence: 0.9, matches: [{ name: 'X' }] };
const clear = { status: 'CLEAR', confidence: 0, matches: [] };

describe('screeningPolicy.decideForResult', () => {
    test('CONFIRMED_MATCH blocks', () => {
        expect(decideForResult(confirmed).block).toBe(true);
    });
    test('POTENTIAL_MATCH blocks when blockOnPotential', () => {
        expect(decideForResult(potential, { blockOnPotential: true }).block).toBe(true);
    });
    test('POTENTIAL_MATCH allowed when blockOnPotential=false', () => {
        expect(decideForResult(potential, { blockOnPotential: false }).block).toBe(false);
    });
    test('CLEAR allows', () => {
        expect(decideForResult(clear).block).toBe(false);
    });
});

describe('screeningPolicy.decide', () => {
    test('all clear -> ALLOW', () => {
        const r = decide([{ party: { role: 'buyer' }, result: clear }, { party: { role: 'seller' }, result: clear }]);
        expect(r.decision).toBe('ALLOW');
    });
    test('one confirmed match -> BLOCK', () => {
        const r = decide([{ party: { role: 'seller' }, result: confirmed }, { party: { role: 'buyer' }, result: clear }]);
        expect(r.decision).toBe('BLOCK');
        expect(r.blocked[0].reason).toBe('CONFIRMED_MATCH');
    });
    test('engine error fails CLOSED by default', () => {
        const r = decide([{ party: { role: 'buyer' }, error: 'timeout' }]);
        expect(r.decision).toBe('BLOCK');
        expect(r.blocked[0].reason).toBe('SCREENING_UNAVAILABLE');
    });
    test('engine error allowed when failOpen', () => {
        const r = decide([{ party: { role: 'buyer' }, error: 'timeout' }], { failOpen: true });
        expect(r.decision).toBe('ALLOW');
    });
    test('potential allowed when blockOnPotential=false', () => {
        const r = decide([{ party: { role: 'buyer' }, result: potential }], { blockOnPotential: false });
        expect(r.decision).toBe('ALLOW');
    });
});
