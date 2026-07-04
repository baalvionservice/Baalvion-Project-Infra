'use strict';
/**
 * Provider credential resolver for connectors.
 *
 * Analytics never stores provider secrets — it reads them live from the existing
 * CMS integrations vault (cms_website_integrations, AES-256-GCM) via
 * integrationService, in-process (same service). Store an analytics provider in
 * the console (category 'analytics') and connectors pick it up immediately, no
 * redeploy — identical to how payment/AI providers are consumed.
 */
const integrationService = require('../integrationService');

/**
 * Decrypted credentials for one provider on a website, or null if not configured
 * / disabled. SERVER-SIDE ONLY — the returned `secrets` are plaintext and must
 * never be sent to a client.
 */
async function getProviderCredentials(websiteSlug, provider) {
    const rows = await integrationService.resolve(websiteSlug, { provider, category: 'analytics' });
    const row = rows[0];
    if (!row || !row.enabled) return null;
    return { provider, config: row.config || {}, secrets: row.secrets || {}, status: row.status };
}

/**
 * Non-secret status of every analytics provider connected to a website, for the
 * dashboard "Providers" panel. Never returns secrets.
 */
async function listAnalyticsProviders(websiteSlug) {
    const rows = await integrationService.resolve(websiteSlug, { category: 'analytics' });
    return rows.map((r) => ({
        provider: r.provider,
        enabled: r.enabled,
        status: r.status,
        config: r.config || {},
    }));
}

module.exports = { getProviderCredentials, listAnalyticsProviders };
