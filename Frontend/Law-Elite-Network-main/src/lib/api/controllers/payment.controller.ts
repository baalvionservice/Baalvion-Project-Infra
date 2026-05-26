
"use client";

import { PaymentService } from '../services/payment.service';
import { ApiResponse } from '../types';

export class PaymentController {
  constructor(private service: PaymentService) {}

  async initiateCheckout(req: { bookingId: string; uid: string }): Promise<ApiResponse> {
    try {
      const data = await this.service.createConsultationOrder(req.bookingId, req.uid);
      return { success: true, message: 'Checkout session initiated.', data };
    } catch (error: any) {
      return { success: false, message: 'Order creation failed.', error: error.message };
    }
  }

  async completePayment(req: { paymentId: string; transactionId: string; signature: string }): Promise<ApiResponse> {
    try {
      const data = await this.service.verifyPayment(req.paymentId, req.transactionId, req.signature);
      return { success: true, message: 'Payment verified and secured.', data };
    } catch (error: any) {
      return { success: false, message: 'Verification failed.', error: error.message };
    }
  }
}
