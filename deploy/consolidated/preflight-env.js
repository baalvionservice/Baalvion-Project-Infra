#!/usr/bin/env node
/*
 * Consolidated stack startup preflight — FAIL FAST when a required env var is
 * missing or still an unfilled placeholder. Runs (via tini + docker-entrypoint.sh)
 * BEFORE pm2 starts any service, so a misconfigured deploy stops at the door instead
 * of 42 processes silently fail-opening. All 6 Node apps share one .env, so the
 * fleet-wide required set below applies to every container.
 *   Reference: docs/deployment/production/04-environment-and-secrets.md
 */
'use strict';

const PLACEHOLDER = /__set_me|__from_secret|change[-_]?me|your[-_]|replace[-_]?me|<[^>]+>/i;

// Hard-required: missing OR placeholder → refuse to start.
const REQUIRED = [
  // infra
  'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'REDIS_HOST', 'REDIS_PORT',
  // identity / RS256
  'JWT_PUBLIC_KEY', 'JWT_ISSUER', 'JWT_AUDIENCE', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET',
  // trust-boundary secrets
  'GATEWAY_SIGNING_SECRET', 'INTERNAL_SERVICE_SECRET', 'BILLING_SIGNING_SECRET',
  'RBAC_INTERNAL_API_KEY', 'AUDIT_INTERNAL_KEY', 'METRICS_SECRET', 'CART_SESSION_SECRET',
  'CMS_SECRETS_KEY', 'PROVIDER_SECRET_KEY', 'FINANCE_WEBHOOK_SECRET',
  // datastores
  'NEO4J_PASSWORD',
  // inter-service discovery (consolidated container DNS)
  'AUTH_SERVICE_URL', 'JWKS_URI', 'RBAC_BASE_URL', 'CMS_BASE_URL', 'NOTIFICATION_BASE_URL', 'SVC_PAYMENT',
  'INVENTORY_INTERNAL_KEY',
  // email identity
  'EMAIL_FROM',
];

// Secrets that should be reasonably strong (warn, do not fail).
const SECRETS = new Set([
  'DB_PASSWORD', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'GATEWAY_SIGNING_SECRET',
  'INTERNAL_SERVICE_SECRET', 'BILLING_SIGNING_SECRET', 'RBAC_INTERNAL_API_KEY', 'AUDIT_INTERNAL_KEY',
  'METRICS_SECRET', 'CART_SESSION_SECRET', 'CMS_SECRETS_KEY', 'PROVIDER_SECRET_KEY',
  'FINANCE_WEBHOOK_SECRET', 'INVENTORY_INTERNAL_KEY', 'NEO4J_PASSWORD',
]);

const missing = [], placeholder = [], weak = [], warn = [];
for (const k of REQUIRED) {
  const v = process.env[k];
  if (v === undefined || v === '') { missing.push(k); continue; }
  if (PLACEHOLDER.test(v)) { placeholder.push(k); continue; }
  if (SECRETS.has(k) && v.length < 24) weak.push(`${k}(len ${v.length})`);
}

// One-of: the mailer hard-requires an email provider.
const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
if (!hasSmtp && !process.env.RESEND_API_KEY) {
  missing.push('email provider (SMTP_HOST+SMTP_USER+SMTP_PASS or RESEND_API_KEY)');
}

// Recommended but non-fatal.
for (const k of ['SUPERADMIN_PASSWORD', 'STOREFRONT_URL', 'OPENSEARCH_URL']) {
  if (!process.env[k]) warn.push(k);
}
// Loud failure if a known dry-run-only value leaks into production. The dry-run opts out
// explicitly with DEPLOY_PROFILE=dryrun; any other profile hard-fails on these.
if (process.env.DEPLOY_PROFILE !== 'dryrun') {
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') placeholder.push('NODE_TLS_REJECT_UNAUTHORIZED=0 (dry-run-only)');
  if (process.env.PSP_MOCK === 'true') placeholder.push('PSP_MOCK=true (dry-run-only — use real gateways)');
  if (/mailpit|mailhog/i.test(process.env.SMTP_HOST || '')) {
    placeholder.push(`SMTP_HOST=${process.env.SMTP_HOST} (dev mail catcher — use Amazon SES)`);
  }
}

const T = '[preflight]';
if (missing.length) console.error(`${T} MISSING (${missing.length}): ${missing.join(', ')}`);
if (placeholder.length) console.error(`${T} PLACEHOLDER/unfilled (${placeholder.length}): ${placeholder.join(', ')}`);
if (weak.length) console.error(`${T} WEAK secret(s) <24 chars: ${weak.join(', ')}`);
if (warn.length) console.error(`${T} note — optional unset: ${warn.join(', ')}`);

if (missing.length || placeholder.length) {
  console.error(`${T} FAILED — refusing to start. Fix the above (see deploy/consolidated/.env.production.example).`);
  process.exit(1);
}
console.error(`${T} OK — ${REQUIRED.length} required vars present${weak.length ? ` (+${weak.length} weak-secret warning)` : ''}.`);
