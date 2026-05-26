
"use client";

import { WalletService } from '../services/wallet.service';
import { ApiResponse } from '../types';

export class WalletController {
  constructor(private service: WalletService) {}

  async getWallet(uid: string): Promise<ApiResponse> {
    try {
      const data = await this.service.getOrCreateWallet(uid);
      return { success: true, message: 'Wallet synchronized', data };
    } catch (error: any) {
      return { success: false, message: 'Wallet fetch failed', error: error.message };
    }
  }
}
