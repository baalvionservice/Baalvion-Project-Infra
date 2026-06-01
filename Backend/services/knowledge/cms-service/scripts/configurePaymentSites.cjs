'use strict';
/**
 * Configure payment providers in the CMS vault for the 2 Phase-3 test websites.
 * Secrets are AES-encrypted at rest by secretCrypto (the ONLY crypto authority);
 * payment-service resolves them at runtime via sdk.config. mode:'mock' means the
 * adapter simulates order creation (no live merchant account) — flip to 'live'
 * by setting config.mode='live' and real keys, nothing else changes.
 */
require('dotenv').config();
const { CmsWebsite, CmsWebsiteIntegration, connectDB, sequelize } = require('../models');
const secretCrypto = require('../utils/secretCrypto');

const SITES = [
    {
        slug: 'baalvion-mining',
        provider: 'razorpay',
        secrets: { keyId: 'rzp_test_baalvionmining', keySecret: 'rzp_ks_mining', webhookSecret: 'rzp_whsec_mining_e2e' },
        config: { mode: 'mock', baseUrl: 'https://api.razorpay.com' },
    },
    {
        slug: 'baalvionstack-shop',
        provider: 'stripe',
        secrets: { secretKey: 'sk_test_baalvionstack', publishableKey: 'pk_test_baalvionstack', webhookSecret: 'whsec_stack_e2e' },
        config: { mode: 'mock' },
    },
];

(async () => {
    await connectDB();
    for (const s of SITES) {
        const w = await CmsWebsite.findOne({ where: { slug: s.slug } });
        if (!w) { console.log('SKIP (no website):', s.slug); continue; }
        const existing = await CmsWebsiteIntegration.findOne({ where: { websiteId: w.id, provider: s.provider } });
        const prev = existing ? secretCrypto.decrypt(existing.secretsEnc) : {};
        const merged = { ...prev, ...s.secrets };
        const fields = {
            websiteId: w.id,
            provider: s.provider,
            category: 'payment',
            label: s.provider,
            config: s.config,
            secretsEnc: secretCrypto.encrypt(merged),
            secretHints: secretCrypto.maskSecrets(merged),
            enabled: true,
            status: 'configured',
            updatedBy: null,
        };
        if (existing) {
            await existing.update(fields);
            console.log(`updated  ${s.slug} → ${s.provider} (enabled, configured)`);
        } else {
            await CmsWebsiteIntegration.create({ ...fields, createdBy: null });
            console.log(`created  ${s.slug} → ${s.provider} (enabled, configured)`);
        }
    }
    await sequelize.close();
    console.log('DONE: 2 sites configured for payments');
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
