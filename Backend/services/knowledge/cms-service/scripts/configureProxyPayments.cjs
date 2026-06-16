'use strict';
/**
 * Add the missing Stripe + PayU payment integrations to the CMS vault for the
 * Proxy-BaalvionStack site (slug: proxy-baalvionstack).
 *
 * The site already had a Razorpay entry (mock mode, placeholder keys); the
 * BillingCheckout UI lets shoppers pick razorpay | stripe | payu, but selecting
 * Stripe/PayU failed because no vault entry existed (payment-service raised
 * PspConfigNotFoundException → HTTP 422). This seeds the two missing providers in
 * the SAME shape as the existing Razorpay entry: category=payment, enabled,
 * status=configured, config.mode='mock' with placeholder test keys.
 *
 * Secrets are AES-256-GCM encrypted at rest by secretCrypto (the only crypto
 * authority) exactly like the Razorpay entry. The secret field names match what
 * the Java PSP adapters read from ProviderConfig:
 *   stripe → secretKey, publishableKey, webhookSecret   (StripeGateway)
 *   payu   → merchantKey, merchantSalt                  (PayUGateway)
 *
 * mock mode means the adapter simulates order creation (no live merchant account).
 * Flip to a real provider sandbox / production by setting config.mode='live' and
 * pasting real keys in the admin console — nothing else changes (see
 * configureSandboxPayments.cjs). This script is idempotent and does NOT touch the
 * existing Razorpay entry.
 *
 *   node scripts/configureProxyPayments.cjs
 */
require('dotenv').config();
const { CmsWebsite, CmsWebsiteIntegration, connectDB, sequelize } = require('../models');
const secretCrypto = require('../utils/secretCrypto');

const SITE_SLUG = process.env.PROXY_SITE_SLUG || 'proxy-baalvionstack';

// Placeholder TEST keys + mock mode — mirrors the existing Razorpay entry
// (rzp_test_proxy / mode:mock). Swap in real keys + mode:'live' to go live.
const PROVIDERS = [
    {
        provider: 'stripe',
        secrets: { secretKey: 'sk_test_proxy', publishableKey: 'pk_test_proxy', webhookSecret: 'whsec_proxy' },
        config: { mode: 'mock' },
    },
    {
        provider: 'payu',
        secrets: { merchantKey: 'payu_test_proxy', merchantSalt: 'payu_salt_proxy' },
        config: { mode: 'mock' },
    },
    {
        provider: 'cashfree',
        secrets: { clientId: 'cf_test_proxy', clientSecret: 'cfsk_test_proxy' },
        config: { mode: 'mock', baseUrl: 'https://sandbox.cashfree.com' },
    },
];

(async () => {
    await connectDB();
    const w = await CmsWebsite.findOne({ where: { slug: SITE_SLUG } });
    if (!w) { console.error(`[proxy-payments] ERROR: no CMS website with slug "${SITE_SLUG}"`); process.exit(1); }

    for (const p of PROVIDERS) {
        const existing = await CmsWebsiteIntegration.findOne({ where: { websiteId: w.id, provider: p.provider } });
        const prev = existing ? secretCrypto.decrypt(existing.secretsEnc) : {};
        const merged = { ...prev, ...p.secrets };
        const fields = {
            websiteId: w.id,
            provider: p.provider,
            category: 'payment',
            label: p.provider,
            config: p.config,
            secretsEnc: secretCrypto.encrypt(merged),
            secretHints: secretCrypto.maskSecrets(merged),
            enabled: true,
            status: 'configured',
            updatedBy: null,
        };
        if (existing) {
            await existing.update(fields);
            console.log(`[proxy-payments] updated  ${SITE_SLUG} → ${p.provider} (enabled, configured, mode=${p.config.mode})`);
        } else {
            await CmsWebsiteIntegration.create({ ...fields, createdBy: null });
            console.log(`[proxy-payments] created  ${SITE_SLUG} → ${p.provider} (enabled, configured, mode=${p.config.mode})`);
        }
    }

    await sequelize.close();
    console.log(`[proxy-payments] DONE: stripe + payu seeded for ${SITE_SLUG}`);
})().catch((e) => { console.error('[proxy-payments] ERR', e.message); process.exit(1); });
