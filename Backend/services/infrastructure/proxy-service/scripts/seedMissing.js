require('dotenv').config({ path: '.env' });
const db = require('../models');
const DEMO_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

function daysAgo(n) { return new Date(Date.now() - n * 86400000); }
function randFloat(a, b) { return +(a + Math.random() * (b - a)).toFixed(2); }
function randInt(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }

async function seed() {
  await db.sequelize.authenticate();

  const userOwner = await db.users.findOne({ where: { email: 'admin@baalvion.com' } });
  const userAdmin = await db.users.findOne({ where: { email: 'platform@baalvion.com' } });
  const userMember = await db.users.findOne({ where: { email: 'member@acme.com' } });
  const userTF = await db.users.findOne({ where: { email: 'ops@techflow.io' } });
  const planE = await db.plans.findOne({ where: { name: 'Enterprise' } });
  const planG = await db.plans.findOne({ where: { name: 'Growth' } });
  const org2 = await db.organizations.findOne({ where: { slug: 'techflow' } });
  const provBright = await db.providers.findOne({ where: { name: 'Bright Data' } });
  const provSmart = await db.providers.findOne({ where: { name: 'Smartproxy' } });
  const provOxy = await db.providers.findOne({ where: { name: 'Oxylabs' } });

  console.log('Entities:', { userOwner: !!userOwner, planE: !!planE, org2: !!org2, provBright: !!provBright });

  const now = new Date();

  // Subscriptions
  const [sub1] = await db.subscriptions.findOrCreate({
    where: { org_id: DEMO_ORG_ID, user_id: userOwner.id },
    defaults: {
      plan_id: planE.id, status: 'active',
      current_period_start: daysAgo(15),
      current_period_end: new Date(now.getTime() + 15 * 86400000),
      cancel_at_period_end: false, org_id: DEMO_ORG_ID, plan_slug: 'enterprise',
      enforcement_mode: 'pay-as-you-go', stripe_customer_id: 'cus_demo_001',
      stripe_subscription_id: 'sub_demo_stripe_001',
    }
  });
  if (org2) {
    await db.subscriptions.findOrCreate({
      where: { org_id: org2.id, user_id: userTF.id },
      defaults: {
        plan_id: planG.id, status: 'active',
        current_period_start: daysAgo(5),
        current_period_end: new Date(now.getTime() + 25 * 86400000),
        cancel_at_period_end: false, org_id: org2.id, plan_slug: 'growth',
        enforcement_mode: 'pay-as-you-go',
      }
    });
  }
  console.log('Subscriptions done');

  // Invoices
  const invCount = await db.invoices.count({ where: { org_id: DEMO_ORG_ID } });
  if (invCount === 0) {
    for (const inv of [
      { amount: 899, status: 'paid', d: 90 },
      { amount: 899, status: 'paid', d: 60 },
      { amount: 899, status: 'paid', d: 30 },
      { amount: 899, status: 'pending', d: 1 },
    ]) {
      const issued = daysAgo(inv.d);
      await db.invoices.create({
        user_id: userOwner.id, subscription_id: sub1.id,
        amount: inv.amount, tax: inv.amount * 0.18, total: inv.amount * 1.18,
        status: inv.status, issued_at: issued,
        due_at: new Date(issued.getTime() + 7 * 86400000), org_id: DEMO_ORG_ID,
      });
    }
    console.log('Invoices done');
  }

  // Payment methods
  const pmCount = await db.payment_methods.count({ where: { org_id: DEMO_ORG_ID } });
  if (pmCount === 0) {
    await db.payment_methods.create({ user_id: userOwner.id, gateway: 'stripe', last4: '4242', brand: 'visa', expiry: '12/29', is_default: true, org_id: DEMO_ORG_ID });
    await db.payment_methods.create({ user_id: userOwner.id, gateway: 'razorpay', last4: '5555', brand: 'mastercard', expiry: '08/27', is_default: false, org_id: DEMO_ORG_ID });
    console.log('Payment methods done');
  }

  // Usage Records
  const urCount = await db.usage_records.count({ where: { org_id: DEMO_ORG_ID } });
  if (urCount === 0) {
    for (let i = 29; i >= 0; i--) {
      const d = daysAgo(i);
      await db.usage_records.create({
        org_id: DEMO_ORG_ID, period_start: d, period_end: d,
        bandwidth_gb: randFloat(80, 140), requests: randInt(6000, 12000),
        success_rate: randFloat(95, 99.5), avg_latency_ms: randInt(180, 310),
      });
    }
    console.log('Usage records done');
  }

  // Provider health & incidents
  if (provBright) { try { await db.provider_health.create({ provider_id: provBright.id, latency_ms: randInt(150, 300), success_rate: randFloat(96, 99), status: 'healthy' }); } catch (_) {} }
  if (provSmart) { try { await db.provider_health.create({ provider_id: provSmart.id, latency_ms: randInt(150, 300), success_rate: randFloat(96, 99), status: 'healthy' }); } catch (_) {} }
  if (provOxy) { try { await db.provider_health.create({ provider_id: provOxy.id, latency_ms: 870, success_rate: 88.4, status: 'degraded' }); } catch (_) {} }
  if (provOxy) { try { await db.provider_incidents.create({ provider_id: provOxy.id, title: 'Increased latency in APAC region', status: 'open', started_at: daysAgo(2) }); } catch (_) {} }
  if (provBright) { try { await db.provider_incidents.create({ provider_id: provBright.id, title: 'Brief connectivity issue resolved', status: 'resolved', started_at: daysAgo(7), resolved_at: daysAgo(6) }); } catch (_) {} }
  console.log('Provider health/incidents done');

  // Routing Rules
  const rrCount = await db.routing_rules.count();
  if (rrCount === 0 && provBright && provSmart && provOxy) {
    await db.routing_rules.create({ priority: 1, name: 'Default Residential', match: { type: 'residential' }, provider_id: provBright.id });
    await db.routing_rules.create({ priority: 2, name: 'Datacenter Traffic', match: { type: 'datacenter' }, provider_id: provSmart.id });
    await db.routing_rules.create({ priority: 3, name: 'Mobile Traffic', match: { type: 'mobile' }, provider_id: provBright.id });
    await db.routing_rules.create({ priority: 10, name: 'Fallback Oxylabs', match: {}, provider_id: provOxy.id });
    console.log('Routing rules done');
  }

  // Notifications
  const notifCount = await db.notifications.count({ where: { org_id: DEMO_ORG_ID } });
  if (notifCount === 0) {
    await db.notifications.create({ org_id: DEMO_ORG_ID, title: 'Usage threshold warning', body: 'You have used 80% of your bandwidth.' });
    await db.notifications.create({ org_id: DEMO_ORG_ID, title: 'New invoice generated', body: 'Invoice INV-2026-004 for $899.00 is ready.' });
    await db.notifications.create({ org_id: DEMO_ORG_ID, title: 'Provider incident resolved', body: 'Bright Data APAC connectivity issue resolved.' });
    console.log('Notifications done');
  }

  // Audit logs
  const alCount = await db.audit_logs.count({ where: { org_id: DEMO_ORG_ID } });
  if (alCount === 0) {
    for (const e of [
      { action: 'org.updated', entity_type: 'organization', entity_id: 1 },
      { action: 'proxy.created', entity_type: 'proxy', entity_id: 1 },
      { action: 'user.login', entity_type: 'user', entity_id: userOwner.id },
    ]) {
      await db.audit_logs.create({ org_id: DEMO_ORG_ID, admin_id: userOwner.id, action: e.action, entity_type: e.entity_type, entity_id: e.entity_id, details: {} });
    }
    console.log('Audit logs done');
  }

  // Support Tickets
  const tkCount = await db.support_tickets.count({ where: { org_id: DEMO_ORG_ID } });
  if (tkCount === 0) {
    const tk1 = await db.support_tickets.create({ org_id: DEMO_ORG_ID, subject: 'Proxy rotation not working', status: 'open', priority: 'high' });
    const tk2 = await db.support_tickets.create({ org_id: DEMO_ORG_ID, subject: 'Billing invoice discrepancy', status: 'pending', priority: 'normal' });
    await db.support_tickets.create({ org_id: DEMO_ORG_ID, subject: 'Feature request: SOCKS5 per-country', status: 'resolved', priority: 'low' });
    await db.ticket_messages.create({ org_id: DEMO_ORG_ID, ticket_id: tk1.id, author_user_id: userOwner.id, message: 'Rotating residential proxies hitting same IP.' });
    await db.ticket_messages.create({ org_id: DEMO_ORG_ID, ticket_id: tk2.id, author_user_id: userOwner.id, message: 'Invoice shows $899 but expected $749.' });
    console.log('Support tickets done');
  }

  // Abuse logs
  const abuseCount = await db.abuse_logs.count({ where: { org_id: DEMO_ORG_ID } });
  if (abuseCount === 0) {
    await db.abuse_logs.create({ org_id: DEMO_ORG_ID, user_id: userMember.id, event_type: 'rate_limit_exceeded', risk_score: 72, action_taken: 'throttled', resolved: false, severity: 'medium', reason: 'Burst request anomaly: 450 req/min' });
    await db.abuse_logs.create({ org_id: DEMO_ORG_ID, user_id: userOwner.id, event_type: 'unusual_geo', risk_score: 35, action_taken: 'flagged', resolved: true, severity: 'low', reason: 'Login from unusual geographic location' });
    console.log('Abuse logs done');
  }

  // Feature Flags
  const ffData = [
    { key: 'smart-routing', description: 'Enable intelligent provider routing', default_value: true, plans: ['enterprise'] },
    { key: 'socks5-support', description: 'Enable SOCKS5 protocol', default_value: false, plans: ['growth', 'enterprise'] },
    { key: 'bulk-export', description: 'Allow bulk proxy export', default_value: true, plans: ['growth', 'enterprise'] },
    { key: 'advanced-analytics', description: 'Enable advanced analytics', default_value: false, plans: ['enterprise'] },
    { key: 'geo-targeting', description: 'Enable precise geo-targeting', default_value: true, plans: ['growth', 'enterprise'] },
  ];
  for (const f of ffData) {
    try { await db.feature_flags.create({ key: f.key, description: f.description, default_value: f.default_value, plans: f.plans }); } catch (_) {}
  }
  console.log('Feature flags done');

  // API keys
  const akCount = await db.api_keys.count({ where: { org_id: DEMO_ORG_ID } });
  if (akCount === 0) {
    await db.api_keys.create({ org_id: DEMO_ORG_ID, name: 'Production API Key', key_prefix: 'bns_prod_01', key_hash: 'hash_demo_prod', created_by: userOwner.id });
    await db.api_keys.create({ org_id: DEMO_ORG_ID, name: 'Development API Key', key_prefix: 'bns_dev_001', key_hash: 'hash_demo_dev', created_by: userOwner.id });
    console.log('API keys done');
  }

  console.log('All missing data seeded successfully!');
  process.exit(0);
}

seed().catch(e => { console.error('Error:', e.message); console.error(e.stack); process.exit(1); });
