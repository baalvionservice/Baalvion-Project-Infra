
import api from './axios';
import { PricingPlan, Subscription, Invoice, PlanTier } from '@/types/billing';
import { ApiResponse } from '@/types/crm';

export const billingApi = {
  getPlans: async (): Promise<ApiResponse<PricingPlan[]>> => {
    const { data } = await api.get('/billing/plans');
    return data;
  },

  subscribe: async (plan: PlanTier): Promise<ApiResponse<Subscription>> => {
    const { data } = await api.post('/billing/subscribe', { plan });
    return data;
  },

  getSubscription: async (): Promise<ApiResponse<Subscription>> => {
    const { data } = await api.get('/billing/subscription');
    return data;
  },

  cancelSubscription: async (): Promise<ApiResponse<Subscription>> => {
    const { data } = await api.post('/billing/cancel');
    return data;
  },

  getInvoices: async (): Promise<ApiResponse<Invoice[]>> => {
    const { data } = await api.get('/billing/invoices');
    return data;
  }
};
