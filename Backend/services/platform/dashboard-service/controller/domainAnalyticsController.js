'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { fetchDomainMetrics } = require('../service/analyticsProvider');

exports.get = async (req, res, next) => {
    try {
        const rows = await db.DomainAnalytics.findAll({ where: { org_id: req.user.orgId }, order: [['monthly_visitors', 'DESC']], raw: true });

        const out = await Promise.all(rows.map(async (r) => {
            // Optional live override from an analytics provider (returns null when none configured).
            let live = null;
            try { live = await fetchDomainMetrics(r.domain); } catch (_) { live = null; }
            return {
                id: r.domain_key,
                domain: r.domain,
                businessName: r.business_name,
                sslStatus: r.ssl_status,
                monthlyVisitors: live?.monthlyVisitors ?? r.monthly_visitors,
                pageViews: live?.pageViews ?? r.page_views,
                avgSessionDuration: live?.avgSessionDuration ?? r.avg_session_duration,
                webRevenue: Number(r.web_revenue),
                uptime: Number(r.uptime),
                hostingCost: Number(r.hosting_cost),
                trafficTrend: r.traffic_trend || [],
                topPages: r.top_pages || [],
                trafficSources: r.traffic_sources || [],
                seo: r.seo || {},
                geoVisitors: r.geo_visitors || [],
                revenueAttribution: r.revenue_attribution || {},
            };
        }));

        return sendSuccess(req, res, out);
    } catch (err) { return next(err); }
};
