/**
 * @file server/__tests__/treasury.integration.test.ts
 * @description End-to-end database tests for the treasury engine against real
 * (embedded) PostgreSQL: wallet lifecycle with ledger-derived balances, the
 * funding guard, idempotency, projection/ledger reconciliation, FX execution as
 * two balanced postings with currency isolation, fee posting, liquidity, plus
 * concurrency and a conservation property test.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, seedOrganization, disconnect } from '../test/db';
import { ledgerService, type ActorContext } from '../services/ledger-service';
import { walletService } from '../services/wallet-service';
import { projectionService } from '../services/projection-service';
import { fxService } from '../services/fx-service';
import { feeService } from '../services/fee-service';
import { liquidityService } from '../services/liquidity-service';
import { reconciliationService } from '../services/reconciliation-service';
import { ValidationError } from '../db/errors';

function actorFor(orgId: string): ActorContext {
  return { organizationId: orgId, actorId: '00000000-0000-4000-8000-000000000001', actorRole: 'platform_admin', ip: '127.0.0.1' };
}

let extCounter = 0;
async function openExternal(ctx: ActorContext, currency: string) {
  extCounter += 1;
  return ledgerService.openAccount(ctx, { code: `EXT:${currency}:${extCounter}`, name: `External ${currency}`, type: 'ASSET', purpose: 'EXTERNAL', currency, allowNegative: true });
}

async function fundWallet(ctx: ActorContext, walletId: string, externalId: string, amount: string, ref?: string) {
  return walletService.operate(ctx, walletId, { op: 'CREDIT', amount, counterAccountId: externalId, reference: ref });
}

describe('treasury engine (PostgreSQL)', () => {
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

  it('opens a wallet and derives balances from the ledger', async () => {
    const wallet = await walletService.openWallet(ctx, { type: 'COMPANY', currency: 'USD' });
    const ext = await openExternal(ctx, 'USD');

    await fundWallet(ctx, wallet.id, ext.id, '1000.00');
    await walletService.operate(ctx, wallet.id, { op: 'HOLD', amount: '200.00' });
    await walletService.operate(ctx, wallet.id, { op: 'RESERVE', amount: '100.00' });

    const { balances } = await projectionService.getBalances(ctx, wallet.id);
    expect(balances.available).toBe('700.0000'); // 1000 - 200 held - 100 reserved
    expect(balances.held).toBe('200.0000');
    expect(balances.reserved).toBe('100.0000');
    expect(balances.total).toBe('1000.0000');

    const recon = await reconciliationService.reconcileWallet(ctx, wallet.id);
    expect(recon.matched).toBe(true);
  });

  it('blocks a hold that exceeds available funds', async () => {
    const wallet = await walletService.openWallet(ctx, { type: 'USER', currency: 'USD' });
    const ext = await openExternal(ctx, 'USD');
    await fundWallet(ctx, wallet.id, ext.id, '50.00');
    await expect(walletService.operate(ctx, wallet.id, { op: 'HOLD', amount: '100.00' })).rejects.toBeInstanceOf(ValidationError);
  });

  it('is idempotent on a wallet operation reference', async () => {
    const wallet = await walletService.openWallet(ctx, { type: 'USER', currency: 'USD' });
    const ext = await openExternal(ctx, 'USD');
    const first = await fundWallet(ctx, wallet.id, ext.id, '500.00', 'credit-1');
    const second = await fundWallet(ctx, wallet.id, ext.id, '500.00', 'credit-1');
    expect(second.idempotentReplay).toBe(true);
    expect(second.ledgerTransactionId).toBe(first.ledgerTransactionId);
    const { balances } = await projectionService.getBalances(ctx, wallet.id);
    expect(balances.available).toBe('500.0000'); // applied once
  });

  it('opening a wallet is idempotent on reference', async () => {
    const a = await walletService.openWallet(ctx, { type: 'MERCHANT', currency: 'EUR', reference: 'm-1' });
    const b = await walletService.openWallet(ctx, { type: 'MERCHANT', currency: 'EUR', reference: 'm-1' });
    expect(b.id).toBe(a.id);
  });

  it('clears pending into available (pending = incoming − outgoing)', async () => {
    const wallet = await walletService.openWallet(ctx, { type: 'USER', currency: 'USD' });
    const ext = await openExternal(ctx, 'USD');
    await walletService.operate(ctx, wallet.id, { op: 'MARK_PENDING', amount: '300.00', counterAccountId: ext.id });
    let { balances } = await projectionService.getBalances(ctx, wallet.id);
    expect(balances.pending).toBe('300.0000');
    expect(balances.incoming).toBe('300.0000');
    expect(balances.projected).toBe('300.0000'); // available 0 + pending 300

    await walletService.operate(ctx, wallet.id, { op: 'CLEAR_PENDING', amount: '300.00' });
    ({ balances } = await projectionService.getBalances(ctx, wallet.id));
    expect(balances.pending).toBe('0.0000');
    expect(balances.outgoing).toBe('300.0000');
    expect(balances.available).toBe('300.0000');
  });

  it('executes FX as two balanced postings with currency isolation', async () => {
    const usd = await walletService.openWallet(ctx, { type: 'COMPANY', currency: 'USD' });
    const inr = await walletService.openWallet(ctx, { type: 'COMPANY', currency: 'INR' });
    const ext = await openExternal(ctx, 'USD');
    await fundWallet(ctx, usd.id, ext.id, '1000.00');

    const quote = await fxService.quote(ctx, { baseCurrency: 'USD', quoteCurrency: 'INR', midRate: '83.50', spreadBps: 10, marginBps: 10, baseAmount: '100.00' });
    expect(quote.allInRate.toString()).toBe('83.333'); // mid marked down 20bps

    const exec = await fxService.execute(ctx, { quoteId: quote.id, fromWalletId: usd.id, toWalletId: inr.id });
    expect(exec.idempotentReplay).toBe(false);

    const usdBal = await projectionService.getBalances(ctx, usd.id);
    const inrBal = await projectionService.getBalances(ctx, inr.id);
    expect(usdBal.balances.available).toBe('900.0000'); // 1000 - 100
    expect(inrBal.balances.available).toBe('8333.3000'); // 100 × 83.333

    // A quote executes at most once.
    const replay = await fxService.execute(ctx, { quoteId: quote.id, fromWalletId: usd.id, toWalletId: inr.id });
    expect(replay.idempotentReplay).toBe(true);
    expect(replay.trade.id).toBe(exec.trade.id);
  });

  it('rejects FX when a wallet currency does not match the quote', async () => {
    const usd = await walletService.openWallet(ctx, { type: 'COMPANY', currency: 'USD' });
    const gbp = await walletService.openWallet(ctx, { type: 'COMPANY', currency: 'GBP' });
    const ext = await openExternal(ctx, 'USD');
    await fundWallet(ctx, usd.id, ext.id, '100.00');
    const quote = await fxService.quote(ctx, { baseCurrency: 'USD', quoteCurrency: 'EUR', midRate: '0.92', baseAmount: '100.00' });
    await expect(fxService.execute(ctx, { quoteId: quote.id, fromWalletId: usd.id, toWalletId: gbp.id })).rejects.toThrow(/TO_WALLET_CURRENCY/);
  });

  it('charges a fee and books it to the fee-income account', async () => {
    const wallet = await walletService.openWallet(ctx, { type: 'MERCHANT', currency: 'USD' });
    const ext = await openExternal(ctx, 'USD');
    await fundWallet(ctx, wallet.id, ext.id, '1000.00');
    const rule = await feeService.createRule(ctx, { code: 'pct-50', name: 'Platform 0.5%', type: 'PERCENTAGE', scope: 'PLATFORM', currency: 'USD', basisPoints: 50 });

    const calc = await feeService.calculate(ctx, rule.id, '1000.00', 'USD');
    expect(calc.feeAmount).toBe('5.0000');

    const applied = await feeService.applyFee(ctx, { feeRuleId: rule.id, baseAmount: '1000.00', currency: 'USD', payerAccountId: wallet.availableAccountId, reference: 'fee-1' });
    expect(applied.feeAmount).toBe('5.0000');
    expect(applied.ledgerTransactionId).not.toBeNull();

    const { balances } = await projectionService.getBalances(ctx, wallet.id);
    expect(balances.available).toBe('995.0000'); // 1000 - 5 fee

    // Idempotent on reference.
    const replay = await feeService.applyFee(ctx, { feeRuleId: rule.id, baseAmount: '1000.00', currency: 'USD', payerAccountId: wallet.availableAccountId, reference: 'fee-1' });
    expect(replay.feeTransaction.id).toBe(applied.feeTransaction.id);
  });

  it('derives a liquidity position and reconciles the ledger', async () => {
    const wallet = await walletService.openWallet(ctx, { type: 'TREASURY', currency: 'USD' });
    const ext = await openExternal(ctx, 'USD');
    await fundWallet(ctx, wallet.id, ext.id, '5000.00');
    await walletService.operate(ctx, wallet.id, { op: 'RESERVE', amount: '1000.00' });

    const live = await liquidityService.computeLive(ctx, 'USD');
    expect(live.availableLiquidity).toBe('4000.0000'); // 5000 - 1000 reserved
    expect(live.reserved).toBe('1000.0000');
    expect(live.currentPosition).toBe('5000.0000');

    const snap = await liquidityService.snapshot(ctx, 'USD');
    expect(snap.currency).toBe('USD');

    const recon = await reconciliationService.reconcileLedger(ctx, 'USD');
    expect(recon.mismatches).toHaveLength(0);
  });

  it('conserves funds across a random sequence of wallet operations (property)', async () => {
    const wallet = await walletService.openWallet(ctx, { type: 'USER', currency: 'USD' });
    const ext = await openExternal(ctx, 'USD');
    await fundWallet(ctx, wallet.id, ext.id, '1000.00');

    const ops: Array<'HOLD' | 'RELEASE' | 'RESERVE' | 'UNRESERVE'> = ['HOLD', 'RELEASE', 'RESERVE', 'UNRESERVE'];
    for (let i = 0; i < 25; i += 1) {
      const { balances } = await projectionService.getBalances(ctx, wallet.id);
      const op = ops[Math.floor(Math.random() * ops.length)];
      const source = op === 'RELEASE' ? balances.held : op === 'UNRESERVE' ? balances.reserved : balances.available;
      const max = Math.floor(Number(source));
      if (max < 1) continue;
      const amount = (Math.floor(Math.random() * max) + 1).toFixed(2);
      await walletService.operate(ctx, wallet.id, { op, amount });
    }

    const { balances } = await projectionService.getBalances(ctx, wallet.id);
    // Internal moves never change total custody.
    expect(balances.total).toBe('1000.0000');
    const recon = await reconciliationService.reconcileWallet(ctx, wallet.id);
    expect(recon.matched).toBe(true);
  });

  it('keeps funds consistent under concurrent operations (optimistic lock)', async () => {
    const wallet = await walletService.openWallet(ctx, { type: 'USER', currency: 'USD' });
    const ext = await openExternal(ctx, 'USD');
    await fundWallet(ctx, wallet.id, ext.id, '100.00');

    const results = await Promise.allSettled([
      walletService.operate(ctx, wallet.id, { op: 'HOLD', amount: '30.00' }),
      walletService.operate(ctx, wallet.id, { op: 'HOLD', amount: '30.00' }),
    ]);
    expect(results.some((r) => r.status === 'fulfilled')).toBe(true);

    const { balances } = await projectionService.getBalances(ctx, wallet.id);
    // No lost update / double spend: total is conserved and books reconcile.
    expect(balances.total).toBe('100.0000');
    expect(Number(balances.available) + Number(balances.held)).toBe(100);
    const recon = await reconciliationService.reconcileWallet(ctx, wallet.id);
    expect(recon.matched).toBe(true);
  });

  it('scopes wallets to the tenant', async () => {
    const wallet = await walletService.openWallet(ctx, { type: 'USER', currency: 'USD' });
    const otherCtx = actorFor(await seedOrganization('Other Org'));
    await expect(projectionService.getBalances(otherCtx, wallet.id)).rejects.toThrow(/Wallet_NOT_FOUND/);
  });
});
