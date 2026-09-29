
import api from './axios';
import { Payment, PaymentMethod } from '@/types/payment';
import { ApiResponse } from '@/types/crm';

export const paymentsApi = {
  getPayments: async (): Promise<ApiResponse<Payment[]>> => {
    const { data } = await api.get('/payments');
    return data;
  },

  getPayment: async (id: string): Promise<ApiResponse<Payment>> => {
    const { data } = await api.get(`/payments?id=${id}`);
    return data;
  },

  createPayment: async (proposalId: string, amount: number, companyName: string): Promise<ApiResponse<Payment>> => {
    const { data } = await api.post('/payments/create', { proposalId, amount, companyName });
    return data;
  },

  payNow: async (id: string, method: PaymentMethod): Promise<ApiResponse<Payment>> => {
    const { data } = await api.post(`/payments/${id}/pay`, { method });
    return data;
  },

  moveToEscrow: async (id: string): Promise<ApiResponse<Payment>> => {
    const { data } = await api.post(`/payments/${id}/escrow`);
    return data;
  },

  releasePayment: async (id: string): Promise<ApiResponse<Payment>> => {
    const { data } = await api.post(`/payments/${id}/release`);
    return data;
  }
};
