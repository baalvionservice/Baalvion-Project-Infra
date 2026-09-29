'use strict';
/**
 * Per-website integration & key management.
 *
 * Stores each website's external API endpoints + credentials and payment keys.
 * Secrets are encrypted at rest and only ever leave masked through the console.
 * The internal resolver returns decrypted config so any service can read the
 * live keys a website was configured with — paste a key in the console and the
 * platform uses it immediately, no redeploy.
 */
const { CmsWebsite, CmsWebsiteIntegration } = require('../models');
const { AppError } = require('../utils/errors');
const secretCrypto = require('../utils/secretCrypto');
const { getSdk } = require('../platform/sdk');
const { emitSafe, CmsEvents } = require('../platform/events');
const { SITES } = require('@baalvion/sites');

// Minimum fields that must be present for an integration to count as testable.
const PROVIDER_REQUIRED = {
    razorpay: ['keyId', 'keySecret'],
    stripe: ['secretKey'],
    payu: ['merchantKey', 'merchantSalt'],
    cashfree: ['clientId', 'clientSecret'],
    twilio: ['accountSid', 'authToken'],
    gemini: ['apiKey'],
    openai: ['apiKey'],
    // Social login (clientId is non-secret config; clientSecret is encrypted).
    'google-oauth': ['clientId', 'clientSecret'],
    'facebook-oauth': ['clientId', 'clientSecret'],
    'github-oauth': ['clientId', 'clientSecret'],
    // Unified Analytics providers (category 'analytics'). The Analytics platform's
    // connector catalog (connectors/registry.PROVIDER_CATALOG) is the authoritative
    // per-provider required-key list; these entries let the console Test button
    // verify the secret half is present for the common OAuth/token providers.
    ga4: ['refreshToken'],
    gsc: ['refreshToken'],
    gtm: ['accountId', 'containerId', 'refreshToken'],
    'google-ads': ['developerToken', 'refreshToken'],
    adsense: ['refreshToken'],
    'google-news': ['siteUrl', 'refreshToken'],
    'merchant-center': ['merchantId', 'refreshToken'],
    clarity: ['apiToken'],
    'bing-webmaster': ['apiKey'],
    'meta-pixel': ['adAccountId', 'accessToken'],
    'linkedin-insight': ['adAccountId', 'accessToken'],
    'x-pixel': ['apiKey', 'apiSecretKey', 'accessToken', 'accessTokenSecret', 'adAccountId'],
    'pinterest-tag': ['adAccountId', 'accessToken'],
    'tiktok-pixel': ['advertiserId', 'accessToken'],
    cloudflare: ['apiToken'],
};

/**
 * Resolve a caller "scope" into the org filter for a website query. Accepts the
 * scope object `{ orgId, isPlatformAdmin }` from the controller, or a legacy plain
 * orgId string (kept for direct callers/scripts). Platform principals are NOT
 * org-scoped — they manage every website across orgs, consistent with
 * websiteService.orgFilter and cmsAccess.loadCmsRole. Everyone else is org-scoped.
 */
function orgFilter(scope) {
    if (scope && typeof scope === 'object') {
        return scope.isPlatformAdmin ? {} : { organizationId: scope.orgId };
    }
    return { organizationId: scope };
}

async function assertWebsite(websiteId, scope) {
    const w = await CmsWebsite.findOne({ where: { id: websiteId, ...orgFilter(scope) } });
    if (!w) throw new AppError('NOT_FOUND', 'Website not found', 404);
    return w;
}

function toPublic(row) {
    const r = typeof row.toJSON === 'function' ? row.toJSON() : row;
    return {
        id: r.id,
        websiteId: r.websiteId,
        provider: r.provider,
        category: r.category,
        label: r.label,
        config: r.config || {},
        secretHints: r.secretHints || {},
        enabled: r.enabled,
        status: r.status,
        lastTestedAt: r.lastTestedAt,
        lastTestOk: r.lastTestOk,
        lastTestMessage: r.lastTestMessage,
        updatedAt: r.updatedAt,
    };
}

async function list(websiteId, scope) {
    await assertWebsite(websiteId, scope);
    const rows = await CmsWebsiteIntegration.findAll({
        where: { websiteId },
        order: [['category', 'ASC'], ['provider', 'ASC']],
    });
    return rows.map(toPublic);
}

async function upsert(websiteId, scope, provider, body, userId) {
    const website = await assertWebsite(websiteId, scope);
    const existing = await CmsWebsiteIntegration.findOne({ where: { websiteId, provider } });

    // Merge secrets: a sent field replaces; an omitted or blank field is kept.
    const prevSecrets = existing ? secretCrypto.decrypt(existing.secretsEnc) : {};
    const merged = { ...prevSecrets };
    for (const [k, v] of Object.entries(body.secrets || {})) {
        if (v === '' || v == null) continue;
        merged[k] = String(v);
    }
    const secretsEnc = secretCrypto.encrypt(merged);
    const secretHints = secretCrypto.maskSecrets(merged);
    const config = body.config ?? existing?.config ?? {};
    const configured = Object.keys(merged).length > 0 || Object.keys(config).length > 0;

    const fields = {
        websiteId,
        provider,
        category: body.category || existing?.category || 'other',
        label: body.label ?? existing?.label ?? provider,
        config,
        secretsEnc,
        secretHints,
        enabled: body.enabled ?? existing?.enabled ?? false,
        status: configured ? 'configured' : 'unconfigured',
        updatedBy: userId,
    };

    let result;
    if (existing) {
        await existing.update(fields);
        result = toPublic(existing);
    } else {
        const created = await CmsWebsiteIntegration.create({ ...fields, createdBy: userId });
        result = toPublic(created);
    }

    // Key-propagation event: the moment a key changes in the console, every
    // consumer (via the SDK config-resolver) busts its cached keys for this tenant.
    emitSafe(CmsEvents.INTEGRATION_UPDATED, {
        websiteSlug: website.slug,
        websiteId,
        provider,
        category: result.category,
        status: result.status,
    }, { tenantId: website.slug });

    return result;
}

async function remove(websiteId, scope, provider) {
    const website = await assertWebsite(websiteId, scope);
    const row = await CmsWebsiteIntegration.findOne({ where: { websiteId, provider } });
    if (!row) throw new AppError('NOT_FOUND', 'Integration not found', 404);
    const category = row.category;
    await row.destroy();

    emitSafe(CmsEvents.INTEGRATION_REMOVED, {
        websiteSlug: website.slug,
        websiteId,
        provider,
        category,
    }, { tenantId: website.slug });
}

async function test(websiteId, scope, provider) {
    await assertWebsite(websiteId, scope);
    const row = await CmsWebsiteIntegration.findOne({ where: { websiteId, provider } });
    if (!row) throw new AppError('NOT_FOUND', 'Integration not found', 404);

    const secrets = secretCrypto.decrypt(row.secretsEnc);
    const cfg = row.config || {};
    let ok = false;
    let message = '';

    if (row.category === 'api' || provider === 'backend_api') {
        const base = cfg.baseUrl || cfg.url;
        if (!base) {
            message = 'No base URL configured';
        } else {
            const url = String(base).replace(/\/$/, '') + (cfg.healthPath || '/health');
            try {
                // Outbound via sdk.http: timeout + per-host circuit breaker, no
                // internal-auth/trace headers leaked to a third-party host. Single
                // attempt (retries: 0) keeps the "honest up/down" semantics of the
                // Test-connection button.
                const resp = await getSdk().http.get(url, {
                    headers: secrets.apiKey ? { Authorization: `Bearer ${secrets.apiKey}` } : {},
                    timeoutMs: 5000,
                    retries: 0,
                    internal: false,
                    trace: false,
                });
                ok = resp.ok;
                message = `GET ${url} → HTTP ${resp.status}`;
            } catch (e) {
                // The shared sdk.http client trips a per-host circuit breaker after
                // repeated failures; surface that as an honest, readable status.
                message = e && e.name === 'CircuitOpenError'
                    ? 'Too many recent failures — circuit open, retry in ~15s'
                    : `Connection failed: ${e.message || 'error'}`;
            }
        }
    } else if (provider === 'gemini') {
        // Genuinely verified, not merely present. The editorial pipeline cannot
        // draft anything without this key, so "Keys present" is the wrong answer
        // to give about a mistyped one -- the failure would otherwise surface
        // much later, as a drafting error with no obvious cause. Listing models
        // is the cheapest call that proves the key works, and it generates
        // nothing and costs nothing.
        const key = secrets.apiKey || cfg.apiKey;
        if (!key) {
            message = 'Missing: apiKey';
        } else {
            try {
                const resp = await getSdk().http.get(
                    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
                    { timeoutMs: 8000, retries: 0, internal: false, trace: false }
                );
                ok = resp.ok;
                if (ok) {
                    const models = (resp.body && resp.body.models) || [];
                    const wanted = cfg.model || 'gemini-2.5-flash';
                    // A key can be valid while the configured model name is not.
                    // Say so rather than reporting a flat pass.
                    const has = models.some((m) => String(m.name || '').endsWith(wanted));
                    message = has
                        ? `Key valid — ${wanted} available (${models.length} models)`
                        : `Key valid, but "${wanted}" is not in the ${models.length} models this key can reach`;
                    ok = has;
                } else {
                    message = `Google rejected the key (HTTP ${resp.status})`;
                }
            } catch (e) {
                message = e && e.name === 'CircuitOpenError'
                    ? 'Too many recent failures — circuit open, retry in ~15s'
                    : `Could not reach Google: ${e.message || 'error'}`;
            }
        }
    } else {
        // Payment / SMS / other AI: don't call live third parties from here in dev —
        // confirm the required keys are present so the wiring is verifiably complete.
        const need = PROVIDER_REQUIRED[provider] || ['secretKey'];
        const missing = need.filter((k) => !secrets[k] && !cfg[k]);
        ok = missing.length === 0;
        message = ok ? 'Keys present (provider not live-verified in dev)' : `Missing: ${missing.join(', ')}`;
    }

    await row.update({
        lastTestedAt: new Date(),
        lastTestOk: ok,
        lastTestMessage: message,
        status: ok ? 'configured' : row.status === 'unconfigured' ? 'unconfigured' : 'error',
    });
    return { ok, message };
}

/**
 * INTERNAL: return decrypted integration config for a website slug, for
 * service-to-service consumption. Guarded by an internal secret at the route.
 */
async function resolve(websiteSlug, { provider, category } = {}) {
    const w = await CmsWebsite.findOne({ where: { slug: websiteSlug } });
    if (!w) throw new AppError('NOT_FOUND', 'Website not found', 404);
    const where = { websiteId: w.id };
    if (provider) where.provider = provider;
    if (category) where.category = category;
    const rows = await CmsWebsiteIntegration.findAll({ where });
    return rows.map((r) => ({
        provider: r.provider,
        category: r.category,
        enabled: r.enabled,
        status: r.status,
        config: r.config || {},
        secrets: secretCrypto.decrypt(r.secretsEnc),
    }));
}

// A cms_websites.domain value matches a registry entry if it equals (case-insensitively)
// any of the entry's domains. cms_websites rows are per-tenant CMS installs, not every
// Baalvion property has one — this only tells us which registry sites already have keys.
function findSiteForDomain(domain) {
    const needle = String(domain || '').toLowerCase();
    return SITES.find((s) => s.domains.some((d) => d.toLowerCase() === needle)) || null;
}

/**
 * Per-website integration/connection status rollup for the dashboard "Website
 * Connections" widget.
 *
 * For a platform principal this lists every property in the canonical site registry
 * (@baalvion/sites), not just the ones that happen to have a cms_websites row — cms_websites
 * only exists for tenants actually using the CMS module, so keying off it alone silently
 * dropped every other Baalvion property from the dashboard. Registry sites are merged with
 * any matching cms_websites integration data by domain; a site with no CMS record is honestly
 * reported with zero configured integrations rather than omitted.
 * Tenant admins remain org-scoped to their own cms_websites rows, since the registry has no
 * notion of organization ownership.
 */
async function summary(scope) {
    const websites = await CmsWebsite.findAll({
        where: { ...orgFilter(scope) },
        attributes: ['id', 'name', 'slug', 'domain'],
        order: [['name', 'ASC']],
    });
    const integrations = websites.length
        ? await CmsWebsiteIntegration.findAll({ where: { websiteId: websites.map((w) => w.id) } })
        : [];
    const byWebsite = {};
    for (const i of integrations) {
        (byWebsite[i.websiteId] = byWebsite[i.websiteId] || []).push(i);
    }
    const rollup = (w) => {
        const rows = byWebsite[w.id] || [];
        return {
            total: rows.length,
            configured: rows.filter((i) => i.status === 'configured').length,
            hasPayment: rows.some((i) => i.category === 'payment' && i.status === 'configured'),
            hasApi: rows.some((i) => i.category === 'api' && i.status === 'configured'),
        };
    };

    const isPlatformAdmin = Boolean(scope && typeof scope === 'object' && scope.isPlatformAdmin);
    if (!isPlatformAdmin) {
        return websites.map((w) => ({
            websiteId: w.id,
            name: w.name,
            slug: w.slug,
            ...rollup(w),
        }));
    }

    const websiteBySiteId = {};
    for (const w of websites) {
        const site = findSiteForDomain(w.domain);
        if (site) websiteBySiteId[site.id] = w;
    }
    return SITES.map((site) => {
        const w = websiteBySiteId[site.id];
        return {
            websiteId: w ? w.id : null,
            name: site.name,
            slug: site.id,
            siteStatus: site.status,
            hasCmsRecord: Boolean(w),
            ...(w ? rollup(w) : { total: 0, configured: 0, hasPayment: false, hasApi: false }),
        };
    });
}

module.exports = { list, upsert, remove, test, resolve, summary };
