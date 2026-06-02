export type IntegrationCategory = 'api' | 'payment' | 'sms' | 'ai' | 'webhook' | 'other';

export interface Integration {
  id: string;
  websiteId: string;
  provider: string;
  category: IntegrationCategory;
  label: string;
  config: Record<string, string>;
  secretHints: Record<string, string | null>;
  enabled: boolean;
  status: 'configured' | 'unconfigured' | 'error';
  lastTestedAt: string | null;
  lastTestOk: boolean | null;
  lastTestMessage: string | null;
  updatedAt: string;
}

export interface UpsertIntegrationPayload {
  category: IntegrationCategory;
  label?: string;
  config?: Record<string, string>;
  /** Plaintext secrets to store (encrypted server-side). Omit a field to keep the existing value. */
  secrets?: Record<string, string>;
  enabled?: boolean;
}

export interface IntegrationTestResult {
  ok: boolean;
  message: string;
}

export interface WebsiteIntegrationSummary {
  websiteId: string;
  name: string;
  slug: string;
  total: number;
  configured: number;
  hasPayment: boolean;
  hasApi: boolean;
}

// ── Provider catalog: drives which fields the console renders per integration ──
export interface ProviderField {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'select';
  options?: string[];
}

export interface ProviderDef {
  provider: string;
  category: IntegrationCategory;
  label: string;
  description: string;
  /** Non-secret config fields (stored in clear). */
  fields: ProviderField[];
  /** Secret fields (encrypted at rest, shown masked). */
  secretFields: ProviderField[];
}

export const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  api: 'Backend API',
  payment: 'Payments',
  sms: 'SMS / Messaging',
  ai: 'AI',
  webhook: 'Webhooks',
  other: 'Other',
};

export const PROVIDER_CATALOG: ProviderDef[] = [
  {
    provider: 'backend_api',
    category: 'api',
    label: 'Backend API',
    description: "This website's own backend service the platform connects to.",
    fields: [
      { key: 'baseUrl', label: 'Base URL', placeholder: 'http://localhost:3003' },
      { key: 'healthPath', label: 'Health path', placeholder: '/health' },
    ],
    secretFields: [{ key: 'apiKey', label: 'API Key', placeholder: 'service API key (optional)' }],
  },
  {
    provider: 'razorpay',
    category: 'payment',
    label: 'Razorpay',
    description: 'Razorpay payment gateway (cards / UPI / netbanking).',
    fields: [{ key: 'mode', label: 'Mode', type: 'select', options: ['test', 'live'] }],
    secretFields: [
      { key: 'keyId', label: 'Key ID', placeholder: 'rzp_test_…' },
      { key: 'keySecret', label: 'Key Secret', placeholder: 'secret' },
    ],
  },
  {
    provider: 'stripe',
    category: 'payment',
    label: 'Stripe',
    description: 'Stripe payments.',
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_…' },
      { key: 'mode', label: 'Mode', type: 'select', options: ['test', 'live'] },
    ],
    secretFields: [
      { key: 'secretKey', label: 'Secret Key', placeholder: 'sk_…' },
      { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'whsec_… (optional)' },
    ],
  },
  {
    provider: 'payu',
    category: 'payment',
    label: 'PayU',
    description: 'PayU payment gateway.',
    fields: [{ key: 'mode', label: 'Mode', type: 'select', options: ['test', 'live'] }],
    secretFields: [
      { key: 'merchantKey', label: 'Merchant Key' },
      { key: 'merchantSalt', label: 'Merchant Salt' },
    ],
  },
  {
    provider: 'twilio',
    category: 'sms',
    label: 'Twilio SMS',
    description: 'Transactional SMS via Twilio.',
    fields: [{ key: 'fromNumber', label: 'From number', placeholder: '+1…' }],
    secretFields: [
      { key: 'accountSid', label: 'Account SID', placeholder: 'AC…' },
      { key: 'authToken', label: 'Auth Token' },
    ],
  },
  {
    provider: 'gemini',
    category: 'ai',
    label: 'Google Gemini',
    description: 'AI features (content generation, assistants).',
    fields: [{ key: 'model', label: 'Model', placeholder: 'gemini-1.5-pro' }],
    secretFields: [{ key: 'apiKey', label: 'API Key' }],
  },
];
