'use strict';
/**
 * Central PSP key vault resolver.
 *
 * Resolves a website's payment-provider keys (Razorpay / Stripe / PayU) from the CMS
 * "Integrations & Keys" vault — the SAME store the admin panel writes to, encrypted at rest
 * (AES-256-GCM) and decrypted only on this internal, x-internal-secret-guarded read path. This is
 * what lets an operator paste/rotate a key in the admin console and have checkout use it live, with
 * no redeploy.
 *
 * Fail-OPEN to env: if the vault is unconfigured (no slug), unreachable, or has no entry for the
 * provider, getPaymentCreds returns null and the caller falls back to its env keys — so a CMS
 * outage never breaks payments. Results are cached briefly (default 60s) like the Java PSP resolver.
 */
const CMS_URL = (process.env.CMS_INTERNAL_URL || process.env.CMS_BASE_URL || 'http://localhost:3011').replace(/\/+$/, '');
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'baalvion-internal-dev-secret';
const DEFAULT_SLUG = process.env.PAYMENT_SITE_SLUG || '';
const TTL_MS = Number(process.env.CMS_VAULT_TTL_MS || 60000);
const SERVICE = process.env.SERVICE_NAME || 'order-payments';

const cache = new Map(); // `${slug}|${provider}` -> { at, value }

async function fetchVault(slug, provider) {
  const url = `${CMS_URL}/api/v1/internal/integrations/${encodeURIComponent(slug)}?category=payment`
    + (provider ? `&provider=${encodeURIComponent(provider)}` : '');
  const res = await fetch(url, { headers: { 'x-internal-secret': INTERNAL_SECRET, 'x-internal-service': SERVICE } });
  if (!res.ok) return [];
  const body = await res.json().catch(() => ({}));
  return Array.isArray(body.data) ? body.data : [];
}

/**
 * @returns {Promise<{secrets:Object, config:Object, mode:string}|null>} the vault entry for the
 *   provider, or null when the caller should use its env keys instead.
 */
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
  } catch { value = null; } // fail-open → env fallback
  cache.set(key, { at: now, value });
  return value;
}

module.exports = { getPaymentCreds };
