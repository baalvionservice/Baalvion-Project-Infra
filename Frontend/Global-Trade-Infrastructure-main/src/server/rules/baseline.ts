/**
 * @file server/rules/baseline.ts
 * @description The platform-global Restricted & Prohibited Goods baseline for the
 * Rule/Policy Engine. This is the privileged seed (organizationId NULL) that every
 * tenant inherits and may tighten with a same-key override (see rule-service.evaluate).
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

/** Stable key every tenant evaluates and may override. */
export const RESTRICTED_GOODS_KEY = 'compliance.restricted-goods';
export const RESTRICTED_GOODS_CATEGORY = 'RESTRICTED_GOODS';

/** Destinations under comprehensive embargo for dual-use / controlled exports. */
const EMBARGOED_DESTINATIONS = ['IR', 'KP', 'SY', 'CU', 'RU'];

interface BaselineRule {
  key: string;
  name: string;
  description: string;
  priority: number;
  direction: TradeDirection;
  condition: Condition;
  effect: Effect | Effect[];
}

/**
 * The baseline rule set. DENY_OVERRIDES: the most severe matching decision wins, so a
 * single prohibited-goods DENY blocks regardless of how many REVIEW rules also match.
 */
export const RESTRICTED_GOODS_RULES: readonly BaselineRule[] = [
  {
    key: 'prohibited-wildlife',
    name: 'CITES-listed wildlife / ivory',
    description: 'Wildlife products and ivory (HS 0507) are prohibited for trade.',
    priority: 100,
    direction: 'BOTH',
    condition: {
      any: [
        { fact: 'productCategory', op: 'eq', value: 'wildlife', caseInsensitive: true },
        { fact: 'hsCode', op: 'startsWith', value: '0507' },
      ],
    },
    effect: { type: 'DENY', message: 'CITES-listed wildlife or ivory product is prohibited' },
  },
  {
    key: 'prohibited-narcotics',
    name: 'Narcotic substances',
    description: 'Controlled narcotic substances are prohibited for commercial trade.',
    priority: 100,
    direction: 'BOTH',
    condition: { fact: 'productCategory', op: 'eq', value: 'narcotics', caseInsensitive: true },
    effect: { type: 'DENY', message: 'Narcotic substances are prohibited for trade' },
  },
  {
    key: 'dual-use-embargo',
    name: 'Dual-use export to embargoed destination',
    description: 'Dual-use goods may not be exported to comprehensively embargoed destinations.',
    priority: 90,
    direction: 'EXPORT',
    condition: {
      all: [
        { fact: 'productCategory', op: 'eq', value: 'dual_use', caseInsensitive: true },
        { fact: 'destinationCountry', op: 'in', value: EMBARGOED_DESTINATIONS, caseInsensitive: true },
      ],
    },
    effect: { type: 'DENY', message: 'Dual-use export to an embargoed destination is prohibited' },
  },
  {
    key: 'defense-export-license',
    name: 'Defense / military goods',
    description: 'Defense and military goods require an export-control license and manual review.',
    priority: 80,
    direction: 'EXPORT',
    condition: { fact: 'productCategory', op: 'eq', value: 'defense', caseInsensitive: true },
    effect: [
      { type: 'REVIEW', message: 'Defense / military goods require export-control review' },
      { type: 'REQUIRE_LICENSE', message: 'Export-control license required', params: { license: 'EXPORT_CONTROL_LICENSE' } },
    ],
  },
  {
    key: 'controlled-chemical-permit',
    name: 'Controlled chemicals',
    description: 'Controlled chemicals require a permit and manual review before clearance.',
    priority: 80,
    direction: 'BOTH',
    condition: { fact: 'productCategory', op: 'eq', value: 'controlled_chemical', caseInsensitive: true },
    effect: [
      { type: 'REVIEW', message: 'Controlled chemical requires manual review' },
      { type: 'REQUIRE_LICENSE', message: 'Controlled-chemical permit required', params: { license: 'CONTROLLED_CHEMICAL_PERMIT' } },
    ],
  },
  {
    key: 'pharma-import-license',
    name: 'Pharmaceutical import',
    description: 'Pharmaceutical / drug imports require a drug-import license and review.',
    priority: 70,
    direction: 'IMPORT',
    condition: { fact: 'productCategory', op: 'eq', value: 'pharmaceutical', caseInsensitive: true },
    effect: [
      { type: 'REVIEW', message: 'Pharmaceutical import requires regulatory review' },
      { type: 'REQUIRE_LICENSE', message: 'Drug-import license required', params: { license: 'DRUG_IMPORT_LICENSE' } },
    ],
  },
  {
    key: 'hazardous-dgd',
    name: 'Hazardous materials',
    description: 'Hazardous materials require a dangerous-goods declaration and review.',
    priority: 70,
    direction: 'BOTH',
    condition: { fact: 'productCategory', op: 'eq', value: 'hazardous', caseInsensitive: true },
    effect: [
      { type: 'REVIEW', message: 'Hazardous materials require a dangerous-goods declaration' },
      { type: 'REQUIRE_CERTIFICATE', message: 'Dangerous-goods declaration required', params: { certificate: 'DANGEROUS_GOODS_DECLARATION' } },
    ],
  },
  {
    key: 'food-health-cert',
    name: 'Food / agricultural import',
    description: 'Food and agricultural imports require a phytosanitary / health certificate.',
    priority: 40,
    direction: 'IMPORT',
    condition: { fact: 'productCategory', op: 'eq', value: 'food', caseInsensitive: true },
    // No decision-bearing effect → stays ALLOW, but carries a documentary obligation.
    effect: { type: 'REQUIRE_CERTIFICATE', message: 'Phytosanitary / health certificate required', params: { certificate: 'PHYTOSANITARY_OR_HEALTH_CERTIFICATE' } },
  },
];

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
      key: RESTRICTED_GOODS_KEY,
      name: 'Global Restricted & Prohibited Goods',
      description: 'Platform baseline for prohibited goods, dual-use/export controls, and licensing/certification obligations.',
      category: RESTRICTED_GOODS_CATEGORY,
      conflictStrategy: 'DENY_OVERRIDES',
      defaultDecision: 'ALLOW',
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
