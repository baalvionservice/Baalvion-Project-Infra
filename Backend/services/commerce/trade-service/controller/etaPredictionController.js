'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — live in-transit ETA
 * prediction (delegates scoring to service/tracking-platform/etaPredictionEngine.js).
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const etaEngine = require('../service/tracking-platform/etaPredictionEngine');

function toApi(r) {
    return {
        id: r.id, shipmentId: r.shipment_id, predictedEta: r.predicted_eta,
        confidencePct: r.confidence_pct != null ? Number(r.confidence_pct) : null,
        riskScore: r.risk_score != null ? Number(r.risk_score) : null,
        delayProbabilityPct: r.delay_probability_pct != null ? Number(r.delay_probability_pct) : null,
        factors: r.factors, modelVersion: r.model_version, computedAt: r.computed_at,
    };
}

const listForShipment = async (req, res, next) => {
    try {
        const { limit, offset } = parseListQuery(req.query, { allowedSort: ['computed_at'] });
        const where = { shipment_id: req.params.shipmentId };
        const { count, rows } = await db.EtaPrediction.findAndCountAll({ where, limit, offset, order: [['computed_at', 'DESC']] });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const latest = async (req, res, next) => {
    try {
        const row = await etaEngine.latestPrediction(req.params.shipmentId);
        if (!row) return next(new AppError('NOT_FOUND', 'No ETA prediction yet for this shipment', 404));
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

// POST /eta_predictions/:shipmentId/recompute — force an immediate re-prediction.
const recompute = async (req, res, next) => {
    try {
        const row = await etaEngine.predictEta(req.params.shipmentId);
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) {
        if (err.message === 'shipment not found') return next(new AppError('NOT_FOUND', err.message, 404));
        return next(err);
    }
};

module.exports = { listForShipment, latest, recompute };
