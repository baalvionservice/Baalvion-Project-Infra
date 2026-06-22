/**
 * @file server/rules/__tests__/seed-restricted-goods.cli.test.ts
 * @description Verifies the PRODUCTION CLI seeder (scripts/seed-restricted-goods.cjs)
 * against real PostgreSQL: it provisions the global baseline, is idempotent
 * (replace-in-place), and the seeded data actually enforces through screenGoods.
 * Exercising the real script — not a re-implementation — keeps the prod seed path honest.
 */
import { createRequire } from 'module';
import path from 'path';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, seedOrganization, disconnect } from '../../test/db';
import { prisma } from '../../db/prisma';
import { screenGoods } from '../goods-screening';
import { RESTRICTED_GOODS_KEY } from '../baseline';
import type { ActorContext } from '../../services/rule-service';

const require = createRequire(import.meta.url);
const { seed } = require(path.resolve(process.cwd(), 'scripts/seed-restricted-goods.cjs')) as {
  seed: (db: typeof prisma) => Promise<{ key: string; rules: number }>;
};

function ctxFor(orgId: string): ActorContext {
  return { organizationId: orgId, actorId: 'officer-1', actorRole: 'COMPLIANCE_OFFICER', ip: '10.0.0.1' };
}

describe('seed-restricted-goods.cjs (production CLI seeder)', () => {
  let orgA: string;

  beforeEach(async () => {
    await resetDatabase();
    orgA = await seedOrganization('Org A');
  });
  afterAll(async () => {
    await disconnect();
  });

  it('provisions the global baseline and is idempotent (replace-in-place)', async () => {
    const first = await seed(prisma);
    expect(first.key).toBe(RESTRICTED_GOODS_KEY);
    expect(first.rules).toBeGreaterThan(0);

    await seed(prisma); // re-run

    const globalSets = await prisma.ruleSet.findMany({ where: { key: RESTRICTED_GOODS_KEY, organizationId: null } });
    expect(globalSets).toHaveLength(1);
    const rules = await prisma.rule.count({ where: { ruleSetId: globalSets[0].id, deletedAt: null } });
    expect(rules).toBe(first.rules);
  });

  it('seeded data enforces through screenGoods', async () => {
    await seed(prisma);
    const denied = await screenGoods(ctxFor(orgA), { productCategory: 'wildlife' });
    expect(denied.decision).toBe('DENY');
    const cleared = await screenGoods(ctxFor(orgA), { productCategory: 'textiles' });
    expect(cleared.decision).toBe('ALLOW');
  });
});
