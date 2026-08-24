export type IntegrationCategory = 'api' | 'payment' | 'sms' | 'ai' | 'webhook' | 'oauth' | 'analytics' | 'other';

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
  analytics: 'Analytics Providers',
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
    provider: 'crypto',
    category: 'payment',
    label: 'Crypto (BTC / ETH / BNB / USDT / USDC)',
    description: 'Merchant receiving addresses for crypto deposits — read directly by payment-service\'s CryptoGateway (community/access-tier checkout). Field keys must match exactly: btcAddress, usdtTrc20Address, ethBep20Address, usdtErc20Address, usdcErc20Address, ethAddress, bnbAddress, usdtBep20Address.',
    fields: [
      { key: 'btcAddress', label: 'BTC receiving address', placeholder: 'bc1…' },
      { key: 'usdtTrc20Address', label: 'USDT (TRC20 — Tron) receiving address', placeholder: 'T…' },
      { key: 'ethBep20Address', label: 'ETH-BEP20 (Binance-Peg ETH on BSC) receiving address', placeholder: '0x…' },
      { key: 'usdtErc20Address', label: 'USDT (ERC20 — Ethereum) receiving address', placeholder: '0x…' },
      { key: 'usdcErc20Address', label: 'USDC (ERC20 — Ethereum) receiving address', placeholder: '0x…' },
      { key: 'ethAddress', label: 'Native ETH (Ethereum mainnet) receiving address', placeholder: '0x…' },
      { key: 'bnbAddress', label: 'Native BNB (BNB Smart Chain) receiving address', placeholder: '0x…' },
      { key: 'usdtBep20Address', label: 'USDT (BEP20 — BSC) receiving address — a different contract from TRC20/ERC20 USDT', placeholder: '0x…' },
    ],
    secretFields: [],
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
    provider: 'facebook-oauth',
    category: 'oauth',
    label: 'Facebook Login',
    description: '"Continue with Facebook" on this site\'s login page.',
    fields: [
      { key: 'clientId', label: 'App ID', placeholder: 'Facebook App ID' },
      { key: 'redirectUri', label: 'Redirect URI (register in Meta App → Facebook Login)', placeholder: 'https://<site>/auth-bff/oauth/facebook/callback' },
    ],
    secretFields: [{ key: 'clientSecret', label: 'App Secret', placeholder: 'Facebook App Secret' }],
    websiteSlugs: OAUTH_WEBSITE_SLUGS,
  },

  // ── Unified Analytics providers (category 'analytics') ──────────────────────
  // Field keys MUST match each connector's requiredCreds (Backend/services/knowledge/
  // cms-service/connectors/*). IDs/URLs are non-secret config; OAuth secrets,
  // refresh tokens and API keys are secretFields (AES-256-GCM encrypted at rest).
  // First-party tracking works with none of these connected; add them for extra data.
  {
    provider: 'ga4',
    category: 'analytics',
    label: 'Google Analytics 4',
    description: 'GA4 traffic — users, sessions, pageviews by page/country/channel (Data API).',
    fields: [
      { key: 'propertyId', label: 'Property ID', placeholder: 'properties/123456789 or 123456789' },
      { key: 'oauthClientId', label: 'OAuth Client ID', placeholder: '…apps.googleusercontent.com' },
    ],
    secretFields: [
      { key: 'oauthClientSecret', label: 'OAuth Client Secret', placeholder: 'GOCSPX-…' },
      { key: 'refreshToken', label: 'OAuth Refresh Token', placeholder: '1//0g…' },
    ],
  },
  {
    provider: 'gsc',
    category: 'analytics',
    label: 'Google Search Console',
    description: 'Search impressions, clicks, CTR, position + top queries/pages.',
    fields: [
      { key: 'siteUrl', label: 'Site URL / Property', placeholder: 'https://imperialpedia.baalvion.com/ or sc-domain:baalvion.com' },
      { key: 'oauthClientId', label: 'OAuth Client ID', placeholder: '…apps.googleusercontent.com' },
    ],
    secretFields: [
      { key: 'oauthClientSecret', label: 'OAuth Client Secret', placeholder: 'GOCSPX-…' },
      { key: 'refreshToken', label: 'OAuth Refresh Token', placeholder: '1//0g…' },
    ],
  },
  {
    provider: 'gtm',
    category: 'analytics',
    label: 'Google Tag Manager',
    description: 'Container/tag config health (GTM deploys tags — it has no traffic data of its own).',
    fields: [
      { key: 'accountId', label: 'Account ID', placeholder: 'GTM account id' },
      { key: 'containerId', label: 'Container ID', placeholder: 'GTM container id' },
      { key: 'oauthClientId', label: 'OAuth Client ID', placeholder: '…apps.googleusercontent.com' },
    ],
    secretFields: [
      { key: 'oauthClientSecret', label: 'OAuth Client Secret', placeholder: 'GOCSPX-…' },
      { key: 'refreshToken', label: 'OAuth Refresh Token' },
    ],
  },
  {
    provider: 'google-ads',
    category: 'analytics',
    label: 'Google Ads',
    description: 'Campaign clicks, impressions, cost, conversions (Ads API).',
    fields: [
      { key: 'customerId', label: 'Customer ID', placeholder: '123-456-7890' },
      { key: 'loginCustomerId', label: 'Login/MCC Customer ID (optional)', placeholder: 'manager account id, if via MCC' },
      { key: 'oauthClientId', label: 'OAuth Client ID', placeholder: '…apps.googleusercontent.com' },
    ],
    secretFields: [
      { key: 'developerToken', label: 'Developer Token' },
      { key: 'oauthClientSecret', label: 'OAuth Client Secret', placeholder: 'GOCSPX-…' },
      { key: 'refreshToken', label: 'OAuth Refresh Token' },
    ],
  },
  {
    provider: 'adsense',
    category: 'analytics',
    label: 'Google AdSense',
    description: 'Est. earnings, RPM, CPC, ad clicks & impressions (AdSense Management API).',
    fields: [
      { key: 'accountId', label: 'Account ID', placeholder: 'pub-XXXXXXXXXXXXXXXX' },
      { key: 'oauthClientId', label: 'OAuth Client ID', placeholder: '…apps.googleusercontent.com' },
    ],
    secretFields: [
      { key: 'oauthClientSecret', label: 'OAuth Client Secret', placeholder: 'GOCSPX-…' },
      { key: 'refreshToken', label: 'OAuth Refresh Token' },
    ],
  },
  {
    provider: 'google-news',
    category: 'analytics',
    label: 'Google News',
    description: 'News-surface impressions/clicks via Search Console’s type=news filter.',
    fields: [
      { key: 'siteUrl', label: 'Site URL / Property', placeholder: 'https://imperialpedia.baalvion.com/' },
      { key: 'oauthClientId', label: 'OAuth Client ID', placeholder: '…apps.googleusercontent.com' },
    ],
    secretFields: [
      { key: 'oauthClientSecret', label: 'OAuth Client Secret', placeholder: 'GOCSPX-…' },
      { key: 'refreshToken', label: 'OAuth Refresh Token' },
    ],
  },
  {
    provider: 'merchant-center',
    category: 'analytics',
    label: 'Google Merchant Center',
    description: 'Shopping clicks, impressions, CTR (Content API for Shopping).',
    fields: [
      { key: 'merchantId', label: 'Merchant ID' },
      { key: 'oauthClientId', label: 'OAuth Client ID', placeholder: '…apps.googleusercontent.com' },
    ],
    secretFields: [
      { key: 'oauthClientSecret', label: 'OAuth Client Secret', placeholder: 'GOCSPX-…' },
      { key: 'refreshToken', label: 'OAuth Refresh Token' },
    ],
  },
  {
    provider: 'clarity',
    category: 'analytics',
    label: 'Microsoft Clarity',
    description: 'Session insights (last 3 days only — Clarity API hard cap).',
    fields: [],
    secretFields: [{ key: 'apiToken', label: 'API Token', placeholder: 'from Clarity project settings → Data Export' }],
  },
  {
    provider: 'bing-webmaster',
    category: 'analytics',
    label: 'Bing Webmaster',
    description: 'Bing search clicks, impressions, position + top queries.',
    fields: [{ key: 'siteUrl', label: 'Site URL', placeholder: 'https://imperialpedia.baalvion.com/' }],
    secretFields: [{ key: 'apiKey', label: 'API Key', placeholder: 'Bing Webmaster API key' }],
  },
  {
    provider: 'cloudflare',
    category: 'analytics',
    label: 'Cloudflare Analytics',
    description: 'Edge requests, pageviews, uniques, threats (GraphQL Analytics).',
    fields: [{ key: 'zoneId', label: 'Zone ID' }],
    secretFields: [{ key: 'apiToken', label: 'API Token', placeholder: 'scoped: Zone → Analytics → Read' }],
  },
  {
    provider: 'meta-pixel',
    category: 'analytics',
    label: 'Meta Pixel',
    description: 'Ad-account insights — impressions/clicks/spend (no raw pixel-fire API exists).',
    fields: [{ key: 'adAccountId', label: 'Ad Account ID', placeholder: 'act_XXXXXXXXX or numeric' }],
    secretFields: [{ key: 'accessToken', label: 'Access Token', placeholder: 'Meta long-lived access token' }],
  },
  {
    provider: 'linkedin-insight',
    category: 'analytics',
    label: 'LinkedIn Insight',
    description: 'Ad-account analytics — impressions/clicks/spend/conversions.',
    fields: [{ key: 'adAccountId', label: 'Ad Account ID', placeholder: 'sponsoredAccount numeric id' }],
    secretFields: [{ key: 'accessToken', label: 'Access Token' }],
  },
  {
    provider: 'pinterest-tag',
    category: 'analytics',
    label: 'Pinterest Tag',
    description: 'Ad-account analytics — spend/impressions/clicks.',
    fields: [{ key: 'adAccountId', label: 'Ad Account ID' }],
    secretFields: [{ key: 'accessToken', label: 'Access Token' }],
  },
  {
    provider: 'tiktok-pixel',
    category: 'analytics',
    label: 'TikTok Pixel',
    description: 'Advertiser reporting — spend/impressions/clicks/conversions.',
    fields: [{ key: 'advertiserId', label: 'Advertiser ID' }],
    secretFields: [{ key: 'accessToken', label: 'Access Token' }],
  },
  {
    provider: 'x-pixel',
    category: 'analytics',
    label: 'X (Twitter) Ads',
    description: 'Ad-account stats — impressions/clicks/spend (OAuth 1.0a signed).',
    fields: [
      { key: 'adAccountId', label: 'Ad Account ID' },
      { key: 'apiKey', label: 'API Key (consumer key)' },
    ],
    secretFields: [
      { key: 'apiSecretKey', label: 'API Secret Key (consumer secret)' },
      { key: 'accessToken', label: 'Access Token' },
      { key: 'accessTokenSecret', label: 'Access Token Secret' },
    ],
  },
];
