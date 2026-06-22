'use strict';
/**
 * Operator loader — upsert a site's payment provider into the CMS vault from
 * ENVIRONMENT VARIABLES (so credentials never live in this file, git, or chat).
 *
 * Run it in the TARGET environment (the CMS that owns the vault — ideally
 * staging/prod, NOT a dev laptop), with the keys exported in the shell:
 *
 *   SITE_SLUG=proxy-baalvionstack PAYMENT_PROVIDER=razorpay PAYMENT_MODE=live \
 *   RZP_KEY_ID=... RZP_KEY_SECRET=... RZP_WEBHOOK_SECRET=... \
 *   node scripts/loadPaymentProvider.cjs
 *
 *   # Stripe:
 *   SITE_SLUG=baalvion-elite-circle PAYMENT_PROVIDER=stripe PAYMENT_MODE=live \
 *   STRIPE_SECRET_KEY=... STRIPE_PUBLISHABLE_KEY=... STRIPE_WEBHOOK_SECRET=... \
 *   node scripts/loadPaymentProvider.cjs
 *
 *   # PayU (webhook hash verified with the salt; PAYU_WEBHOOK_SECRET optional):
 *   SITE_SLUG=control-the-market PAYMENT_PROVIDER=payu PAYMENT_MODE=live \
 *   PAYU_MERCHANT_KEY=... PAYU_MERCHANT_SALT=... node scripts/loadPaymentProvider.cjs
 *
 *   # Cashfree (webhook signature verified with the clientSecret):
 *   SITE_SLUG=control-the-market PAYMENT_PROVIDER=cashfree PAYMENT_MODE=live \
 *   CASHFREE_CLIENT_ID=... CASHFREE_CLIENT_SECRET=... node scripts/loadPaymentProvider.cjs
 *
 * VALIDATE with TEST keys + PAYMENT_MODE=mock first; flip to live only after a
 * sandbox dry-run and sign-off. See payment-service/docs/ROLLOUT.md.
 */
require('dotenv').config();
const { CmsWebsite, CmsWebsiteIntegration, connectDB, sequelize } = require('../models');
const secretCrypto = require('../utils/secretCrypto');

const env = (k, required = true) => {
    const v = process.env[k];
    if (required && !v) { console.error(`Missing required env: ${k}`); process.exit(2); }
    return v;
};

function secretsFor(provider) {
    if (provider === 'razorpay') {
        return { keyId: env('RZP_KEY_ID'), keySecret: env('RZP_KEY_SECRET'), webhookSecret: env('RZP_WEBHOOK_SECRET') };
    }
    if (provider === 'stripe') {
        return { secretKey: env('STRIPE_SECRET_KEY'), publishableKey: env('STRIPE_PUBLISHABLE_KEY'), webhookSecret: env('STRIPE_WEBHOOK_SECRET') };
    }
    if (provider === 'payu') {
        // webhookSecret is optional for PayU (the return hash is verified with merchantSalt).
        const out = { merchantKey: env('PAYU_MERCHANT_KEY'), merchantSalt: env('PAYU_MERCHANT_SALT') };
        if (process.env.PAYU_WEBHOOK_SECRET) out.webhookSecret = process.env.PAYU_WEBHOOK_SECRET;
        return out;
    }
    if (provider === 'cashfree') {
        // Cashfree verifies webhooks with the clientSecret (no separate webhook secret).
        return { clientId: env('CASHFREE_CLIENT_ID'), clientSecret: env('CASHFREE_CLIENT_SECRET') };
    }
    console.error(`Unsupported PAYMENT_PROVIDER: ${provider}`); process.exit(2);
}

(async () => {
    const slug = env('SITE_SLUG');
    const provider = env('PAYMENT_PROVIDER');
    const mode = process.env.PAYMENT_MODE || 'mock';
    if (mode === 'live' && process.env.NODE_ENV !== 'production') {
        console.warn('[warn] PAYMENT_MODE=live outside NODE_ENV=production — live keys should not be loaded into a dev/local vault.');
    }
    const secrets = secretsFor(provider);

    await connectDB();
    const w = await CmsWebsite.findOne({ where: { slug } });
    if (!w) { console.error(`No CMS website for slug "${slug}" — register the tenant first.`); process.exit(2); }

    const existing = await CmsWebsiteIntegration.findOne({ where: { websiteId: w.id, provider } });
    const merged = { ...(existing ? secretCrypto.decrypt(existing.secretsEnc) : {}), ...secrets };
    const fields = {
        websiteId: w.id, provider, category: 'payment', label: provider,
        config: { mode }, secretsEnc: secretCrypto.encrypt(merged), secretHints: secretCrypto.maskSecrets(merged),
        enabled: true, status: 'configured', updatedBy: null,
    };
    if (existing) await existing.update(fields);
    else await CmsWebsiteIntegration.create({ ...fields, createdBy: null });

    // Print ONLY masked hints — never the raw secret.
    console.log(`OK: ${slug} → ${provider} (mode=${mode}) loaded into vault. hints=${JSON.stringify(secretCrypto.maskSecrets(merged))}`);
    await sequelize.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
