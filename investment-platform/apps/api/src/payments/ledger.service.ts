import { Injectable } from '@nestjs/common';
import { Prisma } from '@baalvion-invest/database';
import { PrismaService } from '../common/prisma/prisma.service';

interface Leg {
  account: string;
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
}

/**
 * Double-entry posting helper. Every money movement must post balanced legs
 * (sum of debits === sum of credits) against a source ref.
 */
@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async post(
    tx: Prisma.TransactionClient,
    params: {
      orgId?: string;
      currency: string;
      refType: string;
      refId: string;
      memo?: string;
      legs: Leg[];
    },
  ): Promise<void> {
    const debits = params.legs
      .filter((l) => l.direction === 'DEBIT')
      .reduce((s, l) => s + l.amount, 0);
    const credits = params.legs
      .filter((l) => l.direction === 'CREDIT')
      .reduce((s, l) => s + l.amount, 0);
    if (Math.abs(debits - credits) > 1e-6) {
      throw new Error(
        `Unbalanced ledger posting for ${params.refType}:${params.refId} (D=${debits} C=${credits})`,
      );
    }

    await tx.ledgerEntry.createMany({
      data: params.legs.map((l) => ({
        orgId: params.orgId,
        account: l.account,
        direction: l.direction,
        amount: l.amount,
        currency: params.currency,
        refType: params.refType,
        refId: params.refId,
        memo: params.memo,
      })),
    });
  }
}
