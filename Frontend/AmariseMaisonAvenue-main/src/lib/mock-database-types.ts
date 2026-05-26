/**
 * @fileOverview Production-Grade NoSQL Type Definitions for AMARISÉ / BAALVION
 * Platform-agnostic schema for multi-country luxury eCommerce.
 */

export type Role = 'user' | 'vip' | 'concierge' | 'admin' | 'super_admin';
export type CountryCode = 'US' | 'UK' | 'AE' | 'IN' | 'SG';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type LockStatus = 'ACTIVE' | 'EXPIRED' | 'RELEASED';

/** 👤 User & Identity */
export interface UserDoc {
  id: string;
  email: string;
  role: Role;
  country_code: CountryCode;
  profile: {
    first_name: string;
    last_name: string;
    phone?: string;
  };
  created_at: string;
}

export interface UserSessionDoc {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  device_info: Record<string, any>;
}

/** 👜 Product & Inventory */
export interface ProductDoc {
  id: string;
  name: string;
  brand: string;
  category: string;
  base_price_usd: number;
  description: string;
  metadata: {
    ai_tags: string[];
    heritage_score: number;
  };
}

export interface ProductVariantDoc {
  id: string;
  product_id: string;
  sku: string;
  attributes: Record<string, string>;
  regional_pricing: Record<CountryCode, { amount: number; currency: string }>;
  is_vip_only: boolean;
}

export interface InventoryDoc {
  id: string;
  variant_id: string;
  country_code: CountryCode;
  quantity: number;
  warehouse_id: string;
  last_sync: string;
}

export interface InventoryLockDoc {
  id: string;
  variant_id: string;
  user_id: string;
  status: LockStatus;
  expires_at: string;
}

/** 💳 Transactions */
export interface OrderDoc {
  id: string;
  user_id: string;
  total_amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  country_code: CountryCode;
  created_at: string;
}

export interface PaymentDoc {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  gateway: 'STRIPE' | 'RAZORPAY' | 'PAYU' | 'ACH';
  status: PaymentStatus;
  idempotency_key: string;
  gateway_response: Record<string, any>;
}

/** 🤖 AI & Audit */
export interface AiLogDoc {
  id: string;
  feature: 'recommendation' | 'search' | 'pricing' | 'fraud';
  input: Record<string, any>;
  output: Record<string, any>;
  latency_ms: number;
  trace_id: string;
  timestamp: string;
}

export interface AuditLogDoc {
  id: string;
  actor_id: string; // admin_id or system
  event: string;
  resource_id: string;
  changes: {
    before: any;
    after: any;
  };
  timestamp: string;
}

/** 🌍 Global Config */
export interface CountryConfigDoc {
  id: CountryCode;
  name: string;
  default_currency: string;
  languages: string[];
  gateways: string[];
  tax_config: {
    type: 'VAT' | 'GST' | 'SALES_TAX';
    base_rate: number;
  };
}
