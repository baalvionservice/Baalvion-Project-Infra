import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { StripeService } from './stripe.service';
import { LedgerService } from './ledger.service';

/**
 * Escrow lifecycle: fund (investor → escrow hold) → release (escrow → company)
 * or refund (escrow → investor). Each transition posts double-entry legs.
 */
@Injectable()
export class EscrowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly ledger: LedgerService,
  ) {}

  /** Begin funding an escrow account for a committed investment. */
  async fund(orgId: string, escrowAccountId: string, amount: number) {
    const escrow = await this.prisma.escrowAccount.findUnique({
      where: { id: escrowAccountId },
      include: { deal: true },
    });
    if (!escrow) throw new NotFoundException('Escrow account not found');
    if (escrow.deal.investorOrgId !== orgId) {
      throw new BadRequestException('Only the investor funds this escrow');
    }

    const idempotencyKey = `escrow-fund-${escrowAccountId}-${amount}`;
    const intent = await this.stripe.createPaymentIntent(
      amount,
      escrow.currency,
      { escrowAccountId, dealId: escrow.dealId },
      idempotencyKey,
    );

    const payment = await this.prisma.payment.create({
      data: {
        orgId,
        escrowAccountId,
        provider: 'STRIPE',
        direction: 'INBOUND',
        amount,
        currency: escrow.currency,
        status: 'PROCESSING',
        externalRef: intent.id,
        idempotencyKey,
      },
    });
    await this.prisma.escrowTransaction.create({
      data: {
        escrowAccountId,
        type: 'FUND',
        amount,
        currency: escrow.currency,
        status: 'PROCESSING',
        paymentId: payment.id,
      },
    });

    return {
      clientSecret: intent.clientSecret,
      paymentId: payment.id,
      externalRef: intent.id,
      status: intent.status,
    };
  }

  /** Webhook-driven: a funding payment succeeded. */
  async markFunded(externalRef: string): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { externalRef, status: { not: 'SUCCEEDED' } },
    });
    if (!payment || !payment.escrowAccountId) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCEEDED' },
      });
      await tx.escrowTransaction.updateMany({
        where: { paymentId: payment.id },
        data: { status: 'SUCCEEDED' },
      });
      const escrow = await tx.escrowAccount.update({
        where: { id: payment.escrowAccountId! },
        data: {
          balance: { increment: payment.amount },
          status: 'FUNDED',
        },
      });
      await this.ledger.post(tx, {
        orgId: payment.orgId,
        currency: payment.currency,
        refType: 'payment',
        refId: payment.id,
        memo: 'Escrow funded',
        legs: [
          { account: 'investor:cash', direction: 'DEBIT', amount: Number(payment.amount) },
          { account: 'escrow:hold', direction: 'CREDIT', amount: Number(payment.amount) },
        ],
      });
      // Move associated investment to FUNDED.
      await tx.investment.updateMany({
        where: { dealId: escrow.dealId, status: 'COMMITTED' },
        data: { status: 'FUNDED', fundedAt: new Date() },
      });
    });
  }

  /** Release escrowed funds to the company and close the investment. */
  async release(orgId: string, escrowAccountId: string) {
    const escrow = await this.prisma.escrowAccount.findUnique({
      where: { id: escrowAccountId },
      include: { deal: true },
    });
    if (!escrow) throw new NotFoundException('Escrow account not found');
    if (escrow.deal.companyOrgId !== orgId && escrow.deal.investorOrgId !== orgId) {
      throw new BadRequestException('Not authorized to release');
    }
    if (escrow.status !== 'FUNDED') {
      throw new BadRequestException('Escrow is not in a funded state');
    }
    const amount = Number(escrow.balance);

    return this.prisma.$transaction(async (tx) => {
      await tx.escrowTransaction.create({
        data: {
          escrowAccountId,
          type: 'RELEASE',
          amount,
          currency: escrow.currency,
          status: 'SUCCEEDED',
        },
      });
      await tx.escrowAccount.update({
        where: { id: escrowAccountId },
        data: { balance: 0, status: 'RELEASED' },
      });
      await this.ledger.post(tx, {
        currency: escrow.currency,
        refType: 'escrow_release',
        refId: escrowAccountId,
        memo: 'Escrow released to company',
        legs: [
          { account: 'escrow:hold', direction: 'DEBIT', amount },
          { account: 'company:cash', direction: 'CREDIT', amount },
        ],
      });
      const investment = await tx.investment.findFirst({
        where: { dealId: escrow.dealId, status: 'FUNDED' },
      });
      if (investment) {
        await tx.investment.update({
          where: { id: investment.id },
          data: { status: 'ACTIVE', closedAt: new Date() },
        });
        // Open the investor's position.
        await tx.position.create({
          data: {
            investmentId: investment.id,
            investorOrgId: investment.investorOrgId,
            companyOrgId: investment.companyOrgId,
            securityType: investment.securityType,
            shares: investment.shares ?? 0,
            costBasis: investment.amount,
            currency: investment.currency,
          },
        });
      }
      await tx.deal.update({
        where: { id: escrow.dealId },
        data: { status: 'CLOSED' },
      });
      return { released: amount, currency: escrow.currency };
    });
  }
}
