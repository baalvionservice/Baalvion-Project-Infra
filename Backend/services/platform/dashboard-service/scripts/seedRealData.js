'use strict';
/**
 * Seed the real-data feature tables (formerly inline reference handlers in routes/extras.js) for
 * BOTH the demo org and the platform-admin org, plus the GLOBAL fx_rates table. Idempotent:
 * deletes the org's rows for each table before re-inserting. Values mirror the previous inline
 * data so the UI is visually unchanged but now served from the database.
 *
 * Run from the service dir:  node scripts/seedRealData.js
 */
const db = require('../models');

const DEMO = 'a97b5d4a-3457-4d6d-a2ed-e74fcfb87d86';
const PLATFORM = '52c76e5c-0668-4492-ba20-23e7ee16f49b';
const ORGS = [DEMO, PLATFORM];

async function seedPerOrg(Model, rows) {
    for (const org of ORGS) {
        await Model.destroy({ where: { org_id: org } });
        await Model.bulkCreate(rows.map((r) => ({ ...r, org_id: org })));
    }
}

// ── Corporate actions ────────────────────────────────────────────────────────
const dueDiligenceItems = [
    { item_key: 'dd_1', label: 'Financial statements review', sort_order: 1 },
    { item_key: 'dd_2', label: 'Legal & compliance audit', sort_order: 2 },
    { item_key: 'dd_3', label: 'IP & technology assessment', sort_order: 3 },
    { item_key: 'dd_4', label: 'Customer contract review', sort_order: 4 },
    { item_key: 'dd_5', label: 'HR & key-personnel review', sort_order: 5 },
];
const corporateDeals = [
    { deal_key: 'deal_1', name: 'Project Eagle — Acquisition of Innovate Solutions', type: 'Acquisition', stage: 'Due Diligence', value: '25M', started: '2026-02-15', close_date: '2026-09-30', owner: 'Aisha Rahman', status: 'active', timeline: [] },
    { deal_key: 'deal_2', name: 'Trade House — Minority Stake in PortLink', type: 'Investment', stage: 'Negotiation', value: '8M', started: '2026-03-01', close_date: '2026-08-15', owner: 'Marcus Chen', status: 'active', timeline: [] },
    { deal_key: 'deal_3', name: 'Amarisé — Joint Venture (EU Distribution)', type: 'Joint Venture', stage: 'LOI Signed', value: '15M', started: '2026-04-10', close_date: '2026-11-01', owner: 'Elena Dubois', status: 'active', timeline: [] },
    { deal_key: 'deal_comp_1', name: 'Acquisition of DataLeap Analytics', type: 'Acquisition', value: '12.5M', completed_date: '2025-12-20', status: 'completed', timeline: [
        { date: '2025-09-01', event: 'Initial contact and NDA signed' },
        { date: '2025-09-20', event: 'Letter of Intent (LOI) signed' },
        { date: '2025-10-05', event: 'Due diligence process started' },
        { date: '2025-11-15', event: 'Definitive agreement signed' },
        { date: '2025-12-18', event: 'Regulatory approvals received' },
        { date: '2025-12-20', event: 'Deal closed and funds transferred' },
    ] },
];

// ── GDPR ─────────────────────────────────────────────────────────────────────
const gdprStatusCards = [
    { title: 'Data Inventory', status: 'Complete', description: 'All data assets mapped', sort_order: 1 },
    { title: 'Consent Management', status: 'Active', description: 'Cookie + marketing consent tracked', sort_order: 2 },
    { title: 'DSR Workflow', status: 'Operational', description: 'Subject requests handled within SLA', sort_order: 3 },
    { title: 'Breach Readiness', status: 'Ready', description: '72-hour notification plan in place', sort_order: 4 },
];
const gdprSubjectRequests = [
    { request_key: 'dsr_1', type: 'Access', subject_name: 'John Doe', submitted_at: '2026-04-28T10:00:00Z', status: 'Pending', due_date: '2026-05-28T10:00:00Z' },
    { request_key: 'dsr_2', type: 'Erasure', subject_name: 'Mei Lin', submitted_at: '2026-04-20T09:00:00Z', status: 'Completed', due_date: '2026-05-20T09:00:00Z' },
    { request_key: 'dsr_3', type: 'Portability', subject_name: 'Raj Patel', submitted_at: '2026-05-02T14:00:00Z', status: 'In Progress', due_date: '2026-06-01T14:00:00Z' },
];
const gdprCookieConsent = [
    { domain: 'baalvionmining.com', rate: 92.5 },
    { domain: 'baalviontrade.com', rate: 88.2 },
    { domain: 'amarisemaison.com', rate: 95.1 },
];
const gdprRetentionPolicies = [
    { data_type: 'Customer PII', period: '5 years post-relationship', legal_basis: 'Contractual Necessity, Legal Obligation', sort_order: 1 },
    { data_type: 'Transaction records', period: '7 years', legal_basis: 'Legal Obligation (tax)', sort_order: 2 },
    { data_type: 'Marketing consent', period: 'Until withdrawn', legal_basis: 'Consent', sort_order: 3 },
    { data_type: 'Employee records', period: '6 years post-employment', legal_basis: 'Legal Obligation', sort_order: 4 },
];

// ── Docs ─────────────────────────────────────────────────────────────────────
const docApiCategories = [
    { name: 'Businesses', sort_order: 1, endpoints: [
        { method: 'GET', path: '/api/businesses', description: 'List all businesses in your portfolio.', parameters: [{ name: 'limit', type: 'integer', required: false, description: 'Max results.' }, { name: 'offset', type: 'integer', required: false, description: 'Pagination offset.' }], request: 'curl https://api.baalvion.com/v1/businesses', response: '[{"id":"2","name":"Baalvion Mining Co","country":"UAE","status":"Active"}]' },
    ] },
    { name: 'Employees', sort_order: 2, endpoints: [
        { method: 'GET', path: '/api/employees', description: 'List employees.', parameters: [{ name: 'business_id', type: 'string', required: false, description: 'Filter by business.' }], request: 'curl https://api.baalvion.com/v1/employees', response: '[{"id":1,"name":"Aisha Rahman","department":"Operations"}]' },
    ] },
    { name: 'Finance', sort_order: 3, endpoints: [
        { method: 'GET', path: '/api/financials', description: 'List financial entries.', parameters: [], request: 'curl https://api.baalvion.com/v1/financials', response: '[{"type":"Revenue","amount":1850000}]' },
    ] },
];
const docHelpCategories = [
    { slug: 'getting-started', name: 'Getting Started', description: 'Basics of setting up Baalvion.', sort_order: 1 },
    { slug: 'finance', name: 'Finance & Equity', description: 'Manage finances and cap tables.', sort_order: 2 },
    { slug: 'employees', name: 'People & HR', description: 'Manage your workforce.', sort_order: 3 },
    { slug: 'operations', name: 'Operations', description: 'Daily ops, alerts and automation.', sort_order: 4 },
    { slug: 'compliance', name: 'Compliance', description: 'Stay compliant across regions.', sort_order: 5 },
    { slug: 'billing', name: 'Billing', description: 'Plans, invoices and usage.', sort_order: 6 },
];
const docHelpArticles = [
    { slug: 'adding-your-first-business', title: 'Adding Your First Business', category: 'Getting Started', reading_time: '3 min', last_updated: '2026-05-15', content: 'Adding your first business is the first step to unlocking Baalvion. Go to Businesses → Add Business, fill in the name, country and currency, then save.' },
    { slug: 'understanding-equity', title: 'Understanding Equity & Cap Tables', category: 'Finance & Equity', reading_time: '5 min', last_updated: '2026-05-10', content: "The Equity page shows your cap table with each stakeholder's percentage and USD value derived from the latest valuation." },
    { slug: 'managing-alerts', title: 'Managing Operational Alerts', category: 'Operations', reading_time: '4 min', last_updated: '2026-05-08', content: 'Alerts surface revenue drops, compliance deadlines and high-value events. Configure rules under Operations → Alerts.' },
];
const docFaqs = [
    { question: 'What is Baalvion?', answer: 'Baalvion is a global business operating system to manage businesses, employees, finances and operations from one dashboard.', sort_order: 1 },
    { question: 'How do I add a business?', answer: 'Go to Businesses → Add Business and complete the form.', sort_order: 2 },
    { question: 'Can I manage multiple currencies?', answer: 'Yes — the dashboard converts all figures to USD using live FX rates while preserving local-currency views.', sort_order: 3 },
    { question: 'Is my data secure?', answer: 'Auth uses HttpOnly cookies via a BFF gateway; no tokens are exposed to JavaScript.', sort_order: 4 },
    { question: 'How does billing work?', answer: 'Plans are billed monthly or annually; view invoices and usage under Settings → Billing.', sort_order: 5 },
    { question: 'Can I invite investors?', answer: 'Yes — create read-only Investor Portals under Reports → Investor Portals.', sort_order: 6 },
];

// ── Finance reports ──────────────────────────────────────────────────────────
const financeReports = [
    { report_key: 'rep_1', name: 'Q1 2026 Consolidated P&L', type: 'P&L Statement', period: 'Q1 2026', generated_at: '2026-04-02', size_label: '248 KB' },
    { report_key: 'rep_2', name: 'March 2026 Cash Flow', type: 'Cash Flow', period: 'Mar 2026', generated_at: '2026-04-01', size_label: '180 KB' },
    { report_key: 'rep_3', name: 'Q1 2026 Balance Sheet', type: 'Balance Sheet', period: 'Q1 2026', generated_at: '2026-04-02', size_label: '210 KB' },
    { report_key: 'rep_4', name: 'FY2025 Annual Report', type: 'Annual Report', period: 'FY 2025', generated_at: '2026-01-31', size_label: '1.4 MB' },
];

// ── Billing ──────────────────────────────────────────────────────────────────
const billingSubscriptions = [{
    plan: 'Pro', price: 299, annual_price: 2990, billing_cycle: 'annually', status: 'Active',
    next_billing_date: '2026-07-01',
    payment_method: { type: 'Visa', last4: '4242', expiry: '09/27' },
    contact: { name: 'Demo User', email: 'demo@baalvion.test', company: 'Baalvion Holdings', address: 'DIFC, Dubai, UAE' },
    limits: { businesses: 5, users: 25, apiCalls: 100000, storage: 10 },
    usage: { apiCalls: 48240, storage: 2.4 },
}];
const billingInvoices = [
    { invoice_key: 'INV-2026-006', period: 'June 2026', amount: 299, status: 'Paid', payment_date: '2026-06-01' },
    { invoice_key: 'INV-2026-005', period: 'May 2026', amount: 299, status: 'Paid', payment_date: '2026-05-01' },
    { invoice_key: 'INV-2026-004', period: 'April 2026', amount: 299, status: 'Paid', payment_date: '2026-04-01' },
    { invoice_key: 'INV-2026-003', period: 'March 2026', amount: 299, status: 'Paid', payment_date: '2026-03-01' },
    { invoice_key: 'INV-2026-002', period: 'February 2026', amount: 299, status: 'Paid', payment_date: '2026-02-01' },
    { invoice_key: 'INV-2026-001', period: 'January 2026', amount: 299, status: 'Paid', payment_date: '2026-01-01' },
];

// ── Marketplace ──────────────────────────────────────────────────────────────
const mkApp = (slug, name, category, description, rating, installs, developer, pricing, featured) => ({
    slug, name, category, description, rating, installs, developer, version: '1.2.0', last_updated: '2026-05-20', featured,
    icon: `https://placehold.co/48x48/1A3C6E/ffffff/png?text=${encodeURIComponent(name.charAt(0))}`,
    permissions: ['Read Finance Data', 'Write Invoices', 'Access Business Settings'],
    pricing,
    features: [`${name} core automation`, 'Real-time sync', 'Audit logging', 'Role-based access'],
    screenshots: [
        `https://placehold.co/1200x800/e2e8f0/64748b/png?text=${encodeURIComponent(name + ' — Overview')}`,
        `https://placehold.co/1200x800/e2e8f0/64748b/png?text=${encodeURIComponent(name + ' — Details')}`,
    ],
    reviews: [
        { user: 'Aisha R.', rating: 5, comment: 'Saves us hours every week.' },
        { user: 'Marcus C.', rating: 4, comment: 'Solid, a few rough edges.' },
    ],
});
const marketplaceApps = [
    mkApp('gst-billing-india', 'GST Billing', 'Finance', 'Automate GST invoicing, filing and reconciliation for India.', 4.8, 5200, 'Baalvion Inc.', '$12/month', true),
    mkApp('quickbooks-sync', 'QuickBooks Sync', 'Finance', 'Two-way sync of invoices and ledgers with QuickBooks.', 4.6, 8900, 'Intuit', '$19/month', true),
    mkApp('slack-integration', 'Slack Integration', 'Productivity', 'Push alerts and approvals to Slack channels.', 4.7, 14200, 'Slack', 'Free', false),
    mkApp('hr-onboarding', 'HR Onboarding', 'People', 'Automated onboarding workflows for new hires.', 4.5, 3100, 'Baalvion Inc.', '$9/month', false),
    mkApp('ad-optimizer', 'Ad Optimizer', 'Marketing', 'AI-driven ad spend optimization across channels.', 4.4, 2600, 'AdWorks', '$29/month', false),
];
const marketplaceInstalls = [
    { app_slug: 'quickbooks-sync', installed_at: new Date() },
    { app_slug: 'slack-integration', installed_at: new Date() },
];

// ── Automation ───────────────────────────────────────────────────────────────
const automationCronJobs = [
    { job_key: 'cron_1', name: 'Daily Revenue Sync', description: 'Syncs revenue from all payment gateways.', frequency: 'Daily at 2:00 AM UTC', last_run: '2026-05-28T02:00:15Z', next_run: '2026-05-29T02:00:00Z', duration: '12.5s', status: 'Success' },
    { job_key: 'cron_2', name: 'KPI Snapshot', description: 'Captures hourly KPI metrics.', frequency: 'Hourly', last_run: '2026-05-28T14:00:03Z', next_run: '2026-05-28T15:00:00Z', duration: '3.1s', status: 'Success' },
    { job_key: 'cron_3', name: 'FX Rate Refresh', description: 'Pulls latest FX rates.', frequency: 'Every 6 hours', last_run: '2026-05-28T12:00:00Z', next_run: '2026-05-28T18:00:00Z', duration: '1.8s', status: 'Success' },
    { job_key: 'cron_4', name: 'Weekly Report Mailer', description: 'Emails the Monday summary.', frequency: 'Weekly (Mon 8 AM)', last_run: '2026-05-26T08:00:00Z', next_run: '2026-06-02T08:00:00Z', duration: '8.4s', status: 'Failed' },
];
const automationWebhooks = [
    { event_key: 'wh_1', occurred_at: '2026-05-28T10:30:01Z', event_type: 'payment_intent.succeeded', source: 'Stripe', payload: '{"id":"pi_3P...","amount":50000,"currency":"usd"}', response_code: 200, status: 'Success' },
    { event_key: 'wh_2', occurred_at: '2026-05-28T10:18:44Z', event_type: 'payout.paid', source: 'Razorpay', payload: '{"id":"pout_9","amount":23000}', response_code: 200, status: 'Success' },
    { event_key: 'wh_3', occurred_at: '2026-05-28T09:55:12Z', event_type: 'charge.failed', source: 'PayPal', payload: '{"id":"ch_2","error":"insufficient_funds"}', response_code: 402, status: 'Failed' },
];

// ── Investor portals ─────────────────────────────────────────────────────────
const investorPortals = [
    { portal_key: 'portal_abc123', name: 'Q1 2026 General Update', pin: '1234', included_businesses: ['2', '3', '4'], expires: '2026-10-31', investor_name: 'General Partners' },
    { portal_key: 'portal_gulf01', name: 'Gulf Capital — Mining Brief', pin: '5678', included_businesses: ['2'], expires: '2026-09-15', investor_name: 'Gulf Capital Partners' },
    { portal_key: 'portal_angel7', name: 'Angel Syndicate — Portfolio', pin: '4321', included_businesses: ['3', '4'], expires: '2026-12-01', investor_name: 'Angel Syndicate' },
];

// ── Domain analytics ─────────────────────────────────────────────────────────
const domainAnalytics = [
    { domain_key: 'dom_1', domain: 'baalvionmining.com', business_name: 'Baalvion Mining Co', ssl_status: 'valid', monthly_visitors: 84200, page_views: 312500, avg_session_duration: '3m 12s', web_revenue: 128000, uptime: 99.98, hosting_cost: 420,
        traffic_trend: [{ date: 'Jan', visitors: 61000 }, { date: 'Feb', visitors: 66500 }, { date: 'Mar', visitors: 72000 }, { date: 'Apr', visitors: 78000 }, { date: 'May', visitors: 84200 }],
        top_pages: [{ url: '/', views: 120000, avgTime: '2m 40s', bounceRate: 38 }, { url: '/products', views: 64000, avgTime: '3m 05s', bounceRate: 31 }, { url: '/contact', views: 22000, avgTime: '1m 50s', bounceRate: 52 }],
        traffic_sources: [{ name: 'Organic', value: 48 }, { name: 'Direct', value: 27 }, { name: 'Referral', value: 15 }, { name: 'Social', value: 10 }],
        seo: { da: 62, backlinks: 18400, keywords: 5200 },
        geo_visitors: [{ country: 'UAE', flag: '🇦🇪', visitors: 38000, percentage: 45 }, { country: 'India', flag: '🇮🇳', visitors: 21000, percentage: 25 }, { country: 'UK', flag: '🇬🇧', visitors: 13000, percentage: 15 }],
        revenue_attribution: { orders: 1240, totalValue: 128000 } },
    { domain_key: 'dom_2', domain: 'baalviontrade.com', business_name: 'Baalvion Trade House', ssl_status: 'valid', monthly_visitors: 51800, page_views: 198000, avg_session_duration: '2m 48s', web_revenue: 96000, uptime: 99.95, hosting_cost: 360,
        traffic_trend: [{ date: 'Jan', visitors: 40000 }, { date: 'Feb', visitors: 43000 }, { date: 'Mar', visitors: 46500 }, { date: 'Apr', visitors: 49000 }, { date: 'May', visitors: 51800 }],
        top_pages: [{ url: '/', views: 78000, avgTime: '2m 20s', bounceRate: 41 }, { url: '/marketplace', views: 52000, avgTime: '3m 30s', bounceRate: 28 }],
        traffic_sources: [{ name: 'Organic', value: 40 }, { name: 'Direct', value: 35 }, { name: 'Referral', value: 18 }, { name: 'Social', value: 7 }],
        seo: { da: 55, backlinks: 12100, keywords: 3800 },
        geo_visitors: [{ country: 'Singapore', flag: '🇸🇬', visitors: 26000, percentage: 50 }, { country: 'India', flag: '🇮🇳', visitors: 14000, percentage: 27 }],
        revenue_attribution: { orders: 890, totalValue: 96000 } },
    { domain_key: 'dom_3', domain: 'amarisemaison.com', business_name: 'Amarisé Maison Avenue', ssl_status: 'valid', monthly_visitors: 132400, page_views: 540000, avg_session_duration: '4m 02s', web_revenue: 312000, uptime: 99.99, hosting_cost: 680,
        traffic_trend: [{ date: 'Jan', visitors: 98000 }, { date: 'Feb', visitors: 108000 }, { date: 'Mar', visitors: 118000 }, { date: 'Apr', visitors: 125000 }, { date: 'May', visitors: 132400 }],
        top_pages: [{ url: '/', views: 210000, avgTime: '3m 10s', bounceRate: 34 }, { url: '/collections', views: 140000, avgTime: '4m 40s', bounceRate: 22 }, { url: '/heritage', views: 60000, avgTime: '5m 10s', bounceRate: 19 }],
        traffic_sources: [{ name: 'Organic', value: 52 }, { name: 'Social', value: 24 }, { name: 'Direct', value: 16 }, { name: 'Referral', value: 8 }],
        seo: { da: 71, backlinks: 32500, keywords: 8900 },
        geo_visitors: [{ country: 'France', flag: '🇫🇷', visitors: 58000, percentage: 44 }, { country: 'UK', flag: '🇬🇧', visitors: 34000, percentage: 26 }, { country: 'UAE', flag: '🇦🇪', visitors: 20000, percentage: 15 }],
        revenue_attribution: { orders: 3120, totalValue: 312000 } },
];

// ── AI ───────────────────────────────────────────────────────────────────────
const aiRecommendations = [
    { rec_key: 'opp_1', title: 'Launch premium tier in UK', description: 'Strong market fit for a premium offering in the UK segment.', estimated_impact: '+$120K/yr', confidence: 76, sort_order: 1 },
    { rec_key: 'opp_2', title: 'Cross-sell logistics to trade clients', description: 'Bundle fulfilment with the trade desk.', estimated_impact: '+$90K/yr', confidence: 68, sort_order: 2 },
];
const aiStrategyScenarios = [
    { scenario: 'expand', payload: { cost: '1.5M', timeToRevenue: '9-12 months', riskLevel: 'Medium-High', confidence: 78, requirements: ['Incorporate a local subsidiary.', 'Obtain the relevant operating license.', 'Comply with local data laws.', 'Establish banking relationships.'], competitors: ['Regional Leader A', 'Regional Leader B'], summary: 'Expansion is viable with a 9-12 month runway and medium-high risk.' } },
    { scenario: 'acquire', payload: { roi: '3.2x', integrationCost: '800K', synergySavings: '1.1M/yr', offerRange: '10M - 14M', confidence: 74, summary: 'Acquisition delivers strong synergies; offer within 10-14M.' } },
    { scenario: 'merge', payload: { combinedRevenue: '6.0M', costSavings: '1.4M/yr', redundantHeadcount: 12, newEntityValue: '32M', confidence: 70, summary: 'Merger creates a $32M entity with $1.4M annual savings.' } },
    { scenario: 'windDown', payload: { outstandingLiabilities: '450K', employeeSeverance: '320K', assetLiquidationValue: '1.2M', netPosition: '430K', confidence: 81, summary: 'Orderly wind-down nets a positive $430K after liabilities.' } },
];

// ── Sync ─────────────────────────────────────────────────────────────────────
const week = (base) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({ day, revenue: Math.round(base * (0.8 + (i % 4) * 0.12)) }));
const syncOfflineSnapshots = [{
    todays_revenue: 8320, walk_in_customers: 164, avg_transaction: 50.73,
    top_store: { name: 'Dubai Mall', business: 'Baalvion Mining Co' },
    revenue_last_7_days: week(7800),
}];
const syncConflicts = [
    { conflict_key: 'conflict_1', business_id: '2', field: 'Employee Count', offline_value: '47', online_value: '51', detected_at: '2026-05-28T14:14:00Z', resolved: false },
    { conflict_key: 'conflict_2', business_id: '3', field: 'Inventory SKU-204', offline_value: '120', online_value: '118', detected_at: '2026-05-28T13:02:00Z', resolved: false },
    { conflict_key: 'resolved_1', business_id: '4', field: 'Customer Email', offline_value: 'old@x.com', online_value: 'new@x.com', detected_at: '2026-05-27T09:00:00Z', resolved: true, resolved_by: 'Aisha Rahman', resolved_at: '2026-05-27T10:05:00Z', action: 'Kept Online Value' },
    { conflict_key: 'resolved_2', business_id: '2', field: 'Price List', offline_value: 'v3', online_value: 'v2', detected_at: '2026-05-26T15:00:00Z', resolved: true, resolved_by: 'Marcus Chen', resolved_at: '2026-05-26T16:40:00Z', action: 'Kept Offline Value' },
];

// ── FX rates (GLOBAL — no org_id) ─────────────────────────────────────────────
const now = new Date();
const fxRates = [
    { base: 'USD', code: 'USD', symbol: '$', currency: 'US Dollar', rate: 1, change_24h: 0, change_7d: 0, last_updated: now, as_of: now },
    { base: 'USD', code: 'EUR', symbol: '€', currency: 'Euro', rate: 0.92, change_24h: -0.12, change_7d: 0.30, last_updated: now, as_of: now },
    { base: 'USD', code: 'GBP', symbol: '£', currency: 'British Pound', rate: 0.79, change_24h: 0.08, change_7d: -0.22, last_updated: now, as_of: now },
    { base: 'USD', code: 'AED', symbol: 'AED', currency: 'UAE Dirham', rate: 3.67, change_24h: 0.00, change_7d: 0.01, last_updated: now, as_of: now },
    { base: 'USD', code: 'SGD', symbol: 'S$', currency: 'Singapore Dollar', rate: 1.35, change_24h: 0.05, change_7d: -0.10, last_updated: now, as_of: now },
    { base: 'USD', code: 'INR', symbol: '₹', currency: 'Indian Rupee', rate: 83.2, change_24h: 0.21, change_7d: 0.65, last_updated: now, as_of: now },
];

async function main() {
    await db.sequelize.authenticate();
    await db.sequelize.sync({ alter: false }); // ensure new tables exist

    await seedPerOrg(db.DueDiligenceItem, dueDiligenceItems);
    await seedPerOrg(db.CorporateDeal, corporateDeals);
    await seedPerOrg(db.GdprStatusCard, gdprStatusCards);
    await seedPerOrg(db.GdprSubjectRequest, gdprSubjectRequests);
    await seedPerOrg(db.GdprCookieConsent, gdprCookieConsent);
    await seedPerOrg(db.GdprRetentionPolicy, gdprRetentionPolicies);
    await seedPerOrg(db.DocApiCategory, docApiCategories);
    await seedPerOrg(db.DocHelpCategory, docHelpCategories);
    await seedPerOrg(db.DocHelpArticle, docHelpArticles);
    await seedPerOrg(db.DocFaq, docFaqs);
    await seedPerOrg(db.FinanceReport, financeReports);
    await seedPerOrg(db.BillingSubscription, billingSubscriptions);
    await seedPerOrg(db.BillingInvoice, billingInvoices);
    await seedPerOrg(db.MarketplaceApp, marketplaceApps);
    await seedPerOrg(db.MarketplaceInstall, marketplaceInstalls);
    await seedPerOrg(db.AutomationCronJob, automationCronJobs);
    await seedPerOrg(db.AutomationWebhook, automationWebhooks);
    await seedPerOrg(db.InvestorPortal, investorPortals);
    await seedPerOrg(db.DomainAnalytics, domainAnalytics);
    await seedPerOrg(db.AiRecommendation, aiRecommendations);
    await seedPerOrg(db.AiStrategyScenario, aiStrategyScenarios);
    await seedPerOrg(db.SyncOfflineSnapshot, syncOfflineSnapshots);
    await seedPerOrg(db.SyncConflict, syncConflicts);

    // Global FX rates (not org-scoped)
    await db.FxRate.destroy({ where: {} });
    await db.FxRate.bulkCreate(fxRates);

    console.log('[seedRealData] done — seeded real-data tables for both orgs + global fx_rates.');
    await db.sequelize.close();
}

main().catch((err) => { console.error('[seedRealData] FAILED:', err); process.exit(1); });
