'use strict';
/**
 * Freight Management — Quote Requests (Phase 3, Prompt 2).
 *
 * Persists the OUTPUT of a freight quote request (tradeops.freight_quotes +
 * freight_quote_items + freight_comparisons, migration 049). Distinct from the
 * EPHEMERAL marketplace comparison at POST /v1/freight/quotes
 * (freightMarketplaceController.compareQuotes, no persistence, fixed 4-carrier
 * enum) — this fans out across every ACTIVE carrier in the dynamic Carrier
 * Directory (tradeops.carriers), prices each one with a full charge breakdown
 * (freight + the tenant's own Rate Engine rules + fuel/terminal/handling/customs/
 * insurance/tax), and persists a scored comparison the caller can page through
 * without re-quoting.
 *
 * Reuses rather than duplicates: service/freight/normalize.js (canonical request +
 * chargeable weight), service/freight/connectors (buildConnectorForCarrier — coded
 * connector when the carrier has one, GenericConnector otherwise), and
 * service/freight/rateEngine.js (the tenant's persisted pricing rules layer on top
 * of each carrier's own simulated/live base rate).
 */
const db = require('../models');
const norm = require('../service/freight/normalize');
const { EMISSION_FACTORS } = require('../service/logistics/schema');
const connectors = require('../service/freight/connectors');
const rateEngine = require('../service/freight/rateEngine');
const scoring = require('../service/freight/comparisonScoring');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { createFreightQuoteSchema } = require('../validators/freightQuote.schema');
const { auditLogistics } = require('../utils/logisticsAudit');

const QUOTE_TTL_HOURS = 48;
const ENGINE_VERSION = 'freight-quote-engine@1.0.0';

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}
function actorOf(req) {
    return (req.auth && (req.auth.userId || req.auth.email)) || 'system';
}
function num(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

/** Sum of a connector-normalized quote's surcharges matching one or more codes. */
function surchargeTotal(surcharges = [], codes) {
    return surcharges.filter((s) => codes.includes(s.code)).reduce((sum, s) => sum + num(s.amount), 0);
}

/**
 * Price one carrier's normalized quote into the full charge breakdown the spec asks
 * for. Fuel comes straight from the connector; terminal/handling/customs/insurance/
 * tax are documented first-pass estimates (no live terminal-tariff or duty-engine
 * integration in this phase) layered on top of the tenant's own Rate Engine
 * adjustment of the carrier's base linehaul.
 */
async function priceCarrierQuote({ quote, carrierRow, request, tenantId, mode, originCode, destinationCode }) {
    // Every surcharge the connector priced in (FUEL, RESI, ...) is stripped out of
    // `amount` to isolate the pure linehaul, then the tenant's Rate Engine rules are
    // applied to THAT linehaul before fuel is re-added — so a contract/discount rule
    // adjusts freight cost, not the carrier's own fuel surcharge.
    const fuelSurcharge = Number(surchargeTotal(quote.surcharges, ['FUEL']).toFixed(2));
    const nonFuelSurcharges = Number(quote.surcharges.filter((s) => s.code !== 'FUEL').reduce((sum, s) => sum + num(s.amount), 0).toFixed(2));
    const linehaul = Number(Math.max(0, quote.amount - fuelSurcharge - nonFuelSurcharges).toFixed(2));

    const { finalRate: adjustedLinehaul, appliedRules } = await rateEngine.previewRate({
        tenantId, carrierId: carrierRow ? carrierRow.id : null, originCode, destinationCode, mode,
        baseRate: linehaul, weightKg: request.chargeable_weight_kg, volumeCbm: 0, fuelPct: 0, date: null,
    });

    const terminalCharge = Number((adjustedLinehaul * 0.02).toFixed(2)); // 2% terminal handling estimate
    const handlingCharge = 15; // flat handling fee estimate
    const customsCharge = 0; // duty estimation not integrated into freight quotes in this phase
    const insuranceEstimate = request.insurance_requested
        ? Number(Math.max(5, request.declared_value * 0.005).toFixed(2)) // 0.5% of declared value, $5 floor
        : 0;
    const taxEstimate = 0; // tax/duty estimation not integrated into freight quotes in this phase

    const totalAmount = Number((adjustedLinehaul + fuelSurcharge + terminalCharge + handlingCharge + customsCharge + insuranceEstimate + taxEstimate).toFixed(2));
    // Rough per-mode emission estimate (kg CO2 per tonne-km factor applied directly to
    // chargeable weight, since Phase 1 has no lane-distance network wired into
    // freight quotes yet — service/logistics/optimizer.js's route-level CO2 is
    // distance-aware and should supersede this once route optimization is linked in).
    const carbonEstimateKg = Number(((EMISSION_FACTORS[mode] || EMISSION_FACTORS.road) * request.chargeable_weight_kg).toFixed(2));

    return {
        carrierId: carrierRow ? carrierRow.id : null,
        serviceLevel: quote.service_level,
        baseFreight: adjustedLinehaul,
        fuelSurcharge,
        terminalCharge,
        handlingCharge,
        customsCharge,
        insuranceEstimate,
        taxEstimate,
        totalAmount,
        currency: quote.currency,
        transitDays: quote.transit_days,
        carbonEstimateKg,
        appliedRateRules: appliedRules,
    };
}

function toItemApi(r) {
    return {
        id: r.id, carrierId: r.carrier_id, serviceLevel: r.service_level,
        baseFreight: Number(r.base_freight), fuelSurcharge: Number(r.fuel_surcharge),
        terminalCharge: Number(r.terminal_charge), handlingCharge: Number(r.handling_charge),
        customsCharge: Number(r.customs_charge), insuranceEstimate: Number(r.insurance_estimate),
        taxEstimate: Number(r.tax_estimate), totalAmount: Number(r.total_amount), currency: r.currency,
        transitDays: r.transit_days, carbonEstimateKg: r.carbon_estimate_kg != null ? Number(r.carbon_estimate_kg) : null,
        rankCheapest: r.rank_cheapest, rankFastest: r.rank_fastest, rankBest: r.rank_best, selected: r.selected,
    };
}

function toComparisonApi(r) {
    return {
        carrierId: r.carrier_id, rank: r.rank,
        priceScore: Number(r.price_score), transitScore: Number(r.transit_score),
        reliabilityScore: Number(r.reliability_score), capacityScore: Number(r.capacity_score),
        carbonScore: Number(r.carbon_score), insuranceScore: Number(r.insurance_score),
        trackingQualityScore: Number(r.tracking_quality_score), pickupAvailabilityScore: Number(r.pickup_availability_score),
        deliveryAccuracyScore: Number(r.delivery_accuracy_score), cancellationPolicyScore: Number(r.cancellation_policy_score),
        overallScore: Number(r.overall_score),
    };
}

function toQuoteApi(q, items = [], comparisons = []) {
    return {
        id: q.id, shipmentId: q.shipment_id, tradeOperationId: q.trade_operation_id,
        origin: q.origin, destination: q.destination, cargo: q.cargo, incoterm: q.incoterm,
        transportMode: q.transport_mode, preferredCarrierId: q.preferred_carrier_id,
        requestedPickup: q.requested_pickup, requestedDelivery: q.requested_delivery,
        status: q.status, validUntil: q.valid_until, engineVersion: q.engine_version,
        items: items.map(toItemApi), comparisons: comparisons.map(toComparisonApi),
        createdAt: q.created_at, updatedAt: q.updated_at,
    };
}

// ── POST /v1/freight/quote-requests ──────────────────────────────────────────
const create = async (req, res, next) => {
    try {
        const parsed = createFreightQuoteSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const body = parsed.data;
        const tenantId = callerTenantId(req);

        // service/freight/normalize.js's normalizePiece() reads snake_case piece
        // fields (weight_kg/length_cm/...) — the API validator accepts camelCase,
        // so bridge each piece explicitly rather than passing it through as-is.
        const snakeCasePieces = (body.pieces || []).map((p) => ({
            quantity: p.quantity, weight_kg: p.weightKg, length_cm: p.lengthCm, width_cm: p.widthCm, height_cm: p.heightCm,
        }));

        const request = Object.assign(norm.normalizeShipmentRequest({
            mode: body.transportMode, incoterm: body.incoterm, currency: body.currency,
            declared_value: body.declaredValue, origin: body.origin, destination: body.destination,
            pieces: snakeCasePieces, total_weight_kg: body.totalWeightKg, ready_date: body.expectedPickup,
        }), { insurance_requested: body.insuranceRequested });

        const quoteRow = await db.FreightQuoteRequest.create({
            tenant_id: tenantId || 'T-DEMO',
            shipment_id: body.shipmentId || null,
            trade_operation_id: body.tradeOperationId || null,
            origin: request.origin || {},
            destination: request.destination || {},
            cargo: {
                cargoType: body.cargoType || null, commodity: body.commodity || null, hsCode: body.hsCode || null,
                hazardous: body.hazardous, containerType: body.containerType || null,
                pieces: request.pieces, chargeableWeightKg: request.chargeable_weight_kg,
            },
            incoterm: body.incoterm || null,
            transport_mode: body.transportMode || null,
            preferred_carrier_id: body.preferredCarrierId || null,
            requested_pickup: body.expectedPickup || null,
            requested_delivery: body.expectedDelivery || null,
            status: 'draft',
            created_by: actorOf(req),
        });

        const originCode = request.origin && request.origin.country;
        const destinationCode = request.destination && request.destination.country;

        const carrierWhere = { status: 'active' };
        const carrierRows = await db.CarrierDirectory.findAll({
            where: carrierWhere,
            include: [{ model: db.CarrierService, as: 'carrierServices' }],
        });
        const eligible = carrierRows.filter((c) => {
            if (!body.transportMode) return true;
            const modes = Array.isArray(c.modes) ? c.modes : [];
            return modes.includes(body.transportMode) || (c.carrierServices || []).some((s) => s.transport_mode === body.transportMode);
        });

        const priced = [];
        const errors = [];
        await Promise.all(eligible.map(async (carrierRow) => {
            try {
                const conn = connectors.buildConnectorForCarrier(carrierRow, { services: carrierRow.carrierServices });
                const { quote } = await conn.quote(request, { now: new Date() });
                const breakdown = await priceCarrierQuote({
                    quote, carrierRow, request: { ...request, insurance_requested: body.insuranceRequested, declared_value: body.declaredValue },
                    tenantId, mode: quote.mode, originCode, destinationCode,
                });
                priced.push(breakdown);
            } catch (err) {
                errors.push({ carrierId: carrierRow.id, carrierCode: carrierRow.code, message: err && err.message });
            }
        }));

        if (priced.length === 0) {
            await quoteRow.update({ status: 'expired' });
            return sendSuccess(req, res, { ...toQuoteApi(quoteRow, [], []), errors }, 200);
        }

        const cheapestOrder = [...priced].sort((a, b) => a.totalAmount - b.totalAmount);
        const fastestOrder = [...priced].sort((a, b) => (a.transitDays || 0) - (b.transitDays || 0));
        const rankOf = (order, carrierId) => order.findIndex((p) => p.carrierId === carrierId) + 1;

        const carriersById = {};
        eligible.forEach((c) => { carriersById[c.id] = c.toJSON ? c.toJSON() : c; });
        const scored = scoring.scoreAndRank(priced.map((p) => ({
            carrierId: p.carrierId, totalAmount: p.totalAmount, transitDays: p.transitDays, carbonEstimateKg: p.carbonEstimateKg,
        })), carriersById);
        const bestRankByCarrier = {};
        scored.forEach((s) => { bestRankByCarrier[s.carrierId] = s.rank; });

        const itemRows = await Promise.all(priced.map((p) => db.FreightQuoteItem.create({
            tenant_id: tenantId || 'T-DEMO',
            quote_id: quoteRow.id,
            carrier_id: p.carrierId,
            service_level: p.serviceLevel,
            base_freight: p.baseFreight,
            fuel_surcharge: p.fuelSurcharge,
            terminal_charge: p.terminalCharge,
            handling_charge: p.handlingCharge,
            customs_charge: p.customsCharge,
            insurance_estimate: p.insuranceEstimate,
            tax_estimate: p.taxEstimate,
            total_amount: p.totalAmount,
            currency: p.currency,
            transit_days: p.transitDays,
            carbon_estimate_kg: p.carbonEstimateKg,
            rank_cheapest: rankOf(cheapestOrder, p.carrierId),
            rank_fastest: rankOf(fastestOrder, p.carrierId),
            rank_best: bestRankByCarrier[p.carrierId] || null,
        })));

        const comparisonRows = await Promise.all(scored.map((s) => db.FreightComparison.create({
            tenant_id: tenantId || 'T-DEMO',
            quote_id: quoteRow.id,
            carrier_id: s.carrierId,
            price_score: s.priceScore, transit_score: s.transitScore, reliability_score: s.reliabilityScore,
            capacity_score: s.capacityScore, carbon_score: s.carbonScore, insurance_score: s.insuranceScore,
            tracking_quality_score: s.trackingQualityScore, pickup_availability_score: s.pickupAvailabilityScore,
            delivery_accuracy_score: s.deliveryAccuracyScore, cancellation_policy_score: s.cancellationPolicyScore,
            overall_score: s.overallScore, rank: s.rank,
        })));

        const validUntil = new Date(Date.now() + QUOTE_TTL_HOURS * 3600 * 1000);
        await quoteRow.update({ status: 'quoted', valid_until: validUntil, engine_version: ENGINE_VERSION });

        await auditLogistics(req, 'freight_quote.created', 'freight_quote', quoteRow.id, { carriersQuoted: priced.length, carriersFailed: errors.length });

        return sendSuccess(req, res, { ...toQuoteApi(quoteRow, itemRows, comparisonRows), errors }, 201);
    } catch (err) { return next(err); }
};

// ── GET /v1/freight/quote-requests ───────────────────────────────────────────
const list = async (req, res, next) => {
    try {
        const { limit, offset, order } = parseListQuery(req.query, { allowedSort: ['created_at', 'status'] });
        const where = {};
        if (req.query.status) where.status = req.query.status;
        if (req.query.shipmentId) where.shipment_id = req.query.shipmentId;
        const tenantId = callerTenantId(req);
        if (tenantId) where.tenant_id = tenantId;
        const { count, rows } = await db.FreightQuoteRequest.findAndCountAll({ where, limit, offset, order });
        return sendPaginated(req, res, { items: rows.map((r) => toQuoteApi(r)), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

// ── GET /v1/freight/quote-requests/:id ───────────────────────────────────────
const get = async (req, res, next) => {
    try {
        const tenantId = callerTenantId(req);
        const where = { id: req.params.id };
        if (tenantId) where.tenant_id = tenantId;
        const row = await db.FreightQuoteRequest.findOne({ where });
        if (!row) return next(new AppError('NOT_FOUND', 'Freight quote not found', 404));
        const items = await db.FreightQuoteItem.findAll({ where: { quote_id: row.id }, order: [['total_amount', 'ASC']] });
        const comparisons = await db.FreightComparison.findAll({ where: { quote_id: row.id }, order: [['rank', 'ASC']] });
        return sendSuccess(req, res, toQuoteApi(row, items, comparisons));
    } catch (err) { return next(err); }
};

module.exports = { create, list, get };
