import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { WebhooksController } from './webhooks.controller';
import { EscrowService } from './escrow.service';
import { StripeService } from './stripe.service';
import { WiseService } from './wise.service';
import { LedgerService } from './ledger.service';

@Module({
  controllers: [PaymentsController, WebhooksController],
  providers: [EscrowService, StripeService, WiseService, LedgerService],
  exports: [EscrowService, StripeService, WiseService, LedgerService],
})
export class PaymentsModule {}
