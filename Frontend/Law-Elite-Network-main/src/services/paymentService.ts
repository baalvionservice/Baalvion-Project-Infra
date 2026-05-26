/**
 * @fileOverview PaymentService
 * Primary service layer for processing financial transactions and consultation fees.
 */

import { savePaymentMock } from "@/lib/mock/paymentMock";
import { Payment } from "@/types/payment";

/**
 * Processes a consultation payment through the mock secure gateway.
 */
export const processPayment = async (paymentData: Omit<Payment, "status" | "createdAt">): Promise<Payment> => {
  // Simulate payment gateway processing latency
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const payment: Payment = {
    ...paymentData,
    status: "success",
    createdAt: Date.now(),
  };

  savePaymentMock(payment);

  return payment;
};
