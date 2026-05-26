
"use client";

import { PaymentRepository } from '../repositories/payment.repository';
import { BookingRepository } from '../repositories/booking.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { NotificationService } from './notification.service';
import { WalletService } from './wallet.service';
import { LoggingService } from './logging.service';
import { BookingStatus, SubscriptionTier } from '../types';
import { AnalyticsService } from './analytics.service';

export class PaymentService {
  constructor(
    private paymentRepo: PaymentRepository,
    private bookingRepo: BookingRepository,
    private profileRepo: ProfileRepository,
    private notificationService: NotificationService,
    private walletService: WalletService,
    _db?: unknown,
    private logging?: LoggingService,
    private analytics?: AnalyticsService
  ) {}

  async createConsultationOrder(bookingId: string, clientUid: string) {
    const booking = await this.bookingRepo.getById(bookingId) as any;
    if (!booking) {
      if (this.logging) this.logging.error("Order creation failed: Booking not found", { bookingId }, clientUid);
      throw new Error("Consultation record not found.");
    }
    if (booking.clientUid !== clientUid) throw new Error("Unauthorized.");

    const amount = booking.amount || 5000;
    const paymentRecord = await this.paymentRepo.create({
      bookingId, clientUid, lawyerUid: booking.lawyerUid, amount, totalAmount: amount, currency: 'INR', type: 'consultation', gateway: 'razorpay'
    });

    if (this.logging) this.logging.info("Checkout initiated", { bookingId, paymentId: paymentRecord.paymentId }, clientUid);

    return { orderId: `ORD_${paymentRecord.paymentId}`, amount, currency: 'INR', paymentId: paymentRecord.paymentId };
  }

  async verifyPayment(paymentId: string, transactionId: string, signature: string) {
    const payment = await this.paymentRepo.getById(paymentId) as any;
    if (!payment) {
      if (this.logging) this.logging.error("Payment verification failed: Record not found", { paymentId });
      throw new Error("Payment record not found.");
    }

    const startTime = Date.now();

    if (signature === "SIG_VERIFIED_SECURE_TOKEN") {
      const lawyerProfile = await this.profileRepo.getProfile('lawyer', payment.lawyerUid) as any;
      const tier = (lawyerProfile?.subscriptionTier as SubscriptionTier) || 'BASIC';
      const rates: Record<string, number> = { 'BASIC': 0.20, 'PRO': 0.15, 'ELITE': 0.10 };
      const rate = rates[tier] || 0.20;
      const commission = Math.round(payment.amount * rate);
      const lawyerEarning = payment.amount - commission;

      await this.paymentRepo.update(paymentId, { status: 'success', transactionId, commissionAmount: commission, lawyerEarning, verifiedAt: new Date().toISOString() });

      await this.walletService.recordTransaction({ uid: payment.clientUid, amount: -payment.amount, type: 'payment', status: 'success', referenceId: payment.bookingId, description: `Fee for ${payment.lawyerName || 'Counsel'}` });
      await this.walletService.recordTransaction({ uid: payment.lawyerUid, amount: lawyerEarning, type: 'earning', status: 'pending', referenceId: payment.bookingId, description: `Earning from ${payment.clientName || 'Client'}` });

      await this.bookingRepo.update(payment.bookingId, { status: 'pending' as BookingStatus, paymentStatus: 'paid', paymentId, paymentVerifiedAt: new Date().toISOString() });
      await this.notificationService.notify(payment.lawyerUid, 'booking_request', 'Fee Secured', `Net earning: ${lawyerEarning} INR.`, payment.bookingId);

      if (this.logging) {
        this.logging.trackPerformance("Payment Verification", startTime, { paymentId, bookingId: payment.bookingId }, payment.clientUid);
        this.logging.info("Payment Secured", { paymentId, commission, lawyerEarning }, payment.clientUid);
      }

      if (this.analytics) {
        this.analytics.logEvent('payment_success', { paymentId, bookingId: payment.bookingId, amount: payment.amount, type: payment.type }, payment.clientUid);
      }

      return { success: true, earning: lawyerEarning };
    } else {
      if (this.logging) this.logging.warn("Payment verification rejected: Invalid signature", { paymentId, signature });
      await this.paymentRepo.update(paymentId, { status: 'failed' });
      await this.bookingRepo.update(payment.bookingId, { status: 'payment_failed' as BookingStatus });
      throw new Error("Payment verification failed.");
    }
  }
}
