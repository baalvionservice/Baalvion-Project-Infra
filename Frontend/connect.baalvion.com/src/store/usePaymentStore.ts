
import { create } from 'zustand';
import { Payment, PaymentMethod } from '@/types/payment';
import { paymentsApi } from '@/lib/api/payments';
import { useNotificationStore } from './useNotificationStore';

interface PaymentState {
  payments: Payment[];
  loading: boolean;
  selectedPayment: Payment | null;
  
  // Actions
  fetchPayments: () => Promise<void>;
  createPayment: (proposalId: string, amount: number, companyName: string) => Promise<Payment | null>;
  processPayment: (id: string, method: PaymentMethod) => Promise<void>;
  releasePayment: (id: string) => Promise<void>;
  getPaymentByProposal: (proposalId: string) => Payment | undefined;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],
  loading: false,
  selectedPayment: null,

  fetchPayments: async () => {
    set({ loading: true });
    try {
      const res = await paymentsApi.getPayments();
      if (res.success) set({ payments: res.data });
    } finally {
      set({ loading: false });
    }
  },

  createPayment: async (proposalId, amount, companyName) => {
    const res = await paymentsApi.createPayment(proposalId, amount, companyName);
    if (res.success) {
      set(state => ({ payments: [res.data, ...state.payments] }));
      return res.data;
    }
    return null;
  },

  processPayment: async (id, method) => {
    set({ loading: true });
    try {
      // 1. Pay
      const payRes = await paymentsApi.payNow(id, method);
      if (payRes.success) {
        set(state => ({ payments: state.payments.map(p => p.id === id ? payRes.data : p) }));
        
        // 2. Move to Escrow (Simulated delay)
        setTimeout(async () => {
          const escrowRes = await paymentsApi.moveToEscrow(id);
          if (escrowRes.success) {
            set(state => ({ payments: state.payments.map(p => p.id === id ? escrowRes.data : p) }));
            useNotificationStore.getState().triggerEvent('payment.completed', escrowRes.data);
          }
        }, 2000);
      }
    } finally {
      set({ loading: false });
    }
  },

  releasePayment: async (id) => {
    const res = await paymentsApi.releasePayment(id);
    if (res.success) {
      set(state => ({ payments: state.payments.map(p => p.id === id ? res.data : p) }));
      useNotificationStore.getState().triggerEvent('escrow.released', res.data);
    }
  },

  getPaymentByProposal: (proposalId) => {
    return get().payments.find(p => p.proposalId === proposalId);
  }
}));
