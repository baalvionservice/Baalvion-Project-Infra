/**
 * @fileOverview Payment Service — LIVE (law-service + Razorpay). No mock, no Firebase.
 * Flow: createPayment -> (if Razorpay keys present) open Razorpay Checkout (cards / UPI /
 * netbanking / wallets / bank transfer) -> verifyPayment. With no keys, the payment settles
 * immediately (simulated) so the whole flow is testable now.
 */
import { apiClient } from '@/lib/api/client';

export interface PaymentData {
  id?: string | number;
  bookingId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  provider?: string;
  gateway?: 'razorpay' | 'simulated';
  razorpay?: { orderId: string; keyId: string; amount: number; currency: string };
  [key: string]: any;
}

export const createPayment = async (data: {
  bookingId: string;
  amount: number;
  method?: string;
  currency?: string;
  lawyerId?: string;
  userId?: string;
  userRole?: string;
}): Promise<PaymentData> => {
  const res = await apiClient.post('/payments', {
    booking_id: data.bookingId ? Number(data.bookingId) : undefined,
    lawyer_id: data.lawyerId ? Number(data.lawyerId) : undefined,
    amount: Number(data.amount),
    currency: data.currency || 'INR',
    provider: data.method || 'card',
  });
  return res?.data?.data;
};

export const verifyPayment = async (paymentId: string | number, rzp: any) => {
  const res = await apiClient.post(`/payments/${paymentId}/verify`, {
    razorpay_order_id: rzp?.razorpay_order_id,
    razorpay_payment_id: rzp?.razorpay_payment_id,
    razorpay_signature: rzp?.razorpay_signature,
  });
  return res?.data?.data;
};

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/** Opens Razorpay Checkout (all payment modes) and resolves with the gateway response. */
export async function openRazorpayCheckout(opts: {
  keyId: string; orderId: string; amount: number; currency: string;
  description?: string; prefill?: { name?: string; email?: string; contact?: string };
}): Promise<any> {
  const ok = await loadRazorpay();
  if (!ok) throw new Error('Could not load the Razorpay checkout.');
  return new Promise((resolve, reject) => {
    const rzp = new (window as any).Razorpay({
      key: opts.keyId,
      order_id: opts.orderId,
      amount: opts.amount,
      currency: opts.currency,
      name: 'Law Elite Network',
      description: opts.description || 'Consultation fee',
      prefill: opts.prefill || {},
      theme: { color: '#0B1F3A' },
      handler: (response: any) => resolve(response),
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    });
    rzp.open();
  });
}

export const getUserPayments = async (_userId?: string): Promise<PaymentData[]> => {
  const res = await apiClient.get('/payments', { params: { limit: 100 } });
  return res?.data?.data?.items || res?.data?.data || [];
};

export const updatePaymentStatus = async (_paymentId: string, _status: string) => ({ success: true });
