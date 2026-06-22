/**
 * @file server/services/rule-service.ts
 * @description Rule Engine application service. The single entry point the API
 * uses to author and evaluate rules. Every mutation runs in one transaction that
 * writes the entity, an immutable audit row, an append-only version snapshot and
 * a transactional-outbox event — then the outbox is relayed onto the bus.
 *
 * Tenancy: writes are always tenant-owned (organizationId = the caller's org),
 * which satisfies the RLS WITH CHECK policy. The platform-global baseline
 * (organizationId NULL) is seeded by privileged tooling, not this service.
 */
import { randomUUID } from 'crypto';
import { Prisma, RuleSet, Rule, RuleRevision } from '@prisma/client';
import { withTransaction, PrismaTransaction } from '../db/prisma';
import { NotFoundError, ValidationError } from '../db/errors';
import {
  ruleSetRepository,
  ruleRepository,
  ruleRevisionRepository,
  auditRepository,
  outboxRepository,
  RuleSetFilter,
} from '../repositories';
import { flushOutbox } from '../orchestration/event-store';
import { validateCondition, Condition } from '../rules/condition';
import { evaluateRuleSet } from '../rules/rule-engine';
import {
  Decision,
  Effect,
  EvaluationResult,
  RuleDefinition,
  RuleSetDefinition,
  TradeDirection,
} from '../rules/types';
import {
  CreateRuleSetInput,
  UpdateRuleSetInput,
  CreateRuleInput,
  UpdateRuleInput,
  EvaluateInput,
} from '../rules/schemas';

export interface ActorContext {
  organizationId: string;
  actorId: string;
  actorRole: string;
  ip?: string | null;
}

const DECISIONS: ReadonlySet<string> = new Set<Decision>(['ALLOW', 'DENY', 'REVIEW']);

function asDecision(value: string | null | undefined): Decision {
  return value && DECISIONS.has(value) ? (value as Decision) : 'ALLOW';
}

function snapshot<T>(row: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(row)) as Prisma.InputJsonValue;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function assertCondition(condition: unknown): void {
  const errors = validateCondition(condition);
  if (errors.length > 0) {
    throw new ValidationError(`Invalid condition: ${errors.join('; ')}`);
  }
}

function withinWindow(from: Date | null, to: Date | null, now: Date): boolean {
  const t = now.getTime();
  if (from && t < from.getTime()) return false;
  if (to && t > to.getTime()) return false;
  return true;
}

function setIsActive(set: RuleSet, now: Date): boolean {
  return set.status === 'ACTIVE' && withinWindow(set.effectiveFrom, set.effectiveTo, now);
}

function toRuleDefinition(row: Rule): RuleDefinition {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    priority: row.priority,
    status: row.status,
    condition: row.condition as unknown as Condition,
    effect: row.effect as unknown as Effect | Effect[],
    country: row.country,
    region: row.region,
    hsCode: row.hsCode,
    productCategory: row.productCategory,
    orgType: row.orgType,
    role: row.role,
    direction: row.direction as TradeDirection,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
  };
}

async function recordRevision(
  tx: PrismaTransaction,
  ctx: ActorContext,
  entity: { type: 'RULE_SET' | 'RULE'; ruleSetId: string | null; ruleId: string | null; key: string; version: number },
  action: string,
  snap: Prisma.InputJsonValue,
  reason?: string,
): Promise<RuleRevision> {
  return ruleRevisionRepository.record(
    {
      organizationId: ctx.organizationId,
      ruleSetId: entity.ruleSetId,
      ruleId: entity.ruleId,
      entityType: entity.type,
      entityKey: entity.key,
      version: entity.version,
      action,
      snapshot: snap,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      reason: reason ?? null,
    },
    tx,
  );
}

async function audit(
  tx: PrismaTransaction,
  ctx: ActorContext,
  entityType: string,
  entityId: string,
  action: string,
  before: Prisma.InputJsonValue | null,
  after: Prisma.InputJsonValue | null,
  correlationId: string,
): Promise<void> {
  await auditRepository.record(
    {
      organizationId: ctx.organizationId,
      entityType,
      entityId,
      action,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      source: 'rule-engine',
      beforeState: before ?? undefined,
      afterState: after ?? undefined,
      correlationId,
      ip: ctx.ip ?? undefined,
    },
    tx,
  );
}

async function enqueue(
  tx: PrismaTransaction,
  ctx: ActorContext,
  eventType: string,
  payload: Record<string, unknown>,
  correlationId: string,
): Promise<void> {
  await outboxRepository.enqueue(
    {
      organizationId: ctx.organizationId,
      tradeId: null,
      eventType,
      payload: { ...payload, actorId: ctx.actorId, organizationId: ctx.organizationId } as Prisma.InputJsonValue,
      correlationId,
      sequence: 0,
    },
    tx,
  );
}

export const ruleService = {
  // ── Rule sets ────────────────────────────────────────────────────────────

  async createRuleSet(ctx: ActorContext, input: CreateRuleSetInput): Promise<RuleSet> {
    const correlationId = randomUUID();
    const created = await withTransaction(async (tx) => {
      const row = await ruleSetRepository.create(
        {
          organizationId: ctx.organizationId,
          key: input.key,
          name: input.name,
          description: input.description ?? null,
          category: input.category,
          conflictStrategy: input.conflictStrategy ?? 'DENY_OVERRIDES',
          defaultDecision: input.defaultDecision ?? 'ALLOW',
          effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null,
          effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
          priority: input.priority ?? 0,
          metadata: input.metadata ? asJson(input.metadata) : undefined,
        },
        tx,
      );
      await audit(tx, ctx, 'RuleSet', row.id, 'CREATE', null, snapshot(row), correlationId);
      await recordRevision(tx, ctx, { type: 'RULE_SET', ruleSetId: row.id, ruleId: null, key: row.key, version: row.version }, 'CREATE', snapshot(row));
      await enqueue(tx, ctx, 'RULE_SET_CREATED', { ruleSetId: row.id, key: row.key, category: row.category }, correlationId);
      return row;
    });
    await flushOutbox();
    return created;
  },

  async updateRuleSet(ctx: ActorContext, id: string, input: UpdateRuleSetInput): Promise<RuleSet> {
    const correlationId = randomUUID();
    const updated = await withTransaction(async (tx) => {
      const before = await ruleSetRepository.findScopedById(id, ctx.organizationId, tx);
      if (!before || before.organizationId !== ctx.organizationId) {
        throw new NotFoundError('RuleSet', id); // global sets are not tenant-editable
      }
      const data: Record<string, unknown> = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.description !== undefined) data.description = input.description;
      if (input.category !== undefined) data.category = input.category;
      if (input.status !== undefined) data.status = input.status;
      if (input.conflictStrategy !== undefined) data.conflictStrategy = input.conflictStrategy;
      if (input.defaultDecision !== undefined) data.defaultDecision = input.defaultDecision;
      if (input.effectiveFrom !== undefined) data.effectiveFrom = input.effectiveFrom ? new Date(input.effectiveFrom) : null;
      if (input.effectiveTo !== undefined) data.effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : null;
      if (input.priority !== undefined) data.priority = input.priority;
      if (input.metadata !== undefined) data.metadata = asJson(input.metadata);

      const row =
        input.expectedVersion !== undefined
          ? await ruleSetRepository.updateWithLock(id, input.expectedVersion, data, tx)
          : await ruleSetRepository.update(id, { ...data, version: { increment: 1 } }, tx);

      await audit(tx, ctx, 'RuleSet', row.id, 'UPDATE', snapshot(before), snapshot(row), correlationId);
      await recordRevision(tx, ctx, { type: 'RULE_SET', ruleSetId: row.id, ruleId: null, key: row.key, version: row.version }, 'UPDATE', snapshot(row), input.reason);
      await enqueue(tx, ctx, 'RULE_SET_UPDATED', { ruleSetId: row.id, key: row.key }, correlationId);
      return row;
    });
    await flushOutbox();
    return updated;
  },

  async archiveRuleSet(ctx: ActorContext, id: string, reason?: string): Promise<RuleSet> {
    const correlationId = randomUUID();
    const archived = await withTransaction(async (tx) => {
      const before = await ruleSetRepository.findScopedById(id, ctx.organizationId, tx);
      if (!before || before.organizationId !== ctx.organizationId) {
        throw new NotFoundError('RuleSet', id);
      }
      const row = await ruleSetRepository.update(id, { status: 'ARCHIVED', deletedAt: new Date(), version: { increment: 1 } }, tx);
      await audit(tx, ctx, 'RuleSet', row.id, 'ARCHIVE', snapshot(before), snapshot(row), correlationId);
      await recordRevision(tx, ctx, { type: 'RULE_SET', ruleSetId: row.id, ruleId: null, key: row.key, version: row.version }, 'ARCHIVE', snapshot(row), reason);
      await enqueue(tx, ctx, 'RULE_SET_ARCHIVED', { ruleSetId: row.id, key: row.key }, correlationId);
      return row;
    });
    await flushOutbox();
    return archived;
  },

  listRuleSets(ctx: ActorContext, filter: RuleSetFilter, page: { page: number; pageSize: number }) {
    return ruleSetRepository.listScoped(ctx.organizationId, filter, page);
  },

  async getRuleSet(ctx: ActorContext, id: string): Promise<{ ruleSet: RuleSet; rules: Rule[] }> {
    const ruleSet = await ruleSetRepository.findScopedById(id, ctx.organizationId);
    if (!ruleSet) throw new NotFoundError('RuleSet', id);
    const rules = await ruleRepository.listBySet(ruleSet.id);
    return { ruleSet, rules };
  },

  listRevisions(_ctx: ActorContext, ruleSetId: string): Promise<RuleRevision[]> {
    return ruleRevisionRepository.listBySet(ruleSetId);
  },

  // ── Rules ────────────────────────────────────────────────────────────────

  async createRule(ctx: ActorContext, ruleSetId: string, input: CreateRuleInput): Promise<Rule> {
    assertCondition(input.condition);
    const correlationId = randomUUID();
    const created = await withTransaction(async (tx) => {
      const set = await ruleSetRepository.findScopedById(ruleSetId, ctx.organizationId, tx);
      if (!set || set.organizationId !== ctx.organizationId) {
        throw new NotFoundError('RuleSet', ruleSetId); // rules are added only to tenant-owned sets
      }
      const row = await ruleRepository.create(
        {
          ruleSetId,
          organizationId: ctx.organizationId,
          key: input.key,
          name: input.name,
          description: input.description ?? null,
          priority: input.priority ?? 0,
          status: input.status ?? 'ACTIVE',
          condition: asJson(input.condition),
          effect: asJson(input.effect),
          country: input.country ?? null,
          region: input.region ?? null,
          hsCode: input.hsCode ?? null,
          productCategory: input.productCategory ?? null,
          orgType: input.orgType ?? null,
          role: input.role ?? null,
          direction: input.direction ?? 'BOTH',
          tags: input.tags ?? [],
          effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null,
          effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
          metadata: input.metadata ? asJson(input.metadata) : undefined,
        },
        tx,
      );
      await audit(tx, ctx, 'Rule', row.id, 'CREATE', null, snapshot(row), correlationId);
      await recordRevision(tx, ctx, { type: 'RULE', ruleSetId, ruleId: row.id, key: row.key, version: row.version }, 'CREATE', snapshot(row));
      await enqueue(tx, ctx, 'RULE_CREATED', { ruleId: row.id, ruleSetId, key: row.key }, correlationId);
      return row;
    });
    await flushOutbox();
    return created;
  },

  async updateRule(ctx: ActorContext, ruleSetId: string, ruleId: string, input: UpdateRuleInput): Promise<Rule> {
    if (input.condition !== undefined) assertCondition(input.condition);
    const correlationId = randomUUID();
    const updated = await withTransaction(async (tx) => {
      const before = await ruleRepository.findScopedById(ruleId, ctx.organizationId, tx);
      if (!before || before.organizationId !== ctx.organizationId || before.ruleSetId !== ruleSetId) {
        throw new NotFoundError('Rule', ruleId);
      }
      const data: Record<string, unknown> = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.description !== undefined) data.description = input.description;
      if (input.priority !== undefined) data.priority = input.priority;
      if (input.status !== undefined) data.status = input.status;
      if (input.condition !== undefined) data.condition = asJson(input.condition);
      if (input.effect !== undefined) data.effect = asJson(input.effect);
      if (input.country !== undefined) data.country = input.country;
      if (input.region !== undefined) data.region = input.region;
      if (input.hsCode !== undefined) data.hsCode = input.hsCode;
      if (input.productCategory !== undefined) data.productCategory = input.productCategory;
      if (input.orgType !== undefined) data.orgType = input.orgType;
      if (input.role !== undefined) data.role = input.role;
      if (input.direction !== undefined) data.direction = input.direction;
      if (input.tags !== undefined) data.tags = input.tags;
      if (input.effectiveFrom !== undefined) data.effectiveFrom = input.effectiveFrom ? new Date(input.effectiveFrom) : null;
      if (input.effectiveTo !== undefined) data.effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : null;
      if (input.metadata !== undefined) data.metadata = asJson(input.metadata);

      const row =
        input.expectedVersion !== undefined
          ? await ruleRepository.updateWithLock(ruleId, input.expectedVersion, data, tx)
          : await ruleRepository.update(ruleId, { ...data, version: { increment: 1 } }, tx);

      await audit(tx, ctx, 'Rule', row.id, 'UPDATE', snapshot(before), snapshot(row), correlationId);
      await recordRevision(tx, ctx, { type: 'RULE', ruleSetId, ruleId: row.id, key: row.key, version: row.version }, 'UPDATE', snapshot(row), input.reason);
      await enqueue(tx, ctx, 'RULE_UPDATED', { ruleId: row.id, ruleSetId, key: row.key }, correlationId);
      return row;
    });
    await flushOutbox();
    return updated;
  },

  async deleteRule(ctx: ActorContext, ruleSetId: string, ruleId: string, reason?: string): Promise<void> {
    const correlationId = randomUUID();
    await withTransaction(async (tx) => {
      const before = await ruleRepository.findScopedById(ruleId, ctx.organizationId, tx);
      if (!before || before.organizationId !== ctx.organizationId || before.ruleSetId !== ruleSetId) {
        throw new NotFoundError('Rule', ruleId);
      }
      await ruleRepository.softDelete(ruleId, tx);
      await audit(tx, ctx, 'Rule', ruleId, 'DELETE', snapshot(before), null, correlationId);
      await recordRevision(tx, ctx, { type: 'RULE', ruleSetId, ruleId, key: before.key, version: before.version }, 'DELETE', snapshot(before), reason);
      await enqueue(tx, ctx, 'RULE_DELETED', { ruleId, ruleSetId, key: before.key }, correlationId);
    });
    await flushOutbox();
  },

  // ── Evaluation ─────────────────────────────────────────────────────────────

  /**
   * Evaluate a rule set by key. Merges the platform-global baseline (NULL org)
   * with the caller's tenant override of the same key: the tenant set, when
   * present, governs strategy/default and contributes its rules on top of the
   * inherited global rules. The evaluation is recorded to the audit trail and
   * emitted as a RULE_EVALUATED event for forensic replay.
   */
  async evaluate(ctx: ActorContext, input: EvaluateInput): Promise<EvaluationResult> {
    const now = input.now ? new Date(input.now) : new Date();
    const [global, tenant] = await Promise.all([
      ruleSetRepository.findGlobalByKey(input.ruleSetKey),
      ruleSetRepository.findTenantByKey(input.ruleSetKey, ctx.organizationId),
    ]);
    if (!global && !tenant) throw new NotFoundError('RuleSet', input.ruleSetKey);

    const governing = (tenant ?? global) as RuleSet;
    const activeSetIds: string[] = [];
    if (global && setIsActive(global, now)) activeSetIds.push(global.id);
    if (tenant && setIsActive(tenant, now)) activeSetIds.push(tenant.id);

    const ruleRows = await ruleRepository.listActiveBySetIds(activeSetIds);

    const definition: RuleSetDefinition = {
      id: governing.id,
      key: governing.key,
      name: governing.name,
      category: governing.category,
      status: 'ACTIVE', // set-level windows already applied above
      conflictStrategy: governing.conflictStrategy,
      defaultDecision: asDecision(governing.defaultDecision),
      effectiveFrom: null,
      effectiveTo: null,
      rules: ruleRows.map(toRuleDefinition),
    };

    const result = evaluateRuleSet(definition, input.facts, { now });

    const correlationId = randomUUID();
    await withTransaction(async (tx) => {
      await audit(
        tx,
        ctx,
        'RuleSet',
        governing.id,
        'RULE_EVALUATED',
        null,
        {
          ruleSetKey: result.ruleSetKey,
          decision: result.decision,
          defaultApplied: result.defaultApplied,
          matched: result.matches.map((m) => m.ruleKey),
          evaluated: result.evaluated,
        } as Prisma.InputJsonValue,
        correlationId,
      );
      await enqueue(
        tx,
        ctx,
        'RULE_EVALUATED',
        { ruleSetKey: result.ruleSetKey, decision: result.decision, matched: result.matches.length, category: governing.category },
        correlationId,
      );
    });
    await flushOutbox();

    return result;
  },
};
