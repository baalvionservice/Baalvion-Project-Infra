/**
 * @file server/rules/condition.ts
 * @description Safe, structured condition language for the Rule Engine.
 *
 * Conditions are stored as DATA (a JSON AST), never as evaluated strings — there
 * is no `eval`, no `new Function`, and no string-matching DSL. The evaluator is
 * pure and deterministic: given the same AST + facts it always returns the same
 * boolean, which makes rule evaluation replayable and unit-testable in isolation.
 *
 * Grammar (discriminated union):
 *   { always: true|false }                         constant
 *   { fact, op, value?, caseInsensitive? }         comparison
 *   { all:  Condition[] }                           logical AND (empty => true)
 *   { any:  Condition[] }                           logical OR  (empty => false)
 *   { not:  Condition }                             negation
 */

export type Comparator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'ncontains'
  | 'startsWith'
  | 'endsWith'
  | 'matches'
  | 'exists'
  | 'between';

export const COMPARATORS: readonly Comparator[] = [
  'eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin',
  'contains', 'ncontains', 'startsWith', 'endsWith', 'matches', 'exists', 'between',
];

export interface ComparisonNode {
  /** Dot-path into the facts object, e.g. "trade.amount" or "destinationCountry". */
  fact: string;
  op: Comparator;
  value?: unknown;
  /** Case-insensitive string comparison (eq/ne/contains/startsWith/endsWith/in/nin). */
  caseInsensitive?: boolean;
}

export interface AllNode {
  all: Condition[];
}
export interface AnyNode {
  any: Condition[];
}
export interface NotNode {
  not: Condition;
}
export interface AlwaysNode {
  always: boolean;
}

export type Condition = ComparisonNode | AllNode | AnyNode | NotNode | AlwaysNode;

/** Facts are an arbitrary, read-only object graph supplied by the caller. */
export type Facts = Record<string, unknown>;

/** Longest regex we will compile from a rule (ReDoS guard for `matches`). */
const MAX_REGEX_LENGTH = 512;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Safe dot-path resolution. Returns `undefined` for any missing segment. */
export function resolveFact(facts: Facts, path: string): unknown {
  if (!path) return undefined;
  const segments = path.split('.');
  let current: unknown = facts;
  for (const segment of segments) {
    if (!isObject(current)) return undefined;
    // Guard against prototype-pollution style lookups.
    if (segment === '__proto__' || segment === 'constructor' || segment === 'prototype') {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isNaN(value) ? null : value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function toComparable(value: unknown): { kind: 'number'; v: number } | { kind: 'date'; v: number } | { kind: 'string'; v: string } | null {
  const n = toNumber(value);
  if (n !== null) return { kind: 'number', v: n };
  if (value instanceof Date) return { kind: 'date', v: value.getTime() };
  if (typeof value === 'string') {
    const t = Date.parse(value);
    if (!Number.isNaN(t)) return { kind: 'date', v: t };
    return { kind: 'string', v: value };
  }
  return null;
}

/** Ordered comparison usable by gt/gte/lt/lte/between. Returns null if incomparable. */
function order(a: unknown, b: unknown): number | null {
  const ca = toComparable(a);
  const cb = toComparable(b);
  if (!ca || !cb) return null;
  if (ca.kind === 'string' || cb.kind === 'string') {
    const sa = String(ca.kind === 'string' ? ca.v : a);
    const sb = String(cb.kind === 'string' ? cb.v : b);
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  }
  return ca.v < cb.v ? -1 : ca.v > cb.v ? 1 : 0;
}

function norm(value: unknown, ci: boolean): unknown {
  return ci && typeof value === 'string' ? value.toLowerCase() : value;
}

function looseEq(a: unknown, b: unknown, ci: boolean): boolean {
  const na = norm(a, ci);
  const nb = norm(b, ci);
  if (na === nb) return true;
  // Numeric equivalence ("100" == 100) without surprising string coercion of objects.
  const oa = toNumber(a);
  const ob = toNumber(b);
  if (oa !== null && ob !== null) return oa === ob;
  return false;
}

function evalComparison(node: ComparisonNode, facts: Facts): boolean {
  const left = resolveFact(facts, node.fact);
  const { op, value, caseInsensitive: ci = false } = node;

  switch (op) {
    case 'exists':
      return value === false ? left === undefined || left === null : left !== undefined && left !== null;
    case 'eq':
      return looseEq(left, value, ci);
    case 'ne':
      return !looseEq(left, value, ci);
    case 'gt': {
      const c = order(left, value);
      return c !== null && c > 0;
    }
    case 'gte': {
      const c = order(left, value);
      return c !== null && c >= 0;
    }
    case 'lt': {
      const c = order(left, value);
      return c !== null && c < 0;
    }
    case 'lte': {
      const c = order(left, value);
      return c !== null && c <= 0;
    }
    case 'between': {
      if (!Array.isArray(value) || value.length !== 2) return false;
      const lo = order(left, value[0]);
      const hi = order(left, value[1]);
      return lo !== null && hi !== null && lo >= 0 && hi <= 0;
    }
    case 'in':
      return Array.isArray(value) && value.some((candidate) => looseEq(left, candidate, ci));
    case 'nin':
      return !(Array.isArray(value) && value.some((candidate) => looseEq(left, candidate, ci)));
    case 'contains': {
      if (Array.isArray(left)) return left.some((item) => looseEq(item, value, ci));
      if (typeof left === 'string') {
        return String(norm(left, ci)).includes(String(norm(value, ci)));
      }
      return false;
    }
    case 'ncontains': {
      if (Array.isArray(left)) return !left.some((item) => looseEq(item, value, ci));
      if (typeof left === 'string') {
        return !String(norm(left, ci)).includes(String(norm(value, ci)));
      }
      return true;
    }
    case 'startsWith':
      return typeof left === 'string' && String(norm(left, ci)).startsWith(String(norm(value, ci)));
    case 'endsWith':
      return typeof left === 'string' && String(norm(left, ci)).endsWith(String(norm(value, ci)));
    case 'matches': {
      if (typeof left !== 'string' || typeof value !== 'string') return false;
      if (value.length > MAX_REGEX_LENGTH) return false;
      try {
        return new RegExp(value, ci ? 'i' : '').test(left);
      } catch {
        return false;
      }
    }
    default:
      return false;
  }
}

/**
 * Evaluate a condition AST against a facts object. Pure and total — never throws;
 * an unrecognised node evaluates to `false` (fail-closed).
 */
export function evaluateCondition(condition: Condition, facts: Facts): boolean {
  if ('always' in condition) return condition.always === true;
  if ('all' in condition) return condition.all.every((c) => evaluateCondition(c, facts));
  if ('any' in condition) return condition.any.some((c) => evaluateCondition(c, facts));
  if ('not' in condition) return !evaluateCondition(condition.not, facts);
  if ('fact' in condition && 'op' in condition) return evalComparison(condition, facts);
  return false;
}

/**
 * Structurally validate a condition AST (input validation at the write boundary).
 * Returns a list of human-readable errors; an empty list means valid.
 */
export function validateCondition(condition: unknown, path = '$'): string[] {
  if (!isObject(condition)) {
    return [`${path}: condition must be an object`];
  }
  if ('always' in condition) {
    return typeof condition.always === 'boolean' ? [] : [`${path}.always: must be a boolean`];
  }
  if ('all' in condition || 'any' in condition) {
    const key = 'all' in condition ? 'all' : 'any';
    const branch = (condition as Record<string, unknown>)[key];
    if (!Array.isArray(branch)) return [`${path}.${key}: must be an array`];
    return branch.flatMap((child, i) => validateCondition(child, `${path}.${key}[${i}]`));
  }
  if ('not' in condition) {
    return validateCondition(condition.not, `${path}.not`);
  }
  if ('fact' in condition && 'op' in condition) {
    const errors: string[] = [];
    if (typeof condition.fact !== 'string' || condition.fact.length === 0) {
      errors.push(`${path}.fact: must be a non-empty string`);
    }
    if (!COMPARATORS.includes(condition.op as Comparator)) {
      errors.push(`${path}.op: "${String(condition.op)}" is not a known comparator`);
    }
    const op = condition.op as Comparator;
    if ((op === 'in' || op === 'nin') && !Array.isArray(condition.value)) {
      errors.push(`${path}.value: "${op}" requires an array`);
    }
    if (op === 'between' && (!Array.isArray(condition.value) || condition.value.length !== 2)) {
      errors.push(`${path}.value: "between" requires a [min, max] array`);
    }
    return errors;
  }
  return [`${path}: unrecognised condition node (expected always/all/any/not/fact)`];
}
