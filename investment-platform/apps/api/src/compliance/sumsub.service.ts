import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';

/**
 * Thin Sumsub REST client. HMAC-signs requests per Sumsub's scheme
 * (X-App-Token + X-App-Access-Sig + X-App-Access-Ts). When credentials are
 * absent (local dev), methods return deterministic simulated values so the
 * onboarding flow remains exercisable end-to-end.
 */
@Injectable()
export class SumsubService {
  private readonly logger = new Logger(SumsubService.name);
  private readonly appToken?: string;
  private readonly secretKey?: string;
  private readonly baseUrl: string;
  private readonly webhookSecret?: string;

  constructor(config: ConfigService) {
    this.appToken = process.env.SUMSUB_APP_TOKEN || undefined;
    this.secretKey = process.env.SUMSUB_SECRET_KEY || undefined;
    this.baseUrl = process.env.SUMSUB_BASE_URL || 'https://api.sumsub.com';
    this.webhookSecret = process.env.SUMSUB_WEBHOOK_SECRET || undefined;
  }

  get enabled(): boolean {
    return !!(this.appToken && this.secretKey);
  }

  /** Create an applicant for a subject and return the Sumsub applicantId. */
  async createApplicant(externalUserId: string, levelName = 'basic-kyc-level'): Promise<string> {
    if (!this.enabled) {
      this.logger.warn('Sumsub disabled — returning simulated applicantId');
      return `sim_${externalUserId.slice(0, 8)}`;
    }
    const body = JSON.stringify({ externalUserId });
    const res = await this.signedFetch(
      'POST',
      `/resources/applicants?levelName=${encodeURIComponent(levelName)}`,
      body,
    );
    return res.id as string;
  }

  /** SDK access token the web client uses to launch the WebSDK. */
  async createAccessToken(externalUserId: string, levelName = 'basic-kyc-level'): Promise<string> {
    if (!this.enabled) return `sim-token-${externalUserId.slice(0, 8)}`;
    const res = await this.signedFetch(
      'POST',
      `/resources/accessTokens?userId=${encodeURIComponent(externalUserId)}&levelName=${encodeURIComponent(levelName)}`,
      '',
    );
    return res.token as string;
  }

  /** Verify an inbound webhook signature (HMAC-SHA256 of the raw body). */
  verifyWebhook(rawBody: Buffer, signature?: string): boolean {
    if (!this.webhookSecret) return true; // dev: accept
    if (!signature) return false;
    const digest = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    return digest === signature;
  }

  private async signedFetch(method: string, path: string, body: string) {
    const ts = Math.floor(Date.now() / 1000).toString();
    const signature = createHmac('sha256', this.secretKey!)
      .update(ts + method + path + body)
      .digest('hex');

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-App-Token': this.appToken!,
        'X-App-Access-Sig': signature,
        'X-App-Access-Ts': ts,
      },
      body: body || undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Sumsub ${method} ${path} failed: ${res.status} ${text}`);
    }
    return (await res.json()) as Record<string, unknown>;
  }
}
