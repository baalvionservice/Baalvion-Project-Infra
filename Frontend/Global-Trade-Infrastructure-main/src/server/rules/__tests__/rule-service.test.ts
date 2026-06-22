/**
 * @file server/rules/__tests__/rule-service.test.ts
 * @description Integration tests for the Rule Engine service against real
 * PostgreSQL: global-baseline evaluation, tenant override + merge, optimistic
 * versioning, append-only revisions, and RLS (global + own-tenant) visibility.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, seedOrganization, disconnect } from '../../test/db';
import { prisma, withTenant } from '../../db/prisma';
import { ruleService, ActorContext } from '../../services/rule-service';

const SANCTIONS_KEY = 'sanctions.screening';

function ctxFor(orgId: string): ActorContext {
  return { organizationId: orgId, actorId: 'officer-1', actorRole: 'COMPLIANCE_OFFICER', ip: '10.0.0.1' };
}

/** Seed a platform-global sanctions baseline (organizationId NULL) via privileged client. */
async function seedGlobalSanctions(): Promise<string> {
  const set = await prisma.ruleSet.create({
    data: {
      organizationId: null,
      key: SANCTIONS_KEY,
      name: 'Global Sanctions Screening',
      category: 'SANCTIONS',
      conflictStrategy: 'DENY_OVERRIDES',
      defaultDecision: 'ALLOW',
    },
  });
  await prisma.rule.create({
    data: {
      ruleSetId: set.id,
      organizationId: null,
      key: 'sanctioned-destinations',
      name: 'Comprehensively sanctioned destinations',
      priority: 100,
      status: 'ACTIVE',
      condition: { fact: 'destinationCountry', op: 'in', value: ['IR', 'KP', 'SY', 'CU', 'RU'] },
      effect: { type: 'DENY', message: 'Destination under comprehensive sanctions' },
      direction: 'BOTH',
      tags: [],
    },
  });
  return set.id;
}

describe('rule-service (PostgreSQL)', () => {
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

  it('evaluates the global baseline for any tenant and records an audit trail', async () => {
    await seedGlobalSanctions();

    const denied = await ruleService.evaluate(ctxFor(orgA), { ruleSetKey: SANCTIONS_KEY, facts: { destinationCountry: 'IR' } });
    expect(denied.decision).toBe('DENY');
    expect(denied.matches.map((m) => m.ruleKey)).toContain('sanctioned-destinations');

    const cleared = await ruleService.evaluate(ctxFor(orgA), { ruleSetKey: SANCTIONS_KEY, facts: { destinationCountry: 'DE' } });
    expect(cleared.decision).toBe('ALLOW');
    expect(cleared.defaultApplied).toBe(true);

    const audits = await prisma.auditLog.findMany({ where: { action: 'RULE_EVALUATED' } });
    expect(audits.length).toBe(2);
    const events = await prisma.domainEvent.findMany({ where: { type: 'RULE_EVALUATED' } });
    expect(events.length).toBeGreaterThanOrEqual(2);
  });

  it('throws NotFound for an unknown rule-set key', async () => {
    await expect(ruleService.evaluate(ctxFor(orgA), { ruleSetKey: 'does.not.exist', facts: {} })).rejects.toThrow(/NOT_FOUND/);
  });

  it('lets a tenant override the global baseline (governing strategy + merged rules)', async () => {
    await seedGlobalSanctions(); // global DENYs RU

    // Org A creates a same-key override that ALLOWs RU under ALLOW_OVERRIDES.
    const override = await ruleService.createRuleSet(ctxFor(orgA), {
      key: SANCTIONS_KEY,
      name: 'Org A sanctions posture',
      category: 'SANCTIONS',
      conflictStrategy: 'ALLOW_OVERRIDES',
      defaultDecision: 'ALLOW',
    });
    await ruleService.createRule(ctxFor(orgA), override.id, {
      key: 'ru-licensed-exemption',
      name: 'RU permitted under specific licence',
      priority: 50,
      condition: { fact: 'destinationCountry', op: 'eq', value: 'RU' },
      effect: { type: 'ALLOW', message: 'Licensed exemption' },
    });

    // Org A: tenant governs → ALLOW_OVERRIDES → allow wins over global deny.
    const aResult = await ruleService.evaluate(ctxFor(orgA), { ruleSetKey: SANCTIONS_KEY, facts: { destinationCountry: 'RU' } });
    expect(aResult.decision).toBe('ALLOW');

    // Org B: no override → inherits the global baseline → deny.
    const bResult = await ruleService.evaluate(ctxFor(orgB), { ruleSetKey: SANCTIONS_KEY, facts: { destinationCountry: 'RU' } });
    expect(bResult.decision).toBe('DENY');
  });

  it('versions sets and writes an append-only revision per change', async () => {
    const set = await ruleService.createRuleSet(ctxFor(orgA), { key: 'tax.vat', name: 'VAT', category: 'TAX' });
    expect(set.version).toBe(1);

    const updated = await ruleService.updateRuleSet(ctxFor(orgA), set.id, { name: 'VAT (EU)', reason: 'clarify scope' });
    expect(updated.version).toBe(2);

    const revisions = await ruleService.listRevisions(ctxFor(orgA), set.id);
    expect(revisions.map((r) => r.action)).toEqual(['UPDATE', 'CREATE']); // newest first
  });

  it('enforces optimistic locking on stale updates', async () => {
    const set = await ruleService.createRuleSet(ctxFor(orgA), { key: 'doc.req', name: 'Docs', category: 'DOCUMENT' });
    await ruleService.updateRuleSet(ctxFor(orgA), set.id, { name: 'Docs v2', expectedVersion: 1 });
    await expect(ruleService.updateRuleSet(ctxFor(orgA), set.id, { name: 'Docs v3', expectedVersion: 1 })).rejects.toThrow(/OPTIMISTIC_LOCK/);
  });

  it('rule_revisions are immutable at the database layer (append-only trigger)', async () => {
    await ruleService.createRuleSet(ctxFor(orgA), { key: 'imm.test', name: 'Immutable', category: 'TEST' });
    await expect(prisma.ruleRevision.updateMany({ where: {}, data: { reason: 'tamper' } })).rejects.toThrow();
    await expect(prisma.ruleRevision.deleteMany({ where: {} })).rejects.toThrow();
  });

  it('RLS exposes global + own-tenant rule sets, never another tenant\'s', async () => {
    await seedGlobalSanctions(); // global (NULL org)
    const aSet = await ruleService.createRuleSet(ctxFor(orgA), { key: 'a.only', name: 'A only', category: 'TEST' });

    const aVisible = await withTenant(orgA, (tx) => tx.ruleSet.findMany());
    const aKeys = aVisible.map((r) => r.key);
    expect(aKeys).toContain(SANCTIONS_KEY); // global inherited
    expect(aKeys).toContain('a.only'); // own tenant

    const bVisible = await withTenant(orgB, (tx) => tx.ruleSet.findMany());
    const bKeys = bVisible.map((r) => r.key);
    expect(bKeys).toContain(SANCTIONS_KEY); // global inherited
    expect(bKeys).not.toContain('a.only'); // Org A's row is invisible to Org B
    expect(bVisible.find((r) => r.id === aSet.id)).toBeUndefined();
  });

  it('rejects a structurally invalid condition at the write boundary', async () => {
    const set = await ruleService.createRuleSet(ctxFor(orgA), { key: 'bad.cond', name: 'Bad', category: 'TEST' });
    await expect(
      ruleService.createRule(ctxFor(orgA), set.id, {
        key: 'broken',
        name: 'Broken',
        condition: { fact: 'x', op: 'in', value: 'should-be-array' },
        effect: { type: 'DENY' },
      }),
    ).rejects.toThrow(/Invalid condition/);
  });
});
