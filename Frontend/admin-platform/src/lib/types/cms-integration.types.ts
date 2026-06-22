export type IntegrationCategory = 'api' | 'payment' | 'sms' | 'ai' | 'webhook' | 'oauth' | 'other';

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
  /**
   * When set, this provider card is only shown for websites whose slug is listed
   * (used to scope social login to specific sites). Omit = available to every website.
   */
  websiteSlugs?: string[];
}

export const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  api: 'Backend API',
  payment: 'Payments',
  sms: 'SMS / Messaging',
  ai: 'AI',
  webhook: 'Webhooks',
  oauth: 'Social Login',
  other: 'Other',
};

// Sites allowed to use social login (Google / GitHub). Keyed by CMS website slug.
// Scoped deliberately — these cards only appear on these two websites' integration pages.
export const OAUTH_WEBSITE_SLUGS = ['amarise-maison-avenue', 'proxy-baalvionstack'];

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
      { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'whsec_… (dashboard webhook)' },
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
    provider: 'cashfree',
    category: 'payment',
    label: 'Cashfree',
    description: 'Cashfree Payments (PG) — cards / UPI / netbanking.',
    fields: [
      { key: 'mode', label: 'Mode', type: 'select', options: ['test', 'live'] },
      { key: 'baseUrl', label: 'Base URL', placeholder: 'sandbox.cashfree.com (test) / api.cashfree.com (live)' },
    ],
    secretFields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'x-client-id' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: 'x-client-secret (also the webhook secret)' },
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
  {
    provider: 'google-oauth',
    category: 'oauth',
    label: 'Google Sign-In',
    description: '"Continue with Google" on this site\'s login page.',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: '…apps.googleusercontent.com' },
      { key: 'redirectUri', label: 'Redirect URI (register this in Google Console)', placeholder: 'https://<site>/auth-bff/oauth/google/callback' },
    ],
    secretFields: [{ key: 'clientSecret', label: 'Client Secret', placeholder: 'GOCSPX-…' }],
    websiteSlugs: OAUTH_WEBSITE_SLUGS,
  },
  {
    provider: 'github-oauth',
    category: 'oauth',
    label: 'GitHub Sign-In',
    description: '"Continue with GitHub" on this site\'s login page.',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'Ov23li…' },
      { key: 'redirectUri', label: 'Redirect URI (register this in GitHub OAuth App)', placeholder: 'https://<site>/auth-bff/oauth/github/callback' },
    ],
    secretFields: [{ key: 'clientSecret', label: 'Client Secret', placeholder: '40-char hex secret' }],
    websiteSlugs: OAUTH_WEBSITE_SLUGS,
  },
];
