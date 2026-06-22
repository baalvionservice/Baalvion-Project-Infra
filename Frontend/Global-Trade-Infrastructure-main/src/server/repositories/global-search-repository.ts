/**
 * @file server/repositories/global-search-repository.ts
 * @description MODULE 8 — read-only persistence for Global Search over every
 * registry entity (products, organizations, countries, HS codes, certificates,
 * documents, workflows, authorities, ports, policies, …) stored in `gckb_records`.
 * Tenant-scoped (global baseline ⊕ caller's tenant), soft-delete aware. New and
 * additive — it does not modify the existing GCKB repositories.
 */
import { GckbRecord, Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';

function scope(organizationId: string | null): Prisma.GckbRecordWhereInput {
  return organizationId ? { OR: [{ organizationId: null }, { organizationId }] } : { organizationId: null };
}

export interface GlobalSearchFilter {
  keyword?: string;
  entityTypes?: string[];
  tags?: string[];
  status?: string;
}

function buildWhere(organizationId: string | null, f: GlobalSearchFilter): Prisma.GckbRecordWhereInput {
  const and: Prisma.GckbRecordWhereInput[] = [{ deletedAt: null }, scope(organizationId)];
  if (f.entityTypes && f.entityTypes.length) and.push({ entityType: { in: f.entityTypes } });
  if (f.status) and.push({ status: f.status });
  if (f.tags && f.tags.length) and.push({ tags: { hasSome: f.tags } });
  if (f.keyword) {
    const kw = f.keyword;
    and.push({
      OR: [
        { name: { contains: kw, mode: 'insensitive' } },
        { recordKey: { contains: kw, mode: 'insensitive' } },
        { code: { contains: kw, mode: 'insensitive' } },
        { hsCode: { contains: kw, mode: 'insensitive' } },
        { productCategory: { contains: kw, mode: 'insensitive' } },
        { tags: { has: kw } },
      ],
    });
  }
  return { AND: and };
}

export interface EntityTypeFacet {
  entityType: string;
  count: number;
}

export class GlobalSearchRepository {
  /** A bounded window of matching records (most-recently-updated first) for ranking. */
  candidates(organizationId: string | null, filter: GlobalSearchFilter, take: number): Promise<GckbRecord[]> {
    return prisma.gckbRecord.findMany({ where: buildWhere(organizationId, filter), orderBy: { updatedAt: 'desc' }, take });
  }

  count(organizationId: string | null, filter: GlobalSearchFilter): Promise<number> {
    return prisma.gckbRecord.count({ where: buildWhere(organizationId, filter) });
  }

  /** Accurate per-entity-type counts across the whole match set (not just the page). */
  async facetByEntityType(organizationId: string | null, filter: GlobalSearchFilter): Promise<EntityTypeFacet[]> {
    const groups = await prisma.gckbRecord.groupBy({
      by: ['entityType'],
      where: buildWhere(organizationId, filter),
      _count: { _all: true },
      orderBy: { entityType: 'asc' },
    });
    return groups.map((g) => ({ entityType: g.entityType, count: g._count._all }));
  }

  /** Prefix-match suggestions across name / recordKey / code. */
  suggestions(organizationId: string | null, prefix: string, take: number): Promise<GckbRecord[]> {
    return prisma.gckbRecord.findMany({
      where: {
        AND: [
          { deletedAt: null },
          scope(organizationId),
          {
            OR: [
              { name: { startsWith: prefix, mode: 'insensitive' } },
              { recordKey: { startsWith: prefix, mode: 'insensitive' } },
              { code: { startsWith: prefix, mode: 'insensitive' } },
            ],
          },
        ],
      },
      orderBy: { name: 'asc' },
      take,
    });
  }
}

export const globalSearchRepository = new GlobalSearchRepository();
