import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

/**
 * Stripe wrapper for inbound funding (investor → escrow). Falls back to a
 * simulated PaymentIntent when no secret key is configured.
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe?: Stripe;
  private readonly webhookSecret?: string;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || undefined;
    if (key) this.stripe = new Stripe(key);
    else this.logger.warn('Stripe not configured — simulating PaymentIntents');
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>,
    idempotencyKey: string,
  ): Promise<{ id: string; clientSecret: string; status: string }> {
    if (!this.stripe) {
      return {
        id: `sim_pi_${idempotencyKey.slice(0, 12)}`,
        clientSecret: `sim_secret_${idempotencyKey.slice(0, 12)}`,
        status: 'requires_payment_method',
      };
    }
    const pi = await this.stripe.paymentIntents.create(
      {
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey },
    );
    return {
      id: pi.id,
      clientSecret: pi.client_secret ?? '',
      status: pi.status,
    };
  }

  /** Verify + parse a Stripe webhook. Returns the event or null if invalid. */
  constructEvent(rawBody: Buffer, signature?: string): Stripe.Event | null {
    if (!this.stripe || !this.webhookSecret) {
      try {
        return JSON.parse(rawBody.toString()) as Stripe.Event;
      } catch {
        return null;
      }
    }
    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature ?? '',
        this.webhookSecret,
      );
    } catch (err) {
      this.logger.warn(`Stripe webhook signature failed: ${String(err)}`);
      return null;
    }
  }
}
