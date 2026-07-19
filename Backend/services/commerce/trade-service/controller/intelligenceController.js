'use strict';
/**
 * @file intelligenceController.js
 * @description Corridor-opportunity scoring — a real statistical aggregation over
 * this tenant's own RFQ + Quotation history (volume, price competitiveness, win-rate,
 * recency trend). No AI/ML — deterministic, explainable scoring computed on demand.
 * Two call modes share one aggregation, differing only in scoring weights:
 *   - 'forecast'    (Calibrate Forecast): balanced — volume, growth, win-rate weighted evenly.
 *   - 'optimization' (Execute Strategic Optimization): accepts a `priority` of
 *     'cost' | 'speed' | 'balanced' and re-weights toward price competitiveness or recency,
 *     mirroring the cheapest/fastest/balanced pattern already used by the logistics optimizer.
 */
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { Op } = require('sequelize');

const DAY_MS = 24 * 60 * 60 * 1000;

async function computeCorridorScores(tenantId, priority) {
    const since90 = new Date(Date.now() - 90 * DAY_MS);
    const rfqs = await db.Rfq.findAll({
        where: { tenant_id: tenantId, created_at: { [Op.gte]: since90 } },
        attributes: ['id', 'origin_country', 'destination_country', 'commodity', 'category', 'target_price', 'created_at'],
    });
    if (rfqs.length === 0) return [];

    const rfqIds = rfqs.map((r) => String(r.id));
    const quotations = await db.Quotation.findAll({
        where: { rfqId: { [Op.in]: rfqIds } },
        attributes: ['id', 'rfqId', 'price', 'status'],
    });
    const quotesByRfq = new Map();
    for (const q of quotations) {
        const list = quotesByRfq.get(q.rfqId) || [];
        list.push(q);
        quotesByRfq.set(q.rfqId, list);
    }

    const corridors = new Map(); // key: origin|destination
    const now = Date.now();
    const recentCutoff = now - 30 * DAY_MS;

    for (const rfq of rfqs) {
        const origin = rfq.origin_country || 'Unspecified';
        const destination = rfq.destination_country || 'Unspecified';
        const key = `${origin}|${destination}`;
        let c = corridors.get(key);
        if (!c) {
            c = {
                originNode: origin, destinationNode: destination,
                rfqCount: 0, recentCount: 0, olderCount: 0,
                targetPrices: [], quotePrices: [], accepted: 0, totalQuotes: 0,
                commodities: new Set(),
            };
            corridors.set(key, c);
        }
        c.rfqCount += 1;
        c.commodities.add(rfq.commodity || rfq.category || 'General');
        const createdAt = new Date(rfq.created_at).getTime();
        if (createdAt >= recentCutoff) c.recentCount += 1; else c.olderCount += 1;
        if (rfq.target_price) c.targetPrices.push(Number(rfq.target_price));

        const quotes = quotesByRfq.get(String(rfq.id)) || [];
        c.totalQuotes += quotes.length;
        for (const q of quotes) {
            if (q.price) c.quotePrices.push(Number(q.price));
            if (q.status === 'accepted') c.accepted += 1;
        }
    }

    const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
    const stddev = (arr) => {
        if (arr.length < 2) return 0;
        const m = avg(arr);
        return Math.sqrt(avg(arr.map((v) => (v - m) ** 2)));
    };

    // Weight profiles: [volume, growth, winRate, priceCompetitiveness]
    const WEIGHTS = {
        forecast: [0.3, 0.3, 0.25, 0.15],
        cost: [0.15, 0.15, 0.2, 0.5],
        speed: [0.2, 0.5, 0.2, 0.1],
        balanced: [0.25, 0.25, 0.25, 0.25],
    };
    const weights = WEIGHTS[priority] || WEIGHTS.forecast;

    const maxRfqCount = Math.max(...[...corridors.values()].map((c) => c.rfqCount), 1);

    const results = [...corridors.entries()].map(([key, c]) => {
        const volumeScore = (c.rfqCount / maxRfqCount) * 100;
        const growthScore = c.olderCount === 0
            ? (c.recentCount > 0 ? 100 : 0)
            : Math.max(0, Math.min(100, ((c.recentCount - c.olderCount) / c.olderCount) * 100 + 50));
        const winRateScore = c.totalQuotes > 0 ? (c.accepted / c.totalQuotes) * 100 : 0;
        const avgTarget = avg(c.targetPrices);
        const avgQuote = avg(c.quotePrices);
        const priceCompetitivenessScore = avgTarget > 0 && avgQuote > 0
            ? Math.max(0, Math.min(100, 100 - Math.abs(avgQuote - avgTarget) / avgTarget * 100))
            : 50;

        const opportunityScore = Math.round(
            volumeScore * weights[0] + growthScore * weights[1] + winRateScore * weights[2] + priceCompetitivenessScore * weights[3],
        );
        const priceStddev = stddev(c.targetPrices);
        const stabilityIndex = avgTarget > 0
            ? Math.round(Math.max(0, Math.min(100, 100 - (priceStddev / avgTarget) * 100)))
            : 100;

        const growthForecast = c.olderCount === 0
            ? (c.recentCount > 0 ? '+100%' : '0%')
            : `${c.recentCount >= c.olderCount ? '+' : ''}${Math.round(((c.recentCount - c.olderCount) / c.olderCount) * 100)}%`;

        return {
            id: key,
            originNode: c.originNode,
            destinationNode: c.destinationNode,
            commodities: [...c.commodities],
            rfqCount: c.rfqCount,
            opportunityScore: Math.max(0, Math.min(100, opportunityScore)),
            stabilityIndex,
            growthForecast,
            winRatePercent: Math.round(winRateScore),
            avgTargetPrice: Math.round(avgTarget * 100) / 100,
        };
    });

    return results.sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 20);
}

const calibrateForecast = async (req, res, next) => {
    try {
        const tenantId = req.auth && (req.auth.tenantId || req.auth.orgId);
        const scores = await computeCorridorScores(tenantId, 'forecast');
        return sendSuccess(req, res, { corridors: scores, computedAt: new Date().toISOString(), mode: 'forecast' });
    } catch (err) {
        return next(err);
    }
};

const executeStrategicOptimization = async (req, res, next) => {
    try {
        const tenantId = req.auth && (req.auth.tenantId || req.auth.orgId);
        const priority = ['cost', 'speed', 'balanced'].includes(req.body?.priority) ? req.body.priority : 'balanced';
        const scores = await computeCorridorScores(tenantId, priority);
        return sendSuccess(req, res, { corridors: scores, computedAt: new Date().toISOString(), mode: 'optimization', priority });
    } catch (err) {
        return next(err);
    }
};

module.exports = { calibrateForecast, executeStrategicOptimization };
