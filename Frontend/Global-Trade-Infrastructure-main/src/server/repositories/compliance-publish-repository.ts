/**
 * @file server/repositories/compliance-publish-repository.ts
 * @description Persistence for the compliance publish gate: moderation_cases and
 * publish_gates. Both are tenant-owned (organizationId NOT NULL) and RLS-scoped.
 * publish_gates is the optimistic-locked workflow aggregate.
 */
import { ModerationCase, PublishGate, Prisma } from '@prisma/client';
import { BaseRepository, client } from './base-repository';
import { prisma } from '../db/prisma';
import {
  ModelDelegate,
  PrismaTransaction,
  Paginated,
  PageRequest,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from './types';

export type ModerationCaseCreateInput = Omit<Prisma.ModerationCaseUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>;
export type PublishGateCreateInput = Omit<Prisma.PublishGateUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>;

export interface PublishGateFilter {
  status?: string;
  subjectType?: string;
  subjectId?: string;
  decision?: string;
  tradeId?: string;
}

// ── Moderation cases ─────────────────────────────────────────────────────────

export class ModerationCaseRepository extends BaseRepository<ModerationCase> {
  protected readonly entityName = 'ModerationCase';
  protected readonly softDeletes = false;
  protected delegate(tx?: PrismaTransaction): ModelDelegate<ModerationCase> {
    return client(tx).moderationCase as unknown as ModelDelegate<ModerationCase>;
  }

  findScopedById(id: string, organizationId: string, tx?: PrismaTransaction): Promise<ModerationCase | null> {
    return this.delegate(tx).findFirst({ where: { id, organizationId } });
  }

  async listScoped(
    organizationId: string,
    filter: { subjectType?: string; subjectId?: string; status?: string },
    req: PageRequest = {},
  ): Promise<Paginated<ModerationCase>> {
    const page = Math.max(1, req.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, req.pageSize ?? DEFAULT_PAGE_SIZE));
    const where: Prisma.ModerationCaseWhereInput = {
      organizationId,
      ...(filter.subjectType ? { subjectType: filter.subjectType } : {}),
      ...(filter.subjectId ? { subjectId: filter.subjectId } : {}),
      ...(filter.status ? { status: filter.status as ModerationCase['status'] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.moderationCase.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.moderationCase.count({ where }),
    ]);
    return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

// ── Publish gates (optimistic-locked workflow aggregate) ─────────────────────

export class PublishGateRepository extends BaseRepository<PublishGate> {
  protected readonly entityName = 'PublishGate';
  protected delegate(tx?: PrismaTransaction): ModelDelegate<PublishGate> {
    return client(tx).publishGate as unknown as ModelDelegate<PublishGate>;
  }

  findScopedById(id: string, organizationId: string, tx?: PrismaTransaction): Promise<PublishGate | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ id, organizationId }) });
  }

  findActiveBySubject(
    organizationId: string,
    subjectType: string,
    subjectId: string,
    tx?: PrismaTransaction,
  ): Promise<PublishGate | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ organizationId, subjectType, subjectId }) });
  }

  findByReference(organizationId: string, reference: string, tx?: PrismaTransaction): Promise<PublishGate | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ organizationId, reference }) });
  }

  async listScoped(
    organizationId: string,
    filter: PublishGateFilter,
    req: PageRequest = {},
  ): Promise<Paginated<PublishGate>> {
    const page = Math.max(1, req.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, req.pageSize ?? DEFAULT_PAGE_SIZE));
    const where: Prisma.PublishGateWhereInput = {
      deletedAt: null,
      organizationId,
      ...(filter.status ? { status: filter.status as PublishGate['status'] } : {}),
      ...(filter.subjectType ? { subjectType: filter.subjectType } : {}),
      ...(filter.subjectId ? { subjectId: filter.subjectId } : {}),
      ...(filter.decision ? { decision: filter.decision as PublishGate['decision'] } : {}),
      ...(filter.tradeId ? { tradeId: filter.tradeId } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.publishGate.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.publishGate.count({ where }),
    ]);
    return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

export const moderationCaseRepository = new ModerationCaseRepository();
export const publishGateRepository = new PublishGateRepository();
