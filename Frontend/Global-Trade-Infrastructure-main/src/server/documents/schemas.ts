/**
 * @file server/documents/schemas.ts
 * @description Zod validators for the trade-document generation + vault API.
 */
import { z } from 'zod';

export const generateDocumentSchema = z.object({
  documentType: z.string().min(1).max(64),
  data: z.record(z.string(), z.unknown()),
  format: z.enum(['PDF', 'HTML', 'JSON', 'XML']).optional(),
  locale: z.string().max(16).optional(),
  persist: z.boolean().optional(),
  tradeId: z.string().uuid().optional(),
  reference: z.string().min(1).max(128).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type GenerateDocumentReq = z.infer<typeof generateDocumentSchema>;
