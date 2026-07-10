'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — live in-transit ETA
 * re-prediction. Distinct from service/freight/eta.js (a pure pre-booking
 * quote-ETA calculator): this engine re-scores an ALREADY-BOOKED shipment's
 * delivery estimate using its carrier's track record, open delay causes, and
 * weather/traffic signals for the destination lane.
 *
 * Deterministic rule/statistics-based scoring by default; the model_version
 * column lets a future Gemini-backed model (already a registered provider —
 * providers/index.js's 'ai' entry) coexist without a schema change.
 */
const db = require('../../models');
const weatherProvider = require('../../providers/weather');
const trafficProvider = require('../../providers/traffic');
const { createAlert } = require('./alertEngine');

const MODEL_VERSION = 'rule-based-v1';

/** Base confidence starts high and is eroded by risk factors. */
function scoreConfidence({ onTimePct, openDelayCount, weatherRisk, trafficRisk }) {
    let confidence = onTimePct != null ? Number(onTimePct) : 80;
    confidence -= openDelayCount * 10;
    confidence -= weatherRisk * 0.3;
    confidence -= trafficRisk * 0.3;
    return Math.max(5, Math.min(99, Math.round(confidence)));
}

function scoreRisk({ openDelayCount, weatherRisk, trafficRisk, etaAccuracyPct }) {
    let risk = openDelayCount * 20;
    risk += weatherRisk * 0.4;
    risk += trafficRisk * 0.4;
    if (etaAccuracyPct != null) risk += Math.max(0, 70 - Number(etaAccuracyPct));
    return Math.max(0, Math.min(100, Math.round(risk)));
}

/**
 * Recompute + persist an ETA prediction for a shipment, raising an
 * `eta_changed` alert when the predicted date moves by more than a day from
 * the shipment's current `estimated_arrival`.
 */
async function predictEta(shipmentId) {
    const shipment = await db.TradeShipment.findByPk(shipmentId);
    if (!shipment) throw new Error('shipment not found');

    const openDelays = await db.DelayEvent.count({ where: { shipment_id: shipmentId, resolved: false } });

    let carrierPerf = null;
    if (shipment.carrier_id) {
        carrierPerf = await db.CarrierPerformance.findOne({
            where: { carrier_id: shipment.carrier_id },
            order: [['period_end', 'DESC']],
        });
    }

    const laneLabel = `${shipment.origin_port || shipment.origin_country || ''}->${shipment.destination_port || shipment.destination_country || ''}`;
    const weather = await weatherProvider.conditionsFor(laneLabel);
    const traffic = await trafficProvider.congestionFor(laneLabel);

    const onTimePct = carrierPerf ? Number(carrierPerf.on_time_pct) : null;
    const etaAccuracyPct = carrierPerf ? Number(carrierPerf.eta_accuracy_pct) : null;
    const weatherRisk = weather.delayRiskPct || 0;
    const trafficRisk = traffic.delayRiskPct || 0;

    const confidencePct = scoreConfidence({ onTimePct, openDelayCount: openDelays, weatherRisk, trafficRisk });
    const riskScore = scoreRisk({ openDelayCount: openDelays, weatherRisk, trafficRisk, etaAccuracyPct });
    const delayProbabilityPct = Math.min(100, Math.round(riskScore * 0.9));

    const baseEta = shipment.estimated_arrival ? new Date(shipment.estimated_arrival) : new Date();
    const extraDelayDays = Math.round((openDelays * 1) + (weatherRisk + trafficRisk) / 50);
    const predictedEta = new Date(baseEta.getTime() + extraDelayDays * 86400000);

    const prediction = await db.EtaPrediction.create({
        tenant_id: shipment.tenant_id,
        shipment_id: shipmentId,
        predicted_eta: predictedEta,
        confidence_pct: confidencePct,
        risk_score: riskScore,
        delay_probability_pct: delayProbabilityPct,
        model_version: MODEL_VERSION,
        factors: {
            onTimePct, etaAccuracyPct, openDelays,
            weather: { condition: weather.condition, delayRiskPct: weatherRisk },
            traffic: { congestionPct: traffic.congestionPct, delayRiskPct: trafficRisk },
        },
    });

    const driftDays = Math.abs(predictedEta.getTime() - baseEta.getTime()) / 86400000;
    if (driftDays >= 1) {
        await createAlert({
            shipmentId, alertType: 'eta_changed', severity: driftDays >= 3 ? 'high' : 'medium',
            message: `ETA re-predicted to ${predictedEta.toISOString().slice(0, 10)} (was ${baseEta.toISOString().slice(0, 10)})`,
            metadata: { predictedEta: predictedEta.toISOString(), previousEta: baseEta.toISOString(), riskScore },
            tenantId: shipment.tenant_id,
        });
    }

    return prediction;
}

async function latestPrediction(shipmentId) {
    return db.EtaPrediction.findOne({ where: { shipment_id: shipmentId }, order: [['computed_at', 'DESC']] });
}

module.exports = { predictEta, latestPrediction, scoreConfidence, scoreRisk, MODEL_VERSION };
