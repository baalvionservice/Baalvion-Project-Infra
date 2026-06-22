/**
 * @file server/rules/__tests__/goods-screening.test.ts
 * @description Integration tests for restricted-goods screening against real
 * PostgreSQL: the global baseline (prohibited / dual-use / licensing / certification),
 * idempotent seeding, tenant override + merge, and the additive, fail-open wiring into
 * the live ComplianceEngine trade-compliance gate.
 */
import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, seedOrganization, disconnect } from '../../test/db';
import { prisma } from '../../db/prisma';
import { ruleService, type ActorContext } from '../../services/rule-service';
import { screenGoods } from '../goods-screening';
import { seedRestrictedGoodsBaseline, RESTRICTED_GOODS_KEY } from '../baseline';
import { ComplianceEngine } from '../../compliance/compliance-engine';
import type { TradeContext } from '@/orchestration/ports';
import { USER_ROLES } from '@/core/roles';

function ctxFor(orgId: string): ActorContext {
  return { organizationId: orgId, actorId: 'officer-1', actorRole: 'COMPLIANCE_OFFICER', ip: '10.0.0.1' };
}

function tradeContext(metadata: Record<string, unknown>, destinationCountry = 'DE'): TradeContext {
  return {
    refs: { tradeId: randomUUID() },
    terms: {
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      commodity: 'Goods',
      quantity: 1,
      unitPrice: 100,
      currency: 'USD',
      originCountry: 'IN',
      destinationCountry,
    },
    actorId: 'officer-1',
    actorRole: USER_ROLES.COMPLIANCE_OFFICER,
    correlationId: randomUUID(),
    metadata,
  };
}

describe('goods-screening (PostgreSQL)', () => {
  let orgA: string;
  let orgB: string;

  beforeEach(async () => {
    await resetDatabase();
    orgA = await seedOrganization('Org A');
    orgB = await seedOrganization('Org B');
  });
  afterAll(async () => {
    await disconnect();
  });

  it('seeds the baseline idempotently', async () => {
    const first = await seedRestrictedGoodsBaseline();
    expect(first.created).toBe(true);
    expect(first.ruleCount).toBeGreaterThan(0);

    const second = await seedRestrictedGoodsBaseline();
    expect(second.created).toBe(false);
    expect(second.ruleSetId).toBe(first.ruleSetId);

    const globalSets = await prisma.ruleSet.findMany({ where: { key: RESTRICTED_GOODS_KEY, organizationId: null } });
    expect(globalSets).toHaveLength(1);
  });

  it('prohibits CITES wildlife by category and by HS code', async () => {
    await seedRestrictedGoodsBaseline();

    const byCategory = await screenGoods(ctxFor(orgA), { productCategory: 'wildlife' });
    expect(byCategory.decision).toBe('DENY');
    expect(byCategory.prohibited).toBe(true);
    expect(byCategory.matchedRules).toContain('prohibited-wildlife');

    const byHsCode = await screenGoods(ctxFor(orgA), { hsCode: '0507100000' });
    expect(byHsCode.decision).toBe('DENY');
  });

  it('flags controlled chemicals for review with a required permit', async () => {
    await seedRestrictedGoodsBaseline();

    const result = await screenGoods(ctxFor(orgA), { productCategory: 'controlled_chemical' });
    expect(result.decision).toBe('REVIEW');
    expect(result.requiresReview).toBe(true);
    expect(result.requiredLicenses).toContain('CONTROLLED_CHEMICAL_PERMIT');
  });

  it('allows food imports but requires a health certificate (obligation, not a block)', async () => {
    await seedRestrictedGoodsBaseline();

    const result = await screenGoods(ctxFor(orgA), { productCategory: 'food', direction: 'IMPORT' });
    expect(result.decision).toBe('ALLOW');
    expect(result.prohibited).toBe(false);
    expect(result.requiredCertificates).toContain('PHYTOSANITARY_OR_HEALTH_CERTIFICATE');
  });

  it('blocks dual-use exports to embargoed destinations only', async () => {
    await seedRestrictedGoodsBaseline();

    const embargoed = await screenGoods(ctxFor(orgA), {
      productCategory: 'dual_use',
      direction: 'EXPORT',
      destinationCountry: 'IR',
    });
    expect(embargoed.decision).toBe('DENY');

    const permitted = await screenGoods(ctxFor(orgA), {
      productCategory: 'dual_use',
      direction: 'EXPORT',
      destinationCountry: 'DE',
    });
    expect(permitted.decision).toBe('ALLOW');
  });

  it('clears unrestricted goods with no obligations', async () => {
    await seedRestrictedGoodsBaseline();

    const result = await screenGoods(ctxFor(orgA), { productCategory: 'textiles', hsCode: '6109100000' });
    expect(result.decision).toBe('ALLOW');
    expect(result.matchedRules).toHaveLength(0);
    expect(result.requiredLicenses).toHaveLength(0);
    expect(result.requiredCertificates).toHaveLength(0);
  });

  it('lets a tenant tighten the baseline for itself without affecting other tenants', async () => {
    await seedRestrictedGoodsBaseline(); // textiles globally allowed

    const override = await ruleService.createRuleSet(ctxFor(orgA), {
      key: RESTRICTED_GOODS_KEY,
      name: 'Org A restricted-goods posture',
      category: 'RESTRICTED_GOODS',
      conflictStrategy: 'DENY_OVERRIDES',
      defaultDecision: 'ALLOW',
    });
    await ruleService.createRule(ctxFor(orgA), override.id, {
      key: 'org-a-no-textiles',
      name: 'Org A bans textiles imports',
      priority: 60,
      condition: { fact: 'productCategory', op: 'eq', value: 'textiles', caseInsensitive: true },
      effect: { type: 'DENY', message: 'Org A policy: textiles not permitted' },
    });

    const aResult = await screenGoods(ctxFor(orgA), { productCategory: 'textiles' });
    expect(aResult.decision).toBe('DENY');

    const bResult = await screenGoods(ctxFor(orgB), { productCategory: 'textiles' });
    expect(bResult.decision).toBe('ALLOW');
  });

  it('records an audit trail for every screening', async () => {
    await seedRestrictedGoodsBaseline();
    await screenGoods(ctxFor(orgA), { productCategory: 'wildlife' });

    const audits = await prisma.auditLog.findMany({ where: { action: 'RULE_EVALUATED' } });
    expect(audits.length).toBeGreaterThanOrEqual(1);
  });

  describe('ComplianceEngine gate (live trade-compliance flow)', () => {
    it('fails OPEN when the baseline is not seeded — party screening governs', async () => {
      const engine = new ComplianceEngine({ organizationId: orgA });
      const result = await engine.screen(tradeContext({ productCategory: 'wildlife' }));
      // No restricted-goods baseline: the prohibited good is NOT caught, and the
      // (clean) party/country/value checks pass, so the trade is not blocked here.
      expect(result.passed).toBe(true);
    });

    it('blocks a prohibited good once the baseline is seeded', async () => {
      await seedRestrictedGoodsBaseline();
      const engine = new ComplianceEngine({ organizationId: orgA });
      const result = await engine.screen(tradeContext({ productCategory: 'wildlife' }));
      expect(result.passed).toBe(false);
      expect(result.reasons).toContain('restricted_goods:prohibited-wildlife');
    });

    it('does not block when the goods are unrestricted', async () => {
      await seedRestrictedGoodsBaseline();
      const engine = new ComplianceEngine({ organizationId: orgA });
      const result = await engine.screen(tradeContext({ productCategory: 'textiles' }));
      expect(result.passed).toBe(true);
    });
  });
});
