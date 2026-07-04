'use strict';
/**
 * Provider connector registry (plugin architecture).
 *
 * Every external provider is a connector object implementing one interface:
 *
 *   {
 *     id, provider, category,          // identity + which module its metrics feed
 *     requiredCreds: string[],         // vault keys needed (drives the "connect" UI)
 *     validate(creds): Promise|void,   // shape + optional live ping
 *     sync({ website, creds, since, until, logger }): Promise<Metric[]>
 *   }
 *
 * Adding a provider = drop a file that calls register(connector) and whitelist it
 * in cms-service integrationService PROVIDER_REQUIRED. No core changes.
 */
const _connectors = new Map();

function register(connector) {
    if (!connector || !connector.provider) throw new Error('connector.provider is required');
    if (typeof connector.sync !== 'function') throw new Error(`connector ${connector.provider} must implement sync()`);
    _connectors.set(connector.provider, connector);
    return connector;
}

function get(provider) {
    return _connectors.get(provider) || null;
}

function list() {
    return [..._connectors.values()];
}

/**
 * Catalog of every provider the platform intends to support, with the vault keys
 * each needs and the module its data feeds. Powers the admin "Connect a provider"
 * UI even before a connector's sync() is implemented. `implemented` reflects
 * whether a live connector is registered.
 */
const PROVIDER_CATALOG = Object.freeze([
    { provider: 'ga4', label: 'Google Analytics 4', category: 'traffic', requiredCreds: ['propertyId', 'oauthClientId', 'oauthClientSecret', 'refreshToken'] },
    { provider: 'gsc', label: 'Google Search Console', category: 'seo', requiredCreds: ['siteUrl', 'oauthClientId', 'oauthClientSecret', 'refreshToken'] },
    { provider: 'gtm', label: 'Google Tag Manager', category: 'traffic', requiredCreds: ['containerId', 'oauthClientId', 'oauthClientSecret', 'refreshToken'] },
    { provider: 'google-ads', label: 'Google Ads', category: 'marketing', requiredCreds: ['customerId', 'developerToken', 'oauthClientId', 'oauthClientSecret', 'refreshToken'] },
    { provider: 'adsense', label: 'Google AdSense', category: 'marketing', requiredCreds: ['accountId', 'oauthClientId', 'oauthClientSecret', 'refreshToken'] },
    { provider: 'google-news', label: 'Google News', category: 'seo', requiredCreds: ['publicationId'] },
    { provider: 'merchant-center', label: 'Google Merchant Center', category: 'ecommerce', requiredCreds: ['merchantId', 'oauthClientId', 'oauthClientSecret', 'refreshToken'] },
    { provider: 'clarity', label: 'Microsoft Clarity', category: 'traffic', requiredCreds: ['projectId', 'apiToken'] },
    { provider: 'bing-webmaster', label: 'Bing Webmaster', category: 'seo', requiredCreds: ['siteUrl', 'apiKey'] },
    { provider: 'meta-pixel', label: 'Meta Pixel', category: 'marketing', requiredCreds: ['pixelId', 'accessToken'] },
    { provider: 'linkedin-insight', label: 'LinkedIn Insight', category: 'marketing', requiredCreds: ['partnerId', 'accessToken'] },
    { provider: 'x-pixel', label: 'X Pixel', category: 'marketing', requiredCreds: ['pixelId', 'accessToken'] },
    { provider: 'pinterest-tag', label: 'Pinterest Tag', category: 'marketing', requiredCreds: ['tagId', 'accessToken'] },
    { provider: 'tiktok-pixel', label: 'TikTok Pixel', category: 'marketing', requiredCreds: ['pixelId', 'accessToken'] },
    { provider: 'cloudflare', label: 'Cloudflare Analytics', category: 'traffic', requiredCreds: ['zoneId', 'apiToken'] },
    { provider: 'internal_cms', label: 'Internal CMS Analytics', category: 'content', requiredCreds: [] },
    { provider: 'server', label: 'Server Analytics', category: 'infra', requiredCreds: [] },
]);

module.exports = { register, get, list, PROVIDER_CATALOG };
