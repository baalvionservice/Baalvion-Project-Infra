/**
 * @file server/services/settlement-service.ts
 * @description The settlement engine application service. An instruction moves
 * money between a payer, a clearing and a payee ledger account. Each operator or
 * system action (authorize / capture / settle / fail / cancel / reverse) is
 * validated by the settlement state machine, which also yields the implied
 * balanced posting; the service applies that posting to the ledger AND advances
 * the instruction's state in ONE transaction under optimistic locking, then
 * relays the outbox. State change and money movement are therefore atomic — a
 * crash can never leave a settled instruction without its ledger entries.
 */
import { randomUUID } from 'crypto';
import { Prisma, LedgerTransaction, SettlementInstruction, AuditLog } from '@prisma/client';
import { withTransaction } from '../db/prisma';
import { NotFoundError, ValidationError } from '../db/errors';
import {
  ledgerAccountRepository,
  settlementInstructionRepository,
  auditRepository,
  outboxRepository,
  SettlementInstructionFilter,
} from '../repositories';
import { flushOutbox } from '../orchestration/event-store';
import { Money } from '../ledger/money';
import { buildPosting } from '../ledger/posting';
import {
  planTransition,
  legalActions,
  SettlementAccounts,
  SettlementError,
} from '../ledger/settlement-machine';
import { SETTLEMENT_TERMINAL, SettlementAction } from '../ledger/types';
import { applyPostingTx } from './ledger-service';
import type { ActorContext } from './rule-service';
import { CreateSettlementInput, TransitionSettlementInput } from '../ledger/schemas';

function snapshot<T>(row: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(row)) as Prisma.InputJsonValue;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function loadDistinctAccount(ctx: ActorContext, id: string, currency: string, role: string) {
  const account = await ledgerAccountRepository.findScopedById(id, ctx.organizationId);
  if (!account) throw new NotFoundError('LedgerAccount', id);
  if (account.status !== 'ACTIVE') throw new ValidationError(`ACCOUNT_NOT_ACTIVE: ${role} account ${account.code} is ${account.status}`);
  if (account.currency !== currency) {
    throw new ValidationError(`ACCOUNT_CURRENCY_MISMATCH: ${role} account ${account.code} is ${account.currency}, instruction is ${currency}`);
  }
  return account;
}

export interface SettlementTransitionResult {
  instruction: SettlementInstruction;
  ledgerTransactionId: string | null;
  legalNextActions: SettlementAction[];
}

export const settlementService = {
  async createInstruction(ctx: ActorContext, input: CreateSettlementInput): Promise<SettlementInstruction> {
    const currency = Money.zero(input.currency).currency; // validates currency
    const amount = Money.of(input.amount, currency);
    if (!amount.isPositive()) throw new ValidationError('INVALID_AMOUNT: settlement amount must be positive');

    if (new Set([input.payerAccountId, input.clearingAccountId, input.payeeAccountId]).size !== 3) {
      throw new ValidationError('DISTINCT_ACCOUNTS_REQUIRED: payer, clearing and payee must be different accounts');
    }
    await loadDistinctAccount(ctx, input.payerAccountId, currency, 'payer');
    await loadDistinctAccount(ctx, input.clearingAccountId, currency, 'clearing');
    await loadDistinctAccount(ctx, input.payeeAccountId, currency, 'payee');

    const correlationId = input.correlationId ?? randomUUID();
    const created = await withTransaction(async (tx) => {
      const row = (await settlementInstructionRepository.create(
        {
          organizationId: ctx.organizationId,
          reference: input.reference ?? null,
          status: 'CREATED',
          rail: input.rail ?? 'INTERNAL',
          currency,
          amount: amount.toDecimalString(),
          settledAmount: '0',
          payerAccountId: input.payerAccountId,
          clearingAccountId: input.clearingAccountId,
          payeeAccountId: input.payeeAccountId,
          tradeId: input.tradeId ?? null,
          escrowId: input.escrowId ?? null,
          priority: input.priority ?? 0,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          correlationId,
          metadata: input.metadata ? asJson(input.metadata) : undefined,
        },
        tx,
      )) as SettlementInstruction;
      await auditRepository.record(
        {
          organizationId: ctx.organizationId,
          tradeId: row.tradeId ?? undefined,
          entityType: 'SettlementInstruction',
          entityId: row.id,
          action: 'CREATE',
          actorId: ctx.actorId,
          actorRole: ctx.actorRole,
          source: 'settlement',
          afterState: snapshot(row),
          correlationId,
          ip: ctx.ip ?? undefined,
        },
        tx,
      );
      await outboxRepository.enqueue(
        {
          organizationId: ctx.organizationId,
          tradeId: row.tradeId ?? null,
          eventType: 'SETTLEMENT_CREATED',
          payload: { instructionId: row.id, amount: row.amount, currency, rail: row.rail, actorId: ctx.actorId } as Prisma.InputJsonValue,
          correlationId,
          sequence: 0,
        },
        tx,
      );
      return row;
    });
    await flushOutbox();
    return created;
  },

  /**
   * Drive an instruction through one transition. The state machine decides the
   * next state and the implied money movement; both are committed atomically.
   */
  async transition(ctx: ActorContext, id: string, input: TransitionSettlementInput): Promise<SettlementTransitionResult> {
    const correlationId = randomUUID();
    const action = input.action as SettlementAction;

    const result = await withTransaction(async (tx) => {
      const before = await settlementInstructionRepository.findScopedById(id, ctx.organizationId, tx);
      if (!before) throw new NotFoundError('SettlementInstruction', id);
      if (SETTLEMENT_TERMINAL.has(before.status)) {
        throw new SettlementError(`TERMINAL_STATE: ${before.status} cannot transition`);
      }

      const accounts: SettlementAccounts = {
        payerAccountId: before.payerAccountId,
        clearingAccountId: before.clearingAccountId,
        payeeAccountId: before.payeeAccountId,
      };
      const amount = Money.of(before.amount.toString(), before.currency);
      const settled = Money.of(before.settledAmount.toString(), before.currency);
      const requested = input.amount ? Money.of(input.amount, before.currency) : undefined;

      const plan = planTransition(before.status, action, accounts, { amount, settled }, requested);

      let ledgerTransactionId: string | null = null;
      if (plan.posting) {
        const posting = buildPosting(plan.posting);
        const txn: LedgerTransaction = await applyPostingTx(tx, ctx, posting, {
          correlationId,
          reference: null,
          description: `settlement.${action.toLowerCase()} ${id}`,
          source: 'settlement',
          tradeId: before.tradeId,
        });
        ledgerTransactionId = txn.id;
      }

      const expectedVersion = input.expectedVersion ?? before.version;
      const after = (await settlementInstructionRepository.updateWithLock(
        id,
        expectedVersion,
        { status: plan.toStatus, settledAmount: plan.settledAfter.toDecimalString() },
        tx,
      )) as SettlementInstruction;

      await auditRepository.record(
        {
          organizationId: ctx.organizationId,
          tradeId: after.tradeId ?? undefined,
          entityType: 'SettlementInstruction',
          entityId: id,
          action: `TRANSITION_${action}`,
          actorId: ctx.actorId,
          actorRole: ctx.actorRole,
          source: 'settlement',
          beforeState: snapshot(before),
          afterState: snapshot(after),
          correlationId,
          ip: ctx.ip ?? undefined,
        },
        tx,
      );
      await outboxRepository.enqueue(
        {
          organizationId: ctx.organizationId,
          tradeId: after.tradeId ?? null,
          eventType: `SETTLEMENT_${action}`,
          payload: {
            instructionId: id,
            fromStatus: plan.fromStatus,
            toStatus: plan.toStatus,
            movedAmount: plan.movedAmount.toDecimalString(),
            settledAmount: plan.settledAfter.toDecimalString(),
            ledgerTransactionId,
            reason: input.reason ?? null,
            actorId: ctx.actorId,
          } as Prisma.InputJsonValue,
          correlationId,
          sequence: 0,
        },
        tx,
      );

      return { instruction: after, ledgerTransactionId, legalNextActions: legalActions(after.status) };
    });
    await flushOutbox();
    return result;
  },

  async getInstruction(ctx: ActorContext, id: string): Promise<{ instruction: SettlementInstruction; legalNextActions: SettlementAction[] }> {
    const instruction = await settlementInstructionRepository.findScopedById(id, ctx.organizationId);
    if (!instruction) throw new NotFoundError('SettlementInstruction', id);
    return { instruction, legalNextActions: legalActions(instruction.status) };
  },

  listInstructions(ctx: ActorContext, filter: SettlementInstructionFilter, page: { page: number; pageSize: number }) {
    return settlementInstructionRepository.listScoped(ctx.organizationId, filter, page);
  },

  /** Forensic timeline for an instruction (from the immutable audit trail). */
  getHistory(_ctx: ActorContext, id: string): Promise<AuditLog[]> {
    return auditRepository.listByEntity('SettlementInstruction', id);
  },
};
