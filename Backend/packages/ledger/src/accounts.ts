/**
 * Chart of accounts.
 *
 * Deliberately small. A chart that models every product line is a chart nobody keeps accurate;
 * the product detail belongs in the dimensions carried on each line (site, tenant, party,
 * product), not in a proliferation of account codes. These are the accounts the platform's
 * actual money flows need, and no more.
 */

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface AccountDef {
  code: string;
  name: string;
  type: AccountType;
  description: string;
}

/**
 * Debit increases an asset or an expense; credit increases a liability, equity or revenue.
 * Everything else in this package follows from that one rule.
 */
export function increasesOnDebit(type: AccountType): boolean {
  return type === 'ASSET' || type === 'EXPENSE';
}

export const ACCOUNTS: Readonly<Record<string, AccountDef>> = Object.freeze({
  PSP_RECEIVABLE: {
    code: '1100',
    name: 'Processor receivable',
    type: 'ASSET',
    description: 'Money captured by a processor but not yet settled to a bank account. Real, and not yet cash.',
  },
  BANK: {
    code: '1000',
    name: 'Bank',
    type: 'ASSET',
    description: 'Settled cash.',
  },
  DEFERRED_REVENUE: {
    code: '2100',
    name: 'Deferred revenue',
    type: 'LIABILITY',
    description: 'Paid for, not yet delivered. A liability — the obligation to provide the service — never revenue.',
  },
  REFUNDS_PAYABLE: {
    code: '2200',
    name: 'Refunds payable',
    type: 'LIABILITY',
    description: 'Owed back to a customer after an early termination, until it is actually paid.',
  },
  REVENUE: {
    code: '4000',
    name: 'Revenue',
    type: 'REVENUE',
    description: 'Earned. Recognised as the service is delivered, not when the cash arrives.',
  },
  REFUNDS: {
    code: '4900',
    name: 'Refunds',
    type: 'REVENUE',
    description: 'Contra-revenue. Kept separate from revenue so gross and net are both visible.',
  },
  PROCESSOR_FEES: {
    code: '5100',
    name: 'Processor fees',
    type: 'EXPENSE',
    description: 'What the PSP kept. Posted as its own line so per-property profit is answerable.',
  },
});

export type AccountKey = keyof typeof ACCOUNTS;

export function accountFor(key: AccountKey): AccountDef {
  const def = ACCOUNTS[key];
  if (!def) throw new Error(`[ledger] unknown account: ${String(key)}`);
  return def;
}
