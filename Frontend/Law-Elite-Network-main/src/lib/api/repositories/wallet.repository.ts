
"use client";

import { apiClient } from '@/lib/api/client';
import { WalletData, TransactionData } from '../types';

export class WalletRepository {
  constructor() {}

  async getWalletByUid(uid: string): Promise<WalletData | null> {
    try {
      const res = await apiClient.get(`/wallets/${uid}`);
      return (res.data?.data as WalletData) ?? null;
    } catch {
      return null;
    }
  }

  async createWallet(uid: string, currency: string = 'INR'): Promise<WalletData> {
    try {
      const res = await apiClient.post('/wallets', { uid, currency });
      return (res.data?.data as WalletData) ?? { walletId: uid, uid, balance: 0, currency, updatedAt: null };
    } catch {
      return { walletId: uid, uid, balance: 0, currency, updatedAt: null };
    }
  }

  async updateBalance(uid: string, amount: number) {
    try {
      await apiClient.patch(`/wallets/${uid}/balance`, { amount });
    } catch {
      // no-op
    }
  }

  async createTransaction(data: Partial<TransactionData>): Promise<TransactionData> {
    try {
      const res = await apiClient.post('/wallets/transactions', data);
      return (res.data?.data as TransactionData) ?? (data as TransactionData);
    } catch {
      return data as TransactionData;
    }
  }

  // Real-time query not available over REST; returns null
  getTransactionsQuery(_uid: string, _max: number = 50) {
    return null;
  }

  async findTransactionByRef(refId: string, type: string) {
    try {
      const res = await apiClient.get('/wallets/transactions', { params: { referenceId: refId, type } });
      const list = res.data?.data;
      return Array.isArray(list) && list.length > 0 ? list[0] : null;
    } catch {
      return null;
    }
  }
}
