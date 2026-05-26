/**
 * @fileOverview Payment Mock Storage.
 * Simulates persistence for financial transactions within the elite network.
 */

import { Payment } from "@/types/payment";

const STORAGE_KEY = "law_elite_payments";

export const getPaymentsMock = (): Payment[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const savePaymentMock = (payment: Payment) => {
  if (typeof window === 'undefined') return;
  const existing = getPaymentsMock();
  const updated = [...existing, payment];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
