'use strict';
/**
 * Central PSP key vault resolver — same "Integrations & Keys" CMS vault every other payment
 * service reads (order-execution-service/integrations/payment/cmsVault.js is the reference
 * implementation this mirrors). Fail-OPEN to config/env: a vault outage never breaks billing.
 */
const CMS_URL = (process.env.CMS_INTERNAL_URL || process.env.CMS_BASE_URL || 'http://localhost:3018').replace(/\/+$/, '');
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'baalvion-internal-dev-secret';
const DEFAULT_SLUG = process.env.PAYMENT_SITE_SLUG || '';
const TTL_MS = Number(process.env.CMS_VAULT_TTL_MS || 60000);
const SERVICE = process.env.SERVICE_NAME || 'developer-service';

if (process.env.NODE_ENV === 'production'
  && (!process.env.INTERNAL_SERVICE_SECRET || INTERNAL_SECRET === 'baalvion-internal-dev-secret')) {
  throw new Error('INTERNAL_SERVICE_SECRET must be set to a non-default value (CMS vault auth)');
}
if (/(^|\/\/)(169\.254\.|127\.|0\.0\.0\.0|metadata|169\.254\.169\.254)/i.test(CMS_URL) && process.env.NODE_ENV === 'production') {
  throw new Error('CMS_INTERNAL_URL must not point at a link-local/metadata host');
}

const cache = new Map();

async function fetchVault(slug, provider) {
  const url = `${CMS_URL}/api/v1/internal/integrations/${encodeURIComponent(slug)}?category=payment`
    + (provider ? `&provider=${encodeURIComponent(provider)}` : '');
  const res = await fetch(url, { headers: { 'x-internal-secret': INTERNAL_SECRET, 'x-internal-service': SERVICE } });
  if (!res.ok) return [];
  const body = await res.json().catch(() => ({}));
  return Array.isArray(body.data) ? body.data : [];
}

async function getPaymentCreds(provider, slug = DEFAULT_SLUG) {
  const p = String(provider || '').toLowerCase();
  if (!slug || !CMS_URL || !p) return null;
  const key = `${slug}|${p}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && (now - hit.at) < TTL_MS) return hit.value;

  let value = null;
  try {
    const list = await fetchVault(slug, p);
    const entry = list.find((e) =>
      String(e.provider).toLowerCase() === p && e.category === 'payment' && e.enabled && e.status === 'configured');
    if (entry && entry.secrets && Object.keys(entry.secrets).length) {
      value = { secrets: entry.secrets || {}, config: entry.config || {}, mode: (entry.config && entry.config.mode) || 'test' };
    }
  } catch { value = null; }
  cache.set(key, { at: now, value });
  return value;
}

module.exports = { getPaymentCreds };
