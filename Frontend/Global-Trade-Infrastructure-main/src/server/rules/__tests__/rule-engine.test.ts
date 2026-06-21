/**
 * @file server/rules/__tests__/rule-engine.test.ts
 * @description Unit tests for evaluateRuleSet — selector pre-filtering, time
 * windows, conflict-resolution strategies, obligations and the default decision.
 * No I/O; rule sets are hand-built fixtures.
 */
import { describe, it, expect } from 'vitest';
import { evaluateRuleSet } from '../rule-engine';
import { RuleDefinition, RuleSetDefinition, ConflictStrategy, Effect } from '../types';

const NOW = new Date('2026-06-21T00:00:00.000Z');

function rule(over: Partial<RuleDefinition> & { key: string; condition: RuleDefinition['condition']; effect: Effect | Effect[] }): RuleDefinition {
  return {
    id: `id-${over.key}`,
    name: over.key,
    priority: 0,
    status: 'ACTIVE',
    direction: 'BOTH',
    ...over,
  };
}

function ruleSet(strategy: ConflictStrategy, rules: RuleDefinition[], defaultDecision: RuleSetDefinition['defaultDecision'] = 'ALLOW'): RuleSetDefinition {
  return {
    id: 'set-1',
    key: 'test-set',
    name: 'Test Set',
    category: 'TEST',
    status: 'ACTIVE',
    conflictStrategy: strategy,
    defaultDecision,
    rules,
  };
}

describe('evaluateRuleSet — pre-filtering', () => {
  it('applies the default decision when nothing matches', () => {
    const set = ruleSet('DENY_OVERRIDES', [rule({ key: 'r1', condition: { fact: 'x', op: 'eq', value: 1 }, effect: { type: 'DENY' } })]);
    const res = evaluateRuleSet(set, { x: 2 }, { now: NOW });
    expect(res.decision).toBe('ALLOW');
    expect(res.defaultApplied).toBe(true);
    expect(res.matches).toHaveLength(0);
  });

  it('skips rules whose selectors do not match the facts', () => {
    const set = ruleSet('DENY_OVERRIDES', [
      rule({ key: 'kp-only', country: 'KP', condition: { always: true }, effect: { type: 'DENY' } }),
    ]);
    expect(evaluateRuleSet(set, { country: 'IR' }, { now: NOW }).decision).toBe('ALLOW');
    expect(evaluateRuleSet(set, { country: 'KP' }, { now: NOW }).decision).toBe('DENY');
  });

  it('honours rule effective/expiry windows', () => {
    const expired = rule({
      key: 'expired',
      condition: { always: true },
      effect: { type: 'DENY' },
      effectiveTo: '2020-01-01T00:00:00.000Z',
    });
    expect(evaluateRuleSet(ruleSet('DENY_OVERRIDES', [expired]), {}, { now: NOW }).decision).toBe('ALLOW');
  });

  it('a suspended set matches nothing', () => {
    const set = ruleSet('DENY_OVERRIDES', [rule({ key: 'r', condition: { always: true }, effect: { type: 'DENY' } })]);
    const suspended = { ...set, status: 'SUSPENDED' as const };
    expect(evaluateRuleSet(suspended, {}, { now: NOW }).decision).toBe('ALLOW');
  });
});

describe('evaluateRuleSet — conflict strategies', () => {
  const allow = rule({ key: 'allow', priority: 1, condition: { always: true }, effect: { type: 'ALLOW' } });
  const deny = rule({ key: 'deny', priority: 5, condition: { always: true }, effect: { type: 'DENY' } });
  const review = rule({ key: 'review', priority: 3, condition: { always: true }, effect: { type: 'REVIEW' } });

  it('DENY_OVERRIDES: any deny wins regardless of priority', () => {
    expect(evaluateRuleSet(ruleSet('DENY_OVERRIDES', [allow, review, deny]), {}, { now: NOW }).decision).toBe('DENY');
  });

  it('ALLOW_OVERRIDES: any allow wins', () => {
    expect(evaluateRuleSet(ruleSet('ALLOW_OVERRIDES', [deny, review, allow]), {}, { now: NOW }).decision).toBe('ALLOW');
  });

  it('PRIORITY: the highest-priority matching rule decides', () => {
    expect(evaluateRuleSet(ruleSet('PRIORITY', [allow, review, deny]), {}, { now: NOW }).decision).toBe('DENY');
    const lowDeny = { ...deny, priority: 0 };
    expect(evaluateRuleSet(ruleSet('PRIORITY', [{ ...allow, priority: 9 }, review, lowDeny]), {}, { now: NOW }).decision).toBe('ALLOW');
  });

  it('FIRST_MATCH: only the first (priority-ordered) matching rule applies', () => {
    const res = evaluateRuleSet(ruleSet('FIRST_MATCH', [allow, review, deny]), {}, { now: NOW });
    expect(res.decision).toBe('DENY'); // deny has highest priority, evaluated first
    expect(res.matches).toHaveLength(1);
  });

  it('ALL_MATCH: collects every match, most-severe decision wins', () => {
    const res = evaluateRuleSet(ruleSet('ALL_MATCH', [allow, review]), {}, { now: NOW });
    expect(res.decision).toBe('REVIEW');
    expect(res.matches).toHaveLength(2);
  });
});

describe('evaluateRuleSet — obligations', () => {
  it('collects non-decisional effects from matched rules', () => {
    const set = ruleSet('DENY_OVERRIDES', [
      rule({
        key: 'license',
        country: 'IR',
        condition: { fact: 'amount', op: 'gt', value: 1000 },
        effect: [
          { type: 'REVIEW' },
          { type: 'REQUIRE_LICENSE', params: { license: 'EXPORT_CTRL' }, message: 'Export licence required' },
        ],
      }),
    ]);
    const res = evaluateRuleSet(set, { country: 'IR', amount: 5000 }, { now: NOW });
    expect(res.decision).toBe('REVIEW');
    expect(res.obligations).toEqual([
      { type: 'REQUIRE_LICENSE', params: { license: 'EXPORT_CTRL' }, message: 'Export licence required' },
    ]);
  });
});

describe('evaluateRuleSet — replaces a hardcoded sanctions list with data', () => {
  // The legacy compliance engine hardcoded SANCTIONED_COUNTRIES = {IR,KP,SY,CU,RU}.
  // Expressed as data, the same behaviour is a single rule, editable without deploys.
  const sanctions = ruleSet('DENY_OVERRIDES', [
    rule({
      key: 'sanctioned-destinations',
      condition: { fact: 'destinationCountry', op: 'in', value: ['IR', 'KP', 'SY', 'CU', 'RU'] },
      effect: { type: 'DENY', message: 'Destination is under comprehensive sanctions' },
    }),
  ]);

  it('denies a sanctioned destination and allows a clear one', () => {
    expect(evaluateRuleSet(sanctions, { destinationCountry: 'IR' }, { now: NOW }).decision).toBe('DENY');
    expect(evaluateRuleSet(sanctions, { destinationCountry: 'DE' }, { now: NOW }).decision).toBe('ALLOW');
  });
});
