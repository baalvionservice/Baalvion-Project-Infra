export type PaymentProvider = 'razorpay' | 'payu' | 'stripe';
export type PaymentStatus = 'pending' | 'captured' | 'failed' | 'refunded' | 'partial_refund';
export type SubscriptionStatus = 'created' | 'active' | 'cancelled' | 'expired' | 'paused';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void' | 'overdue';

export interface Transaction {
  id: string;
  provider: PaymentProvider;
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  userId: number;
  orgId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    email: string;
    fullName: string;
  };
}

export interface Subscription {
  id: string;
  provider: PaymentProvider;
  externalId: string;
  planId: string;
  status: SubscriptionStatus;
  userId: number;
  orgId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtCycleEnd: boolean;
  trialEnd: string | null;
  createdAt: string;
  user?: {
    id: number;
    email: string;
    fullName: string;
  };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orgId: string;
  userId: number;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
}

export interface WebhookLog {
  id: string;
  provider: PaymentProvider;
  eventType: string;
  payload: Record<string, unknown>;
  status: 'received' | 'processed' | 'failed';
  errorMessage?: string;
  processedAt: string | null;
  createdAt: string;
}

export interface Refund {
  id: string;
  transactionId: string;
  provider: PaymentProvider;
  externalId: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'created' | 'processed' | 'failed';
  createdAt: string;
}
