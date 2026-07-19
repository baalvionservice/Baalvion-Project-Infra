/**
 * @file services/treasury-sync-service.ts
 * @description Browser client for the real orchestration Treasury/Wallet engine
 * (`/api/wallets`, see `src/server/services/wallet-service.ts` — ledger-backed,
 * bucketed balances). "Re-sync" refreshes the caller's wallet(s) from the ledger,
 * auto-provisioning a COMPANY wallet on first use.
 */
import { fetchLocalApi } from '@/lib/local-api-client';

interface Envelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface WalletSummary {
  id: string;
  type: string;
  currency: string;
  status: string;
}

export interface TreasurySyncResult {
  wallets: WalletSummary[];
  walletCount: number;
}

async function unwrap<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !body || body.success === false) {
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return body.data as T;
}

export const treasurySyncService = {
  async resync(): Promise<TreasurySyncResult> {
    let res = await fetchLocalApi('/api/wallets');
    let list = await unwrap<{ items: WalletSummary[]; total: number }>(res);

    if (list.items.length === 0) {
      // First sync for this org — provision a default operating wallet.
      const openRes = await fetchLocalApi('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'COMPANY', currency: 'USD', reference: 'default-operating-wallet' }),
      });
      await unwrap(openRes);
      res = await fetchLocalApi('/api/wallets');
      list = await unwrap<{ items: WalletSummary[]; total: number }>(res);
    }

    return { wallets: list.items, walletCount: list.items.length };
  },
};
