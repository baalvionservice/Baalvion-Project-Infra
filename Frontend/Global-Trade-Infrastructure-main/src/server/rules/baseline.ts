/**
 * @file server/rules/baseline.ts
 * @description The platform-global Restricted & Prohibited Goods baseline for the
 * Rule/Policy Engine. This is the privileged seed (organizationId NULL) that every
 * tenant inherits and may tighten with a same-key override (see rule-service.evaluate).
 *
 * The rule data is the SINGLE SOURCE OF TRUTH in `restricted-goods.json`, consumed
 * both here (typed, for tests + the in-app seeder) and by `scripts/seed-restricted-goods.cjs`
 * (the production CLI seeder) — so the two can never drift, which matters for a
 * compliance control.
 *
 * Conditions are the safe JSON AST from `condition.ts` (no eval); effects carry the
 * decision (DENY/REVIEW) plus non-decisional obligations (REQUIRE_LICENSE /
 * REQUIRE_CERTIFICATE) that the goods-screening service surfaces to callers.
 *
 * The seeder is idempotent: there is no unique (organizationId,key) constraint, so it
 * guards on an existence check and is safe to run repeatedly from a bootstrap/migration.
 */
import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../db/prisma';
import type { Condition } from './condition';
import type { Effect, TradeDirection } from './types';
import baselineDoc from './restricted-goods.json';

interface BaselineRule {
  key: string;
  name: string;
  description: string;
  priority: number;
  direction: TradeDirection;
  condition: Condition;
  effect: Effect | Effect[];
}

interface BaselineDoc {
  key: string;
  name: string;
  description: string;
  category: string;
  conflictStrategy: string;
  defaultDecision: string;
  rules: BaselineRule[];
}

const BASELINE = baselineDoc as unknown as BaselineDoc;

/** Stable key every tenant evaluates and may override. */
export const RESTRICTED_GOODS_KEY = BASELINE.key;
export const RESTRICTED_GOODS_CATEGORY = BASELINE.category;
/** The baseline rules, exposed for tests and tooling. */
export const RESTRICTED_GOODS_RULES: readonly BaselineRule[] = BASELINE.rules;

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export interface SeedResult {
  created: boolean;
  ruleSetId: string;
  ruleCount: number;
}

/**
 * Seed (idempotently) the platform-global restricted-goods baseline. Uses the
 * privileged client (organizationId NULL) — this is operator tooling, not a
 * tenant-facing mutation, so it bypasses the per-tenant service on purpose.
 */
export async function seedRestrictedGoodsBaseline(db: PrismaClient = prisma): Promise<SeedResult> {
  const existing = await db.ruleSet.findFirst({
    where: { key: RESTRICTED_GOODS_KEY, organizationId: null, deletedAt: null },
  });
  if (existing) {
    const ruleCount = await db.rule.count({ where: { ruleSetId: existing.id, deletedAt: null } });
    return { created: false, ruleSetId: existing.id, ruleCount };
  }

  const set = await db.ruleSet.create({
    data: {
      organizationId: null,
      key: BASELINE.key,
      name: BASELINE.name,
      description: BASELINE.description,
      category: BASELINE.category,
      conflictStrategy: BASELINE.conflictStrategy as Prisma.RuleSetCreateInput['conflictStrategy'],
      defaultDecision: BASELINE.defaultDecision,
    },
  });

  await db.rule.createMany({
    data: RESTRICTED_GOODS_RULES.map((r) => ({
      ruleSetId: set.id,
      organizationId: null,
      key: r.key,
      name: r.name,
      description: r.description,
      priority: r.priority,
      status: 'ACTIVE' as const,
      condition: asJson(r.condition),
      effect: asJson(r.effect),
      direction: r.direction,
      tags: [],
    })),
  });

  return { created: true, ruleSetId: set.id, ruleCount: RESTRICTED_GOODS_RULES.length };
}
