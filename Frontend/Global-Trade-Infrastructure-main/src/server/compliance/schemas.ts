/**
 * @file server/compliance/schemas.ts
 * @description Zod validators for the compliance moderation + publish-gate API.
 */
import { z } from 'zod';

const country = z.string().regex(/^[A-Za-z]{2}$/, 'must be a 2-letter ISO country code').optional();

const moderationContentSchema = z.object({
  title: z.string().max(512).optional(),
  description: z.string().max(20_000).optional(),
  category: z.string().max(128).optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

const partySchema = z.object({
  name: z.string().max(256).optional(),
  country,
  role: z.string().max(64).optional(),
});

export const moderateSchema = z.object({
  subjectType: z.string().min(1).max(64),
  subjectId: z.string().min(1).max(128),
  reference: z.string().min(1).max(128).optional(),
  content: moderationContentSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const evaluateGateSchema = z.object({
  subjectType: z.string().min(1).max(64),
  subjectId: z.string().min(1).max(128),
  reference: z.string().min(1).max(128).optional(),
  tradeId: z.string().uuid().optional(),
  content: moderationContentSchema,
  goods: z
    .object({
      hsCode: z.string().max(32).optional(),
      productCategory: z.string().max(128).optional(),
      originCountry: country,
      destinationCountry: country,
      direction: z.enum(['IMPORT', 'EXPORT', 'BOTH']).optional(),
      quantity: z.number().nonnegative().optional(),
      value: z.number().nonnegative().optional(),
    })
    .optional(),
  parties: z.array(partySchema).max(50).optional(),
  originCountry: country,
  destinationCountry: country,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const gateDecisionSchema = z.object({
  action: z.enum(['approve', 'reject', 'publish', 'suspend', 'resubmit']),
  reason: z.string().min(1).max(500).optional(),
});

export type ModerateInput = z.infer<typeof moderateSchema>;
export type EvaluateGateInput = z.infer<typeof evaluateGateSchema>;
export type GateDecisionInput = z.infer<typeof gateDecisionSchema>;
