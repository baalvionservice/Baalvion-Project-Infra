
export type PaymentStatus = "pending" | "paid" | "escrow" | "released" | "refunded";
export type PaymentMethod = "card" | "upi" | "netbanking";

export interface Payment {
  id: string;
  proposalId: string;
  dealId: string;
  companyName: string;
  amount: number;
  status: PaymentStatus;
  method?: PaymentMethod;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Escrow {
  id: string;
  paymentId: string;
  amount: number;
  status: "holding" | "released";
  releaseDate?: string;
}
