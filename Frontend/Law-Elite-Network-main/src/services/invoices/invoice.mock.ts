/**
 * @fileOverview Mock Invoice Ledger Implementation
 * Simulates persistence and generation of professional billing records.
 */

export interface InvoiceData {
  id: string;
  paymentId: string;
  userId: string;
  bookingId: string;
  date: number;
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'paid' | 'pending';
  items: { description: string; amount: number }[];
}

const STORAGE_KEY = 'law_elite_invoice_ledger';

export const mockCreateInvoice = async (paymentData: any): Promise<InvoiceData> => {
  // Simulate professional record generation
  await new Promise((resolve) => setTimeout(resolve, 800));

  const taxRate = 0.10; // 10% Network Tax/Service Fee
  const taxAmount = paymentData.amount * taxRate;
  const totalAmount = paymentData.amount + taxAmount;

  const newInvoice: InvoiceData = {
    id: `INV_${Date.now()}`,
    paymentId: paymentData.id,
    userId: paymentData.userId,
    bookingId: paymentData.bookingId,
    date: Date.now(),
    baseAmount: paymentData.amount,
    taxAmount: taxAmount,
    totalAmount: totalAmount,
    currency: paymentData.currency || 'INR',
    status: 'paid',
    items: [
      { 
        description: `Executive Consultation - Engagement #${paymentData.bookingId.slice(-6)}`, 
        amount: paymentData.amount 
      }
    ]
  };

  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newInvoice, ...existing]));

  return newInvoice;
};

export const mockGetUserInvoices = async (userId: string): Promise<InvoiceData[]> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return all.filter((inv: InvoiceData) => inv.userId === userId);
};

export const mockGetInvoiceById = async (invoiceId: string): Promise<InvoiceData | null> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return all.find((inv: InvoiceData) => inv.id === invoiceId) || null;
};
