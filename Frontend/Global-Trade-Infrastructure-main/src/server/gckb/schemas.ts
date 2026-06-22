/**
 * @file server/gckb/schemas.ts
 * @description Zod request schemas for the GCKB API (boundary validation). The
 * per-entity `attributes` shape is validated separately by the registry, so here
 * `attributes` is an open object.
 */
import { z } from 'zod';

const statusEnum = z.enum(['DRAFT', 'PUBLISHED', 'SUPERSEDED', 'ARCHIVED']);
const isoDate = z.string().min(4).nullable().optional();

export const envelopeSchema = z
  .object({
    effectiveFrom: isoDate,
    effectiveTo: isoDate,
    authority: z.string().max(256).nullable().optional(),
    source: z.string().max(256).nullable().optional(),
    auditReference: z.string().max(256).nullable().optional(),
  })
  .optional();

export const createRecordSchema = z.object({
  recordKey: z.string().max(256).optional(),
  name: z.string().min(1).max(512),
  attributes: z.record(z.string(), z.unknown()).default({}),
  countryCode: z.string().max(8).nullable().optional(),
  parentKey: z.string().max(256).nullable().optional(),
  code: z.string().max(64).nullable().optional(),
  policyType: z.string().max(64).nullable().optional(),
  hsCode: z.string().max(32).nullable().optional(),
  productCategory: z.string().max(128).nullable().optional(),
  tags: z.array(z.string().max(64)).max(64).optional(),
  status: statusEnum.optional(),
  envelope: envelopeSchema,
});

export const updateRecordSchema = z.object({
  name: z.string().min(1).max(512).optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  countryCode: z.string().max(8).nullable().optional(),
  code: z.string().max(64).nullable().optional(),
  policyType: z.string().max(64).nullable().optional(),
  hsCode: z.string().max(32).nullable().optional(),
  productCategory: z.string().max(128).nullable().optional(),
  tags: z.array(z.string().max(64)).max(64).optional(),
  status: statusEnum.optional(),
  envelope: envelopeSchema,
  expectedVersion: z.number().int().positive().optional(),
  reason: z.string().max(500).optional(),
});

export const relationshipSchema = z.object({
  relationType: z.string().min(1).max(64),
  toType: z.string().min(1).max(64),
  toId: z.string().max(256).nullable().optional(),
  toRef: z.string().max(256).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const importSchema = z
  .object({
    format: z.enum(['csv', 'json', 'xml', 'excel']),
    content: z.string().optional(),
    rows: z.array(z.record(z.string(), z.unknown())).optional(),
    dryRun: z.boolean().default(false),
  })
  .refine((v) => !!v.content || !!v.rows, { message: 'provide either `content` (string) or `rows` (array)' });

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type ImportRequest = z.infer<typeof importSchema>;
