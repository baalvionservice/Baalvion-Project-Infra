/**
 * @file server/repositories/gckb-repository.ts
 * @description Persistence for the Global Country Knowledge Base: gckb_records
 * (generic discriminated head rows), gckb_relationships (typed edges) and the
 * append-only gckb_revisions history. Reads are scoped to the platform-global
 * baseline (organizationId NULL) plus the caller's tenant; writes are tenant-owned
 * (the global baseline is provisioned by privileged tooling).
 */
import { GckbRecord, GckbRelationship, GckbRevision, Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { client } from './base-repository';
import { PrismaTransaction, Paginated, PageRequest, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './types';

function scope(organizationId: string | null): Prisma.GckbRecordWhereInput {
  return organizationId ? { OR: [{ organizationId: null }, { organizationId }] } : { organizationId: null };
}

export interface RecordSearchFilter {
  entityType?: string;
  countryId?: string;
  policyType?: string;
  hsCode?: string;
  productCategory?: string;
  authority?: string;
  code?: string;
  status?: string;
  tag?: string;
  keyword?: string;
  asOf?: Date;
}

export class GckbRecordRepository {
  findById(id: string, tx?: PrismaTransaction): Promise<GckbRecord | null> {
    return client(tx).gckbRecord.findFirst({ where: { id, deletedAt: null } });
  }

  findScopedById(id: string, organizationId: string | null, tx?: PrismaTransaction): Promise<GckbRecord | null> {
    return client(tx).gckbRecord.findFirst({ where: { id, deletedAt: null, ...scope(organizationId) } });
  }

  findGlobalByKey(entityType: string, recordKey: string, tx?: PrismaTransaction): Promise<GckbRecord | null> {
    return client(tx).gckbRecord.findFirst({ where: { entityType, recordKey, organizationId: null, deletedAt: null } });
  }

  findTenantByKey(entityType: string, recordKey: string, organizationId: string, tx?: PrismaTransaction): Promise<GckbRecord | null> {
    return client(tx).gckbRecord.findFirst({ where: { entityType, recordKey, organizationId, deletedAt: null } });
  }

  /** Resolve a country's id by ISO code, preferring a tenant record over global. */
  async findCountryIdByCode(code: string, organizationId: string | null, tx?: PrismaTransaction): Promise<string | null> {
    const recordKey = code.toUpperCase();
    const tenant = organizationId
      ? await client(tx).gckbRecord.findFirst({ where: { entityType: 'country', recordKey, organizationId, deletedAt: null } })
      : null;
    if (tenant) return tenant.id;
    const global = await client(tx).gckbRecord.findFirst({ where: { entityType: 'country', recordKey, organizationId: null, deletedAt: null } });
    return global?.id ?? null;
  }

  create(data: Prisma.GckbRecordUncheckedCreateInput, tx?: PrismaTransaction): Promise<GckbRecord> {
    return client(tx).gckbRecord.create({ data });
  }

  update(id: string, data: Prisma.GckbRecordUncheckedUpdateInput, tx?: PrismaTransaction): Promise<GckbRecord> {
    return client(tx).gckbRecord.update({ where: { id }, data });
  }

  async search(
    organizationId: string | null,
    filter: RecordSearchFilter,
    req: PageRequest = {},
  ): Promise<Paginated<GckbRecord>> {
    const page = Math.max(1, req.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, req.pageSize ?? DEFAULT_PAGE_SIZE));
    const and: Prisma.GckbRecordWhereInput[] = [{ deletedAt: null }, scope(organizationId)];

    if (filter.entityType) and.push({ entityType: filter.entityType });
    if (filter.countryId) and.push({ countryId: filter.countryId });
    if (filter.policyType) and.push({ policyType: filter.policyType });
    if (filter.hsCode) and.push({ hsCode: filter.hsCode });
    if (filter.productCategory) and.push({ productCategory: filter.productCategory });
    if (filter.authority) and.push({ authority: { contains: filter.authority, mode: 'insensitive' } });
    if (filter.code) and.push({ code: filter.code });
    if (filter.status) and.push({ status: filter.status });
    if (filter.tag) and.push({ tags: { has: filter.tag } });
    if (filter.keyword) {
      const kw = filter.keyword;
      and.push({
        OR: [
          { name: { contains: kw, mode: 'insensitive' } },
          { recordKey: { contains: kw, mode: 'insensitive' } },
          { code: { contains: kw, mode: 'insensitive' } },
        ],
      });
    }
    if (filter.asOf) {
      and.push({ status: 'PUBLISHED' });
      and.push({ OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: filter.asOf } }] });
      and.push({ OR: [{ effectiveTo: null }, { effectiveTo: { gt: filter.asOf } }] });
    }

    const where: Prisma.GckbRecordWhereInput = { AND: and };
    const [items, total] = await Promise.all([
      prisma.gckbRecord.findMany({ where, orderBy: [{ entityType: 'asc' }, { recordKey: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
      prisma.gckbRecord.count({ where }),
    ]);
    return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

export type RelationshipInput = Omit<Prisma.GckbRelationshipUncheckedCreateInput, 'id' | 'createdAt'>;

export class GckbRelationshipRepository {
  create(input: RelationshipInput, tx?: PrismaTransaction): Promise<GckbRelationship> {
    return client(tx).gckbRelationship.create({ data: input });
  }

  listFrom(fromId: string): Promise<GckbRelationship[]> {
    return prisma.gckbRelationship.findMany({ where: { fromId }, orderBy: { createdAt: 'asc' } });
  }

  deleteByFrom(fromId: string, tx?: PrismaTransaction): Promise<Prisma.BatchPayload> {
    return client(tx).gckbRelationship.deleteMany({ where: { fromId } });
  }
}

export type GckbRevisionInput = Omit<Prisma.GckbRevisionUncheckedCreateInput, 'id' | 'createdAt'>;

/** Append-only history. Exposes no update/delete (DB trigger enforces too). */
export class GckbRevisionRepository {
  record(input: GckbRevisionInput, tx?: PrismaTransaction): Promise<GckbRevision> {
    return client(tx).gckbRevision.create({ data: input });
  }

  listByRecord(recordId: string): Promise<GckbRevision[]> {
    return prisma.gckbRevision.findMany({ where: { recordId }, orderBy: { version: 'desc' } });
  }

  listByKey(entityType: string, recordKey: string): Promise<GckbRevision[]> {
    return prisma.gckbRevision.findMany({ where: { entityType, recordKey }, orderBy: { version: 'desc' } });
  }

  getVersion(recordId: string, version: number): Promise<GckbRevision | null> {
    return prisma.gckbRevision.findFirst({ where: { recordId, version } });
  }
}

export const gckbRecordRepository = new GckbRecordRepository();
export const gckbRelationshipRepository = new GckbRelationshipRepository();
export const gckbRevisionRepository = new GckbRevisionRepository();
