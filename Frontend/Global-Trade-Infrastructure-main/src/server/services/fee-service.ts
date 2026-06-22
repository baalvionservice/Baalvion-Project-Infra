/**
 * @file server/services/fee-service.ts
 * @description The fee engine. Fee rules (flat / percentage / tier) are computed
 * by the pure fee calculator; charging a fee posts a balanced ledger entry
 * (payer → fee-income account) and records an append-only fee_transactions row.
 * Idempotent on `reference`. The fee-income account is the FEE treasury account
 * for the currency, provisioned on first use.
 */
import { randomUUID } from 'crypto';
import { FeeRule, FeeTransaction, LedgerTransaction } from '@prisma/client';
import { withTransaction } from '../db/prisma';
import { NotFoundError, ValidationError } from '../db/errors';
import { feeRuleRepository, feeTransactionRepository, ledgerTransactionRepository } from '../repositories';
import { flushOutbox } from '../orchestration/event-store';
import { auditWrite, enqueueEvent, snapshot, asJson } from '../orchestration/write-helpers';
import { applyPostingTx } from './ledger-service';
import { getOrCreateTreasuryAccountTx } from './treasury-account-service';
import { computeFee } from '../treasury/fees/fee-math';
import { transfer } from '../ledger/posting';
import { buildPosting } from '../ledger/posting';
import { Money } from '../ledger/money';
import { FeeRuleDefinition, FeeTier } from '../treasury/types';
import type { ActorContext } from './rule-service';

export type { ActorContext };

export interface CreateFeeRuleInput {
  code: string;
  name: string;
  type: 'FLAT' | 'PERCENTAGE' | 'TIER';
  scope: string;
  currency: string;
  basisPoints?: number;
  flatAmount?: string;
  tiers?: FeeTier[];
  minFee?: string;
  maxFee?: string;
  feeAccountId?: string;
  country?: string;
  priority?: number;
}

export interface ApplyFeeInput {
  baseAmount: string | number;
  currency: string;
  payerAccountId: string;
  feeRuleId?: string;
  feeAccountId?: string;
  sourceType?: string;
  sourceId?: string;
  reference?: string;
}

function ruleToDefinition(row: FeeRule): FeeRuleDefinition {
  return {
    type: row.type as FeeRuleDefinition['type'],
    currency: row.currency,
    basisPoints: row.basisPoints,
    flatAmount: row.flatAmount ? row.flatAmount.toString() : null,
    tiers: row.tiers ? (row.tiers as unknown as FeeTier[]) : null,
    minFee: row.minFee ? row.minFee.toString() : null,
    maxFee: row.maxFee ? row.maxFee.toString() : null,
  };
}

export const feeService = {
  async createRule(ctx: ActorContext, input: CreateFeeRuleInput): Promise<FeeRule> {
    const currency = Money.zero(input.currency).currency;
    const correlationId = randomUUID();
    const created = await withTransaction(async (tx) => {
      const existing = await feeRuleRepository.findByCode(ctx.organizationId, input.code, tx);
      if (existing) throw new ValidationError(`FEE_RULE_CODE_TAKEN: ${input.code}`);
      const row = (await feeRuleRepository.create(
        {
          organizationId: ctx.organizationId,
          code: input.code,
          name: input.name,
          type: input.type,
          scope: input.scope,
          currency,
          basisPoints: input.basisPoints ?? null,
          flatAmount: input.flatAmount ?? null,
          tiers: input.tiers ? asJson(input.tiers) : undefined,
          minFee: input.minFee ?? null,
          maxFee: input.maxFee ?? null,
          feeAccountId: input.feeAccountId ?? null,
          country: input.country ?? null,
          priority: input.priority ?? 0,
          status: 'ACTIVE',
        },
        tx,
      )) as FeeRule;
      await auditWrite(tx, ctx, { source: 'fee', entityType: 'FeeRule', entityId: row.id, action: 'CREATE', after: snapshot(row), correlationId });
      await enqueueEvent(tx, ctx, { eventType: 'FEE_RULE_CREATED', payload: { feeRuleId: row.id, code: row.code, scope: row.scope }, correlationId });
      return row;
    });
    await flushOutbox();
    return created;
  },

  /** Pure calculation: the fee a rule would charge on a base amount (no write). */
  async calculate(ctx: ActorContext, feeRuleId: string, baseAmount: string | number, currency: string): Promise<{ feeAmount: string; currency: string }> {
    const rule = await feeRuleRepository.findScopedById(feeRuleId, ctx.organizationId);
    if (!rule) throw new NotFoundError('FeeRule', feeRuleId);
    const base = Money.of(baseAmount, currency);
    const fee = computeFee(ruleToDefinition(rule), base);
    return { feeAmount: fee.toDecimalString(), currency: fee.currency };
  },

  /** Charge a fee: compute it, post payer → fee-income, record the transaction. */
  async applyFee(ctx: ActorContext, input: ApplyFeeInput): Promise<{ feeTransaction: FeeTransaction; ledgerTransactionId: string | null; feeAmount: string }> {
    if (!input.feeRuleId) throw new ValidationError('FEE_RULE_REQUIRED');
    if (input.reference) {
      const prior = await feeTransactionRepository.findByReference(ctx.organizationId, input.reference);
      if (prior) return { feeTransaction: prior, ledgerTransactionId: prior.ledgerTransactionId, feeAmount: prior.feeAmount.toString() };
    }
    const currency = Money.zero(input.currency).currency;
    const base = Money.of(input.baseAmount, currency);
    const correlationId = randomUUID();

    const result = await withTransaction(async (tx) => {
      const rule = await feeRuleRepository.findScopedById(input.feeRuleId as string, ctx.organizationId, tx);
      if (!rule) throw new NotFoundError('FeeRule', input.feeRuleId as string);
      const fee = computeFee(ruleToDefinition(rule), base);

      const feeAccountId =
        input.feeAccountId ??
        rule.feeAccountId ??
        (await getOrCreateTreasuryAccountTx(tx, ctx, 'FEE', currency, correlationId)).ledgerAccountId;

      let ledgerTransactionId: string | null = null;
      if (fee.isPositive()) {
        const posting = buildPosting(transfer(input.payerAccountId, feeAccountId, fee, 'fee.charge'));
        const txn: LedgerTransaction = await applyPostingTx(tx, ctx, posting, {
          correlationId,
          reference: input.reference ? `${input.reference}:fee` : null,
          description: `fee.${rule.scope} ${rule.code}`,
          source: 'fee',
        });
        ledgerTransactionId = txn.id;
      }

      const feeTransaction = await feeTransactionRepository.create(
        {
          organizationId: ctx.organizationId,
          feeRuleId: rule.id,
          reference: input.reference ?? null,
          scope: rule.scope,
          baseAmount: base.toDecimalString(),
          feeAmount: fee.toDecimalString(),
          currency,
          ledgerTransactionId,
          sourceType: input.sourceType ?? null,
          sourceId: input.sourceId ?? null,
          correlationId,
        },
        tx,
      );
      await auditWrite(tx, ctx, { source: 'fee', entityType: 'FeeTransaction', entityId: feeTransaction.id, action: 'CHARGE', after: snapshot(feeTransaction), correlationId });
      await enqueueEvent(tx, ctx, { eventType: 'FEE_CHARGED', payload: { feeTransactionId: feeTransaction.id, feeRuleId: rule.id, feeAmount: fee.toDecimalString(), currency, ledgerTransactionId }, correlationId });
      return { feeTransaction, ledgerTransactionId, feeAmount: fee.toDecimalString() };
    });
    await flushOutbox();
    return result;
  },

  listRules(ctx: ActorContext, filter: { scope?: string; currency?: string; status?: string }, page: { page: number; pageSize: number }) {
    return feeRuleRepository.listScoped(ctx.organizationId, filter, page);
  },

  listTransactions(ctx: ActorContext, filter: { scope?: string; feeRuleId?: string }, page: { page: number; pageSize: number }) {
    return feeTransactionRepository.listScoped(ctx.organizationId, filter, page);
  },
};
