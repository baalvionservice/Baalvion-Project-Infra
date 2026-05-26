/**
 * @fileOverview Payment Service Orchestrator
 * Decouples the UI from financial gateway implementations.
 */

import * as mockService from './payment.mock';
import { createNotification } from '@/services/notifications/notificationService';
import { logAction } from '@/services/audit/auditService';
import { createInvoice } from '@/services/invoices/invoiceService';

export type { PaymentData } from './payment.mock';

const USE_MOCK = true;

export const createPayment = async (data: {
  bookingId: string;
  userId: string;
  amount: number;
  method: string;
  userRole?: string;
}) => {
  const result = await mockService.mockCreatePayment(data);

  await createNotification({
    userId: data.userId,
    title: 'Settlement Verified',
    message: `Payment of ₹${data.amount.toLocaleString()} for Engagement #${data.bookingId.slice(-6)} has been secured in escrow.`,
    type: 'status_changed',
    priority: 'high'
  });

  await createInvoice(result);

  await logAction({
    userId: data.userId,
    userRole: data.userRole || 'client',
    action: 'status_change',
    entityType: 'appointment',
    entityId: data.bookingId,
    details: { paymentId: result.id, amount: data.amount, method: data.method }
  });

  return result;
};

export const getUserPayments = async (userId: string) => {
  return await mockService.mockGetUserPayments(userId);
};

export const updatePaymentStatus = async (paymentId: string, status: 'paid' | 'pending' | 'failed') => {
  return await mockService.mockUpdatePaymentStatus(paymentId, status);
};