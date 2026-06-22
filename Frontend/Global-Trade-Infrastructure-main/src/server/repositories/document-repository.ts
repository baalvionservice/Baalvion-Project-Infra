/**
 * @file server/repositories/document-repository.ts
 * @description Trade-document repository (Agent 12) with versioning support.
 */
import { Document, Prisma } from '@prisma/client';
import { BaseRepository, client } from './base-repository';
import {
  ModelDelegate,
  PrismaTransaction,
  Paginated,
  PageRequest,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from './types';

export interface VaultFilter {
  kind?: string;
  status?: string;
  tradeId?: string;
}

export class DocumentRepository extends BaseRepository<Document> {
  protected readonly entityName = 'Document';
  protected delegate(tx?: PrismaTransaction): ModelDelegate<Document> {
    return client(tx).document as unknown as ModelDelegate<Document>;
  }

  findScopedById(id: string, organizationId: string, tx?: PrismaTransaction): Promise<Document | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ id, organizationId }) });
  }

  async listByTrade(tradeTransactionId: string, tx?: PrismaTransaction): Promise<Document[]> {
    return client(tx).document.findMany({
      where: { tradeTransactionId, deletedAt: null },
      orderBy: [{ kind: 'asc' }, { version: 'desc' }],
    });
  }

  async latestVersion(tradeTransactionId: string, kind: string, tx?: PrismaTransaction): Promise<Document | null> {
    return client(tx).document.findFirst({
      where: { tradeTransactionId, kind, deletedAt: null, status: 'active' },
      orderBy: { version: 'desc' },
    });
  }

  /** Tenant-scoped vault listing (org-wide, optionally filtered). */
  async listVault(
    organizationId: string,
    filter: VaultFilter,
    req: PageRequest = {},
  ): Promise<Paginated<Document>> {
    const page = Math.max(1, req.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, req.pageSize ?? DEFAULT_PAGE_SIZE));
    const where: Prisma.DocumentWhereInput = {
      deletedAt: null,
      organizationId,
      ...(filter.kind ? { kind: filter.kind } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.tradeId ? { tradeTransactionId: filter.tradeId } : {}),
    };
    const [items, total] = await Promise.all([
      client().document.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      client().document.count({ where }),
    ]);
    return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

export const documentRepository = new DocumentRepository();
