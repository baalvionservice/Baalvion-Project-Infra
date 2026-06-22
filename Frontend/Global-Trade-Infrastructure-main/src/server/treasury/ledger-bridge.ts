/**
 * @file server/treasury/ledger-bridge.ts
 * @description The seam between the treasury layer and the ledger's chart of
 * accounts. Treasury accounts and wallet buckets are all real ledger accounts;
 * this creates one inside the caller's transaction (atomic with the rest of the
 * treasury write), keeping the ledger the single source of truth.
 */
import { LedgerAccount } from '@prisma/client';
import { PrismaTransaction } from '../db/prisma';
import { ValidationError } from '../db/errors';
import { ledgerAccountRepository } from '../repositories';
import { Money } from '../ledger/money';
import type { AccountType, NormalSide } from '../ledger/types';
import type { ActorContext } from '../services/rule-service';
import { auditWrite, enqueueEvent, snapshot } from '../orchestration/write-helpers';

export interface CreateLedgerAccountInput {
  code: string;
  name: string;
  type: AccountType;
  normalSide: NormalSide;
  purpose: string;
  currency: string;
  allowNegative: boolean;
  ownerOrgId?: string | null;
}

/** Create a ledger account within the caller's transaction (no outbox flush). */
export async function createLedgerAccountTx(
  tx: PrismaTransaction,
  ctx: ActorContext,
  input: CreateLedgerAccountInput,
  correlationId: string,
): Promise<LedgerAccount> {
  const currency = Money.zero(input.currency).currency; // validates ISO-4217
  const existing = await ledgerAccountRepository.findByCode(ctx.organizationId, input.code, tx);
  if (existing) throw new ValidationError(`ACCOUNT_CODE_TAKEN: ${input.code}`);

  const row = (await ledgerAccountRepository.create(
    {
      organizationId: ctx.organizationId,
      code: input.code,
      name: input.name,
      type: input.type,
      purpose: input.purpose,
      normalSide: input.normalSide,
      currency,
      status: 'ACTIVE',
      allowNegative: input.allowNegative,
      balance: '0',
      ownerOrgId: input.ownerOrgId ?? null,
    },
    tx,
  )) as LedgerAccount;

  await auditWrite(tx, ctx, {
    source: 'treasury',
    entityType: 'LedgerAccount',
    entityId: row.id,
    action: 'CREATE',
    after: snapshot(row),
    correlationId,
  });
  await enqueueEvent(tx, ctx, {
    eventType: 'LEDGER_ACCOUNT_OPENED',
    payload: { accountId: row.id, code: row.code, purpose: row.purpose, currency },
    correlationId,
  });
  return row;
}
