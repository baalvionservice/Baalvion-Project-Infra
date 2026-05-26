
"use client";

import { BookingRepository } from '../repositories/booking.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { UserRole, BookingStatus } from '../types';
import { NotificationService } from './notification.service';
import { WalletService } from './wallet.service';
import { AnalyticsService } from './analytics.service';

export class BookingService {
  constructor(
    private bookingRepo: BookingRepository,
    private profileRepo: ProfileRepository,
    private notificationService?: NotificationService,
    private walletService?: WalletService,
    private analytics?: AnalyticsService
  ) {}

  async requestConsultation(clientUid: string, role: UserRole, data: any) {
    if (role !== 'client') throw new Error("Unauthorized: Only premier clients can request consultations.");

    const [lawyerProfile, clientProfile] = await Promise.all([
      this.profileRepo.getProfile('lawyer', data.lawyerUid),
      this.profileRepo.getProfile('client', clientUid)
    ]);

    if (!lawyerProfile || lawyerProfile.verificationStatus !== 'approved') throw new Error("Target practitioner unavailable.");
    if (!data.scheduledAt || !data.consultationType) throw new Error("Validation Error: Schedule and format required.");

    const payload = {
      ...data,
      clientUid,
      clientName: clientProfile?.fullName || 'Client',
      lawyerName: lawyerProfile?.fullName || 'Practitioner',
      status: 'pending_payment' as BookingStatus,
      paymentStatus: 'unpaid',
      amount: 5000,
      currency: 'INR',
      notes: data.notes || ''
    };

    const booking = await this.bookingRepo.create(payload);

    if (this.analytics) {
      this.analytics.logEvent('booking_created', { 
        bookingId: booking.bookingId, 
        lawyerUid: data.lawyerUid,
        type: data.consultationType 
      }, clientUid);
    }

    return booking;
  }

  async getClientBookings(clientUid: string) { return await this.bookingRepo.findBookings({ clientUid }); }
  async getLawyerBookings(lawyerUid: string) { return await this.bookingRepo.findBookings({ lawyerUid, status: 'pending' }); }

  async updateStatus(bookingId: string, requestingUid: string, role: UserRole, newStatus: BookingStatus) {
    const booking = await this.bookingRepo.getById(bookingId) as any;
    if (!booking) throw new Error("Consultation record not found.");

    const isLawyer = booking.lawyerUid === requestingUid && role === 'lawyer';
    const isClient = booking.clientUid === requestingUid && role === 'client';

    if (!isLawyer && !isClient) throw new Error("Unauthorized.");
    if (booking.status === 'pending_payment' && !['cancelled', 'payment_failed'].includes(newStatus)) throw new Error("Payment required.");

    if (isLawyer) {
      if (booking.paymentStatus !== 'paid') throw new Error("Payment pending.");
      if (!['accepted', 'rejected', 'completed'].includes(newStatus)) throw new Error("Invalid status transition.");
      if (newStatus === 'completed' && booking.status !== 'completed' && this.walletService) {
        const earningAmount = booking.amount * 0.8;
        await this.walletService.creditLawyer(booking.lawyerUid, earningAmount, booking.bookingId, `Completed consultation with ${booking.clientName}`);
      }
    }

    await this.bookingRepo.update(bookingId, { status: newStatus, updatedAt: new Date().toISOString() });

    if (this.notificationService) {
      const type = newStatus === 'accepted' ? 'booking_accepted' : 'booking_rejected';
      const recipient = isLawyer ? booking.clientUid : booking.lawyerUid;
      await this.notificationService.notify(recipient, type as any, 'Engagement Update', `Status: ${newStatus}`, bookingId);
    }
  }
}
