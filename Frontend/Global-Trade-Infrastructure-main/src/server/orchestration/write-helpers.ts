/**
 * @file server/orchestration/write-helpers.ts
 * @description Shared building blocks for the write path: an immutable audit row
 * and a transactional-outbox event, both written inside the caller's database
 * transaction (atomic with the state change). The treasury services use these so
 * every mutation produces an audit event and an at-least-once domain event.
 */
import { Prisma } from '@prisma/client';
import { PrismaTransaction } from '../db/prisma';
import { auditRepository, outboxRepository } from '../repositories';
import type { ActorContext } from '../services/rule-service';

export function snapshot<T>(row: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(row)) as Prisma.InputJsonValue;
}

export function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export interface AuditParams {
  source: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
  correlationId: string;
  tradeId?: string | null;
}

export async function auditWrite(tx: PrismaTransaction, ctx: ActorContext, params: AuditParams): Promise<void> {
  await auditRepository.record(
    {
      organizationId: ctx.organizationId,
      tradeId: params.tradeId ?? undefined,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      source: params.source,
      beforeState: params.before ?? undefined,
      afterState: params.after ?? undefined,
      correlationId: params.correlationId,
      ip: ctx.ip ?? undefined,
    },
    tx,
  );
}

export async function enqueueEvent(
  tx: PrismaTransaction,
  ctx: ActorContext,
  params: { eventType: string; payload: Record<string, unknown>; correlationId: string; tradeId?: string | null },
): Promise<void> {
  await outboxRepository.enqueue(
    {
      organizationId: ctx.organizationId,
      tradeId: params.tradeId ?? null,
      eventType: params.eventType,
      payload: { ...params.payload, actorId: ctx.actorId, organizationId: ctx.organizationId } as Prisma.InputJsonValue,
      correlationId: params.correlationId,
      sequence: 0,
    },
    tx,
  );
}
