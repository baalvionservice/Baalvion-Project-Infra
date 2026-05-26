
"use client";

import { WalletRepository } from '../repositories/wallet.repository';
import { TransactionData } from '../types';

export class WalletService {
  constructor(private walletRepo: WalletRepository) {}

  async getOrCreateWallet(uid: string) {
    let wallet = await this.walletRepo.getWalletByUid(uid);
    if (!wallet) {
      wallet = await this.walletRepo.createWallet(uid);
    }
    return wallet;
  }

  async recordTransaction(data: Partial<TransactionData>) {
    return await this.walletRepo.createTransaction(data);
  }

  async creditLawyer(uid: string, amount: number, referenceId: string, description: string) {
    // 1. Update Wallet
    await this.getOrCreateWallet(uid); // Ensure exists
    await this.walletRepo.updateBalance(uid, amount);

    // 2. Record Transaction as success
    await this.walletRepo.createTransaction({
      uid,
      amount,
      type: 'earning',
      status: 'success',
      referenceId,
      description
    });
  }

  async getTransactions(uid: string) {
    // This is typically handled via useCollection in the UI, 
    // but we can provide a service method for one-time fetches.
  }
}
