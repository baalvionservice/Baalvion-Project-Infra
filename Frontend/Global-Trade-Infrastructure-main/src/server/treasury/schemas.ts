/**
 * @file server/treasury/schemas.ts
 * @description Zod request schemas for the treasury / wallet / FX / fee / liquidity
 * APIs — input validation at the system boundary. Exact money / rate parsing and
 * the engine rules are enforced deeper (money.ts, money-math.ts, the engines).
 * organizationId is never accepted from the client (CR-2/CR-3).
 */
import { z } from 'zod';

// Inline literal tuples so z.infer yields the precise unions (matching ./types).
const walletTypeEnum = z.enum(['USER', 'COMPANY', 'MERCHANT', 'ESCROW', 'RESERVE', 'TREASURY', 'VIRTUAL', 'SETTLEMENT', 'INTEREST']);
const walletOpEnum = z.enum(['CREDIT', 'DEBIT', 'HOLD', 'RELEASE', 'RESERVE', 'UNRESERVE', 'MARK_PENDING', 'CLEAR_PENDING']);
const treasuryKindEnum = z.enum(['OPERATING', 'SETTLEMENT', 'RESERVE', 'LIQUIDITY', 'ESCROW', 'INTEREST', 'FX', 'FEE', 'SUSPENSE']);
const feeTypeEnum = z.enum(['FLAT', 'PERCENTAGE', 'TIER']);

const currency = z.string().regex(/^[A-Za-z]{3}$/, 'currency must be a 3-letter ISO code');
const uuid = z.string().uuid();
const moneyAmount = z.union([
  z.string().regex(/^\d{1,16}(\.\d{1,8})?$/, 'amount must be a non-negative decimal'),
  z.number().finite().nonnegative(),
]);
const rateString = z.string().regex(/^\d{1,12}(\.\d{1,8})?$/, 'rate must be a non-negative decimal');
const decimalString = z.string().regex(/^\d{1,16}(\.\d{1,8})?$/, 'must be a non-negative decimal string');
const bps = z.number().int().min(0).max(1_000_000);

// ── Treasury accounts ────────────────────────────────────────────────────────

export const provisionTreasuryAccountSchema = z.object({
  kind: treasuryKindEnum,
  currency,
});

// ── Wallets ──────────────────────────────────────────────────────────────────

export const openWalletSchema = z.object({
  type: walletTypeEnum,
  currency,
  ownerOrgId: uuid.optional(),
  ownerRef: z.string().min(1).max(128).optional(),
  reference: z.string().min(1).max(128).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const walletOperationSchema = z.object({
  op: walletOpEnum,
  amount: moneyAmount,
  counterAccountId: uuid.optional(),
  reference: z.string().min(1).max(128).optional(),
  reason: z.string().max(500).optional(),
});

export const setWalletStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'FROZEN', 'CLOSED']),
  reason: z.string().max(500).optional(),
});

// ── FX ───────────────────────────────────────────────────────────────────────

export const fxQuoteSchema = z.object({
  baseCurrency: currency,
  quoteCurrency: currency,
  midRate: rateString,
  spreadBps: bps.optional(),
  marginBps: bps.optional(),
  baseAmount: moneyAmount.optional(),
  ttlSeconds: z.number().int().min(1).max(86_400).optional(),
  rateSource: z.string().min(1).max(64).optional(),
  reference: z.string().min(1).max(128).optional(),
});

export const fxExecuteSchema = z.object({
  quoteId: uuid,
  fromWalletId: uuid,
  toWalletId: uuid,
  baseAmount: moneyAmount.optional(),
  reference: z.string().min(1).max(128).optional(),
});

// ── Fees ─────────────────────────────────────────────────────────────────────

const feeTierSchema = z.object({
  upToAmount: decimalString.nullable(),
  basisPoints: bps.optional(),
  flatAmount: decimalString.optional(),
});

export const createFeeRuleSchema = z.object({
  code: z.string().min(1).max(64).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, 'code must be slug-like'),
  name: z.string().min(1).max(256),
  type: feeTypeEnum,
  scope: z.string().min(1).max(64),
  currency,
  basisPoints: bps.optional(),
  flatAmount: decimalString.optional(),
  tiers: z.array(feeTierSchema).min(1).max(32).optional(),
  minFee: decimalString.optional(),
  maxFee: decimalString.optional(),
  feeAccountId: uuid.optional(),
  country: z.string().max(64).optional(),
  priority: z.number().int().min(0).max(1000).optional(),
});

export const calculateFeeSchema = z.object({
  feeRuleId: uuid,
  baseAmount: moneyAmount,
  currency,
});

export const applyFeeSchema = z.object({
  feeRuleId: uuid,
  baseAmount: moneyAmount,
  currency,
  payerAccountId: uuid,
  feeAccountId: uuid.optional(),
  sourceType: z.string().max(64).optional(),
  sourceId: uuid.optional(),
  reference: z.string().min(1).max(128).optional(),
});

// ── Liquidity ────────────────────────────────────────────────────────────────

export const liquiditySnapshotSchema = z.object({ currency });

export type ProvisionTreasuryAccountInput = z.infer<typeof provisionTreasuryAccountSchema>;
export type OpenWalletReq = z.infer<typeof openWalletSchema>;
export type WalletOperationReq = z.infer<typeof walletOperationSchema>;
export type FxQuoteReq = z.infer<typeof fxQuoteSchema>;
export type FxExecuteReq = z.infer<typeof fxExecuteSchema>;
export type CreateFeeRuleReq = z.infer<typeof createFeeRuleSchema>;
export type ApplyFeeReq = z.infer<typeof applyFeeSchema>;
