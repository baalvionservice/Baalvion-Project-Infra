/**
 * @file scripts/seed-restricted-goods.cjs
 * @description Provision the platform-global Restricted & Prohibited Goods rule set
 * (organizationId NULL) for the Rule/Policy Engine. This is what makes the live
 * compliance gate (server/compliance/compliance-engine.ts → goods-screening) and the
 * /api/compliance/goods-screening endpoint enforce real restrictions in production.
 *
 * Single source of truth: the rules live in src/server/rules/restricted-goods.json and
 * are shared with server/rules/baseline.ts (the typed in-app seeder used by tests), so
 * the production seed and the tested seed can never drift.
 *
 * Idempotent: re-running replaces the global set's rules in place. Runs as the
 * privileged DATABASE_URL role (RLS-bypassing) so it can write NULL-org rows.
 *
 *   node scripts/seed-restricted-goods.cjs
 */
const { PrismaClient } = require('@prisma/client');
const baseline = require('../src/server/rules/restricted-goods.json');

async function seed(prisma) {
  // Replace-in-place for idempotency: drop the existing global set (rules cascade).
  const existing = await prisma.ruleSet.findFirst({
    where: { key: baseline.key, organizationId: null, deletedAt: null },
  });
  if (existing) {
    await prisma.ruleSet.delete({ where: { id: existing.id } });
  }

  const set = await prisma.ruleSet.create({
    data: {
      organizationId: null,
      key: baseline.key,
      name: baseline.name,
      description: baseline.description,
      category: baseline.category,
      conflictStrategy: baseline.conflictStrategy,
      defaultDecision: baseline.defaultDecision,
      status: 'ACTIVE',
    },
  });

  for (const r of baseline.rules) {
    await prisma.rule.create({
      data: {
        ruleSetId: set.id,
        organizationId: null,
        key: r.key,
        name: r.name,
        description: r.description,
        priority: r.priority ?? 0,
        status: 'ACTIVE',
        direction: r.direction ?? 'BOTH',
        condition: r.condition,
        effect: r.effect,
        tags: [],
      },
    });
  }
  return { key: baseline.key, rules: baseline.rules.length };
}

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('[seed-restricted-goods] provisioning the global restricted-goods baseline…');
    const res = await seed(prisma);
    console.log(`[seed-restricted-goods]   ${res.key}: ${res.rules} rules`);
    console.log('[seed-restricted-goods] done.');
  } finally {
    await prisma.$disconnect();
  }
}

// Only run when invoked directly (so the data/logic can be required without side effects).
if (require.main === module) {
  main().catch((err) => {
    console.error('[seed-restricted-goods] FAILED:', err);
    process.exit(1);
  });
}

module.exports = { seed };
