/**
 * @file server/repositories/search-repository.ts
 * @description PROMPT 8 — read-only persistence for the marketplace search engine
 * over the catalogue records held in `gckb_records` (entityType in `product`,
 * `product_variant`, …). Tenant-scoped (global baseline ⊕ caller's tenant) and
 * soft-delete aware. New and additive: it never mutates the GCKB repositories.
 * The keyword pre-filter matches the promoted/indexed columns plus the JSON
 * `description`/`brand` fragments; full faceting and ranking happen in the pure
 * engine over the returned candidate window (the OpenSearch backend does the same
 * work natively). Also streams the whole catalogue for (re)indexing.
 */
import { GckbRecord, Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';

function scope(organizationId: string | null): Prisma.GckbRecordWhereInput {
  return organizationId ? { OR: [{ organizationId: null }, { organizationId }] } : { organizationId: null };
}

export interface CatalogFilter {
  entityTypes: string[];
  keyword?: string;
  status?: string;
}

function buildWhere(organizationId: string | null, f: CatalogFilter): Prisma.GckbRecordWhereInput {
  const and: Prisma.GckbRecordWhereInput[] = [{ deletedAt: null }, scope(organizationId)];
  if (f.entityTypes.length) and.push({ entityType: { in: f.entityTypes } });
  if (f.status) and.push({ status: f.status });
  const kw = f.keyword?.trim();
  if (kw) {
    and.push({
      OR: [
        { name: { contains: kw, mode: 'insensitive' } },
        { recordKey: { contains: kw, mode: 'insensitive' } },
        { code: { contains: kw, mode: 'insensitive' } },
        { hsCode: { contains: kw, mode: 'insensitive' } },
        { productCategory: { contains: kw, mode: 'insensitive' } },
        { tags: { has: kw } },
        { attributes: { path: ['description'], string_contains: kw } },
        { attributes: { path: ['brand'], string_contains: kw } },
      ],
    });
  }
  return { AND: and };
}

export class SearchRepository {
  /** A bounded, recency-ordered candidate window for the parity backend to rank. */
  candidates(organizationId: string | null, filter: CatalogFilter, take: number): Promise<GckbRecord[]> {
    return prisma.gckbRecord.findMany({ where: buildWhere(organizationId, filter), orderBy: { updatedAt: 'desc' }, take });
  }

  /** Total matches (drives the `capped` flag when it exceeds the candidate window). */
  count(organizationId: string | null, filter: CatalogFilter): Promise<number> {
    return prisma.gckbRecord.count({ where: buildWhere(organizationId, filter) });
  }

  /** Prefix suggestions across name / recordKey / code, catalogue-scoped. */
  suggestions(organizationId: string | null, entityTypes: string[], prefix: string, take: number): Promise<GckbRecord[]> {
    return prisma.gckbRecord.findMany({
      where: {
        AND: [
          { deletedAt: null },
          scope(organizationId),
          entityTypes.length ? { entityType: { in: entityTypes } } : {},
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

  /** One id-ordered page of the catalogue for (re)indexing. Empty array = done. */
  page(
    organizationId: string | null,
    entityTypes: string[],
    take: number,
    cursorId?: string,
  ): Promise<GckbRecord[]> {
    return prisma.gckbRecord.findMany({
      where: {
        AND: [{ deletedAt: null }, scope(organizationId), entityTypes.length ? { entityType: { in: entityTypes } } : {}],
      },
      orderBy: { id: 'asc' },
      take,
      ...(cursorId ? { skip: 1, cursor: { id: cursorId } } : {}),
    });
  }

  /** A single live record (used by the incremental index-on-write hook). */
  findById(id: string): Promise<GckbRecord | null> {
    return prisma.gckbRecord.findUnique({ where: { id } });
  }
}

export const searchRepository = new SearchRepository();
