/**
 * @file server/auction/schemas.ts
 * @description Zod validators for the auction API boundary. Syntax and ranges are
 * checked here; domain rules (price ladders, reserve, anti-snipe) live in the
 * pure engine and the service. Tenant identity is NEVER accepted from the client.
 */
import { z } from 'zod';

const currency = z.string().regex(/^[A-Za-z]{3}$/, 'must be a 3-letter ISO currency code');
const moneyAmount = z.union([
  z.string().regex(/^\d{1,16}(\.\d{1,8})?$/, 'non-negative decimal string'),
  z.number().finite().nonnegative(),
]);
const positiveMoney = z.union([
  z.string().regex(/^\d{1,16}(\.\d{1,8})?$/, 'positive decimal string'),
  z.number().finite().positive(),
]);

export const createAuctionSchema = z
  .object({
    reference: z.string().min(1).max(128).optional(),
    type: z.enum(['ENGLISH', 'SEALED', 'DUTCH']).optional(),
    title: z.string().min(1).max(256),
    lotRef: z.string().max(128).optional(),
    tradeId: z.string().uuid().optional(),
    sellerOrgId: z.string().uuid().optional(),
    sellerRef: z.string().max(128).optional(),
    currency,
    startPrice: moneyAmount,
    reservePrice: moneyAmount.optional(),
    bidIncrement: positiveMoney.optional(),
    buyNowPrice: positiveMoney.optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    antiSnipeSeconds: z.number().int().min(0).max(86_400).optional(),
    antiSnipeThreshold: z.number().int().min(0).max(86_400).optional(),
    autoOpen: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((v) => new Date(v.endsAt).getTime() > new Date(v.startsAt).getTime(), {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  });

export const placeBidSchema = z.object({
  amount: positiveMoney,
  maxProxyAmount: positiveMoney.optional(),
  bidderRef: z.string().uuid().optional(), // optional org of the bidder for B2B lots
  reference: z.string().min(1).max(128).optional(), // idempotency key
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const auctionActionSchema = z.object({
  action: z.enum(['open', 'close', 'settle', 'cancel']),
  reason: z.string().min(1).max(500).optional(),
  // Optional settlement wiring used by close/settle: when all three are present
  // the engine posts the winning amount to the ledger via a settlement instruction.
  payerAccountId: z.string().uuid().optional(),
  clearingAccountId: z.string().uuid().optional(),
  payeeAccountId: z.string().uuid().optional(),
  settlementRail: z.string().min(2).max(16).optional(),
});

export type CreateAuctionInput = z.infer<typeof createAuctionSchema>;
export type PlaceBidInput = z.infer<typeof placeBidSchema>;
export type AuctionActionInput = z.infer<typeof auctionActionSchema>;
