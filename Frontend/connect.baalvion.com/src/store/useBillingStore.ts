
import { create } from 'zustand';
import { PricingPlan, Subscription, Invoice, PlanTier } from '@/types/billing';
import { billingApi } from '@/lib/api/billing';

interface BillingState {
  plans: PricingPlan[];
  subscription: Subscription | null;
  invoices: Invoice[];
  loading: boolean;
  
  // Actions
  fetchPlans: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  subscribe: (plan: PlanTier) => Promise<void>;
  cancel: () => Promise<void>;
}

export const useBillingStore = create<BillingState>((set, get) => ({
  plans: [],
  subscription: null,
  invoices: [],
  loading: false,

  fetchPlans: async () => {
    set({ loading: true });
    try {
      const res = await billingApi.getPlans();
      if (res.success) set({ plans: res.data });
    } finally {
      set({ loading: false });
    }
  },

  fetchSubscription: async () => {
    set({ loading: true });
    try {
      const res = await billingApi.getSubscription();
      if (res.success) set({ subscription: res.data });
    } finally {
      set({ loading: false });
    }
  },

  fetchInvoices: async () => {
    const res = await billingApi.getInvoices();
    if (res.success) set({ invoices: res.data });
  },

  subscribe: async (plan) => {
    set({ loading: true });
    try {
      const res = await billingApi.subscribe(plan);
      if (res.success) {
        set({ subscription: res.data });
        await get().fetchInvoices();
      }
    } finally {
      set({ loading: false });
    }
  },

  cancel: async () => {
    set({ loading: true });
    try {
      const res = await billingApi.cancelSubscription();
      if (res.success) set({ subscription: res.data });
    } finally {
      set({ loading: false });
    }
  }
}));
