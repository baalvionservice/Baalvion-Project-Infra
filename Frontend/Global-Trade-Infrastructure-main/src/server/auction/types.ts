/**
 * @file server/auction/types.ts
 * @description Shared auction contracts used across the service, repository and
 * HTTP layers.
 */

export interface AuctionFilter {
  status?: string;
  type?: string;
  tradeId?: string;
  currency?: string;
  sellerOrgId?: string;
  search?: string;
}

/** Action verbs an operator/system can drive an auction through. */
export type AuctionAction = 'open' | 'close' | 'settle' | 'cancel';

/** Optional ledger accounts that, when all present, wire auction settlement to the ledger. */
export interface SettlementAccounts {
  payerAccountId: string;
  clearingAccountId: string;
  payeeAccountId: string;
  rail?: string;
}
