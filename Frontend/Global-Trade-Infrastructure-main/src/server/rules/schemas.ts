/**
 * @file server/rules/schemas.ts
 * @description Zod request schemas for the Rule Engine API (input validation at
 * the system boundary). Deep structural validation of the condition AST is done
 * separately by validateCondition() in the service so errors are precise.
 */
import { z } from 'zod';

export const RULE_STATUSES = ['DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED'] as const;
export const CONFLICT_STRATEGIES = ['PRIORITY', 'FIRST_MATCH', 'ALL_MATCH', 'DENY_OVERRIDES', 'ALLOW_OVERRIDES'] as const;
export const DECISIONS = ['ALLOW', 'DENY', 'REVIEW'] as const;
export const TRADE_DIRECTIONS = ['IMPORT', 'EXPORT', 'BOTH'] as const;

const isoDate = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
  .nullable()
  .optional();

/** Loose shape for an effect; deeper meaning is engine-defined and open-ended. */
export const effectSchema = z.object({
  type: z.string().min(1).max(64),
  message: z.string().max(2000).optional(),
  params: z.record(z.string(), z.unknown()).optional(),
});

export const effectsSchema = z.union([effectSchema, z.array(effectSchema).min(1)]);

/** Condition is validated structurally by validateCondition(); here it is just an object. */
export const conditionSchema = z.record(z.string(), z.unknown());

export const createRuleSetSchema = z.object({
  key: z.string().min(1).max(128).regex(/^[a-z0-9][a-z0-9._-]*$/i, 'key must be slug-like'),
  name: z.string().min(1).max(256),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(64),
  conflictStrategy: z.enum(CONFLICT_STRATEGIES).optional(),
  defaultDecision: z.enum(DECISIONS).optional(),
  effectiveFrom: isoDate,
  effectiveTo: isoDate,
  priority: z.number().int().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateRuleSetSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  description: z.string().max(2000).nullable().optional(),
  category: z.string().min(1).max(64).optional(),
  status: z.enum(RULE_STATUSES).optional(),
  conflictStrategy: z.enum(CONFLICT_STRATEGIES).optional(),
  defaultDecision: z.enum(DECISIONS).optional(),
  effectiveFrom: isoDate,
  effectiveTo: isoDate,
  priority: z.number().int().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  expectedVersion: z.number().int().positive().optional(),
  reason: z.string().max(500).optional(),
});

const selectorFields = {
  country: z.string().max(64).nullable().optional(),
  region: z.string().max(64).nullable().optional(),
  hsCode: z.string().max(32).nullable().optional(),
  productCategory: z.string().max(128).nullable().optional(),
  orgType: z.string().max(64).nullable().optional(),
  role: z.string().max(64).nullable().optional(),
  direction: z.enum(TRADE_DIRECTIONS).optional(),
};

export const createRuleSchema = z.object({
  key: z.string().min(1).max(128).regex(/^[a-z0-9][a-z0-9._-]*$/i, 'key must be slug-like'),
  name: z.string().min(1).max(256),
  description: z.string().max(2000).optional(),
  priority: z.number().int().optional(),
  status: z.enum(RULE_STATUSES).optional(),
  condition: conditionSchema,
  effect: effectsSchema,
  ...selectorFields,
  tags: z.array(z.string().max(64)).max(32).optional(),
  effectiveFrom: isoDate,
  effectiveTo: isoDate,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateRuleSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  description: z.string().max(2000).nullable().optional(),
  priority: z.number().int().optional(),
  status: z.enum(RULE_STATUSES).optional(),
  condition: conditionSchema.optional(),
  effect: effectsSchema.optional(),
  ...selectorFields,
  tags: z.array(z.string().max(64)).max(32).optional(),
  effectiveFrom: isoDate,
  effectiveTo: isoDate,
  metadata: z.record(z.string(), z.unknown()).optional(),
  expectedVersion: z.number().int().positive().optional(),
  reason: z.string().max(500).optional(),
});

export const evaluateSchema = z.object({
  ruleSetKey: z.string().min(1).max(128),
  facts: z.record(z.string(), z.unknown()),
  now: z.string().datetime({ offset: true }).optional(),
});

export type CreateRuleSetInput = z.infer<typeof createRuleSetSchema>;
export type UpdateRuleSetInput = z.infer<typeof updateRuleSetSchema>;
export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
export type EvaluateInput = z.infer<typeof evaluateSchema>;
