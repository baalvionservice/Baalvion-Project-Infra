/**
 * @file server/ledger/schemas.ts
 * @description Zod request schemas for the settlement-ledger API — input
 * validation at the system boundary. Exact money parsing and the double-entry /
 * state-machine rules are enforced deeper (money.ts, posting.ts,
 * settlement-machine.ts); these schemas guard shape, types and basic ranges.
 *
 * Note: organizationId is never accepted from the client — the tenant is derived
 * solely from the verified principal (CR-2/CR-3).
 */
import { z } from 'zod';

export const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const;
export const NORMAL_SIDES = ['DEBIT', 'CREDIT'] as const;
export const ENTRY_DIRECTIONS = ['DEBIT', 'CREDIT'] as const;
export const ACCOUNT_STATUSES = ['ACTIVE', 'FROZEN', 'CLOSED'] as const;
export const SETTLEMENT_ACTIONS = ['AUTHORIZE', 'CAPTURE', 'SETTLE', 'FAIL', 'CANCEL', 'REVERSE'] as const;
export const SETTLEMENT_RAIL_VALUES = [
  'INTERNAL', 'SWIFT', 'SEPA', 'FEDWIRE', 'RTGS', 'ACH', 'UPI', 'NEFT', 'IMPS', 'FPS', 'BACS',
] as const;

const currency = z.string().regex(/^[A-Za-z]{3}$/, 'currency must be a 3-letter ISO code');
const uuid = z.string().uuid();

/** A non-negative money amount as a precise decimal string or a finite number. */
const moneyAmount = z.union([
  z.string().regex(/^\d{1,16}(\.\d{1,8})?$/, 'amount must be a non-negative decimal'),
  z.number().finite().nonnegative(),
]);

// ── Accounts ─────────────────────────────────────────────────────────────────

export const openAccountSchema = z.object({
  code: z.string().min(1).max(64).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, 'code must be slug-like'),
  name: z.string().min(1).max(256),
  type: z.enum(ACCOUNT_TYPES),
  purpose: z.string().min(1).max(64).optional(),
  normalSide: z.enum(NORMAL_SIDES).optional(),
  currency,
  allowNegative: z.boolean().optional(),
  ownerOrgId: uuid.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const setAccountStatusSchema = z.object({
  status: z.enum(ACCOUNT_STATUSES),
  reason: z.string().max(500).optional(),
});

// ── Journal postings ─────────────────────────────────────────────────────────

export const postingLineSchema = z.object({
  accountId: uuid,
  direction: z.enum(ENTRY_DIRECTIONS),
  amount: moneyAmount,
  memo: z.string().max(500).optional(),
});

export const postJournalSchema = z.object({
  currency,
  lines: z.array(postingLineSchema).min(2).max(64),
  reference: z.string().min(1).max(128).optional(),
  description: z.string().max(1000).optional(),
  tradeId: uuid.optional(),
  correlationId: z.string().min(1).max(128).optional(),
  source: z.string().min(1).max(64).optional(),
});

// ── Settlement instructions ──────────────────────────────────────────────────

export const createSettlementSchema = z.object({
  amount: moneyAmount,
  currency,
  rail: z.enum(SETTLEMENT_RAIL_VALUES).optional(),
  payerAccountId: uuid,
  clearingAccountId: uuid,
  payeeAccountId: uuid,
  tradeId: uuid.optional(),
  escrowId: uuid.optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  reference: z.string().min(1).max(128).optional(),
  correlationId: z.string().min(1).max(128).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const transitionSettlementSchema = z.object({
  action: z.enum(SETTLEMENT_ACTIONS),
  amount: moneyAmount.optional(), // partial SETTLE amount
  reason: z.string().max(500).optional(),
  expectedVersion: z.number().int().positive().optional(),
});

export type OpenAccountInput = z.infer<typeof openAccountSchema>;
export type SetAccountStatusInput = z.infer<typeof setAccountStatusSchema>;
export type PostJournalInput = z.infer<typeof postJournalSchema>;
export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
export type TransitionSettlementInput = z.infer<typeof transitionSettlementSchema>;
