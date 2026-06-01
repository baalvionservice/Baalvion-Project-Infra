'use strict';
/**
 * Phase-3 rollout (batch 2): enable real payments for the first two rollout sites —
 * Proxy-BaalvionStack (razorpay) and Baalvion Elite Circle (stripe). Registers the
 * Elite Circle CMS tenant if missing, then stores each provider's keys + webhook
 * secret in the CMS vault (AES via secretCrypto). mode:'mock' until live keys land.
 */
require('dotenv').config();
const { CmsWebsite, CmsWebsiteIntegration, connectDB, sequelize } = require('../models');
const secretCrypto = require('../utils/secretCrypto');

const PROXY_ORG = '52c76e5c-0668-4492-ba20-23e7ee16f49b'; // same org as proxy-baalvionstack

const SITES = [
    {
        slug: 'proxy-baalvionstack', provider: 'razorpay',
        secrets: { keyId: 'rzp_test_proxy', keySecret: 'rzp_ks_proxy', webhookSecret: 'rzp_whsec_proxy' },
        config: { mode: 'mock', baseUrl: 'https://api.razorpay.com' },
    },
    {
        slug: 'baalvion-elite-circle', provider: 'stripe',
        ensureWebsite: { name: 'Baalvion Elite Circle', organizationId: PROXY_ORG },
        secrets: { secretKey: 'sk_test_elite', publishableKey: 'pk_test_elite', webhookSecret: 'whsec_elite' },
        config: { mode: 'mock' },
    },
];

(async () => {
    await connectDB();
    for (const s of SITES) {
        let w = await CmsWebsite.findOne({ where: { slug: s.slug } });
        if (!w && s.ensureWebsite) {
            w = await CmsWebsite.create({
                organizationId: s.ensureWebsite.organizationId,
                name: s.ensureWebsite.name,
                slug: s.slug,
                domain: `${s.slug}.baalvion.com`,
                status: 'active',
                createdBy: 1,
            });
            console.log(`registered CMS tenant: ${s.slug} (${s.ensureWebsite.name})`);
        }
        if (!w) { console.log('SKIP (no website + no ensure):', s.slug); continue; }

        const existing = await CmsWebsiteIntegration.findOne({ where: { websiteId: w.id, provider: s.provider } });
        const merged = { ...(existing ? secretCrypto.decrypt(existing.secretsEnc) : {}), ...s.secrets };
        const fields = {
            websiteId: w.id, provider: s.provider, category: 'payment', label: s.provider,
            config: s.config, secretsEnc: secretCrypto.encrypt(merged), secretHints: secretCrypto.maskSecrets(merged),
            enabled: true, status: 'configured', updatedBy: null,
        };
        if (existing) { await existing.update(fields); console.log(`updated  ${s.slug} → ${s.provider}`); }
        else { await CmsWebsiteIntegration.create({ ...fields, createdBy: null }); console.log(`created  ${s.slug} → ${s.provider}`); }
    }
    await sequelize.close();
    console.log('DONE: 2 rollout sites configured for payments');
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
