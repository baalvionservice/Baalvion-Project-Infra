import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { StripeService } from './stripe.service';
import { EscrowService } from './escrow.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('payments/webhooks')
export class WebhooksController {
  constructor(
    private readonly stripe: StripeService,
    private readonly escrow: EscrowService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('stripe')
  async stripeWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    const event = this.stripe.constructEvent(raw, signature);
    if (!event) return { received: false };

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as { id: string };
      await this.escrow.markFunded(pi.id);
    }
    return { received: true };
  }
}
