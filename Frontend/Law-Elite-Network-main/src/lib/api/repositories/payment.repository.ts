
"use client";

import { apiClient } from '@/lib/api/client';

export class PaymentRepository {
  constructor() {}

  async create(data: any) {
    try {
      const res = await apiClient.post('/payments', data);
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }

  async update(paymentId: string, data: any) {
    try {
      await apiClient.patch(`/payments/${paymentId}`, data);
    } catch {
      // no-op
    }
  }

  async getById(paymentId: string) {
    try {
      const res = await apiClient.get(`/payments/${paymentId}`);
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }
}
