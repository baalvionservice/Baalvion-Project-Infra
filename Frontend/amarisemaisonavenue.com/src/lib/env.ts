import { z } from 'zod';

// Fails fast and loud on misconfiguration instead of the previous behavior (ad hoc
// `process.env.X || fallback` reads scattered across src/lib/*.ts, so a typo'd var name
// silently fell back to a dev default in production). Defaults below mirror each var's
// CURRENT in-code fallback exactly — this only adds validation, it does not change behavior
// for anything that already works today. See src/app/layout.tsx for the side-effect import
// that runs this at server startup (client-side validation is skipped; NEXT_PUBLIC_* vars
// are baked into the client bundle at build time, not read at runtime in the browser).

const clientSchema = z.object({
  // Backend service base URLs (all api-client.ts / catalog.ts / crm-client.ts / etc.)
  NEXT_PUBLIC_COMMERCE_URL: z.string().url().default('http://localhost:3012/api/v1'),
  NEXT_PUBLIC_COMMERCE_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_ORDER_URL: z.string().url().default('https://api.baalvion.com/api/v1/order'),
  NEXT_PUBLIC_INVENTORY_URL: z.string().url().default('https://api.baalvion.com/api/v1/inventory'),
  NEXT_PUBLIC_CMS_URL: z.string().url().default('http://localhost:3011/api/v1'),
  NEXT_PUBLIC_CRM_URL: z.string().url().default('http://localhost:3063/api/v1'),
  NEXT_PUBLIC_SHARED_AUTH_URL: z.string().url().default('https://auth.baalvion.com'),
  NEXT_PUBLIC_GATEWAY_URL: z.string().default('/auth-bff'),

  // Store / site identity
  NEXT_PUBLIC_STORE_ID: z.string().optional(),
  NEXT_PUBLIC_STORE_DOMAINS: z.string().optional(),
  NEXT_PUBLIC_CMS_WEBSITE_SLUG: z.string().default('amarise-maison-avenue'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://www.amarisemaisonavenue.com'),

  // Admin console redirect (retired per-app /admin → central admin-platform). Intentionally
  // optional in production — middleware.ts skips the redirect rather than default to localhost.
  NEXT_PUBLIC_ADMIN_CONSOLE_URL: z.string().url().optional(),

  // Feature flags / behavior toggles (plain string comparisons in code, not booleans)
  NEXT_PUBLIC_BFF_MODE: z.string().optional(),
  NEXT_PUBLIC_CHECKOUT_MODE: z.string().default('CONTINUITY'),
  NEXT_PUBLIC_PRESENCE_DISABLED: z.string().optional(),
  NEXT_PUBLIC_ENABLE_LIVE_SHOP: z.string().optional(),
  NEXT_PUBLIC_REFRESH_COOKIE_NAME: z.string().default('baalvion_refresh'),
  NEXT_PUBLIC_OAUTH_PROVIDERS: z.string().optional(),

  // Analytics (optional — features degrade gracefully when unset)
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_ANALYTICS_URL: z.string().url().optional(),
  NEXT_PUBLIC_CMS_PUBLIC_URL: z.string().url().optional(),

  // Error monitoring (optional — instrumentation-client.ts no-ops until this is set).
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

const serverSchema = z.object({
  // Auth reverse-proxy target for the same-origin /auth-bff rewrite (next.config.ts).
  AUTH_PROXY_TARGET: z.string().url().optional(),
  // Error monitoring (optional — instrumentation.ts no-ops until this is set).
  SENTRY_DSN: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

function validateEnv() {
  if (typeof window !== 'undefined') return; // NEXT_PUBLIC_* vars are baked in at build time — skip on client

  const parsed = clientSchema.merge(serverSchema).safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.flatten().fieldErrors;
    console.error('[Amarisé] Invalid environment variables:', issues);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Amarisé] Invalid environment variables — refusing to start in production');
    }
    console.warn('[Amarisé] Continuing in development with invalid env — fix before deploying');
  }
}

validateEnv();

export const env = {
  client: {
    commerceUrl: process.env.NEXT_PUBLIC_COMMERCE_URL || 'http://localhost:3012/api/v1',
    orderUrl: process.env.NEXT_PUBLIC_ORDER_URL || 'https://api.baalvion.com/api/v1/order',
    inventoryUrl: process.env.NEXT_PUBLIC_INVENTORY_URL || 'https://api.baalvion.com/api/v1/inventory',
    cmsUrl: process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3011/api/v1',
    crmUrl: process.env.NEXT_PUBLIC_CRM_URL || 'http://localhost:3063/api/v1',
    sharedAuthUrl: process.env.NEXT_PUBLIC_SHARED_AUTH_URL || 'https://auth.baalvion.com',
    storeId: process.env.NEXT_PUBLIC_STORE_ID || null,
    cmsWebsiteSlug: process.env.NEXT_PUBLIC_CMS_WEBSITE_SLUG || 'amarise-maison-avenue',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.amarisemaisonavenue.com',
  },
  server: {
    authProxyTarget: process.env.AUTH_PROXY_TARGET || 'https://api.baalvion.com/api/v1/identity/auth/v1/auth',
    nodeEnv: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
  },
};
