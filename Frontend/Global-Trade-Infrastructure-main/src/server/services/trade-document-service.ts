/**
 * @file server/services/trade-document-service.ts
 * @description Trade-document generation + vault service. It renders any of the
 * five registered trade documents (invoice, packing list, B/L, certificate of
 * origin, customs declaration) from data, then deposits an immutable, versioned,
 * hashed record into the tenant document vault with an audit trail and outbox
 * event. The rendered content is returned to the caller; only metadata + the
 * content hash are persisted (the binary belongs in an object store).
 */
import { randomUUID } from 'crypto';
import { Document, Prisma } from '@prisma/client';
import { withTransaction } from '../db/prisma';
import { NotFoundError } from '../db/errors';
import { documentRepository, auditRepository, outboxRepository, VaultFilter } from '../repositories';
import { flushOutbox } from '../orchestration/event-store';
import { generateDocument, type GeneratedDocument } from '../documents/document-generator';
import { listTradeDocumentTypes, getTradeDocumentDef } from '../documents/trade-document-templates';
import type { DocumentData } from '../documents/template-engine';
import type { OutputFormat, DocumentTemplate } from '../documents/template-types';
import type { ActorContext } from './rule-service';

export interface GenerateAndVaultInput {
  documentType: string;
  data: DocumentData;
  format?: OutputFormat;
  locale?: string;
  persist?: boolean; // default true
  tradeId?: string; // optional trade binding (must reference an existing trade)
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface GenerateResult {
  generated: GeneratedDocument;
  document: Document | null;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export const tradeDocumentService = {
  /** The catalogue of available trade-document templates. */
  listTemplates(): { type: string; title: string; outputFormats: string[] }[] {
    return listTradeDocumentTypes();
  },

  getTemplate(type: string): DocumentTemplate {
    const def = getTradeDocumentDef(type);
    if (!def) throw new NotFoundError('DocumentTemplate', type);
    return def.template;
  },

  /** Generate a document and (unless persist === false) vault it. */
  async generate(ctx: ActorContext, input: GenerateAndVaultInput): Promise<GenerateResult> {
    const generated = generateDocument(
      { documentType: input.documentType, data: input.data, format: input.format, locale: input.locale },
      { now: new Date().toISOString() },
    );
    if (input.persist === false) return { generated, document: null };

    const correlationId = randomUUID();
    const document = await withTransaction(async (tx) => {
      let version = 1;
      if (input.tradeId) {
        const latest = await documentRepository.latestVersion(input.tradeId, input.documentType, tx);
        if (latest) await documentRepository.update(latest.id, { status: 'superseded' }, tx);
        version = (latest?.version ?? 0) + 1;
      }
      const created = (await documentRepository.create(
        {
          organizationId: ctx.organizationId,
          tradeTransactionId: input.tradeId ?? null,
          entityType: 'TradeDocument',
          entityId: null,
          kind: input.documentType,
          url: `vault://${ctx.organizationId}/${input.documentType}/${generated.documentNumber ?? generated.hash.slice(0, 12)}`,
          hash: generated.hash,
          status: 'active',
          version,
          metadata: asJson({
            documentNumber: generated.documentNumber,
            format: generated.format,
            reference: input.reference ?? null,
            generatedAt: generated.generatedAt,
            contentLength: generated.content.length,
            ...(input.metadata ?? {}),
          }),
        },
        tx,
      )) as Document;

      await auditRepository.record(
        {
          organizationId: ctx.organizationId,
          tradeId: input.tradeId ?? undefined,
          entityType: 'Document',
          entityId: created.id,
          action: 'GENERATE_DOCUMENT',
          actorId: ctx.actorId,
          actorRole: ctx.actorRole,
          source: 'documents',
          afterState: asJson({ documentType: input.documentType, documentNumber: generated.documentNumber, version }),
          correlationId,
          ip: ctx.ip ?? undefined,
        },
        tx,
      );
      await outboxRepository.enqueue(
        {
          organizationId: ctx.organizationId,
          tradeId: input.tradeId ?? null,
          eventType: 'TRADE_DOCUMENT_GENERATED',
          payload: {
            documentId: created.id,
            documentType: input.documentType,
            documentNumber: generated.documentNumber,
            hash: generated.hash,
            version,
            actorId: ctx.actorId,
          } as Prisma.InputJsonValue,
          correlationId,
          sequence: 0,
        },
        tx,
      );
      return created;
    });
    await flushOutbox();
    return { generated, document };
  },

  listVault(ctx: ActorContext, filter: VaultFilter, page: { page: number; pageSize: number }) {
    return documentRepository.listVault(ctx.organizationId, filter, page);
  },

  async getDocument(ctx: ActorContext, id: string): Promise<Document> {
    const doc = await documentRepository.findScopedById(id, ctx.organizationId);
    if (!doc) throw new NotFoundError('Document', id);
    return doc;
  },
};
