/**
 * Global Payment System Mock Data
 * Fully typed, backend-ready structured models
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export type GatewayId = "stripe" | "paypal" | "razorpay" | "payu" | "adyen" | "checkout_com" | "square" | "authorize_net" | "verifone" | "worldpay" | "cashfree" | "easebuzz" | "klarna";

export interface Gateway {
  id: GatewayId;
  name: string;
  regions: string[];
  supportedMethods: PaymentMethodType[];
  logo: string;
  status: "active" | "degraded" | "inactive";
  processingFee: string;
  settlementDays: number;
}

export type PaymentMethodType = "card" | "wallet" | "bank_transfer" | "crypto" | "wire" | "upi";

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  gatewayId: GatewayId;
  billingAddress?: BillingAddress;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  companyName?: string;
  vatNumber?: string;
}

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "unpaid" | "canceled" | "paused" | "incomplete" | "expired" | "enterprise_contract";

export interface Subscription {
  id: string;
  customerId: string;
  planName: string;
  planType: "residential" | "mobile" | "datacenter" | "bundle";
  status: SubscriptionStatus;
  gatewayId: GatewayId;
  amount: number;
  currency: string;
  interval: "monthly" | "yearly";
  gbIncluded: number;
  gbUsed: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  canceledAt?: string;
  pausedAt?: string;
  gracePeriodEnd?: string;
  paymentMethodId: string;
  createdAt: string;
  metadata: Record<string, string>;
}

export type InvoiceStatus = "paid" | "pending" | "failed" | "refunded" | "chargeback" | "void";

export interface Invoice {
  id: string;
  customerId: string;
  subscriptionId: string;
  gateway: GatewayId;
  amount: number;
  subtotal: number;
  tax: number;
  taxRate: number;
  taxType: string;
  currency: string;
  status: InvoiceStatus;
  paidAt?: string;
  dueDate: string;
  issuedAt: string;
  lineItems: InvoiceLineItem[];
  downloadUrl: string;
  couponApplied?: string;
  discountAmount?: number;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: "subscription" | "overage" | "addon" | "credit" | "tax";
}

export type WebhookEventType =
  | "payment_intent.succeeded"
  | "payment_intent.failed"
  | "invoice.payment_failed"
  | "invoice.paid"
  | "chargeback.created"
  | "subscription.updated"
  | "subscription.canceled"
  | "refund.created";

export interface WebhookEvent {
  id: string;
  gateway: GatewayId;
  eventType: WebhookEventType;
  timestamp: string;
  status: "delivered" | "failed" | "pending" | "retrying";
  httpStatus: number;
  payload: Record<string, unknown>;
  retryCount: number;
}

export interface Chargeback {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  invoiceId: string;
  gateway: GatewayId;
  amount: number;
  currency: string;
  reason: string;
  status: "open" | "under_review" | "won" | "lost" | "evidence_submitted";
  evidenceDeadline: string;
  createdAt: string;
  riskScore: number;
}

export interface CustomerPaymentRecord {
  id: string;
  name: string;
  email: string;
  gateway: GatewayId;
  plan: string;
  mrr: number;
  currency: string;
  status: SubscriptionStatus;
  riskScore: number;
  country: string;
  chargebackCount: number;
  failedPayments: number;
  lastPayment: string;
  joinedAt: string;
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  churnRate: number;
  activeSubscriptions: number;
  failedPaymentPercent: number;
  avgRevenuePerUser: number;
  mrrByMonth: { month: string; mrr: number; arr: number }[];
  mrrByPlan: { plan: string; mrr: number; count: number }[];
  gatewayDistribution: { gateway: string; percentage: number; volume: number }[];
  churnByMonth: { month: string; churnRate: number; churned: number }[];
}

export interface EnterpriseContract {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  country: string;
  estimatedGb: number;
  useCase: string;
  paymentTerms: "net_7" | "net_30" | "net_60";
  customPricing: number;
  status: "pending" | "approved" | "active" | "expired" | "rejected";
  startDate?: string;
  endDate?: string;
  createdAt: string;
  manualInvoice: boolean;
}

export type CheckoutSimulationResult = "success" | "failure" | "3d_secure" | "insufficient_funds" | "fraud_flagged";

export interface TaxConfig {
  region: string;
  taxType: string;
  rate: number;
  reverseCharge: boolean;
}

// ============================================
// REGION-GATEWAY MAPPING
// ============================================

export const regionGatewayMap: Record<string, GatewayId> = {
  IN: "razorpay",
  US: "stripe",
  CA: "stripe",
  GB: "checkout_com",
  DE: "adyen",
  FR: "adyen",
  NL: "adyen",
  IT: "adyen",
  ES: "adyen",
  AU: "stripe",
  JP: "stripe",
  BR: "stripe",
  SG: "stripe",
  AE: "stripe",
  SE: "klarna",
};

export const taxConfigs: TaxConfig[] = [
  { region: "EU", taxType: "VAT", rate: 20, reverseCharge: true },
  { region: "GB", taxType: "VAT", rate: 20, reverseCharge: false },
  { region: "IN", taxType: "GST", rate: 18, reverseCharge: false },
  { region: "US", taxType: "None", rate: 0, reverseCharge: false },
  { region: "CA", taxType: "GST/HST", rate: 13, reverseCharge: false },
  { region: "AU", taxType: "GST", rate: 10, reverseCharge: false },
];

// ============================================
// MOCK DATA
// ============================================

export const gateways: Gateway[] = [
  { id: "stripe", name: "Stripe", regions: ["US", "CA", "AU", "JP", "SG", "BR"], supportedMethods: ["card", "wallet", "bank_transfer"], logo: "S", status: "active", processingFee: "2.9% + $0.30", settlementDays: 2 },
  { id: "paypal", name: "PayPal", regions: ["Global"], supportedMethods: ["wallet", "card"], logo: "PP", status: "active", processingFee: "3.49% + $0.49", settlementDays: 1 },
  { id: "razorpay", name: "Razorpay", regions: ["IN"], supportedMethods: ["card", "upi", "wallet", "bank_transfer"], logo: "R", status: "active", processingFee: "2% + ₹2", settlementDays: 3 },
  { id: "payu", name: "PayU", regions: ["IN", "PL", "BR"], supportedMethods: ["card", "upi", "wallet"], logo: "PU", status: "active", processingFee: "2.25%", settlementDays: 3 },
  { id: "adyen", name: "Adyen", regions: ["EU", "DE", "FR", "NL", "IT", "ES"], supportedMethods: ["card", "wallet", "bank_transfer", "wire"], logo: "A", status: "active", processingFee: "€0.11 + scheme fee", settlementDays: 2 },
  { id: "checkout_com", name: "Checkout.com", regions: ["GB", "EU"], supportedMethods: ["card", "wallet", "bank_transfer"], logo: "C", status: "active", processingFee: "2.65% + £0.20", settlementDays: 2 },
  { id: "square", name: "Square", regions: ["US"], supportedMethods: ["card", "wallet"], logo: "SQ", status: "active", processingFee: "2.6% + $0.10", settlementDays: 1 },
  { id: "authorize_net", name: "Authorize.net", regions: ["US", "CA"], supportedMethods: ["card", "bank_transfer"], logo: "AN", status: "active", processingFee: "2.9% + $0.30", settlementDays: 2 },
  { id: "verifone", name: "2Checkout / Verifone", regions: ["Global"], supportedMethods: ["card", "wallet", "wire"], logo: "2C", status: "active", processingFee: "3.5% + $0.35", settlementDays: 5 },
  { id: "worldpay", name: "Worldpay", regions: ["Global"], supportedMethods: ["card", "wallet", "bank_transfer", "wire"], logo: "WP", status: "degraded", processingFee: "2.75%", settlementDays: 3 },
  { id: "cashfree", name: "Cashfree", regions: ["IN"], supportedMethods: ["card", "upi", "wallet", "bank_transfer"], logo: "CF", status: "active", processingFee: "1.95% + ₹3", settlementDays: 2 },
  { id: "easebuzz", name: "Easebuzz", regions: ["IN"], supportedMethods: ["card", "upi", "wallet"], logo: "EB", status: "active", processingFee: "2% + ₹3", settlementDays: 3 },
  { id: "klarna", name: "Klarna", regions: ["US", "GB", "DE", "SE", "NO", "FI", "DK", "NL", "AT"], supportedMethods: ["wallet", "bank_transfer"], logo: "K", status: "active", processingFee: "3.29% + $0.30", settlementDays: 2 },
];

export const mockPaymentMethods: PaymentMethod[] = [
  { id: "pm_1", type: "card", label: "Visa ending in 4242", last4: "4242", brand: "Visa", expiryMonth: 12, expiryYear: 2027, isDefault: true, gatewayId: "stripe" },
  { id: "pm_2", type: "card", label: "Mastercard ending in 5555", last4: "5555", brand: "Mastercard", expiryMonth: 8, expiryYear: 2026, isDefault: false, gatewayId: "stripe" },
  { id: "pm_3", type: "wallet", label: "PayPal - john@company.com", isDefault: false, gatewayId: "paypal" },
  { id: "pm_4", type: "bank_transfer", label: "Chase Bank ****6789", last4: "6789", isDefault: false, gatewayId: "stripe" },
];

export const mockSubscription: Subscription = {
  id: "sub_8x9k2mN",
  customerId: "cus_1",
  planName: "Professional",
  planType: "residential",
  status: "active",
  gatewayId: "stripe",
  amount: 149,
  currency: "USD",
  interval: "monthly",
  gbIncluded: 250,
  gbUsed: 187,
  currentPeriodStart: "2026-02-01",
  currentPeriodEnd: "2026-03-01",
  paymentMethodId: "pm_1",
  createdAt: "2025-06-15",
  metadata: { proxyType: "residential", region: "US" },
};

export const mockInvoices: Invoice[] = [
  {
    id: "INV-2026-007", customerId: "cus_1", subscriptionId: "sub_8x9k2mN", gateway: "stripe",
    amount: 178.20, subtotal: 149.00, tax: 29.20, taxRate: 0, taxType: "None", currency: "USD",
    status: "paid", paidAt: "2026-02-01T10:00:00Z", dueDate: "2026-02-15", issuedAt: "2026-02-01",
    lineItems: [
      { description: "Professional Plan — Residential 250GB", quantity: 1, unitPrice: 149.00, amount: 149.00, type: "subscription" },
      { description: "Overage: 12 GB @ $2.40/GB", quantity: 12, unitPrice: 2.40, amount: 28.80, type: "overage" },
      { description: "Dedicated IP Add-on", quantity: 1, unitPrice: 15.00, amount: 15.00, type: "addon" },
      { description: "Coupon: SAVE15", quantity: 1, unitPrice: -14.60, amount: -14.60, type: "credit" },
    ],
    downloadUrl: "#", couponApplied: "SAVE15", discountAmount: 14.60,
  },
  {
    id: "INV-2026-006", customerId: "cus_1", subscriptionId: "sub_8x9k2mN", gateway: "stripe",
    amount: 149.00, subtotal: 149.00, tax: 0, taxRate: 0, taxType: "None", currency: "USD",
    status: "paid", paidAt: "2026-01-01T10:00:00Z", dueDate: "2026-01-15", issuedAt: "2026-01-01",
    lineItems: [{ description: "Professional Plan — Residential 250GB", quantity: 1, unitPrice: 149.00, amount: 149.00, type: "subscription" }],
    downloadUrl: "#",
  },
  {
    id: "INV-2026-005", customerId: "cus_1", subscriptionId: "sub_8x9k2mN", gateway: "stripe",
    amount: 149.00, subtotal: 149.00, tax: 0, taxRate: 0, taxType: "None", currency: "USD",
    status: "paid", paidAt: "2025-12-01T10:00:00Z", dueDate: "2025-12-15", issuedAt: "2025-12-01",
    lineItems: [{ description: "Professional Plan — Residential 250GB", quantity: 1, unitPrice: 149.00, amount: 149.00, type: "subscription" }],
    downloadUrl: "#",
  },
  {
    id: "INV-2026-004", customerId: "cus_1", subscriptionId: "sub_8x9k2mN", gateway: "stripe",
    amount: 149.00, subtotal: 149.00, tax: 0, taxRate: 0, taxType: "None", currency: "USD",
    status: "refunded", paidAt: "2025-11-01T10:00:00Z", dueDate: "2025-11-15", issuedAt: "2025-11-01",
    lineItems: [{ description: "Professional Plan — Residential 250GB", quantity: 1, unitPrice: 149.00, amount: 149.00, type: "subscription" }],
    downloadUrl: "#",
  },
  {
    id: "INV-2026-003", customerId: "cus_1", subscriptionId: "sub_8x9k2mN", gateway: "stripe",
    amount: 149.00, subtotal: 149.00, tax: 0, taxRate: 0, taxType: "None", currency: "USD",
    status: "paid", paidAt: "2025-10-01T10:00:00Z", dueDate: "2025-10-15", issuedAt: "2025-10-01",
    lineItems: [{ description: "Professional Plan — Residential 250GB", quantity: 1, unitPrice: 149.00, amount: 149.00, type: "subscription" }],
    downloadUrl: "#",
  },
];

export const mockWebhookEvents: WebhookEvent[] = [
  { id: "evt_1a", gateway: "stripe", eventType: "payment_intent.succeeded", timestamp: "2026-02-18T09:12:00Z", status: "delivered", httpStatus: 200, retryCount: 0, payload: { paymentIntentId: "pi_3x9k", amount: 14900, currency: "usd", customerId: "cus_1" } },
  { id: "evt_2b", gateway: "stripe", eventType: "invoice.paid", timestamp: "2026-02-18T09:12:02Z", status: "delivered", httpStatus: 200, retryCount: 0, payload: { invoiceId: "INV-2026-007", amount: 17820 } },
  { id: "evt_3c", gateway: "razorpay", eventType: "payment_intent.failed", timestamp: "2026-02-17T14:30:00Z", status: "delivered", httpStatus: 200, retryCount: 0, payload: { orderId: "order_xyz", reason: "insufficient_funds" } },
  { id: "evt_4d", gateway: "adyen", eventType: "chargeback.created", timestamp: "2026-02-16T11:00:00Z", status: "delivered", httpStatus: 200, retryCount: 0, payload: { chargebackId: "cb_1", amount: 29900, reason: "fraudulent" } },
  { id: "evt_5e", gateway: "stripe", eventType: "subscription.updated", timestamp: "2026-02-15T08:00:00Z", status: "failed", httpStatus: 500, retryCount: 3, payload: { subscriptionId: "sub_8x9k2mN", previousPlan: "Starter", newPlan: "Professional" } },
  { id: "evt_6f", gateway: "checkout_com", eventType: "payment_intent.succeeded", timestamp: "2026-02-14T16:45:00Z", status: "delivered", httpStatus: 200, retryCount: 0, payload: { paymentId: "pay_abc", amount: 29900 } },
  { id: "evt_7g", gateway: "paypal", eventType: "refund.created", timestamp: "2026-02-13T10:20:00Z", status: "delivered", httpStatus: 200, retryCount: 0, payload: { refundId: "ref_xyz", amount: 14900 } },
  { id: "evt_8h", gateway: "stripe", eventType: "invoice.payment_failed", timestamp: "2026-02-12T22:00:00Z", status: "retrying", httpStatus: 0, retryCount: 2, payload: { invoiceId: "INV-pending", reason: "card_declined" } },
];

export const mockChargebacks: Chargeback[] = [
  { id: "cb_1", customerId: "cus_4", customerName: "Emily Davis", customerEmail: "emily@corp.net", invoiceId: "INV-2026-004", gateway: "stripe", amount: 299, currency: "USD", reason: "Fraudulent charge", status: "under_review", evidenceDeadline: "2026-03-01", createdAt: "2026-02-16", riskScore: 82 },
  { id: "cb_2", customerId: "cus_7", customerName: "Carlos Rivera", customerEmail: "carlos@data.mx", invoiceId: "INV-ext-002", gateway: "adyen", amount: 149, currency: "EUR", reason: "Product not received", status: "evidence_submitted", evidenceDeadline: "2026-02-25", createdAt: "2026-02-10", riskScore: 45 },
  { id: "cb_3", customerId: "cus_9", customerName: "Wei Zhang", customerEmail: "wei@tech.cn", invoiceId: "INV-ext-003", gateway: "stripe", amount: 499, currency: "USD", reason: "Unauthorized transaction", status: "won", evidenceDeadline: "2026-01-20", createdAt: "2026-01-05", riskScore: 91 },
  { id: "cb_4", customerId: "cus_12", customerName: "Priya Sharma", customerEmail: "priya@startup.in", invoiceId: "INV-ext-004", gateway: "razorpay", amount: 49, currency: "USD", reason: "Duplicate charge", status: "lost", evidenceDeadline: "2026-01-15", createdAt: "2026-01-02", riskScore: 22 },
];

export const mockCustomerPayments: CustomerPaymentRecord[] = [
  { id: "cus_1", name: "John Smith", email: "john@company.com", gateway: "stripe", plan: "Enterprise", mrr: 299, currency: "USD", status: "active", riskScore: 12, country: "US", chargebackCount: 0, failedPayments: 0, lastPayment: "2026-02-01", joinedAt: "2024-01-15" },
  { id: "cus_2", name: "Sarah Johnson", email: "sarah@agency.com", gateway: "stripe", plan: "Professional", mrr: 149, currency: "USD", status: "active", riskScore: 8, country: "US", chargebackCount: 0, failedPayments: 0, lastPayment: "2026-02-01", joinedAt: "2024-02-20" },
  { id: "cus_3", name: "Mike Chen", email: "mike@startup.io", gateway: "stripe", plan: "Starter", mrr: 49, currency: "USD", status: "active", riskScore: 5, country: "CA", chargebackCount: 0, failedPayments: 1, lastPayment: "2026-01-28", joinedAt: "2024-03-01" },
  { id: "cus_4", name: "Emily Davis", email: "emily@corp.net", gateway: "stripe", plan: "Enterprise", mrr: 299, currency: "USD", status: "past_due", riskScore: 82, country: "US", chargebackCount: 1, failedPayments: 3, lastPayment: "2025-12-15", joinedAt: "2023-11-10" },
  { id: "cus_5", name: "Hans Mueller", email: "hans@gmbh.de", gateway: "adyen", plan: "Enterprise", mrr: 299, currency: "EUR", status: "active", riskScore: 10, country: "DE", chargebackCount: 0, failedPayments: 0, lastPayment: "2026-02-01", joinedAt: "2024-06-01" },
  { id: "cus_6", name: "Kenji Tanaka", email: "kenji@corp.jp", gateway: "stripe", plan: "Professional", mrr: 149, currency: "USD", status: "active", riskScore: 3, country: "JP", chargebackCount: 0, failedPayments: 0, lastPayment: "2026-02-01", joinedAt: "2024-08-10" },
  { id: "cus_7", name: "Carlos Rivera", email: "carlos@data.mx", gateway: "adyen", plan: "Professional", mrr: 149, currency: "EUR", status: "active", riskScore: 45, country: "FR", chargebackCount: 1, failedPayments: 2, lastPayment: "2026-01-15", joinedAt: "2024-04-20" },
  { id: "cus_8", name: "Priya Sharma", email: "priya@startup.in", gateway: "razorpay", plan: "Starter", mrr: 49, currency: "USD", status: "trialing", riskScore: 0, country: "IN", chargebackCount: 0, failedPayments: 0, lastPayment: "—", joinedAt: "2026-02-10" },
  { id: "cus_9", name: "Wei Zhang", email: "wei@tech.cn", gateway: "stripe", plan: "Enterprise", mrr: 499, currency: "USD", status: "canceled", riskScore: 91, country: "US", chargebackCount: 1, failedPayments: 5, lastPayment: "2026-01-01", joinedAt: "2023-09-15" },
  { id: "cus_10", name: "Olivia Brown", email: "olivia@ecom.co.uk", gateway: "checkout_com", plan: "Professional", mrr: 149, currency: "GBP", status: "active", riskScore: 7, country: "GB", chargebackCount: 0, failedPayments: 0, lastPayment: "2026-02-01", joinedAt: "2024-11-05" },
];

export const mockRevenueMetrics: RevenueMetrics = {
  mrr: 47892,
  arr: 574704,
  churnRate: 3.2,
  activeSubscriptions: 2654,
  failedPaymentPercent: 2.8,
  avgRevenuePerUser: 18.04,
  mrrByMonth: [
    { month: "Sep", mrr: 38200, arr: 458400 }, { month: "Oct", mrr: 40100, arr: 481200 },
    { month: "Nov", mrr: 42500, arr: 510000 }, { month: "Dec", mrr: 44100, arr: 529200 },
    { month: "Jan", mrr: 46200, arr: 554400 }, { month: "Feb", mrr: 47892, arr: 574704 },
  ],
  mrrByPlan: [
    { plan: "Starter", mrr: 8920, count: 182 },
    { plan: "Professional", mrr: 18610, count: 125 },
    { plan: "Enterprise", mrr: 15870, count: 53 },
    { plan: "Custom", mrr: 4492, count: 8 },
  ],
  gatewayDistribution: [
    { gateway: "Stripe", percentage: 52, volume: 24904 },
    { gateway: "Adyen", percentage: 18, volume: 8621 },
    { gateway: "Checkout.com", percentage: 12, volume: 5747 },
    { gateway: "Razorpay", percentage: 8, volume: 3831 },
    { gateway: "PayPal", percentage: 6, volume: 2874 },
    { gateway: "Other", percentage: 4, volume: 1915 },
  ],
  churnByMonth: [
    { month: "Sep", churnRate: 4.1, churned: 42 }, { month: "Oct", churnRate: 3.8, churned: 38 },
    { month: "Nov", churnRate: 3.5, churned: 35 }, { month: "Dec", churnRate: 3.9, churned: 39 },
    { month: "Jan", churnRate: 3.4, churned: 34 }, { month: "Feb", churnRate: 3.2, churned: 32 },
  ],
};

export const mockEnterpriseContracts: EnterpriseContract[] = [
  { id: "ec_1", companyName: "Global Retail Corp", contactName: "James Wilson", contactEmail: "james@globalretail.com", country: "US", estimatedGb: 5000, useCase: "Price monitoring across 50+ e-commerce sites", paymentTerms: "net_30", customPricing: 1499, status: "active", startDate: "2025-06-01", endDate: "2026-05-31", createdAt: "2025-05-15", manualInvoice: true },
  { id: "ec_2", companyName: "DataInsight GmbH", contactName: "Anna Becker", contactEmail: "anna@datainsight.de", country: "DE", estimatedGb: 2000, useCase: "Market research & competitive intelligence", paymentTerms: "net_30", customPricing: 899, status: "active", startDate: "2025-09-01", endDate: "2026-08-31", createdAt: "2025-08-20", manualInvoice: false },
  { id: "ec_3", companyName: "TechStart Inc", contactName: "Lisa Park", contactEmail: "lisa@techstart.io", country: "US", estimatedGb: 10000, useCase: "AI training data collection", paymentTerms: "net_60", customPricing: 2999, status: "pending", createdAt: "2026-02-10", manualInvoice: true },
];

// ============================================
// CHECKOUT PLAN OPTIONS
// ============================================

export const checkoutPlans = [
  { id: "res_starter", name: "Residential Starter", type: "residential" as const, baseGb: 25, pricePerGb: 3.50, basePrice: 49, features: ["5 Countries", "HTTP/HTTPS", "Email Support"] },
  { id: "res_pro", name: "Residential Pro", type: "residential" as const, baseGb: 100, pricePerGb: 2.80, basePrice: 149, features: ["50+ Countries", "SOCKS5", "Priority Support", "Sub-users"] },
  { id: "res_enterprise", name: "Residential Enterprise", type: "residential" as const, baseGb: 500, pricePerGb: 2.00, basePrice: 499, features: ["195 Countries", "Dedicated IPs", "24/7 Support", "API Access"] },
  { id: "mob_starter", name: "Mobile Starter", type: "mobile" as const, baseGb: 10, pricePerGb: 8.00, basePrice: 79, features: ["Real 4G/5G", "10 Countries", "Rotating Sessions"] },
  { id: "mob_pro", name: "Mobile Pro", type: "mobile" as const, baseGb: 50, pricePerGb: 6.00, basePrice: 249, features: ["50+ Countries", "Sticky Sessions", "ASN Targeting"] },
  { id: "dc_starter", name: "Datacenter Starter", type: "datacenter" as const, baseGb: 100, pricePerGb: 0.80, basePrice: 29, features: ["US/EU Locations", "High Speed", "Basic Support"] },
  { id: "dc_pro", name: "Datacenter Pro", type: "datacenter" as const, baseGb: 500, pricePerGb: 0.50, basePrice: 99, features: ["Global Locations", "Dedicated IPs", "Priority Support"] },
];

export const regionOptions = [
  { code: "US", name: "United States", defaultGateway: "stripe" as GatewayId, currency: "USD" },
  { code: "CA", name: "Canada", defaultGateway: "stripe" as GatewayId, currency: "CAD" },
  { code: "GB", name: "United Kingdom", defaultGateway: "checkout_com" as GatewayId, currency: "GBP" },
  { code: "DE", name: "Germany", defaultGateway: "adyen" as GatewayId, currency: "EUR" },
  { code: "FR", name: "France", defaultGateway: "adyen" as GatewayId, currency: "EUR" },
  { code: "IN", name: "India", defaultGateway: "razorpay" as GatewayId, currency: "INR" },
  { code: "AU", name: "Australia", defaultGateway: "stripe" as GatewayId, currency: "AUD" },
  { code: "JP", name: "Japan", defaultGateway: "stripe" as GatewayId, currency: "JPY" },
  { code: "SG", name: "Singapore", defaultGateway: "stripe" as GatewayId, currency: "SGD" },
  { code: "AE", name: "UAE", defaultGateway: "stripe" as GatewayId, currency: "AED" },
  { code: "SE", name: "Sweden", defaultGateway: "klarna" as GatewayId, currency: "SEK" },
  { code: "NL", name: "Netherlands", defaultGateway: "adyen" as GatewayId, currency: "EUR" },
];
