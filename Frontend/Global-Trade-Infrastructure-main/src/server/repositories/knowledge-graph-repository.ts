/**
 * @file server/repositories/knowledge-graph-repository.ts
 * @description MODULE 7 — read-only persistence for Knowledge Graph traversal
 * over the existing GCKB tables. Nodes are `gckb_records`; edges are
 * `gckb_relationships` (typed, directed, internal `toId` or external `toRef`).
 * All reads are tenant-scoped (global baseline ⊕ caller's tenant) and exclude
 * soft-deleted records. Batched queries keep breadth-first traversal to O(depth)
 * round-trips. This is a new, additive repository — it does not modify the
 * existing GCKB repositories.
 */
import { GckbRecord, GckbRelationship, Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';

function recordScope(organizationId: string | null): Prisma.GckbRecordWhereInput {
  return organizationId ? { OR: [{ organizationId: null }, { organizationId }] } : { organizationId: null };
}

function edgeScope(organizationId: string | null): Prisma.GckbRelationshipWhereInput {
  return organizationId ? { OR: [{ organizationId: null }, { organizationId }] } : { organizationId: null };
}

export class KnowledgeGraphRepository {
  nodeById(id: string, organizationId: string | null): Promise<GckbRecord | null> {
    return prisma.gckbRecord.findFirst({ where: { AND: [{ id, deletedAt: null }, recordScope(organizationId)] } });
  }

  nodesByIds(ids: string[], organizationId: string | null): Promise<GckbRecord[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return prisma.gckbRecord.findMany({ where: { AND: [{ id: { in: ids }, deletedAt: null }, recordScope(organizationId)] } });
  }

  /** Edges leaving any of `fromIds`. */
  outgoing(fromIds: string[], organizationId: string | null): Promise<GckbRelationship[]> {
    if (fromIds.length === 0) return Promise.resolve([]);
    return prisma.gckbRelationship.findMany({ where: { AND: [{ fromId: { in: fromIds } }, edgeScope(organizationId)] } });
  }

  /** Edges arriving at any of `toIds` (internal edges only — `toId` set). */
  incoming(toIds: string[], organizationId: string | null): Promise<GckbRelationship[]> {
    if (toIds.length === 0) return Promise.resolve([]);
    return prisma.gckbRelationship.findMany({ where: { AND: [{ toId: { in: toIds } }, edgeScope(organizationId)] } });
  }
}

export const knowledgeGraphRepository = new KnowledgeGraphRepository();
