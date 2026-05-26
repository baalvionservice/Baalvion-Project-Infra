/**
 * @fileOverview Invoice Service Orchestrator
 * Centralized entry point for professional billing and reconciliation.
 */

import * as mock from './invoice.mock';
import { logAction } from '@/services/audit/auditService';

export type { InvoiceData } from './invoice.mock';

/**
 * Provisions a new professional invoice following a verified settlement.
 */
export const createInvoice = async (paymentData: any) => {
  const result = await mock.mockCreateInvoice(paymentData);

  // Audit Event
  await logAction({
    userId: paymentData.userId,
    userRole: 'system',
    action: 'status_change',
    entityType: 'system',
    entityId: result.id,
    details: { totalAmount: result.totalAmount, type: 'invoice_generated' }
  });

  return result;
};

/**
 * Retrieves the chronological billing ledger for a member.
 */
export const getUserInvoices = async (userId: string) => {
  return await mock.mockGetUserInvoices(userId);
};

/**
 * Retrieves a specific invoice dossier for auditing.
 */
export const getInvoiceById = async (invoiceId: string) => {
  return await mock.mockGetInvoiceById(invoiceId);
};
