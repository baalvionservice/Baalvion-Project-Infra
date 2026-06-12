// CRM & Marketing domain types — Amarisé CRM (crm-service :3063, /api/v1).
// The service wraps list payloads inside the standard ApiResponse envelope as
// `{ items, total, page, limit, totalPages }` (NOT the commerce `{ data, pagination }`
// shape), so CRM gets its own paginated container type below.

export interface CrmListResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CrmListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  brandId?: string;
}

// ─── VIP Clients ────────────────────────────────────────────────────────────
export type VipTier = 'Silver' | 'Gold' | 'Diamond';

export interface VipClient {
  id: string;
  name: string;
  email: string;
  tier: VipTier;
  loyaltyPoints: number;
  totalSpend: number;
  lastPurchase?: string | null;
  isSubscriber: boolean;
  subscriptionPlan?: string | null;
  status: string;
  walletBalance: number;
  certificates?: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

export interface VipClientPayload {
  name: string;
  email: string;
  tier: VipTier;
  loyaltyPoints?: number;
  totalSpend?: number;
  lastPurchase?: string | null;
  isSubscriber?: boolean;
  subscriptionPlan?: string | null;
  status?: string;
  walletBalance?: number;
  certificates?: unknown[];
}

// ─── Segments ───────────────────────────────────────────────────────────────
export interface Segment {
  id: string;
  name: string;
  description?: string | null;
  userCount: number;
  avgOrderValue: number;
  tags: string[];
  predictedChurn: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SegmentPayload {
  name: string;
  description?: string | null;
  userCount?: number;
  avgOrderValue?: number;
  tags?: string[];
  predictedChurn?: number;
}

// ─── Campaigns ──────────────────────────────────────────────────────────────
export interface Campaign {
  id: string;
  title: string;
  type: string;
  status: string;
  discountValue: number;
  startDate?: string | null;
  endDate?: string | null;
  market?: string | null;
  reach: number;
  conversions: number;
  roi: number;
  predictedRoi: number;
  abTestActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CampaignPayload {
  title: string;
  type: string;
  status?: string;
  discountValue?: number;
  startDate?: string | null;
  endDate?: string | null;
  market?: string | null;
  reach?: number;
  conversions?: number;
  roi?: number;
  predictedRoi?: number;
  abTestActive?: boolean;
}

// ─── Vendors ────────────────────────────────────────────────────────────────
export interface Vendor {
  id: string;
  name: string;
  category: string;
  performance: number;
  productCount: number;
  salesTotal: number;
  status: string;
  payoutSchedule?: string | null;
  joinedDate?: string | null;
  kpis?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorPayload {
  name: string;
  category: string;
  performance?: number;
  productCount?: number;
  salesTotal?: number;
  status?: string;
  payoutSchedule?: string | null;
  joinedDate?: string | null;
  kpis?: Record<string, unknown>;
}

// ─── Affiliates ─────────────────────────────────────────────────────────────
export interface Affiliate {
  id: string;
  name: string;
  tier: string;
  referralCode: string;
  salesGenerated: number;
  commissionEarned: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AffiliatePayload {
  name: string;
  tier: string;
  referralCode: string;
  salesGenerated?: number;
  commissionEarned?: number;
  status?: string;
}

// ─── Appointments ───────────────────────────────────────────────────────────
export interface Appointment {
  id: string;
  customerName: string;
  customerEmail?: string | null;
  customerId?: string | null;
  type: string;
  date?: string | null;
  time?: string | null;
  city?: string | null;
  notes?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppointmentPayload {
  customerName: string;
  customerEmail?: string | null;
  customerId?: string | null;
  type: string;
  date?: string | null;
  time?: string | null;
  city?: string | null;
  notes?: string | null;
  status?: string;
}

// ─── Support Tickets ────────────────────────────────────────────────────────
export type SupportTicketTier = 'Silver' | 'Gold' | 'Diamond';

export interface SupportTicketMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  customerName: string;
  customerEmail?: string | null;
  customerId?: string | null;
  customerTier?: SupportTicketTier | null;
  subject: string;
  status: string;
  priority: string;
  category?: string | null;
  lastMessage?: string | null;
  messages?: SupportTicketMessage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SupportTicketPayload {
  customerName: string;
  customerEmail?: string | null;
  customerId?: string | null;
  customerTier?: SupportTicketTier | null;
  subject: string;
  status?: string;
  priority?: string;
  category?: string | null;
  lastMessage?: string | null;
  messages?: SupportTicketMessage[];
}
