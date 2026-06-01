'use strict';
/**
 * Flip a website's payment provider from `mock` to a REAL provider SANDBOX (test mode)
 * by writing real test-mode keys into the CMS vault and setting config.mode = 'live'.
 *
 * "Stripe/Razorpay test mode" IS the live code path driven by test keys — so this is all
 * that's needed for a real provider sandbox transaction (no code change). The keys are
 * AES-encrypted at rest by secretCrypto (the only crypto authority) exactly like prod keys.
 *
 * Keys come from the ENVIRONMENT (never hard-coded). For safety this script REFUSES
 * non-test keys (must start with sk_test_ / rzp_test_), so it can only enable a sandbox.
 *
 *   # Stripe sandbox (default site = baalvionstack-shop)
 *   STRIPE_TEST_SECRET_KEY=sk_test_xxx STRIPE_TEST_PUBLISHABLE_KEY=pk_test_xxx \
 *   STRIPE_TEST_WEBHOOK_SECRET=whsec_xxx \
 *   node scripts/configureSandboxPayments.cjs --provider stripe --site baalvionstack-shop
 *
 *   # Razorpay sandbox (default site = baalvion-mining)
 *   RAZORPAY_TEST_KEY_ID=rzp_test_xxx RAZORPAY_TEST_KEY_SECRET=xxx \
 *   RAZORPAY_TEST_WEBHOOK_SECRET=xxx \
 *   node scripts/configureSandboxPayments.cjs --provider razorpay --site baalvion-mining
 *
 * Rollback to mock:  node scripts/configurePaymentSites.cjs   (re-sets mode:'mock')
 */
require('dotenv').config();
const { CmsWebsite, CmsWebsiteIntegration, connectDB, sequelize } = require('../models');
const secretCrypto = require('../utils/secretCrypto');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const PROVIDER = String(arg('provider', 'stripe')).toLowerCase();
const DEFAULT_SITE = PROVIDER === 'razorpay' ? 'baalvion-mining' : 'baalvionstack-shop';
const SITE = arg('site', DEFAULT_SITE);

function buildStripe() {
  const secretKey = process.env.STRIPE_TEST_SECRET_KEY;
  const publishableKey = process.env.STRIPE_TEST_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_TEST_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) die('STRIPE_TEST_SECRET_KEY and STRIPE_TEST_WEBHOOK_SECRET are required');
  if (!secretKey.startsWith('sk_test_')) die(`refusing non-test Stripe key (must start with sk_test_) — got "${secretKey.slice(0, 8)}…"`);
  return { secrets: { secretKey, publishableKey: publishableKey || '', webhookSecret }, config: { mode: 'live' } };
}

function buildRazorpay() {
  const keyId = process.env.RAZORPAY_TEST_KEY_ID;
  const keySecret = process.env.RAZORPAY_TEST_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_TEST_WEBHOOK_SECRET;
  if (!keyId || !keySecret || !webhookSecret) die('RAZORPAY_TEST_KEY_ID, RAZORPAY_TEST_KEY_SECRET, RAZORPAY_TEST_WEBHOOK_SECRET are required');
  if (!keyId.startsWith('rzp_test_')) die(`refusing non-test Razorpay key (must start with rzp_test_) — got "${keyId.slice(0, 9)}…"`);
  return { secrets: { keyId, keySecret, webhookSecret }, config: { mode: 'live', baseUrl: 'https://api.razorpay.com' } };
}

function die(msg) { console.error(`[sandbox] ERROR: ${msg}`); process.exit(1); }

(async () => {
  const built = PROVIDER === 'razorpay' ? buildRazorpay() : PROVIDER === 'stripe' ? buildStripe() : die(`unknown provider "${PROVIDER}"`);
  await connectDB();
  const w = await CmsWebsite.findOne({ where: { slug: SITE } });
  if (!w) die(`no CMS website with slug "${SITE}" (run the website seed/bootstrap first)`);

  const existing = await CmsWebsiteIntegration.findOne({ where: { websiteId: w.id, provider: PROVIDER } });
  const prev = existing ? secretCrypto.decrypt(existing.secretsEnc) : {};
  const merged = { ...prev, ...built.secrets };
  const fields = {
    websiteId: w.id, provider: PROVIDER, category: 'payment', label: `${PROVIDER} (sandbox)`,
    config: built.config, secretsEnc: secretCrypto.encrypt(merged), secretHints: secretCrypto.maskSecrets(merged),
    enabled: true, status: 'configured', updatedBy: null,
  };
  if (existing) { await existing.update(fields); }
  else { await CmsWebsiteIntegration.create({ ...fields, createdBy: null }); }

  await sequelize.close();
  console.log(`[sandbox] ${SITE} → ${PROVIDER} SANDBOX (mode=live, test keys, enabled+configured)`);
  console.log('[sandbox] verify:  node warroom/payment_sandbox_e2e.cjs --provider ' + PROVIDER + ' --site ' + SITE);
})().catch((e) => { console.error('[sandbox] ERR', e.message); process.exit(1); });
