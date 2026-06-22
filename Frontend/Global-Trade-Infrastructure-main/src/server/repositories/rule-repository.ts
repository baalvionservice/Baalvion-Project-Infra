/**
 * @file server/repositories/rule-repository.ts
 * @description Persistence for the Rule Engine: rule_sets, rules and the
 * append-only rule_revisions history. Reads are scoped to the platform-global
 * baseline (organizationId NULL) PLUS the caller's tenant; writes are tenant-owned.
 */
import { RuleSet, Rule, RuleRevision, Prisma } from '@prisma/client';
import { BaseRepository, client } from './base-repository';
import { prisma } from '../db/prisma';
import { ModelDelegate, PrismaTransaction, Paginated, PageRequest, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './types';

/** where-clause that returns global (NULL org) rows plus the caller's tenant rows. */
function globalOrTenant(organizationId: string | null): Prisma.RuleSetWhereInput {
  return organizationId
    ? { OR: [{ organizationId: null }, { organizationId }] }
    : { organizationId: null };
}

export interface RuleSetFilter {
  category?: string;
  status?: string;
  search?: string;
}

export class RuleSetRepository extends BaseRepository<RuleSet> {
  protected readonly entityName = 'RuleSet';
  protected delegate(tx?: PrismaTransaction): ModelDelegate<RuleSet> {
    return client(tx).ruleSet as unknown as ModelDelegate<RuleSet>;
  }

  findGlobalByKey(key: string, tx?: PrismaTransaction): Promise<RuleSet | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ key, organizationId: null }) });
  }

  findTenantByKey(key: string, organizationId: string, tx?: PrismaTransaction): Promise<RuleSet | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ key, organizationId }) });
  }

  /** Get a set by id, but only if it is global or owned by the caller's tenant. */
  async findScopedById(id: string, organizationId: string | null, tx?: PrismaTransaction): Promise<RuleSet | null> {
    return this.delegate(tx).findFirst({
      where: { ...this.liveWhere({ id }), ...globalOrTenant(organizationId) } as Record<string, unknown>,
    });
  }

  /** Paginated, filtered listing across global + tenant sets. */
  async listScoped(
    organizationId: string | null,
    filter: RuleSetFilter,
    req: PageRequest = {},
  ): Promise<Paginated<RuleSet>> {
    const page = Math.max(1, req.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, req.pageSize ?? DEFAULT_PAGE_SIZE));
    const where: Prisma.RuleSetWhereInput = {
      deletedAt: null,
      ...globalOrTenant(organizationId),
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.status ? { status: filter.status as RuleSet['status'] } : {}),
      ...(filter.search
        ? { OR: [{ name: { contains: filter.search, mode: 'insensitive' } }, { key: { contains: filter.search, mode: 'insensitive' } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.ruleSet.findMany({ where, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }], skip: (page - 1) * pageSize, take: pageSize }),
      prisma.ruleSet.count({ where }),
    ]);
    return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

export class RuleRepository extends BaseRepository<Rule> {
  protected readonly entityName = 'Rule';
  protected delegate(tx?: PrismaTransaction): ModelDelegate<Rule> {
    return client(tx).rule as unknown as ModelDelegate<Rule>;
  }

  listBySet(ruleSetId: string, tx?: PrismaTransaction): Promise<Rule[]> {
    return this.delegate(tx).findMany({
      where: this.liveWhere({ ruleSetId }),
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /** Active rules for one or more sets (used by the evaluation path). */
  async listActiveBySetIds(ruleSetIds: string[], tx?: PrismaTransaction): Promise<Rule[]> {
    if (ruleSetIds.length === 0) return [];
    return this.delegate(tx).findMany({
      where: this.liveWhere({ ruleSetId: { in: ruleSetIds }, status: 'ACTIVE' }),
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findScopedById(id: string, organizationId: string | null, tx?: PrismaTransaction): Promise<Rule | null> {
    return this.delegate(tx).findFirst({
      where: {
        ...this.liveWhere({ id }),
        ...(organizationId ? { OR: [{ organizationId: null }, { organizationId }] } : { organizationId: null }),
      } as Record<string, unknown>,
    });
  }
}

export type RuleRevisionInput = Omit<Prisma.RuleRevisionUncheckedCreateInput, 'id' | 'createdAt'>;

/** Append-only history. Intentionally exposes no update/delete (DB-enforced too). */
export class RuleRevisionRepository {
  record(input: RuleRevisionInput, tx?: PrismaTransaction): Promise<RuleRevision> {
    return (tx ?? prisma).ruleRevision.create({ data: input });
  }

  listBySet(ruleSetId: string, req: PageRequest = {}): Promise<RuleRevision[]> {
    const take = Math.min(MAX_PAGE_SIZE, Math.max(1, req.pageSize ?? DEFAULT_PAGE_SIZE));
    return prisma.ruleRevision.findMany({ where: { ruleSetId }, orderBy: { createdAt: 'desc' }, take });
  }

  listByEntity(entityType: string, entityKey: string): Promise<RuleRevision[]> {
    return prisma.ruleRevision.findMany({ where: { entityType, entityKey }, orderBy: { createdAt: 'desc' } });
  }
}

export const ruleSetRepository = new RuleSetRepository();
export const ruleRepository = new RuleRepository();
export const ruleRevisionRepository = new RuleRevisionRepository();
