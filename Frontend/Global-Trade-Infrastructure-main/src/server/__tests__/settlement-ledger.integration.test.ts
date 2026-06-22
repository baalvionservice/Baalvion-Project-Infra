/**
 * @file server/__tests__/settlement-ledger.integration.test.ts
 * @description End-to-end database tests for the double-entry ledger and the
 * settlement engine against real (embedded) PostgreSQL. Proves balanced posting,
 * balance maintenance, the funding guard, reversal, idempotency, append-only
 * enforcement at the DB layer, and the full settlement lifecycle.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, seedOrganization, disconnect } from '../test/db';
import { prisma } from '../db/prisma';
import { ledgerService, type ActorContext } from '../services/ledger-service';
import { settlementService } from '../services/settlement-service';
import { ValidationError, NotFoundError } from '../db/errors';

function actorFor(orgId: string): ActorContext {
  return { organizationId: orgId, actorId: '00000000-0000-4000-8000-000000000001', actorRole: 'platform_admin', ip: '127.0.0.1' };
}

async function openAccount(
  ctx: ActorContext,
  code: string,
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE',
  opts: { purpose?: string; allowNegative?: boolean } = {},
) {
  return ledgerService.openAccount(ctx, {
    code,
    name: code,
    type,
    purpose: opts.purpose,
    currency: 'USD',
    allowNegative: opts.allowNegative,
  });
}

/** Fund an asset account from an allow-negative external source. */
async function fund(ctx: ActorContext, externalId: string, accountId: string, amount: string, ref?: string) {
  return ledgerService.postJournal(ctx, {
    currency: 'USD',
    reference: ref,
    description: 'funding',
    lines: [
      { accountId, direction: 'DEBIT', amount },
      { accountId: externalId, direction: 'CREDIT', amount },
    ],
  });
}

describe('settlement ledger (PostgreSQL)', () => {
  let orgId: string;
  let ctx: ActorContext;

  beforeEach(async () => {
    await resetDatabase();
    orgId = await seedOrganization();
    ctx = actorFor(orgId);
  });

  afterAll(async () => {
    await disconnect();
  });

  it('posts a balanced transfer and maintains balances', async () => {
    const external = await openAccount(ctx, 'EXTERNAL', 'ASSET', { purpose: 'EXTERNAL', allowNegative: true });
    const a = await openAccount(ctx, 'A', 'ASSET');
    const b = await openAccount(ctx, 'B', 'ASSET');

    await fund(ctx, external.id, a.id, '1000.00');
    const { transaction, entries } = await ledgerService.postJournal(ctx, {
      currency: 'USD',
      lines: [
        { accountId: b.id, direction: 'DEBIT', amount: '250.00' },
        { accountId: a.id, direction: 'CREDIT', amount: '250.00' },
      ],
    });

    expect(transaction.amount.toString()).toBe('250');
    expect(entries).toHaveLength(2);

    const aAfter = await ledgerService.getAccount(ctx, a.id);
    const bAfter = await ledgerService.getAccount(ctx, b.id);
    expect(aAfter?.balance.toString()).toBe('750');
    expect(bAfter?.balance.toString()).toBe('250');
  });

  it('rejects an unbalanced or insufficient posting', async () => {
    const a = await openAccount(ctx, 'A', 'ASSET');
    const b = await openAccount(ctx, 'B', 'ASSET');

    await expect(
      ledgerService.postJournal(ctx, {
        currency: 'USD',
        lines: [
          { accountId: a.id, direction: 'DEBIT', amount: '100.00' },
          { accountId: b.id, direction: 'CREDIT', amount: '99.99' },
        ],
      }),
    ).rejects.toThrow(/UNBALANCED/);

    // a has no funds → crediting it (decreasing an asset) below zero is blocked.
    await expect(
      ledgerService.postJournal(ctx, {
        currency: 'USD',
        lines: [
          { accountId: b.id, direction: 'DEBIT', amount: '100.00' },
          { accountId: a.id, direction: 'CREDIT', amount: '100.00' },
        ],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('is idempotent on reference', async () => {
    const external = await openAccount(ctx, 'EXTERNAL', 'ASSET', { allowNegative: true });
    const a = await openAccount(ctx, 'A', 'ASSET');

    const first = await fund(ctx, external.id, a.id, '500.00', 'fund-1');
    const second = await fund(ctx, external.id, a.id, '500.00', 'fund-1');
    expect(second.transaction.id).toBe(first.transaction.id);

    const aAfter = await ledgerService.getAccount(ctx, a.id);
    expect(aAfter?.balance.toString()).toBe('500'); // applied once, not twice
  });

  it('reverses a transaction and restores balances', async () => {
    const external = await openAccount(ctx, 'EXTERNAL', 'ASSET', { allowNegative: true });
    const a = await openAccount(ctx, 'A', 'ASSET');
    const funded = await fund(ctx, external.id, a.id, '300.00');

    const { reversal } = await ledgerService.reverseTransaction(ctx, funded.transaction.id, 'mistake');
    expect(reversal.reversalOfId).toBe(funded.transaction.id);

    const aAfter = await ledgerService.getAccount(ctx, a.id);
    expect(aAfter?.balance.toString()).toBe('0'); // back to zero

    const original = await ledgerService.getTransaction(ctx, funded.transaction.id);
    expect(original.transaction.status).toBe('REVERSED');

    // Double reversal is rejected.
    await expect(ledgerService.reverseTransaction(ctx, funded.transaction.id)).rejects.toThrow(/ALREADY_REVERSED/);
  });

  it('produces a balanced trial balance', async () => {
    const external = await openAccount(ctx, 'EXTERNAL', 'ASSET', { allowNegative: true });
    const a = await openAccount(ctx, 'A', 'ASSET');
    await fund(ctx, external.id, a.id, '1234.56');

    const tb = await ledgerService.getTrialBalance(ctx, 'USD');
    const usd = tb.totals.find((t) => t.currency === 'USD');
    expect(usd?.balanced).toBe(true);
    expect(usd?.debit).toBe(usd?.credit);
  });

  it('enforces append-only entries at the database layer', async () => {
    const external = await openAccount(ctx, 'EXTERNAL', 'ASSET', { allowNegative: true });
    const a = await openAccount(ctx, 'A', 'ASSET');
    const { entries } = await fund(ctx, external.id, a.id, '10.00');

    await expect(prisma.ledgerEntry.delete({ where: { id: entries[0].id } })).rejects.toThrow(/append-only/);
  });

  it('runs a full settlement lifecycle posting to the ledger', async () => {
    const external = await openAccount(ctx, 'EXTERNAL', 'ASSET', { allowNegative: true });
    const payer = await openAccount(ctx, 'PAYER', 'ASSET', { purpose: 'OPERATING' });
    const clearing = await openAccount(ctx, 'CLEARING', 'ASSET', { purpose: 'CLEARING' });
    const payee = await openAccount(ctx, 'PAYEE', 'ASSET', { purpose: 'SETTLEMENT' });
    await fund(ctx, external.id, payer.id, '1000.00');

    const instr = await settlementService.createInstruction(ctx, {
      amount: '1000.00',
      currency: 'USD',
      payerAccountId: payer.id,
      clearingAccountId: clearing.id,
      payeeAccountId: payee.id,
    });
    expect(instr.status).toBe('CREATED');

    const authorized = await settlementService.transition(ctx, instr.id, { action: 'AUTHORIZE' });
    expect(authorized.instruction.status).toBe('AUTHORIZED');
    expect((await ledgerService.getAccount(ctx, payer.id))?.balance.toString()).toBe('0');
    expect((await ledgerService.getAccount(ctx, clearing.id))?.balance.toString()).toBe('1000');

    const captured = await settlementService.transition(ctx, instr.id, { action: 'CAPTURE' });
    expect(captured.instruction.status).toBe('CAPTURED');
    expect(captured.ledgerTransactionId).toBeNull(); // capture moves no money

    const settled = await settlementService.transition(ctx, instr.id, { action: 'SETTLE', amount: '400.00' });
    expect(settled.instruction.status).toBe('PARTIALLY_SETTLED');
    expect((await ledgerService.getAccount(ctx, payee.id))?.balance.toString()).toBe('400');

    const finalSettle = await settlementService.transition(ctx, instr.id, { action: 'SETTLE' });
    expect(finalSettle.instruction.status).toBe('SETTLED');
    expect((await ledgerService.getAccount(ctx, payee.id))?.balance.toString()).toBe('1000');
    expect((await ledgerService.getAccount(ctx, clearing.id))?.balance.toString()).toBe('0');

    // Terminal: no further transitions.
    await expect(settlementService.transition(ctx, instr.id, { action: 'AUTHORIZE' })).rejects.toThrow(/TERMINAL_STATE/);

    const history = await settlementService.getHistory(ctx, instr.id);
    expect(history.length).toBeGreaterThanOrEqual(4); // create + 4 transitions
  });

  it('fails an authorized instruction and releases the hold to the payer', async () => {
    const external = await openAccount(ctx, 'EXTERNAL', 'ASSET', { allowNegative: true });
    const payer = await openAccount(ctx, 'PAYER', 'ASSET');
    const clearing = await openAccount(ctx, 'CLEARING', 'ASSET', { purpose: 'CLEARING' });
    const payee = await openAccount(ctx, 'PAYEE', 'ASSET');
    await fund(ctx, external.id, payer.id, '500.00');

    const instr = await settlementService.createInstruction(ctx, {
      amount: '500.00',
      currency: 'USD',
      payerAccountId: payer.id,
      clearingAccountId: clearing.id,
      payeeAccountId: payee.id,
    });
    await settlementService.transition(ctx, instr.id, { action: 'AUTHORIZE' });
    const failed = await settlementService.transition(ctx, instr.id, { action: 'FAIL', reason: 'rail rejected' });

    expect(failed.instruction.status).toBe('FAILED');
    expect((await ledgerService.getAccount(ctx, payer.id))?.balance.toString()).toBe('500'); // refunded
    expect((await ledgerService.getAccount(ctx, clearing.id))?.balance.toString()).toBe('0');
  });

  it('scopes reads to the tenant (cross-tenant access is a miss)', async () => {
    const a = await openAccount(ctx, 'A', 'ASSET');
    const otherOrg = await seedOrganization('Other Org');
    const otherCtx = actorFor(otherOrg);
    expect(await ledgerService.getAccount(otherCtx, a.id)).toBeNull();
    await expect(settlementService.getInstruction(otherCtx, a.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
