'use strict';
// Dashboard "reference" panels that have no dedicated table: Countries (derived from the org's
// businesses), Corporate Actions and FX Rates (reference data). All auth-gated like other routes.
const { Router } = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { sendSuccess } = require('../utils/response');
const db = require('../models');

const router = Router();

// Countries — aggregated from the org's businesses (domains), grouped by country.
router.get('/countries', authMiddleware, async (req, res, next) => {
    try {
        const rows = await db.sequelize.query(
            `SELECT country AS name, country_code AS code, currency,
                    COUNT(*)::int AS businesses
             FROM dashboard.domains
             WHERE org_id = $1
             GROUP BY country, country_code, currency
             ORDER BY businesses DESC`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [req.auth.orgId] },
        );
        return sendSuccess(req, res, rows);
    } catch (err) { next(err); }
});

// Corporate actions / M&A deals — deal pipeline (no dedicated table yet; served as reference data).
router.get('/corporate-actions', authMiddleware, (req, res) =>
    sendSuccess(req, res, {
        dueDiligenceItems: [
            { id: 'dd_1', label: 'Financial statements review' },
            { id: 'dd_2', label: 'Legal & compliance audit' },
            { id: 'dd_3', label: 'IP & technology assessment' },
            { id: 'dd_4', label: 'Customer contract review' },
            { id: 'dd_5', label: 'HR & key-personnel review' },
        ],
        activeDeals: [
            { id: 'deal_1', name: 'Project Eagle — Acquisition of Innovate Solutions', type: 'Acquisition', stage: 'Due Diligence', value: '25M', started: '2026-02-15', close: '2026-09-30', owner: 'Aisha Rahman' },
            { id: 'deal_2', name: 'Trade House — Minority Stake in PortLink', type: 'Investment', stage: 'Negotiation', value: '8M', started: '2026-03-01', close: '2026-08-15', owner: 'Marcus Chen' },
            { id: 'deal_3', name: 'Amarisé — Joint Venture (EU Distribution)', type: 'Joint Venture', stage: 'LOI Signed', value: '15M', started: '2026-04-10', close: '2026-11-01', owner: 'Elena Dubois' },
        ],
        completedDeals: [
            { id: 'deal_comp_1', name: 'Acquisition of DataLeap Analytics', type: 'Acquisition', value: '12.5M', completed: '2025-12-20', timeline: [
                { date: '2025-09-01', event: 'Initial contact and NDA signed' },
                { date: '2025-09-20', event: 'Letter of Intent (LOI) signed' },
                { date: '2025-10-05', event: 'Due diligence process started' },
                { date: '2025-11-15', event: 'Definitive agreement signed' },
                { date: '2025-12-18', event: 'Regulatory approvals received' },
                { date: '2025-12-20', event: 'Deal closed and funds transferred' },
            ] },
        ],
    }),
);

// FX rates — reference rates vs USD (external data; surfaced for the dashboard).
router.get('/fx-rates', authMiddleware, (req, res) =>
    sendSuccess(req, res, {
        base: 'USD',
        asOf: new Date().toISOString(),
        rates: [
            { code: 'USD', symbol: '$',   currency: 'US Dollar',        rate: 1,    change24h: 0,     change7d: 0,     lastUpdated: 'just now' },
            { code: 'EUR', symbol: '€', currency: 'Euro',          rate: 0.92, change24h: -0.12, change7d: 0.30,  lastUpdated: 'just now' },
            { code: 'GBP', symbol: '£', currency: 'British Pound', rate: 0.79, change24h: 0.08,  change7d: -0.22, lastUpdated: 'just now' },
            { code: 'AED', symbol: 'AED', currency: 'UAE Dirham',       rate: 3.67, change24h: 0.00,  change7d: 0.01,  lastUpdated: 'just now' },
            { code: 'SGD', symbol: 'S$',  currency: 'Singapore Dollar', rate: 1.35, change24h: 0.05,  change7d: -0.10, lastUpdated: 'just now' },
            { code: 'INR', symbol: '₹', currency: 'Indian Rupee',  rate: 83.2, change24h: 0.21,  change7d: 0.65,  lastUpdated: 'just now' },
        ],
    }),
);

// Finance reports — recently generated downloadable reports (no file store yet; reference list).
router.get('/finance-reports', authMiddleware, (req, res) =>
    sendSuccess(req, res, [
        { id: 'rep_1', name: 'Q1 2026 Consolidated P&L', type: 'P&L Statement', period: 'Q1 2026', generated: '2026-04-02', size: '248 KB' },
        { id: 'rep_2', name: 'March 2026 Cash Flow', type: 'Cash Flow', period: 'Mar 2026', generated: '2026-04-01', size: '180 KB' },
        { id: 'rep_3', name: 'Q1 2026 Balance Sheet', type: 'Balance Sheet', period: 'Q1 2026', generated: '2026-04-02', size: '210 KB' },
        { id: 'rep_4', name: 'FY2025 Annual Report', type: 'Annual Report', period: 'FY 2025', generated: '2026-01-31', size: '1.4 MB' },
    ]),
);

// Domain (web) analytics — per-site web metrics (no web-analytics table yet; reference data).
router.get('/domain-analytics', authMiddleware, (req, res) =>
    sendSuccess(req, res, [
        {
            id: 'dom_1', domain: 'baalvionmining.com', businessName: 'Baalvion Mining Co', sslStatus: 'valid',
            monthlyVisitors: 84200, pageViews: 312500, avgSessionDuration: '3m 12s', webRevenue: 128000, uptime: 99.98, hostingCost: 420,
            trafficTrend: [{ date: 'Jan', visitors: 61000 }, { date: 'Feb', visitors: 66500 }, { date: 'Mar', visitors: 72000 }, { date: 'Apr', visitors: 78000 }, { date: 'May', visitors: 84200 }],
            topPages: [{ url: '/', views: 120000, avgTime: '2m 40s', bounceRate: 38 }, { url: '/products', views: 64000, avgTime: '3m 05s', bounceRate: 31 }, { url: '/contact', views: 22000, avgTime: '1m 50s', bounceRate: 52 }],
            trafficSources: [{ name: 'Organic', value: 48 }, { name: 'Direct', value: 27 }, { name: 'Referral', value: 15 }, { name: 'Social', value: 10 }],
            seo: { da: 62, backlinks: 18400, keywords: 5200 },
            geoVisitors: [{ country: 'UAE', flag: '🇦🇪', visitors: 38000, percentage: 45 }, { country: 'India', flag: '🇮🇳', visitors: 21000, percentage: 25 }, { country: 'UK', flag: '🇬🇧', visitors: 13000, percentage: 15 }],
            revenueAttribution: { orders: 1240, totalValue: 128000 },
        },
        {
            id: 'dom_2', domain: 'baalviontrade.com', businessName: 'Baalvion Trade House', sslStatus: 'valid',
            monthlyVisitors: 51800, pageViews: 198000, avgSessionDuration: '2m 48s', webRevenue: 96000, uptime: 99.95, hostingCost: 360,
            trafficTrend: [{ date: 'Jan', visitors: 40000 }, { date: 'Feb', visitors: 43000 }, { date: 'Mar', visitors: 46500 }, { date: 'Apr', visitors: 49000 }, { date: 'May', visitors: 51800 }],
            topPages: [{ url: '/', views: 78000, avgTime: '2m 20s', bounceRate: 41 }, { url: '/marketplace', views: 52000, avgTime: '3m 30s', bounceRate: 28 }],
            trafficSources: [{ name: 'Organic', value: 40 }, { name: 'Direct', value: 35 }, { name: 'Referral', value: 18 }, { name: 'Social', value: 7 }],
            seo: { da: 55, backlinks: 12100, keywords: 3800 },
            geoVisitors: [{ country: 'Singapore', flag: '🇸🇬', visitors: 26000, percentage: 50 }, { country: 'India', flag: '🇮🇳', visitors: 14000, percentage: 27 }],
            revenueAttribution: { orders: 890, totalValue: 96000 },
        },
        {
            id: 'dom_3', domain: 'amarisemaison.com', businessName: 'Amarisé Maison Avenue', sslStatus: 'valid',
            monthlyVisitors: 132400, pageViews: 540000, avgSessionDuration: '4m 02s', webRevenue: 312000, uptime: 99.99, hostingCost: 680,
            trafficTrend: [{ date: 'Jan', visitors: 98000 }, { date: 'Feb', visitors: 108000 }, { date: 'Mar', visitors: 118000 }, { date: 'Apr', visitors: 125000 }, { date: 'May', visitors: 132400 }],
            topPages: [{ url: '/', views: 210000, avgTime: '3m 10s', bounceRate: 34 }, { url: '/collections', views: 140000, avgTime: '4m 40s', bounceRate: 22 }, { url: '/heritage', views: 60000, avgTime: '5m 10s', bounceRate: 19 }],
            trafficSources: [{ name: 'Organic', value: 52 }, { name: 'Social', value: 24 }, { name: 'Direct', value: 16 }, { name: 'Referral', value: 8 }],
            seo: { da: 71, backlinks: 32500, keywords: 8900 },
            geoVisitors: [{ country: 'France', flag: '🇫🇷', visitors: 58000, percentage: 44 }, { country: 'UK', flag: '🇬🇧', visitors: 34000, percentage: 26 }, { country: 'UAE', flag: '🇦🇪', visitors: 20000, percentage: 15 }],
            revenueAttribution: { orders: 3120, totalValue: 312000 },
        },
    ]),
);

// GDPR / data-privacy posture — reference data (no privacy-ops table yet).
router.get('/gdpr', authMiddleware, (req, res) =>
    sendSuccess(req, res, {
        statusCards: [
            { title: 'Data Inventory', status: 'Complete', description: 'All data assets mapped' },
            { title: 'Consent Management', status: 'Active', description: 'Cookie + marketing consent tracked' },
            { title: 'DSR Workflow', status: 'Operational', description: 'Subject requests handled within SLA' },
            { title: 'Breach Readiness', status: 'Ready', description: '72-hour notification plan in place' },
        ],
        subjectRequests: [
            { id: 'dsr_1', type: 'Access', name: 'John Doe', submitted: '2026-04-28T10:00:00Z', status: 'Pending', dueDate: '2026-05-28T10:00:00Z' },
            { id: 'dsr_2', type: 'Erasure', name: 'Mei Lin', submitted: '2026-04-20T09:00:00Z', status: 'Completed', dueDate: '2026-05-20T09:00:00Z' },
            { id: 'dsr_3', type: 'Portability', name: 'Raj Patel', submitted: '2026-05-02T14:00:00Z', status: 'In Progress', dueDate: '2026-06-01T14:00:00Z' },
        ],
        cookieConsent: [
            { domain: 'baalvionmining.com', rate: 92.5 },
            { domain: 'baalviontrade.com', rate: 88.2 },
            { domain: 'amarisemaison.com', rate: 95.1 },
        ],
        retentionPolicies: [
            { dataType: 'Customer PII', period: '5 years post-relationship', legalBasis: 'Contractual Necessity, Legal Obligation' },
            { dataType: 'Transaction records', period: '7 years', legalBasis: 'Legal Obligation (tax)' },
            { dataType: 'Marketing consent', period: 'Until withdrawn', legalBasis: 'Consent' },
            { dataType: 'Employee records', period: '6 years post-employment', legalBasis: 'Legal Obligation' },
        ],
    }),
);

// AI — revenue predictions, growth opportunities, risk alerts + strategic scenarios (reference data).
router.get('/ai', authMiddleware, (req, res) =>
    sendSuccess(req, res, {
        predictions: {
            confidenceScore: 78,
            revenuePredictions: [
                { businessId: '2', currentMrr: 1850000, forecasts: { threeMonth: 2050000, sixMonth: 2300000, twelveMonth: 2800000 }, confidence: 82 },
                { businessId: '3', currentMrr: 2100000, forecasts: { threeMonth: 2250000, sixMonth: 2500000, twelveMonth: 3050000 }, confidence: 75 },
                { businessId: '4', currentMrr: 1890000, forecasts: { threeMonth: 1950000, sixMonth: 2100000, twelveMonth: 2400000 }, confidence: 71 },
            ],
            growthOpportunities: [
                { id: 'opp_1', title: 'Launch premium tier in UK', description: 'Strong market fit for a premium offering in the UK segment.', estimatedImpact: '+$120K/yr', confidence: 76 },
                { id: 'opp_2', title: 'Cross-sell logistics to trade clients', description: 'Bundle fulfilment with the trade desk.', estimatedImpact: '+$90K/yr', confidence: 68 },
            ],
            riskAlerts: [
                { id: 'risk_1', business: 'Baalvion Trade House', description: 'High dependency on 2 clients (68% of revenue).', level: 'HIGH' },
                { id: 'risk_2', business: 'Amarisé Maison Avenue', description: 'FX exposure on EUR-denominated costs.', level: 'MEDIUM' },
            ],
        },
        strategy: {
            expand: { cost: '1.5M', timeToRevenue: '9-12 months', riskLevel: 'Medium-High', confidence: 78, requirements: ['Incorporate a local subsidiary.', 'Obtain the relevant operating license.', 'Comply with local data laws.', 'Establish banking relationships.'], competitors: ['Regional Leader A', 'Regional Leader B'], summary: 'Expansion is viable with a 9-12 month runway and medium-high risk.' },
            acquire: { roi: '3.2x', integrationCost: '800K', synergySavings: '1.1M/yr', offerRange: '10M - 14M', confidence: 74, summary: 'Acquisition delivers strong synergies; offer within 10-14M.' },
            merge: { combinedRevenue: '6.0M', costSavings: '1.4M/yr', redundantHeadcount: 12, newEntityValue: '32M', confidence: 70, summary: 'Merger creates a $32M entity with $1.4M annual savings.' },
            windDown: { outstandingLiabilities: '450K', employeeSeverance: '320K', assetLiquidationValue: '1.2M', netPosition: '430K', confidence: 81, summary: 'Orderly wind-down nets a positive $430K after liabilities.' },
        },
    }),
);

// Sync — online/offline sales snapshots + data conflicts (no sync table yet; reference data).
router.get('/sync', authMiddleware, (req, res) => {
    const week = (base) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({ day, revenue: Math.round(base * (0.8 + (i % 4) * 0.12)) }));
    return sendSuccess(req, res, {
        online: { todaysRevenue: 12840, ordersToday: 284, avgOrderValue: 45.21, topChannels: { website: 62, app: 38 }, revenueLast7Days: week(10500) },
        offline: { todaysRevenue: 8320, walkInCustomers: 164, avgTransaction: 50.73, topStore: { name: 'Dubai Mall', business: 'Baalvion Mining Co' }, revenueLast7Days: week(7800) },
        conflicts: [
            { id: 'conflict_1', businessId: '2', field: 'Employee Count', offlineValue: '47', onlineValue: '51', detectedAt: '2026-05-28T14:14:00Z' },
            { id: 'conflict_2', businessId: '3', field: 'Inventory SKU-204', offlineValue: '120', onlineValue: '118', detectedAt: '2026-05-28T13:02:00Z' },
        ],
        resolvedConflicts: [
            { id: 'resolved_1', field: 'Customer Email', businessId: '4', resolvedBy: 'Aisha Rahman', resolvedAt: '2026-05-27T10:05:00Z', action: 'Kept Online Value' },
            { id: 'resolved_2', field: 'Price List', businessId: '2', resolvedBy: 'Marcus Chen', resolvedAt: '2026-05-26T16:40:00Z', action: 'Kept Offline Value' },
        ],
    });
});

// Billing — subscription, usage, contact + invoice history (no billing table yet; reference data).
router.get('/billing', authMiddleware, (req, res) =>
    sendSuccess(req, res, {
        subscription: { plan: 'Pro', price: 299, annualPrice: 2990, billingCycle: 'annually', status: 'Active', nextBillingDate: '2026-07-01', paymentMethod: { type: 'Visa', last4: '4242', expiry: '09/27' } },
        usage: {
            businesses: { used: 3, limit: 5 },
            users: { used: 14, limit: 25 },
            apiCalls: { used: 48240, limit: 100000 },
            storage: { used: 2.4, limit: 10 },
        },
        billingContact: { name: 'Demo User', email: 'demo@baalvion.test', company: 'Baalvion Holdings', address: 'DIFC, Dubai, UAE' },
        invoices: Array.from({ length: 6 }, (_, i) => {
            const m = 5 - i; const d = new Date(2026, m, 1);
            return { id: `INV-2026-${String(m + 1).padStart(3, '0')}`, period: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }), amount: 299, status: 'Paid', paymentDate: d.toISOString().slice(0, 10) };
        }),
    }),
);

// Marketplace — installable apps catalog + installed list (no marketplace table yet; reference data).
router.get('/marketplace', authMiddleware, (req, res) => {
    const mkApp = (slug, name, category, description, rating, installs, developer, pricing, featured) => ({
        slug, name, category, description, rating, installs, developer, version: '1.2.0', lastUpdated: '2026-05-20',
        featured, icon: `/icons/${slug}.png`,
        permissions: ['Read Finance Data', 'Write Invoices', 'Access Business Settings'],
        pricing,
        features: [`${name} core automation`, 'Real-time sync', 'Audit logging', 'Role-based access'],
        screenshots: [`/screens/${slug}-1.png`, `/screens/${slug}-2.png`],
        reviews: [
            { user: 'Aisha R.', rating: 5, comment: 'Saves us hours every week.' },
            { user: 'Marcus C.', rating: 4, comment: 'Solid, a few rough edges.' },
        ],
    });
    return sendSuccess(req, res, {
        apps: [
            mkApp('gst-billing-india', 'GST Billing', 'Finance', 'Automate GST invoicing, filing and reconciliation for India.', 4.8, 5200, 'Baalvion Inc.', '$12/month', true),
            mkApp('quickbooks-sync', 'QuickBooks Sync', 'Finance', 'Two-way sync of invoices and ledgers with QuickBooks.', 4.6, 8900, 'Intuit', '$19/month', true),
            mkApp('slack-integration', 'Slack Integration', 'Productivity', 'Push alerts and approvals to Slack channels.', 4.7, 14200, 'Slack', 'Free', false),
            mkApp('hr-onboarding', 'HR Onboarding', 'People', 'Automated onboarding workflows for new hires.', 4.5, 3100, 'Baalvion Inc.', '$9/month', false),
            mkApp('ad-optimizer', 'Ad Optimizer', 'Marketing', 'AI-driven ad spend optimization across channels.', 4.4, 2600, 'AdWorks', '$29/month', false),
        ],
        installed: ['quickbooks-sync', 'slack-integration'],
    });
});

// Automation — scheduled jobs + recent webhook deliveries (no automation table yet; reference data).
router.get('/automation', authMiddleware, (req, res) =>
    sendSuccess(req, res, {
        cronJobs: [
            { id: 'cron_1', name: 'Daily Revenue Sync', description: 'Syncs revenue from all payment gateways.', frequency: 'Daily at 2:00 AM UTC', lastRun: '2026-05-28T02:00:15Z', nextRun: '2026-05-29T02:00:00Z', duration: '12.5s', status: 'Success' },
            { id: 'cron_2', name: 'KPI Snapshot', description: 'Captures hourly KPI metrics.', frequency: 'Hourly', lastRun: '2026-05-28T14:00:03Z', nextRun: '2026-05-28T15:00:00Z', duration: '3.1s', status: 'Success' },
            { id: 'cron_3', name: 'FX Rate Refresh', description: 'Pulls latest FX rates.', frequency: 'Every 6 hours', lastRun: '2026-05-28T12:00:00Z', nextRun: '2026-05-28T18:00:00Z', duration: '1.8s', status: 'Success' },
            { id: 'cron_4', name: 'Weekly Report Mailer', description: 'Emails the Monday summary.', frequency: 'Weekly (Mon 8 AM)', lastRun: '2026-05-26T08:00:00Z', nextRun: '2026-06-02T08:00:00Z', duration: '8.4s', status: 'Failed' },
        ],
        webhooks: [
            { id: 'wh_1', timestamp: '2026-05-28T10:30:01Z', eventType: 'payment_intent.succeeded', source: 'Stripe', payload: '{"id":"pi_3P...","amount":50000,"currency":"usd"}', responseCode: 200, status: 'Success' },
            { id: 'wh_2', timestamp: '2026-05-28T10:18:44Z', eventType: 'payout.paid', source: 'Razorpay', payload: '{"id":"pout_9","amount":23000}', responseCode: 200, status: 'Success' },
            { id: 'wh_3', timestamp: '2026-05-28T09:55:12Z', eventType: 'charge.failed', source: 'PayPal', payload: '{"id":"ch_2","error":"insufficient_funds"}', responseCode: 402, status: 'Failed' },
        ],
    }),
);

// Investor portals — shareable report portals (no portal-registry surfaced yet; reference list).
router.get('/portals', authMiddleware, (req, res) =>
    sendSuccess(req, res, [
        { id: 'portal_abc123', name: 'Q1 2026 General Update', url: '/portal/portal_abc123', pin: '1234', includedBusinesses: ['2', '3', '4'], expires: '2026-10-31', investorName: 'General Partners' },
        { id: 'portal_gulf01', name: 'Gulf Capital — Mining Brief', url: '/portal/portal_gulf01', pin: '5678', includedBusinesses: ['2'], expires: '2026-09-15', investorName: 'Gulf Capital Partners' },
        { id: 'portal_angel7', name: 'Angel Syndicate — Portfolio', url: '/portal/portal_angel7', pin: '4321', includedBusinesses: ['3', '4'], expires: '2026-12-01', investorName: 'Angel Syndicate' },
    ]),
);

module.exports = router;
