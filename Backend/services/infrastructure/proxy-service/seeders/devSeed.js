'use strict';
const bcrypt = require('bcrypt');
const crypto = require('crypto');

let db = null;
try { db = require('../models'); } catch (_) {}

const DEMO_ORG_ID = 'a0000000-0000-0000-0000-000000000001';
// No committed credential: take the demo password from env, else generate a random
// one per run (logged below) so a fixed password can never become a live backdoor.
const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD || `dev-${crypto.randomBytes(6).toString('hex')}`;

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const COUNTRIES = ['US', 'GB', 'DE', 'JP', 'FR', 'BR', 'AU', 'CA', 'IN', 'SG'];
const PROXY_TYPES = ['residential', 'datacenter', 'mobile'];
const PROXY_STATUSES = ['healthy', 'healthy', 'healthy', 'degraded', 'offline'];

let seeded = false;

const run = async () => {
  if (seeded || !db) return;
  // Defense-in-depth: never seed demo accounts outside development, even if called directly.
  if (process.env.NODE_ENV === 'production') {
    console.warn('Dev seed: refusing to run in production.');
    return;
  }
  seeded = true;

  // Check if already seeded
  try {
    const orgCount = await db.organizations.count({ where: { id: DEMO_ORG_ID } });
    if (orgCount > 0) {
      console.log('Dev seed: data already exists, skipping.');
      return;
    }
  } catch (err) {
    console.warn('Dev seed check error:', err.message);
    return;
  }

  console.log('Dev seed: seeding development data...');
  if (!process.env.DEMO_SEED_PASSWORD) {
    console.log(`Dev seed: generated demo user password = ${DEMO_PASSWORD} (set DEMO_SEED_PASSWORD to pin it)`);
  }
  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // ── Organizations ──────────────────────────────────────────────────────────
  await db.organizations.create({
    id: DEMO_ORG_ID,
    slug: 'acme-global',
    name: 'Acme Global',
    status: 'active',
    plan_slug: 'enterprise',
    bandwidth_limit_gb: 5000,
    bandwidth_used_gb: 3460,
  });

  const org2 = await db.organizations.create({
    slug: 'techflow-inc',
    name: 'TechFlow Inc',
    status: 'active',
    plan_slug: 'growth',
    bandwidth_limit_gb: 1200,
    bandwidth_used_gb: 876,
  });

  const org3 = await db.organizations.create({
    slug: 'dataprime-dev',
    name: 'DataPrime',
    status: 'active',
    plan_slug: 'starter',
    bandwidth_limit_gb: 200,
    bandwidth_used_gb: 89,
  });

  const org4 = await db.organizations.create({
    slug: 'scrapelabs-co',
    name: 'ScrapeLabs',
    status: 'suspended',
    plan_slug: 'growth',
    bandwidth_limit_gb: 1200,
    bandwidth_used_gb: 1100,
  });

  // ── Plans ──────────────────────────────────────────────────────────────────
  const planStarter = await db.plans.create({
    name: 'Starter',
    price: 49,
    bandwidth_limit: 200,
    proxy_types_allowed: ['residential'],
    overage_price: 5,
    session_limits: 10,
    rotation_rules: { mode: 'rotating' },
  });
  const planGrowth = await db.plans.create({
    name: 'Growth',
    price: 199,
    bandwidth_limit: 1200,
    proxy_types_allowed: ['residential', 'datacenter'],
    overage_price: 3,
    session_limits: 50,
    rotation_rules: { mode: 'rotating', stickyOptions: ['5min', '10min'] },
  });
  const planEnterprise = await db.plans.create({
    name: 'Enterprise',
    price: 899,
    bandwidth_limit: 5000,
    proxy_types_allowed: ['residential', 'datacenter', 'mobile'],
    overage_price: 1.5,
    session_limits: 0,
    rotation_rules: { mode: 'smart', stickyOptions: ['5min', '10min', '30min'] },
  });
  // Pay As You Go — metered ($3/GB), prepaid credit. Hidden from the main pricing
  // tiers (publicPlans filters it out); it has its own dedicated pricing card.
  await db.plans.create({
    name: 'Pay As You Go',
    price: 0,
    bandwidth_limit: 0,
    proxy_types_allowed: ['residential', 'datacenter', 'mobile'],
    overage_price: 3,
    session_limits: 0,
    rotation_rules: { mode: 'rotating' },
  });

  // ── Users ──────────────────────────────────────────────────────────────────
  const userOwner = await db.users.create({
    email: 'admin@baalvion.com',
    password_hash: hash,
    role: 'owner',
    status: 'active',
    plan_id: planEnterprise.id,
    org_id: DEMO_ORG_ID,
    full_name: 'Platform Owner',
    mfa_enabled: false,
    email_verified_at: new Date(),
  });

  const userAdmin = await db.users.create({
    email: 'platform@baalvion.com',
    password_hash: hash,
    role: 'platform_admin',
    status: 'active',
    plan_id: planEnterprise.id,
    org_id: DEMO_ORG_ID,
    full_name: 'Platform Admin',
    mfa_enabled: false,
    email_verified_at: new Date(),
  });

  // test@baalvion.com login
  const userTest = await db.users.create({
    email: 'test@baalvion.com',
    password_hash: hash,
    role: 'owner',
    status: 'active',
    plan_id: planEnterprise.id,
    org_id: DEMO_ORG_ID,
    full_name: 'Test User',
    mfa_enabled: false,
    email_verified_at: new Date(),
  });

  const userMember = await db.users.create({
    email: 'member@acme.com',
    password_hash: hash,
    role: 'member',
    status: 'active',
    plan_id: planGrowth.id,
    org_id: DEMO_ORG_ID,
    full_name: 'Alice Johnson',
    mfa_enabled: false,
    email_verified_at: new Date(),
  });

  // Extra users for other orgs
  const userTF = await db.users.create({
    email: 'ops@techflow.io',
    password_hash: hash,
    role: 'owner',
    status: 'active',
    plan_id: planGrowth.id,
    org_id: org2.id,
    full_name: 'TechFlow Admin',
    mfa_enabled: false,
    email_verified_at: new Date(),
  });

  const userDP = await db.users.create({
    email: 'hello@dataprime.dev',
    password_hash: hash,
    role: 'owner',
    status: 'active',
    plan_id: planStarter.id,
    org_id: org3.id,
    full_name: 'DataPrime Admin',
    mfa_enabled: false,
    email_verified_at: new Date(),
  });

  // ── Org Memberships ────────────────────────────────────────────────────────
  await db.org_memberships.create({ org_id: DEMO_ORG_ID, user_id: userOwner.id, role: 'owner', invited_by: userOwner.id });
  await db.org_memberships.create({ org_id: DEMO_ORG_ID, user_id: userAdmin.id, role: 'admin', invited_by: userOwner.id });
  await db.org_memberships.create({ org_id: DEMO_ORG_ID, user_id: userTest.id, role: 'owner', invited_by: userOwner.id });
  await db.org_memberships.create({ org_id: DEMO_ORG_ID, user_id: userMember.id, role: 'member', invited_by: userOwner.id });
  await db.org_memberships.create({ org_id: org2.id, user_id: userTF.id, role: 'owner', invited_by: userTF.id });
  await db.org_memberships.create({ org_id: org3.id, user_id: userDP.id, role: 'owner', invited_by: userDP.id });

  // ── Providers ─────────────────────────────────────────────────────────────
  const provBright = await db.providers.create({
    name: 'Bright Data',
    priority: 1,
    failover_enabled: true,
    health_score: 98.5,
    countries_supported: COUNTRIES,
    type: 'residential',
    status: 'healthy',
    success_rate: 98.5,
    latency: 180,
  });
  const provOxy = await db.providers.create({
    name: 'Oxylabs',
    priority: 2,
    failover_enabled: true,
    health_score: 88.4,
    countries_supported: ['US', 'GB', 'DE', 'JP'],
    type: 'residential',
    status: 'degraded',
    success_rate: 88.4,
    latency: 870,
  });
  const provSmart = await db.providers.create({
    name: 'Smartproxy',
    priority: 3,
    failover_enabled: true,
    health_score: 97.4,
    countries_supported: COUNTRIES,
    type: 'datacenter',
    status: 'healthy',
    success_rate: 97.4,
    latency: 230,
  });

  // ── Proxies ────────────────────────────────────────────────────────────────
  const proxyDefs = [
    { ip: '198.51.100.10', type: 'residential', country: 'US', status: 'healthy', bw: 640, rate: 98.8, lat: 211, name: 'Primary Residential US', prov: provBright.id },
    { ip: '198.51.100.20', type: 'residential', country: 'GB', status: 'healthy', bw: 320, rate: 97.2, lat: 240, name: 'UK Residential', prov: provBright.id },
    { ip: '203.0.113.10', type: 'datacenter', country: 'DE', status: 'healthy', bw: 890, rate: 99.1, lat: 95, name: 'DE Datacenter', prov: provSmart.id },
    { ip: '203.0.113.20', type: 'datacenter', country: 'JP', status: 'healthy', bw: 210, rate: 96.5, lat: 310, name: 'JP Datacenter', prov: provSmart.id },
    { ip: '198.51.100.30', type: 'mobile', country: 'US', status: 'healthy', bw: 180, rate: 94.3, lat: 480, name: 'US Mobile', prov: provBright.id },
    { ip: '198.51.100.40', type: 'residential', country: 'FR', status: 'degraded', bw: 450, rate: 82.1, lat: 680, name: 'FR Residential', prov: provOxy.id },
    { ip: '203.0.113.30', type: 'datacenter', country: 'SG', status: 'healthy', bw: 120, rate: 98.0, lat: 280, name: 'SG Datacenter', prov: provSmart.id },
    { ip: '198.51.100.50', type: 'residential', country: 'AU', status: 'healthy', bw: 90, rate: 97.8, lat: 350, name: 'AU Residential', prov: provBright.id },
    { ip: '203.0.113.40', type: 'datacenter', country: 'CA', status: 'offline', bw: 0, rate: 0, lat: 9999, name: 'CA Datacenter (offline)', prov: provSmart.id },
    { ip: '198.51.100.60', type: 'mobile', country: 'IN', status: 'healthy', bw: 60, rate: 91.2, lat: 520, name: 'IN Mobile', prov: provBright.id },
    { ip: '203.0.113.50', type: 'residential', country: 'BR', status: 'healthy', bw: 140, rate: 95.6, lat: 390, name: 'BR Residential', prov: provBright.id },
    { ip: '198.51.100.70', type: 'datacenter', country: 'US', status: 'healthy', bw: 1200, rate: 99.5, lat: 55, name: 'US Datacenter Premium', prov: provSmart.id },
  ];

  for (const p of proxyDefs) {
    await db.proxies.create({
      provider_id: p.prov,
      type: p.type,
      ip: p.ip,
      port: randInt(9000, 9999),
      country: p.country,
      status: p.status,
      success_rate: p.rate,
      latency: p.lat,
      bandwidth_limit: 500,
      bandwidth_used: p.bw,
      health_score: p.rate,
      org_id: DEMO_ORG_ID,
      name: p.name,
      protocol: 'http',
      username: 'proxyuser',
      password: 'proxypass123',
    });
  }

  // ── Presets ────────────────────────────────────────────────────────────────
  const presetData = [
    { name: 'US Residential HTTP', type: 'residential', country: 'US', protocol: 'http', rotation: 'rotating' },
    { name: 'DE Datacenter SOCKS5', type: 'datacenter', country: 'DE', protocol: 'socks5', rotation: 'sticky-10min' },
    { name: 'Multi-Country Mobile', type: 'mobile', country: 'Multi', protocol: 'http', rotation: 'rotating' },
    { name: 'SEO Campaign EU', type: 'residential', country: 'GB', protocol: 'http', rotation: 'sticky-30min' },
    { name: 'API Scraper Fast', type: 'datacenter', country: 'US', protocol: 'http', rotation: 'rotating' },
  ];
  for (const p of presetData) {
    await db.presets.create({ org_id: DEMO_ORG_ID, ...p });
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────
  const now = new Date();
  const sub1 = await db.subscriptions.create({
    user_id: userOwner.id,
    plan_id: planEnterprise.id,
    status: 'active',
    current_period_start: daysAgo(15),
    current_period_end: new Date(now.getTime() + 15 * 86400000),
    cancel_at_period_end: false,
    org_id: DEMO_ORG_ID,
    plan_slug: 'enterprise',
    enforcement_mode: 'pay-as-you-go',
    stripe_customer_id: 'cus_demo_001',
    stripe_subscription_id: 'sub_demo_stripe_001',
  });

  await db.subscriptions.create({
    user_id: userTF.id,
    plan_id: planGrowth.id,
    status: 'active',
    current_period_start: daysAgo(5),
    current_period_end: new Date(now.getTime() + 25 * 86400000),
    cancel_at_period_end: false,
    org_id: org2.id,
    plan_slug: 'growth',
    enforcement_mode: 'pay-as-you-go',
  });

  // ── Invoices ───────────────────────────────────────────────────────────────
  const invoiceData = [
    { amount: 89900, status: 'paid', daysAgoN: 90 },
    { amount: 89900, status: 'paid', daysAgoN: 60 },
    { amount: 89900, status: 'paid', daysAgoN: 30 },
    { amount: 89900, status: 'pending', daysAgoN: 1 },
  ];
  for (const inv of invoiceData) {
    const issued = daysAgo(inv.daysAgoN);
    const due = new Date(issued.getTime() + 7 * 86400000);
    await db.invoices.create({
      user_id: userOwner.id,
      subscription_id: sub1.id,
      amount: inv.amount / 100,
      tax: (inv.amount / 100 * 0.18),
      total: (inv.amount / 100 * 1.18),
      status: inv.status,
      issued_at: issued,
      due_at: due,
      org_id: DEMO_ORG_ID,
    });
  }

  // ── Payment Methods ────────────────────────────────────────────────────────
  await db.payment_methods.create({
    user_id: userOwner.id,
    gateway: 'stripe',
    last4: '4242',
    brand: 'visa',
    expiry: '12/29',
    is_default: true,
    org_id: DEMO_ORG_ID,
  });
  await db.payment_methods.create({
    user_id: userOwner.id,
    gateway: 'razorpay',
    last4: '5555',
    brand: 'mastercard',
    expiry: '08/27',
    is_default: false,
    org_id: DEMO_ORG_ID,
  });

  // ── Usage Records (30 days) ────────────────────────────────────────────────
  for (let i = 29; i >= 0; i--) {
    const periodDate = daysAgo(i);
    const bw = randFloat(80, 140);
    await db.usage_records.create({
      org_id: DEMO_ORG_ID,
      period_start: periodDate,
      period_end: periodDate,
      bandwidth_gb: bw,
      requests: randInt(6000, 12000),
      success_rate: randFloat(95, 99.5),
      avg_latency_ms: randInt(180, 310),
    });
  }

  // ── Provider Health ────────────────────────────────────────────────────────
  for (const prov of [provBright, provSmart]) {
    await db.provider_health.create({
      provider_id: prov.id,
      latency_ms: randInt(150, 300),
      success_rate: randFloat(96, 99),
      status: 'healthy',
    });
  }
  await db.provider_health.create({
    provider_id: provOxy.id,
    latency_ms: 870,
    success_rate: 88.4,
    status: 'degraded',
  });

  // ── Provider Incidents ────────────────────────────────────────────────────
  await db.provider_incidents.create({
    provider_id: provOxy.id,
    title: 'Increased latency in APAC region',
    status: 'open',
    started_at: daysAgo(2),
  });
  await db.provider_incidents.create({
    provider_id: provBright.id,
    title: 'Brief connectivity issue resolved',
    status: 'resolved',
    started_at: daysAgo(7),
    resolved_at: daysAgo(6),
  });

  // ── Routing Rules ─────────────────────────────────────────────────────────
  await db.routing_rules.create({
    priority: 1,
    name: 'Default Residential',
    match: { type: 'residential' },
    provider_id: provBright.id,
  });
  await db.routing_rules.create({
    priority: 2,
    name: 'Datacenter Traffic',
    match: { type: 'datacenter' },
    provider_id: provSmart.id,
  });
  await db.routing_rules.create({
    priority: 3,
    name: 'Mobile Traffic',
    match: { type: 'mobile' },
    provider_id: provBright.id,
  });
  await db.routing_rules.create({
    priority: 10,
    name: 'Fallback Oxylabs',
    match: {},
    provider_id: provOxy.id,
  });

  // ── Notifications ─────────────────────────────────────────────────────────
  await db.notifications.create({ org_id: DEMO_ORG_ID, title: 'Usage threshold warning', body: 'You have used 80% of your bandwidth. Consider upgrading your plan.' });
  await db.notifications.create({ org_id: DEMO_ORG_ID, title: 'New invoice generated', body: 'Invoice #INV-2026-004 for $899.00 is ready to view.' });
  await db.notifications.create({ org_id: DEMO_ORG_ID, title: 'Provider incident resolved', body: 'The Bright Data APAC connectivity issue has been resolved.' });
  await db.notifications.create({ org_id: DEMO_ORG_ID, title: 'Security alert', body: 'Login from new IP address 203.0.113.99 detected.', read_at: new Date() });

  // ── Audit Logs ────────────────────────────────────────────────────────────
  const auditEntries = [
    { action: 'org.updated', entity_type: 'organization', entity_id: 1 },
    { action: 'proxy.created', entity_type: 'proxy', entity_id: 1 },
    { action: 'user.login', entity_type: 'user', entity_id: userOwner.id },
    { action: 'plan.upgraded', entity_type: 'subscription', entity_id: sub1.id },
    { action: 'api_key.created', entity_type: 'api_key', entity_id: 1 },
  ];
  for (const e of auditEntries) {
    await db.audit_logs.create({
      org_id: DEMO_ORG_ID,
      admin_id: userOwner.id,
      action: e.action,
      entity_type: e.entity_type,
      entity_id: e.entity_id,
      details: {},
    });
  }

  // ── Support Tickets ───────────────────────────────────────────────────────
  const ticket1 = await db.support_tickets.create({ org_id: DEMO_ORG_ID, subject: 'Proxy rotation not working as expected', status: 'open', priority: 'high' });
  const ticket2 = await db.support_tickets.create({ org_id: DEMO_ORG_ID, subject: 'Billing invoice discrepancy', status: 'pending', priority: 'normal' });
  const ticket3 = await db.support_tickets.create({ org_id: DEMO_ORG_ID, subject: 'Feature request: SOCKS5 per-country', status: 'resolved', priority: 'low' });

  await db.ticket_messages.create({ org_id: DEMO_ORG_ID, ticket_id: ticket1.id, author_user_id: userOwner.id, message: 'Hi, I set up rotating residential proxies but every request hits the same IP. Is this a config issue?' });
  await db.ticket_messages.create({ org_id: DEMO_ORG_ID, ticket_id: ticket1.id, author_user_id: userAdmin.id, message: 'Thank you for reaching out. Can you share your proxy endpoint and rotation settings?' });
  await db.ticket_messages.create({ org_id: DEMO_ORG_ID, ticket_id: ticket2.id, author_user_id: userOwner.id, message: 'Invoice INV-2026-003 shows $899 but I expected $749 based on the promo code.' });

  // ── Abuse Logs ────────────────────────────────────────────────────────────
  await db.abuse_logs.create({ org_id: DEMO_ORG_ID, user_id: userMember.id, event_type: 'rate_limit_exceeded', risk_score: 72, action_taken: 'throttled', resolved: false, severity: 'medium', reason: 'Burst request anomaly detected: 450 req/min' });
  await db.abuse_logs.create({ org_id: DEMO_ORG_ID, user_id: userOwner.id, event_type: 'unusual_geo', risk_score: 35, action_taken: 'flagged', resolved: true, severity: 'low', reason: 'Login from unusual geographic location' });

  // ── Feature Flags ─────────────────────────────────────────────────────────
  const flags = [
    { key: 'smart-routing', description: 'Enable intelligent provider routing based on performance', default_value: true, plans: ['enterprise'] },
    { key: 'socks5-support', description: 'Enable SOCKS5 protocol for proxies', default_value: false, plans: ['growth', 'enterprise'] },
    { key: 'bulk-export', description: 'Allow bulk proxy export in multiple formats', default_value: true, plans: ['growth', 'enterprise'] },
    { key: 'advanced-analytics', description: 'Enable advanced analytics dashboard', default_value: false, plans: ['enterprise'] },
    { key: 'geo-targeting', description: 'Enable precise geo-targeting for proxies', default_value: true, plans: ['growth', 'enterprise'] },
  ];
  for (const f of flags) {
    try {
      await db.feature_flags.create({ key: f.key, description: f.description, default_value: f.default_value, plans: f.plans });
    } catch (_) {} // may already exist
  }

  // ── API Keys ──────────────────────────────────────────────────────────────
  await db.api_keys.create({
    org_id: DEMO_ORG_ID,
    name: 'Production API Key',
    key_prefix: 'bns_prod_01',
    key_hash: 'hash_demo_prod',
    created_by: userOwner.id,
  });
  await db.api_keys.create({
    org_id: DEMO_ORG_ID,
    name: 'Development API Key',
    key_prefix: 'bns_dev_001',
    key_hash: 'hash_demo_dev',
    created_by: userOwner.id,
  });

  console.log('Dev seed: completed successfully.');
};

module.exports = { run };
