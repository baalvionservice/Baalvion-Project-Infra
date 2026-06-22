/**
 * @file server/rules/rule-engine.ts
 * @description The pure Rule Engine: evaluate a RuleSetDefinition against a facts
 * object and resolve a decision. No I/O, no Prisma, no globals — the persisted
 * rule rows are loaded by rule-service.ts and handed here as plain objects, which
 * keeps the engine fully deterministic and unit-testable.
 *
 * Pipeline: pre-filter (status + time window + selectors) → evaluate conditions
 * → collect matches → resolve conflicts by the set's strategy → decision.
 */
import { evaluateCondition } from './condition';
import {
  ConflictStrategy,
  Decision,
  Effect,
  EvaluationResult,
  Facts,
  RuleDefinition,
  RuleMatch,
  RuleSetDefinition,
  TradeDirection,
  decisionOf,
  moreSevere,
} from './types';

export interface EvaluateOptions {
  /** Evaluation timestamp (defaults to now). Injectable for deterministic tests. */
  now?: Date;
}

function asTime(value: Date | string | null | undefined): number | null {
  if (value == null) return null;
  if (value instanceof Date) return value.getTime();
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : t;
}

function withinWindow(from: Date | string | null | undefined, to: Date | string | null | undefined, now: number): boolean {
  const f = asTime(from);
  const t = asTime(to);
  if (f !== null && now < f) return false;
  if (t !== null && now > t) return false;
  return true;
}

/**
 * A selector matches when the rule leaves it null/undefined (wildcard) OR it
 * equals the corresponding fact (case-insensitive). Selectors are a cheap
 * pre-filter; the full condition AST still has the final say.
 */
function selectorMatches(ruleValue: string | null | undefined, factValue: unknown): boolean {
  if (ruleValue == null || ruleValue === '') return true;
  if (factValue == null) return false;
  return String(ruleValue).toLowerCase() === String(factValue).toLowerCase();
}

function directionMatches(ruleDir: TradeDirection | undefined, factDir: unknown): boolean {
  const dir = ruleDir ?? 'BOTH';
  if (dir === 'BOTH') return true;
  if (factDir == null) return true; // unspecified direction does not exclude
  return String(factDir).toUpperCase() === dir;
}

function passesSelectors(rule: RuleDefinition, facts: Facts): boolean {
  return (
    selectorMatches(rule.country, facts.country ?? facts.destinationCountry) &&
    selectorMatches(rule.region, facts.region) &&
    selectorMatches(rule.hsCode, facts.hsCode) &&
    selectorMatches(rule.productCategory, facts.productCategory ?? facts.category) &&
    selectorMatches(rule.orgType, facts.orgType) &&
    selectorMatches(rule.role, facts.role) &&
    directionMatches(rule.direction, facts.direction)
  );
}

function effectsOf(rule: RuleDefinition): Effect[] {
  return Array.isArray(rule.effect) ? rule.effect : [rule.effect];
}

/** The decision a rule contributes = the most severe decision among its effects. */
function ruleDecision(effects: Effect[]): Decision | null {
  let result: Decision | null = null;
  for (const effect of effects) {
    const d = decisionOf(effect.type);
    if (d) result = result ? moreSevere(result, d) : d;
  }
  return result;
}

/** Stable ordering: priority desc, then key asc (deterministic tie-break). */
function byPriority(a: RuleMatch, b: RuleMatch): number {
  if (b.priority !== a.priority) return b.priority - a.priority;
  return a.ruleKey < b.ruleKey ? -1 : a.ruleKey > b.ruleKey ? 1 : 0;
}

function resolveDecision(
  strategy: ConflictStrategy,
  matches: RuleMatch[],
  fallback: Decision,
): Decision {
  const decisional = matches.filter((m) => m.decision !== null) as Array<RuleMatch & { decision: Decision }>;
  if (decisional.length === 0) return fallback;

  switch (strategy) {
    case 'FIRST_MATCH':
    case 'PRIORITY': {
      const top = [...decisional].sort(byPriority)[0];
      return top.decision;
    }
    case 'ALLOW_OVERRIDES': {
      if (decisional.some((m) => m.decision === 'ALLOW')) return 'ALLOW';
      if (decisional.some((m) => m.decision === 'DENY')) return 'DENY';
      return 'REVIEW';
    }
    case 'DENY_OVERRIDES':
    case 'ALL_MATCH':
    default: {
      // Most-severe wins: DENY > REVIEW > ALLOW.
      return decisional.reduce<Decision>((acc, m) => moreSevere(acc, m.decision), 'ALLOW');
    }
  }
}

/**
 * Evaluate a rule set against facts. The set must already be merged (global +
 * tenant rules) by the caller; ordering across sources is handled here.
 */
export function evaluateRuleSet(
  set: RuleSetDefinition,
  facts: Facts,
  options: EvaluateOptions = {},
): EvaluationResult {
  const nowDate = options.now ?? new Date();
  const now = nowDate.getTime();
  const fallback: Decision = set.defaultDecision ?? 'ALLOW';

  // A suspended/archived set, or one outside its window, matches nothing.
  const setActive =
    set.status === 'ACTIVE' && withinWindow(set.effectiveFrom, set.effectiveTo, now);

  const candidates = setActive
    ? set.rules.filter(
        (rule) =>
          rule.status === 'ACTIVE' &&
          withinWindow(rule.effectiveFrom, rule.effectiveTo, now) &&
          passesSelectors(rule, facts),
      )
    : [];

  const matches: RuleMatch[] = [];
  const isFirstMatch = set.conflictStrategy === 'FIRST_MATCH';
  const ordered = isFirstMatch
    ? [...candidates].sort((a, b) =>
        b.priority !== a.priority ? b.priority - a.priority : a.key < b.key ? -1 : a.key > b.key ? 1 : 0,
      )
    : candidates;

  for (const rule of ordered) {
    if (!evaluateCondition(rule.condition, facts)) continue;
    const effects = effectsOf(rule);
    matches.push({
      ruleId: rule.id,
      ruleKey: rule.key,
      name: rule.name,
      priority: rule.priority,
      decision: ruleDecision(effects),
      effects,
    });
    if (isFirstMatch) break;
  }

  const decision = resolveDecision(set.conflictStrategy, matches, fallback);
  const obligations = matches
    .flatMap((m) => m.effects)
    .filter((e) => decisionOf(e.type) === null);

  return {
    ruleSetKey: set.key,
    decision,
    defaultApplied: matches.every((m) => m.decision === null),
    conflictStrategy: set.conflictStrategy,
    matches,
    obligations,
    evaluated: candidates.length,
    evaluatedAt: nowDate.toISOString(),
  };
}
