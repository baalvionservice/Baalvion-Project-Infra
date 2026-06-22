/**
 * @file server/rules/types.ts
 * @description In-memory contracts for the Rule Engine. These mirror the
 * persisted `rule_sets` / `rules` rows but are storage-agnostic so the engine
 * (server/rules/rule-engine.ts) can be exercised with hand-built fixtures and
 * has zero coupling to Prisma.
 */
import type { Condition, Facts } from './condition';

export type { Condition, Facts };

export type RuleStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

export type ConflictStrategy =
  | 'PRIORITY'
  | 'FIRST_MATCH'
  | 'ALL_MATCH'
  | 'DENY_OVERRIDES'
  | 'ALLOW_OVERRIDES';

export type TradeDirection = 'IMPORT' | 'EXPORT' | 'BOTH';

/** The three decision-bearing effect kinds. Any other effect type is an obligation. */
export type Decision = 'ALLOW' | 'DENY' | 'REVIEW';

/**
 * A structured effect applied when a rule matches. `type` is open-ended (data,
 * not a hardcoded enum); the engine only special-cases the decision-bearing
 * kinds below and treats everything else as a collected obligation.
 */
export interface Effect {
  type: string; // ALLOW | DENY | REVIEW | REQUIRE_DOCUMENT | REQUIRE_LICENSE | FLAG | SET_RISK | ADD_TARIFF | ROUTE | NOTIFY | …
  message?: string;
  params?: Record<string, unknown>;
}

/** Maps an effect type to the decision it contributes (null = non-decisional obligation). */
export function decisionOf(effectType: string): Decision | null {
  switch (effectType.toUpperCase()) {
    case 'ALLOW':
    case 'PERMIT':
      return 'ALLOW';
    case 'DENY':
    case 'BLOCK':
    case 'REJECT':
      return 'DENY';
    case 'REVIEW':
    case 'REQUIRE_REVIEW':
    case 'FLAG':
    case 'HOLD':
      return 'REVIEW';
    default:
      return null;
  }
}

/** Severity ordering used by ALL_MATCH / DENY_OVERRIDES style resolution. */
const SEVERITY: Record<Decision, number> = { ALLOW: 0, REVIEW: 1, DENY: 2 };

export function moreSevere(a: Decision, b: Decision): Decision {
  return SEVERITY[a] >= SEVERITY[b] ? a : b;
}

/** Selector facets that pre-filter candidate rules before condition evaluation. */
export interface RuleSelectors {
  country?: string | null;
  region?: string | null;
  hsCode?: string | null;
  productCategory?: string | null;
  orgType?: string | null;
  role?: string | null;
  direction?: TradeDirection;
}

/** Storage-agnostic rule shape consumed by the engine. */
export interface RuleDefinition extends RuleSelectors {
  id: string;
  key: string;
  name: string;
  priority: number;
  status: RuleStatus;
  condition: Condition;
  /** One or more effects. A single object is normalised to a one-element array. */
  effect: Effect | Effect[];
  effectiveFrom?: Date | string | null;
  effectiveTo?: Date | string | null;
}

export interface RuleSetDefinition {
  id: string;
  key: string;
  name: string;
  category: string;
  status: RuleStatus;
  conflictStrategy: ConflictStrategy;
  defaultDecision: Decision;
  effectiveFrom?: Date | string | null;
  effectiveTo?: Date | string | null;
  rules: RuleDefinition[];
}

/** A rule that matched during evaluation, with the effects it contributed. */
export interface RuleMatch {
  ruleId: string;
  ruleKey: string;
  name: string;
  priority: number;
  decision: Decision | null;
  effects: Effect[];
}

export interface EvaluationResult {
  ruleSetKey: string;
  decision: Decision;
  /** True when no rule matched and the set's defaultDecision was used. */
  defaultApplied: boolean;
  conflictStrategy: ConflictStrategy;
  matches: RuleMatch[];
  /** Non-decisional effects (REQUIRE_DOCUMENT, ADD_TARIFF, …) from matched rules. */
  obligations: Effect[];
  /** Number of candidate rules considered after selector + window pre-filtering. */
  evaluated: number;
  evaluatedAt: string;
}
