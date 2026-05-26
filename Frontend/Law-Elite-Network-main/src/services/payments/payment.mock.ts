/**
 * @fileOverview Mock Payment Gateway Implementation
 * Simulates enterprise-grade financial verification protocols and ensures reactive persistence.
 */

export interface PaymentData {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  method: string;
  status: 'paid' | 'pending' | 'failed';
  createdAt: number;
}

const STORAGE_KEY = 'law_elite_transactions_ledger';

export const mockCreatePayment = async (data: any): Promise<PaymentData> => {
  // Simulate payment gateway processing latency
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const newPayment: PaymentData = {
    id: `PAY_${Date.now()}`,
    bookingId: data.bookingId,
    userId: data.userId,
    amount: data.amount || 5000,
    currency: 'INR',
    method: data.method || 'upi',
    status: 'paid',
    createdAt: Date.now(),
  };

  // 1. Persist transaction
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newPayment, ...existing]));

  // 2. Update Booking Status in primary ledger
  const bookings = JSON.parse(localStorage.getItem('law_elite_bookings') || '[]');
  const updatedBookings = bookings.map((b: any) => 
    b.id === data.bookingId ? { ...b, status: 'confirmed' } : b
  );
  localStorage.setItem('law_elite_bookings', JSON.stringify(updatedBookings));

  // 3. Update Appointment Status if exists
  const appts = JSON.parse(localStorage.getItem('law_elite_appointments') || '[]');
  const updatedAppts = appts.map((a: any) => 
    (a.id === data.bookingId || a.appointmentId === data.bookingId) ? { ...a, status: 'confirmed' } : a
  );
  localStorage.setItem('law_elite_appointments', JSON.stringify(updatedAppts));

  // 4. Trigger generic storage event for UI reactivity
  window.dispatchEvent(new Event('storage'));

  return newPayment;
};

export const mockGetUserPayments = async (userId: string): Promise<PaymentData[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return all.filter((p: PaymentData) => p.userId === userId);
};

export const mockUpdatePaymentStatus = async (paymentId: string, status: 'paid' | 'pending' | 'failed'): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const updated = all.map((p: PaymentData) => 
    p.id === paymentId ? { ...p, status } : p
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('storage'));
};
