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

// Minimum fields that must be present for an integration to count as testable.
const PROVIDER_REQUIRED = {
    razorpay: ['keyId', 'keySecret'],
    stripe: ['secretKey'],
    payu: ['merchantKey', 'merchantSalt'],
    cashfree: ['clientId', 'clientSecret'],
    twilio: ['accountSid', 'authToken'],
    gemini: ['apiKey'],
    openai: ['apiKey'],
};

async function assertWebsite(websiteId, orgId) {
    const w = await CmsWebsite.findOne({ where: { id: websiteId, organizationId: orgId } });
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

async function list(websiteId, orgId) {
    await assertWebsite(websiteId, orgId);
    const rows = await CmsWebsiteIntegration.findAll({
        where: { websiteId },
        order: [['category', 'ASC'], ['provider', 'ASC']],
    });
    return rows.map(toPublic);
}

async function upsert(websiteId, orgId, provider, body, userId) {
    const website = await assertWebsite(websiteId, orgId);
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

async function remove(websiteId, orgId, provider) {
    const website = await assertWebsite(websiteId, orgId);
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

async function test(websiteId, orgId, provider) {
    await assertWebsite(websiteId, orgId);
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
    } else {
        // Payment / SMS / AI: don't call live third parties from here in dev —
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

/** Org-wide rollup: per-website integration/connection status for the dashboard. */
async function summary(orgId) {
    const websites = await CmsWebsite.findAll({
        where: { organizationId: orgId },
        attributes: ['id', 'name', 'slug'],
        order: [['name', 'ASC']],
    });
    if (websites.length === 0) return [];
    const integrations = await CmsWebsiteIntegration.findAll({
        where: { websiteId: websites.map((w) => w.id) },
    });
    const byWebsite = {};
    for (const i of integrations) {
        (byWebsite[i.websiteId] = byWebsite[i.websiteId] || []).push(i);
    }
    return websites.map((w) => {
        const rows = byWebsite[w.id] || [];
        return {
            websiteId: w.id,
            name: w.name,
            slug: w.slug,
            total: rows.length,
            configured: rows.filter((i) => i.status === 'configured').length,
            hasPayment: rows.some((i) => i.category === 'payment' && i.status === 'configured'),
            hasApi: rows.some((i) => i.category === 'api' && i.status === 'configured'),
        };
    });
}

module.exports = { list, upsert, remove, test, resolve, summary };
