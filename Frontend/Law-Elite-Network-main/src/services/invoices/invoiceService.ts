/**
 * @fileOverview Invoice Service — LIVE. Invoices are derived from real payments
 * (law-service / Postgres); there is no separate invoices table. No mock, no Firebase.
 */
import { paymentApi } from '@/lib/api/client';

export interface InvoiceData {
  id: string;
  invoiceId: string;
  amount: number;
  totalAmount: number;
  currency: string;
  status: string;
  bookingId?: string;
  provider?: string;
  createdAt?: string;
  [key: string]: any;
}

const toInvoice = (p: any): InvoiceData => {
  const created = p.created_at || p.createdAt;
  return {
    id: String(p.id),
    invoiceId: `INV-${String(p.id).padStart(6, '0')}`,
    amount: Number(p.amount || 0),
    totalAmount: Number(p.amount || 0),
    currency: p.currency || 'USD',
    // InvoiceList badge distinguishes paid/pending; a settled payment is a paid invoice.
    status: p.status === 'succeeded' ? 'paid' : (p.status || 'pending'),
    bookingId: p.booking_id != null ? String(p.booking_id) : undefined,
    provider: p.provider,
    lawyerName: p.lawyer?.name,
    // InvoiceList formats `inv.date` with date-fns — always provide a valid Date.
    date: created ? new Date(created) : new Date(),
    createdAt: created,
  };
};

// Invoices are generated from settled payments server-side; nothing to create client-side.
export const createInvoice = async (paymentData: any): Promise<InvoiceData> => toInvoice(paymentData || {});

export const getUserInvoices = async (_userId?: string): Promise<InvoiceData[]> => {
  const res = await paymentApi.list({ limit: 100 });
  const items = res?.data?.data?.items || res?.data?.data || [];
  return items.map(toInvoice);
};

export const getInvoiceById = async (invoiceId: string): Promise<InvoiceData | null> => {
  const id = invoiceId.replace(/^INV-/, '').replace(/^0+/, '');
  const list = await getUserInvoices();
  return list.find((i) => i.id === id || i.invoiceId === invoiceId) || null;
};
