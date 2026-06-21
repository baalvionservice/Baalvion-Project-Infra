/**
 * @file server/rules/__tests__/condition.test.ts
 * @description Unit tests for the safe condition evaluator + validator. No I/O.
 */
import { describe, it, expect } from 'vitest';
import { evaluateCondition, validateCondition, resolveFact, Condition } from '../condition';

describe('resolveFact', () => {
  it('resolves nested dot paths and returns undefined for gaps', () => {
    const facts = { trade: { amount: 1000, parties: { buyer: 'ACME' } } };
    expect(resolveFact(facts, 'trade.amount')).toBe(1000);
    expect(resolveFact(facts, 'trade.parties.buyer')).toBe('ACME');
    expect(resolveFact(facts, 'trade.missing.deep')).toBeUndefined();
  });

  it('refuses prototype-polluting paths', () => {
    expect(resolveFact({}, '__proto__.polluted')).toBeUndefined();
    expect(resolveFact({}, 'constructor.prototype')).toBeUndefined();
  });
});

describe('evaluateCondition — comparisons', () => {
  const facts = {
    destinationCountry: 'IR',
    amount: 1_500_000,
    commodity: 'Crude Oil',
    tags: ['dual-use', 'restricted'],
    name: 'Ivan Petrov',
  };

  it('eq / ne with case-insensitivity', () => {
    expect(evaluateCondition({ fact: 'destinationCountry', op: 'eq', value: 'ir', caseInsensitive: true }, facts)).toBe(true);
    expect(evaluateCondition({ fact: 'destinationCountry', op: 'eq', value: 'ir' }, facts)).toBe(false);
    expect(evaluateCondition({ fact: 'destinationCountry', op: 'ne', value: 'US' }, facts)).toBe(true);
  });

  it('numeric gt/gte/lt/between with string coercion', () => {
    expect(evaluateCondition({ fact: 'amount', op: 'gt', value: 1_000_000 }, facts)).toBe(true);
    expect(evaluateCondition({ fact: 'amount', op: 'between', value: [1_000_000, 2_000_000] }, facts)).toBe(true);
    expect(evaluateCondition({ fact: 'amount', op: 'lt', value: 1_000_000 }, facts)).toBe(false);
    expect(evaluateCondition({ fact: 'amount', op: 'gte', value: '1500000' }, facts)).toBe(true);
  });

  it('in / nin against arrays', () => {
    expect(evaluateCondition({ fact: 'destinationCountry', op: 'in', value: ['IR', 'KP', 'SY'] }, facts)).toBe(true);
    expect(evaluateCondition({ fact: 'destinationCountry', op: 'nin', value: ['US', 'GB'] }, facts)).toBe(true);
  });

  it('contains works on both arrays and strings', () => {
    expect(evaluateCondition({ fact: 'tags', op: 'contains', value: 'dual-use' }, facts)).toBe(true);
    expect(evaluateCondition({ fact: 'commodity', op: 'contains', value: 'oil', caseInsensitive: true }, facts)).toBe(true);
    expect(evaluateCondition({ fact: 'tags', op: 'ncontains', value: 'safe' }, facts)).toBe(true);
  });

  it('startsWith / endsWith / matches', () => {
    expect(evaluateCondition({ fact: 'commodity', op: 'startsWith', value: 'Crude' }, facts)).toBe(true);
    expect(evaluateCondition({ fact: 'name', op: 'matches', value: '^Ivan' }, facts)).toBe(true);
    expect(evaluateCondition({ fact: 'name', op: 'endsWith', value: 'rov' }, facts)).toBe(true);
  });

  it('exists with positive and negated forms', () => {
    expect(evaluateCondition({ fact: 'amount', op: 'exists' }, facts)).toBe(true);
    expect(evaluateCondition({ fact: 'missing', op: 'exists' }, facts)).toBe(false);
    expect(evaluateCondition({ fact: 'missing', op: 'exists', value: false }, facts)).toBe(true);
  });

  it('fails closed for an unknown comparator', () => {
    expect(evaluateCondition({ fact: 'amount', op: 'bogus' as 'eq', value: 1 }, facts)).toBe(false);
  });
});

describe('evaluateCondition — logical composition', () => {
  const facts = { country: 'IR', amount: 2_000_000, category: 'Defense' };

  it('all (AND), any (OR), not', () => {
    const cond: Condition = {
      all: [
        { fact: 'country', op: 'in', value: ['IR', 'KP'] },
        { any: [{ fact: 'amount', op: 'gt', value: 1_000_000 }, { fact: 'category', op: 'eq', value: 'Defense' }] },
        { not: { fact: 'country', op: 'eq', value: 'US' } },
      ],
    };
    expect(evaluateCondition(cond, facts)).toBe(true);
  });

  it('empty all is true, empty any is false', () => {
    expect(evaluateCondition({ all: [] }, facts)).toBe(true);
    expect(evaluateCondition({ any: [] }, facts)).toBe(false);
  });

  it('always constant', () => {
    expect(evaluateCondition({ always: true }, facts)).toBe(true);
    expect(evaluateCondition({ always: false }, facts)).toBe(false);
  });
});

describe('validateCondition', () => {
  it('accepts well-formed conditions', () => {
    expect(validateCondition({ fact: 'amount', op: 'gt', value: 10 })).toEqual([]);
    expect(validateCondition({ all: [{ fact: 'a', op: 'eq', value: 1 }] })).toEqual([]);
  });

  it('rejects unknown operators and malformed values', () => {
    expect(validateCondition({ fact: 'a', op: 'nope', value: 1 })).toHaveLength(1);
    expect(validateCondition({ fact: 'a', op: 'in', value: 'not-an-array' })).toHaveLength(1);
    expect(validateCondition({ fact: 'a', op: 'between', value: [1] })).toHaveLength(1);
    expect(validateCondition({ random: true })).toHaveLength(1);
  });
});
