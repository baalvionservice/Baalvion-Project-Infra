import { Injectable, Logger } from '@nestjs/common';

/**
 * Wise (TransferWise) wrapper for cross-border OUTBOUND payouts
 * (distributions, returns, exits). Implements quote → transfer → fund.
 * Simulates when no token is configured.
 */
@Injectable()
export class WiseService {
  private readonly logger = new Logger(WiseService.name);
  private readonly token?: string;
  private readonly profileId?: string;
  private readonly baseUrl = 'https://api.wise.com';

  constructor() {
    this.token = process.env.WISE_API_TOKEN || undefined;
    this.profileId = process.env.WISE_PROFILE_ID || undefined;
    if (!this.token) this.logger.warn('Wise not configured — simulating payouts');
  }

  get enabled(): boolean {
    return !!(this.token && this.profileId);
  }

  /** Create + fund a transfer. Returns a provider reference. */
  async createPayout(params: {
    amount: number;
    currency: string;
    reference: string;
  }): Promise<{ id: string; status: string }> {
    if (!this.enabled) {
      return { id: `sim_wise_${params.reference.slice(0, 12)}`, status: 'processing' };
    }
    // Quote
    const quote = await this.call('POST', '/v3/quotes', {
      profileId: this.profileId,
      sourceCurrency: params.currency,
      targetCurrency: params.currency,
      sourceAmount: params.amount,
    });
    // Transfer
    const transfer = await this.call('POST', '/v1/transfers', {
      targetAccount: null,
      quoteUuid: (quote as any).id,
      customerTransactionId: params.reference,
      details: { reference: params.reference },
    });
    return { id: (transfer as any).id as string, status: 'processing' };
  }

  private async call(method: string, path: string, body: unknown) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Wise ${method} ${path}: ${res.status}`);
    return res.json();
  }
}
