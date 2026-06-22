/**
 * @file server/services/gckb-service.ts
 * @description The Global Country Knowledge Base application service. A single
 * generic lifecycle engine drives every entity type via the registry: create,
 * update, publish, archive, get, search, history, version comparison,
 * relationships and bulk import. Each mutation runs in one transaction that
 * writes the head row, an append-only revision snapshot, (for tenant writes) an
 * immutable audit row and outbox event(s), then relays the events.
 *
 * Tenancy: `organizationId` may be a tenant UUID (override data, full audit +
 * outbox) or `null` (the platform-global canonical baseline — provisioned by
 * privileged tooling; history is captured in the immutable revision store and
 * events are published directly to the bus).
 */
import { randomUUID } from 'crypto';
import { GckbRecord, GckbRevision, GckbRelationship, Prisma } from '@prisma/client';
import { eventBus } from '@/orchestration/event-bus';
import { withTransaction, PrismaTransaction } from '../db/prisma';
import { NotFoundError, ValidationError, OptimisticLockError } from '../db/errors';
import {
  gckbRecordRepository,
  gckbRelationshipRepository,
  gckbRevisionRepository,
  auditRepository,
  outboxRepository,
} from '../repositories';
import { flushOutbox } from '../orchestration/event-store';
import { getEntityDefinition, KbEntityDefinition } from '../gckb/registry';
import { recordChecksum } from '../gckb/checksum';
import { KbWriteInput, KbSearchQuery, KbRelationshipInput, LifecycleAction } from '../gckb/types';

export interface KbActorContext {
  organizationId: string | null; // null = platform-global baseline write
  actorId: string;
  actorRole: string;
  ip?: string | null;
  source?: string | null;
}

interface PendingEvent {
  type: string;
  payload: Record<string, unknown>;
}

function defOrThrow(entityType: string): KbEntityDefinition {
  const def = getEntityDefinition(entityType);
  if (!def) throw new ValidationError(`Unknown GCKB entity type: "${entityType}"`);
  return def;
}

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new ValidationError(`Invalid date: ${value}`);
  return d;
}

function snapshot(record: GckbRecord): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(record)) as Prisma.InputJsonValue;
}

export class GckbService {
  // ── internal helpers ───────────────────────────────────────────────────────

  private async resolveCountryId(
    ctx: KbActorContext,
    def: KbEntityDefinition,
    input: KbWriteInput,
    tx: PrismaTransaction,
  ): Promise<string | null> {
    if (!def.countryScoped && !input.countryCode) return null;
    if (def.countryScoped && !input.countryCode) {
      throw new ValidationError(`${def.label} requires a countryCode`);
    }
    if (!input.countryCode) return null;
    const id = await gckbRecordRepository.findCountryIdByCode(input.countryCode, ctx.organizationId, tx);
    if (!id) throw new ValidationError(`Country "${input.countryCode}" is not in the knowledge base (create it first)`);
    return id;
  }

  private buildData(
    ctx: KbActorContext,
    def: KbEntityDefinition,
    input: KbWriteInput,
    recordKey: string,
    countryId: string | null,
    version: number,
    checksum: string,
  ): Prisma.GckbRecordUncheckedCreateInput {
    const env = input.envelope ?? {};
    const status = input.status ?? 'DRAFT';
    return {
      organizationId: ctx.organizationId,
      entityType: def.entityType,
      recordKey,
      name: input.name,
      countryId,
      parentId: null,
      code: input.code ?? null,
      policyType: def.usesPolicyType ? input.policyType ?? null : null,
      hsCode: input.hsCode ?? null,
      productCategory: input.productCategory ?? null,
      attributes: (input.attributes ?? {}) as Prisma.InputJsonValue,
      tags: input.tags ?? [],
      version,
      status,
      effectiveFrom: toDate(env.effectiveFrom),
      effectiveTo: toDate(env.effectiveTo),
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
      authority: env.authority ?? null,
      source: env.source ?? ctx.source ?? null,
      checksum,
      auditReference: env.auditReference ?? null,
    };
  }

  private async writeRevision(
    tx: PrismaTransaction,
    ctx: KbActorContext,
    record: GckbRecord,
    action: LifecycleAction,
    reason?: string,
  ): Promise<void> {
    await gckbRevisionRepository.record(
      {
        organizationId: ctx.organizationId,
        recordId: record.id,
        entityType: record.entityType,
        recordKey: record.recordKey,
        version: record.version,
        action,
        snapshot: snapshot(record),
        checksum: record.checksum,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        source: record.source ?? ctx.source ?? null,
        reason: reason ?? null,
      },
      tx,
    );
  }

  private async writeAudit(
    tx: PrismaTransaction,
    ctx: KbActorContext,
    record: GckbRecord,
    action: string,
    before: Prisma.InputJsonValue | null,
    correlationId: string,
  ): Promise<void> {
    if (!ctx.organizationId) return; // global baseline: history lives in revisions
    await auditRepository.record(
      {
        organizationId: ctx.organizationId,
        entityType: `gckb:${record.entityType}`,
        entityId: record.id,
        action,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        source: 'gckb',
        beforeState: before ?? undefined,
        afterState: snapshot(record),
        correlationId,
        ip: ctx.ip ?? undefined,
      },
      tx,
    );
  }

  private async enqueueEvents(
    tx: PrismaTransaction,
    ctx: KbActorContext,
    events: PendingEvent[],
    correlationId: string,
  ): Promise<void> {
    if (!ctx.organizationId) return; // direct-published post-commit for global writes
    for (const e of events) {
      await outboxRepository.enqueue(
        { organizationId: ctx.organizationId, tradeId: null, eventType: e.type, payload: e.payload as Prisma.InputJsonValue, correlationId, sequence: 0 },
        tx,
      );
    }
  }

  private async relayEvents(ctx: KbActorContext, events: PendingEvent[]): Promise<void> {
    if (ctx.organizationId) {
      await flushOutbox();
    } else {
      for (const e of events) await eventBus.publish(e.type, e.payload);
    }
  }

  private eventPayload(record: GckbRecord, action: string): Record<string, unknown> {
    return {
      entityType: record.entityType,
      recordId: record.id,
      recordKey: record.recordKey,
      policyType: record.policyType,
      countryId: record.countryId,
      version: record.version,
      organizationId: record.organizationId,
      action,
    };
  }

  // ── create ──────────────────────────────────────────────────────────────────

  async create(ctx: KbActorContext, entityType: string, input: KbWriteInput): Promise<GckbRecord> {
    const def = defOrThrow(entityType);
    const validation = def.validate(input);
    if (!validation.ok) throw new ValidationError(validation.errors.join('; '));

    const recordKey = def.deriveRecordKey(input);
    const correlationId = randomUUID();
    const events: PendingEvent[] = [];

    const created = await withTransaction(async (tx) => {
      const existing = ctx.organizationId
        ? await gckbRecordRepository.findTenantByKey(entityType, recordKey, ctx.organizationId, tx)
        : await gckbRecordRepository.findGlobalByKey(entityType, recordKey, tx);
      if (existing) {
        throw new ValidationError(`${def.label} "${recordKey}" already exists (use update)`);
      }
      const countryId = await this.resolveCountryId(ctx, def, input, tx);
      const checksum = recordChecksum({ ...input, entityType, recordKey, attributes: input.attributes });
      const data = this.buildData(ctx, def, input, recordKey, countryId, 1, checksum);
      const record = await gckbRecordRepository.create(data, tx);

      await this.writeRevision(tx, ctx, record, 'CREATE');
      await this.writeAudit(tx, ctx, record, 'CREATE', null, correlationId);

      events.push({ type: def.events.created, payload: this.eventPayload(record, 'CREATE') });
      for (const extra of def.extraCreatedEvents?.(input) ?? []) {
        events.push({ type: extra, payload: this.eventPayload(record, 'CREATE') });
      }
      await this.enqueueEvents(tx, ctx, events, correlationId);
      return record;
    });

    await this.relayEvents(ctx, events);
    return created;
  }

  // ── update ──────────────────────────────────────────────────────────────────

  async update(
    ctx: KbActorContext,
    id: string,
    input: Partial<KbWriteInput> & { expectedVersion?: number; reason?: string },
  ): Promise<GckbRecord> {
    const correlationId = randomUUID();
    const events: PendingEvent[] = [];

    const updated = await withTransaction(async (tx) => {
      const before = await gckbRecordRepository.findScopedById(id, ctx.organizationId, tx);
      if (!before) throw new NotFoundError('GckbRecord', id);
      if (before.organizationId !== ctx.organizationId) {
        throw new NotFoundError('GckbRecord', id); // global rows are not tenant-editable via the API
      }
      if (input.expectedVersion !== undefined && input.expectedVersion !== before.version) {
        throw new OptimisticLockError('GckbRecord', id, input.expectedVersion);
      }

      const def = defOrThrow(before.entityType);
      // Merge: a partial update preserves existing values for omitted fields.
      const merged: KbWriteInput = {
        recordKey: before.recordKey,
        name: input.name ?? before.name,
        attributes: (input.attributes ?? (before.attributes as Record<string, unknown>)) ?? {},
        countryCode: input.countryCode,
        code: input.code ?? before.code,
        policyType: input.policyType ?? before.policyType,
        hsCode: input.hsCode ?? before.hsCode,
        productCategory: input.productCategory ?? before.productCategory,
        tags: input.tags ?? before.tags,
        status: input.status ?? (before.status as KbWriteInput['status']),
        envelope: {
          effectiveFrom: input.envelope?.effectiveFrom ?? before.effectiveFrom?.toISOString() ?? null,
          effectiveTo: input.envelope?.effectiveTo ?? before.effectiveTo?.toISOString() ?? null,
          authority: input.envelope?.authority ?? before.authority,
          source: input.envelope?.source ?? before.source,
          auditReference: input.envelope?.auditReference ?? before.auditReference,
        },
      };
      const validation = def.validate(merged);
      if (!validation.ok) throw new ValidationError(validation.errors.join('; '));

      const newChecksum = recordChecksum({
        ...merged,
        entityType: before.entityType,
        recordKey: before.recordKey,
        attributes: merged.attributes,
      });
      if (newChecksum === before.checksum && (input.status ?? before.status) === before.status) {
        return before; // no-op: nothing changed
      }

      const countryId = input.countryCode ? await this.resolveCountryId(ctx, def, merged, tx) : before.countryId;
      const nextVersion = before.version + 1;
      const data = this.buildData(ctx, def, merged, before.recordKey, countryId, nextVersion, newChecksum);
      // updatedAt auto-managed; do not change createdAt or organizationId.
      const record = await gckbRecordRepository.update(id, { ...data, organizationId: before.organizationId }, tx);

      await this.writeRevision(tx, ctx, record, 'UPDATE', input.reason);
      await this.writeAudit(tx, ctx, record, 'UPDATE', snapshot(before), correlationId);
      events.push({ type: def.events.updated, payload: this.eventPayload(record, 'UPDATE') });
      await this.enqueueEvents(tx, ctx, events, correlationId);
      return record;
    });

    await this.relayEvents(ctx, events);
    return updated;
  }

  // ── publish / archive ─────────────────────────────────────────────────────────

  async publish(ctx: KbActorContext, id: string): Promise<GckbRecord> {
    return this.transition(ctx, id, 'PUBLISH', { status: 'PUBLISHED', publishedAt: new Date() });
  }

  async archive(ctx: KbActorContext, id: string, reason?: string): Promise<GckbRecord> {
    return this.transition(ctx, id, 'ARCHIVE', { status: 'ARCHIVED', deletedAt: new Date() }, reason);
  }

  private async transition(
    ctx: KbActorContext,
    id: string,
    action: 'PUBLISH' | 'ARCHIVE',
    patch: Prisma.GckbRecordUncheckedUpdateInput,
    reason?: string,
  ): Promise<GckbRecord> {
    const correlationId = randomUUID();
    const events: PendingEvent[] = [];
    const result = await withTransaction(async (tx) => {
      const before = await gckbRecordRepository.findScopedById(id, ctx.organizationId, tx);
      if (!before || before.organizationId !== ctx.organizationId) throw new NotFoundError('GckbRecord', id);
      const def = defOrThrow(before.entityType);
      const record = await gckbRecordRepository.update(id, { ...patch, version: before.version + 1 }, tx);
      await this.writeRevision(tx, ctx, record, action, reason);
      await this.writeAudit(tx, ctx, record, action, snapshot(before), correlationId);
      const type = action === 'ARCHIVE' ? def.events.archived : `${def.entityType.toUpperCase()}_PUBLISHED`;
      events.push({ type, payload: this.eventPayload(record, action) });
      await this.enqueueEvents(tx, ctx, events, correlationId);
      return record;
    });
    await this.relayEvents(ctx, events);
    return result;
  }

  // ── reads ──────────────────────────────────────────────────────────────────

  async get(ctx: KbActorContext, id: string): Promise<{ record: GckbRecord; relationships: GckbRelationship[] }> {
    const record = await gckbRecordRepository.findScopedById(id, ctx.organizationId);
    if (!record) throw new NotFoundError('GckbRecord', id);
    const relationships = await gckbRelationshipRepository.listFrom(id);
    return { record, relationships };
  }

  async search(ctx: KbActorContext, query: KbSearchQuery) {
    let countryId: string | undefined;
    if (query.countryCode) {
      const resolved = await gckbRecordRepository.findCountryIdByCode(query.countryCode, ctx.organizationId);
      if (!resolved) return { items: [], total: 0, page: query.page ?? 1, pageSize: query.pageSize ?? 25, pages: 1 };
      countryId = resolved;
    }
    return gckbRecordRepository.search(
      ctx.organizationId,
      {
        entityType: query.entityType,
        countryId,
        policyType: query.policyType,
        hsCode: query.hsCode,
        productCategory: query.productCategory,
        authority: query.authority,
        code: query.code,
        status: query.status,
        tag: query.tag,
        keyword: query.keyword,
        asOf: query.asOf ? new Date(query.asOf) : undefined,
      },
      { page: query.page, pageSize: query.pageSize },
    );
  }

  async history(ctx: KbActorContext, id: string): Promise<GckbRevision[]> {
    await this.get(ctx, id); // scope check
    return gckbRevisionRepository.listByRecord(id);
  }

  async versions(ctx: KbActorContext, id: string): Promise<GckbRevision[]> {
    return this.history(ctx, id);
  }

  /** Two version snapshots for side-by-side comparison. */
  async compareVersions(ctx: KbActorContext, id: string, a: number, b: number): Promise<{ a: GckbRevision; b: GckbRevision }> {
    await this.get(ctx, id);
    const [va, vb] = await Promise.all([gckbRevisionRepository.getVersion(id, a), gckbRevisionRepository.getVersion(id, b)]);
    if (!va) throw new NotFoundError('GckbRevision', `${id}@${a}`);
    if (!vb) throw new NotFoundError('GckbRevision', `${id}@${b}`);
    return { a: va, b: vb };
  }

  // ── relationships ────────────────────────────────────────────────────────────

  async addRelationship(ctx: KbActorContext, id: string, input: KbRelationshipInput): Promise<GckbRelationship> {
    const { record } = await this.get(ctx, id);
    return gckbRelationshipRepository.create({
      organizationId: ctx.organizationId,
      fromId: record.id,
      relationType: input.relationType,
      toType: input.toType,
      toId: input.toId ?? null,
      toRef: input.toRef ?? null,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    });
  }

  listRelationships(_ctx: KbActorContext, id: string): Promise<GckbRelationship[]> {
    return gckbRelationshipRepository.listFrom(id);
  }

  // ── bulk import (transactional, all-or-nothing) ──────────────────────────────

  /**
   * Apply a validated set of rows for one entity type in a SINGLE transaction.
   * Any row error rolls back the entire batch (spec §IMPORT rollback). Existing
   * records (by natural key) are updated; new ones are created. Returns a summary.
   */
  async applyImport(
    ctx: KbActorContext,
    entityType: string,
    inputs: KbWriteInput[],
  ): Promise<{ created: number; updated: number; recordIds: string[] }> {
    const def = defOrThrow(entityType);
    const events: PendingEvent[] = [];
    const correlationId = randomUUID();

    const result = await withTransaction(async (tx) => {
      let created = 0;
      let updated = 0;
      const recordIds: string[] = [];

      for (let i = 0; i < inputs.length; i += 1) {
        const input = inputs[i];
        const validation = def.validate(input);
        if (!validation.ok) throw new ValidationError(`row ${i + 1}: ${validation.errors.join('; ')}`);
        const recordKey = def.deriveRecordKey(input);
        const countryId = await this.resolveCountryId(ctx, def, input, tx);
        const checksum = recordChecksum({ ...input, entityType, recordKey, attributes: input.attributes });

        const existing = ctx.organizationId
          ? await gckbRecordRepository.findTenantByKey(entityType, recordKey, ctx.organizationId, tx)
          : await gckbRecordRepository.findGlobalByKey(entityType, recordKey, tx);

        if (!existing) {
          const data = this.buildData(ctx, def, input, recordKey, countryId, 1, checksum);
          const record = await gckbRecordRepository.create(data, tx);
          await this.writeRevision(tx, ctx, record, 'IMPORT');
          await this.writeAudit(tx, ctx, record, 'IMPORT', null, correlationId);
          events.push({ type: def.events.created, payload: this.eventPayload(record, 'IMPORT') });
          created += 1;
          recordIds.push(record.id);
        } else if (existing.checksum !== checksum) {
          const data = this.buildData(ctx, def, input, recordKey, countryId, existing.version + 1, checksum);
          const record = await gckbRecordRepository.update(existing.id, { ...data, organizationId: existing.organizationId }, tx);
          await this.writeRevision(tx, ctx, record, 'IMPORT');
          await this.writeAudit(tx, ctx, record, 'IMPORT', snapshot(existing), correlationId);
          events.push({ type: def.events.updated, payload: this.eventPayload(record, 'IMPORT') });
          updated += 1;
          recordIds.push(record.id);
        } else {
          recordIds.push(existing.id); // unchanged duplicate — skip
        }
      }

      await this.enqueueEvents(tx, ctx, events, correlationId);
      return { created, updated, recordIds };
    });

    await this.relayEvents(ctx, events);
    return result;
  }

  /**
   * Dry-run classification of an import batch — no writes. Reports, per natural
   * key, whether the row would create, update or leave a record unchanged.
   */
  async previewImport(
    ctx: KbActorContext,
    entityType: string,
    inputs: KbWriteInput[],
  ): Promise<{ willCreate: number; willUpdate: number; unchanged: number; rows: Array<{ recordKey: string; action: 'CREATE' | 'UPDATE' | 'UNCHANGED' }> }> {
    const def = defOrThrow(entityType);
    const rows: Array<{ recordKey: string; action: 'CREATE' | 'UPDATE' | 'UNCHANGED' }> = [];
    let willCreate = 0;
    let willUpdate = 0;
    let unchanged = 0;
    for (const input of inputs) {
      const recordKey = def.deriveRecordKey(input);
      const checksum = recordChecksum({ ...input, entityType, recordKey, attributes: input.attributes });
      const existing = ctx.organizationId
        ? await gckbRecordRepository.findTenantByKey(entityType, recordKey, ctx.organizationId)
        : await gckbRecordRepository.findGlobalByKey(entityType, recordKey);
      if (!existing) {
        willCreate += 1;
        rows.push({ recordKey, action: 'CREATE' });
      } else if (existing.checksum !== checksum) {
        willUpdate += 1;
        rows.push({ recordKey, action: 'UPDATE' });
      } else {
        unchanged += 1;
        rows.push({ recordKey, action: 'UNCHANGED' });
      }
    }
    return { willCreate, willUpdate, unchanged, rows };
  }
}

export const gckbService = new GckbService();
export type { KbWriteInput, KbSearchQuery } from '../gckb/types';
