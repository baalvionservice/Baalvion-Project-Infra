'use strict';
/**
 * Sailing Schedules — HTTP surface. Read endpoints are the shipper-facing "when does
 * a ship leave / arrive / how long does this lane take" queries; the write endpoints
 * are how real schedule data gets in (carrier API sync, bulk import, or manual entry
 * by an operator), each recording its own `data_source`.
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { recordAudit } = require('../utils/audit');
const scheduleSvc = require('../service/schedules/scheduleService');
const routing = require('../service/schedules/routing');
const shipmentVoyage = require('../service/schedules/shipmentVoyage');
const scheduleImport = require('../service/schedules/scheduleImport');
const { estimateTransit } = require('../service/schedules/distance');

const actorOf = (req) => (req.auth && (req.auth.userId || req.auth.email)) || 'system';
const tenantOf = (req) => (req.auth && (req.auth.tenantId || req.auth.orgId)) || 'T-DEMO';

// ── Read ─────────────────────────────────────────────────────────────────────

const listDepartures = async (req, res, next) => {
    try {
        const { port, from, to, limit } = req.query;
        if (!port) return next(new AppError('VALIDATION_ERROR', '`port` (UN/LOCODE) is required', 422));
        const items = await scheduleSvc.departuresFromPort({ portCode: port, from, to, limit });
        return sendSuccess(req, res, items);
    } catch (err) { return next(err); }
};

const listArrivals = async (req, res, next) => {
    try {
        const { port, from, to, limit } = req.query;
        if (!port) return next(new AppError('VALIDATION_ERROR', '`port` (UN/LOCODE) is required', 422));
        const items = await scheduleSvc.arrivalsAtPort({ portCode: port, from, to, limit });
        return sendSuccess(req, res, items);
    } catch (err) { return next(err); }
};

/** GET /sailing_schedules/search?from=INNSA&to=AEJEA — the lane search. */
const searchLane = async (req, res, next) => {
    try {
        const { from: fromPort, to: toPort, depart_from: departFrom, depart_to: departTo, limit } = req.query;
        if (!fromPort || !toPort) {
            return next(new AppError('VALIDATION_ERROR', '`from` and `to` port codes are required', 422));
        }
        const result = await scheduleSvc.searchLane({
            fromPort, toPort, from: departFrom, to: departTo, limit,
        });
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

/**
 * GET /sailing_schedules/routes?from=INNSA&to=BRSSZ&max_legs=2
 *
 * The lane search that allows transhipment. `/search` above only returns direct
 * sailings — one vessel calling at both ports — which answers "nothing" for most
 * real long-haul lanes. This returns whole itineraries: ride a vessel to a hub,
 * wait, ride a second one onward. Direct routes come back too (transhipments: 0)
 * and sort first when they arrive first, so this is a superset of /search.
 */
const findRoutes = async (req, res, next) => {
    try {
        const {
            from: fromPort, to: toPort, depart_from: departFrom, depart_to: departTo,
            max_legs: maxLegs, min_connection_hours: minConnectionHours,
            max_connection_days: maxConnectionDays, limit,
        } = req.query;
        if (!fromPort || !toPort) {
            return next(new AppError('VALIDATION_ERROR', '`from` and `to` port codes are required', 422));
        }
        if (fromPort === toPort) {
            return next(new AppError('VALIDATION_ERROR', 'Origin and destination must differ', 422));
        }
        const result = await routing.findRoutes({
            fromPort, toPort, departFrom, departTo, maxLegs,
            minConnectionHours, maxConnectionDays, limit,
        });
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const getVoyage = async (req, res, next) => {
    try {
        const voyage = await scheduleSvc.getVoyage(req.params.id);
        if (!voyage) return next(new AppError('NOT_FOUND', 'Voyage not found', 404));
        return sendSuccess(req, res, voyage);
    } catch (err) { return next(err); }
};

const getVesselPosition = async (req, res, next) => {
    try {
        const position = await scheduleSvc.vesselPosition(req.params.id);
        if (!position) return next(new AppError('NOT_FOUND', 'Vessel not found', 404));
        return sendSuccess(req, res, position);
    } catch (err) { return next(err); }
};

const listVessels = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const where = {};
        if (search) where.name = { [db.Sequelize.Op.iLike]: `%${search}%` };
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Vessel.findAndCountAll({
            where, limit: Number(limit), offset, order: [['name', 'ASC']],
        });
        return sendPaginated(req, res, {
            items: rows.map(scheduleSvc.vesselToApi), total: count, page: Number(page), limit: Number(limit),
        });
    } catch (err) { return next(err); }
};

/**
 * Transit time between two ports. Uses the real published schedule when a sailing
 * exists on the lane; otherwise returns a clearly-flagged distance-based estimate.
 */
const getTransit = async (req, res, next) => {
    try {
        const { from: fromPort, to: toPort } = req.query;
        if (!fromPort || !toPort) {
            return next(new AppError('VALIDATION_ERROR', '`from` and `to` port codes are required', 422));
        }
        const lane = await scheduleSvc.searchLane({ fromPort, toPort, limit: 10 });
        if (lane.sailings.length) {
            const transits = lane.sailings.map((s) => s.transit).filter((t) => t.days != null);
            const fastest = transits.length ? Math.min(...transits.map((t) => t.days)) : null;
            const typical = transits.length
                ? Math.round((transits.reduce((sum, t) => sum + t.days, 0) / transits.length) * 10) / 10
                : null;
            return sendSuccess(req, res, {
                lane: { from: fromPort, to: toPort },
                basis: 'schedule',
                sailingsFound: lane.sailings.length,
                fastestDays: fastest,
                typicalDays: typical,
                note: null,
            });
        }
        // No sailing on file — fall back to the coordinate/speed estimate, clearly labelled.
        const estimate = estimateTransit({});
        return sendSuccess(req, res, {
            lane: { from: fromPort, to: toPort },
            basis: estimate.basis,
            sailingsFound: 0,
            fastestDays: null,
            typicalDays: null,
            note: lane.note,
        });
    } catch (err) { return next(err); }
};

// ── Write (schedule ingestion) ───────────────────────────────────────────────

const createVessel = async (req, res, next) => {
    try {
        const {
            name, imo_number = null, mmsi = null, vessel_type = 'container', flag_country = null,
            operator_name = null, carrier_code = null, capacity_teu = null, deadweight_tons = null,
            service_speed_knots = null, year_built = null, data_source = 'manual',
        } = req.body || {};
        if (!name) return next(new AppError('VALIDATION_ERROR', '`name` is required', 422));
        if (!db.Vessel.VESSEL_TYPES.includes(vessel_type)) {
            return next(new AppError('VALIDATION_ERROR', 'Unknown `vessel_type`', 422, { allowed: db.Vessel.VESSEL_TYPES }));
        }
        const vessel = await db.Vessel.create({
            tenant_id: tenantOf(req), name, imo_number, mmsi, vessel_type, flag_country, operator_name,
            carrier_code, capacity_teu, deadweight_tons, service_speed_knots, year_built,
            data_source, created_by: actorOf(req),
        });
        await recordAudit({
            actorId: actorOf(req), action: 'vessel.created', resourceType: 'vessel',
            resourceId: vessel.id, tenantId: vessel.tenant_id, metadata: { name, imo_number, data_source },
        });
        return sendSuccess(req, res, scheduleSvc.vesselToApi(vessel), 201);
    } catch (err) { return next(err); }
};

/**
 * Creates a voyage together with its full port rotation in one call — a schedule is
 * only meaningful as a complete rotation, so this avoids half-written voyages.
 */
const createVoyage = async (req, res, next) => {
    try {
        const {
            vessel_id, voyage_number, service_name = null, direction = null,
            data_source = 'manual', port_calls = [],
        } = req.body || {};
        if (!vessel_id || !voyage_number) {
            return next(new AppError('VALIDATION_ERROR', '`vessel_id` and `voyage_number` are required', 422));
        }
        const vessel = await db.Vessel.findByPk(vessel_id);
        if (!vessel) return next(new AppError('NOT_FOUND', 'Vessel not found', 404));
        if (!Array.isArray(port_calls) || port_calls.length < 2) {
            return next(new AppError('VALIDATION_ERROR', 'A voyage needs at least two port calls', 422));
        }

        const sorted = [...port_calls].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        const voyage = await db.Voyage.create({
            tenant_id: tenantOf(req), vessel_id, voyage_number, service_name, direction,
            origin_port_code: first.port_code, destination_port_code: last.port_code,
            departure_date: first.etd || null, arrival_date: last.eta || null,
            data_source, created_by: actorOf(req),
        });

        const created = await db.VoyagePortCall.bulkCreate(sorted.map((c, i) => ({
            tenant_id: tenantOf(req), voyage_id: voyage.id, sequence: c.sequence ?? i,
            port_code: c.port_code, port_name: c.port_name || null, country_code: c.country_code || null,
            terminal: c.terminal || null, call_type: c.call_type || 'both',
            eta: c.eta || null, etd: c.etd || null, cutoff_at: c.cutoff_at || null,
            data_source, created_by: actorOf(req),
        })));

        await recordAudit({
            actorId: actorOf(req), action: 'voyage.created', resourceType: 'voyage',
            resourceId: voyage.id, tenantId: voyage.tenant_id,
            metadata: { voyage_number, vessel_id, portCalls: created.length, data_source },
        });

        const full = await scheduleSvc.getVoyage(voyage.id);
        return sendSuccess(req, res, full, 201);
    } catch (err) { return next(err); }
};

/**
 * POST /sailing_schedules/import — ingest a carrier's published schedule.
 *
 * The difference from POST /voyages is idempotence: a feed re-publishes the same
 * voyage every week with revised dates, so this upserts on (vessel, voyage_number)
 * and (voyage, sequence) and returns the DIFF — which ETAs moved, and which booked
 * shipments those moves affect.
 */
const importSchedule = async (req, res, next) => {
    try {
        const result = await scheduleImport.importSchedule({
            payload: req.body || {}, tenantId: tenantOf(req), actor: actorOf(req),
        });
        await recordAudit({
            actorId: actorOf(req), action: 'sailing_schedule.imported', resourceType: 'voyage',
            resourceId: null, tenantId: tenantOf(req),
            metadata: {
                dataSource: result.dataSource, ...result.summary,
                changes: result.changes.length, rejected: result.rejected.length,
                affectedShipments: result.affectedShipments.length, autoSynced: result.autoSynced,
            },
        });
        return sendSuccess(req, res, result);
    } catch (err) {
        if (err instanceof scheduleImport.ScheduleImportError) {
            return next(new AppError(err.code, err.message, 422));
        }
        return next(err);
    }
};

/** Records what actually happened at a port call (arrival/departure), vs the plan. */
const updatePortCall = async (req, res, next) => {
    try {
        const call = await db.VoyagePortCall.findByPk(req.params.id);
        if (!call) return next(new AppError('NOT_FOUND', 'Port call not found', 404));
        const { status, actual_arrival, actual_departure, eta, etd, terminal } = req.body || {};
        if (status && !db.VoyagePortCall.STATUSES.includes(status)) {
            return next(new AppError('VALIDATION_ERROR', 'Unknown `status`', 422, { allowed: db.VoyagePortCall.STATUSES }));
        }
        await call.update({
            ...(status !== undefined ? { status } : {}),
            ...(actual_arrival !== undefined ? { actual_arrival } : {}),
            ...(actual_departure !== undefined ? { actual_departure } : {}),
            ...(eta !== undefined ? { eta } : {}),
            ...(etd !== undefined ? { etd } : {}),
            ...(terminal !== undefined ? { terminal } : {}),
            updated_by: actorOf(req),
        });
        await recordAudit({
            actorId: actorOf(req), action: 'voyage_port_call.updated', resourceType: 'voyage_port_call',
            resourceId: call.id, tenantId: call.tenant_id, metadata: { status, portCode: call.port_code },
        });
        return sendSuccess(req, res, scheduleSvc.portCallToApi(call));
    } catch (err) { return next(err); }
};

// ── Shipment ↔ sailing binding (migration 068) ───────────────────────────────

/** POST /sailing_schedules/shipments/:shipmentId/assign — book a shipment onto a sailing. */
const assignShipmentVoyage = async (req, res, next) => {
    try {
        const { voyage_id: voyageId } = req.body || {};
        if (!voyageId) return next(new AppError('VALIDATION_ERROR', '`voyage_id` is required', 422));

        const shipment = await db.TradeShipment.findByPk(req.params.shipmentId);
        if (!shipment) return next(new AppError('NOT_FOUND', 'Shipment not found', 404));

        const result = await shipmentVoyage.assignVoyage({ shipment, voyageId, actor: actorOf(req) });

        await recordAudit({
            actorId: actorOf(req), action: 'shipment.voyage_assigned', resourceType: 'shipment',
            resourceId: shipment.id, tenantId: shipment.tenant_id,
            metadata: {
                voyageId, voyageNumber: result.voyage.voyage_number,
                loadPort: result.loadCall.port_code, dischargePort: result.dischargeCall.port_code,
            },
        });

        return sendSuccess(req, res, {
            shipmentId: shipment.id,
            voyage: scheduleSvc.voyageToApi(result.voyage),
            loadCall: scheduleSvc.portCallToApi(result.loadCall),
            dischargeCall: scheduleSvc.portCallToApi(result.dischargeCall),
            estimatedDeparture: shipment.estimated_departure,
            estimatedArrival: shipment.estimated_arrival,
        });
    } catch (err) {
        if (err instanceof shipmentVoyage.VoyageAssignmentError) {
            return next(new AppError(err.code, err.message, 422));
        }
        return next(err);
    }
};

/** DELETE /sailing_schedules/shipments/:shipmentId/assign — unbind it. */
const unassignShipmentVoyage = async (req, res, next) => {
    try {
        const shipment = await db.TradeShipment.findByPk(req.params.shipmentId);
        if (!shipment) return next(new AppError('NOT_FOUND', 'Shipment not found', 404));
        await shipmentVoyage.unassignVoyage({ shipment, actor: actorOf(req) });
        await recordAudit({
            actorId: actorOf(req), action: 'shipment.voyage_unassigned', resourceType: 'shipment',
            resourceId: shipment.id, tenantId: shipment.tenant_id, metadata: {},
        });
        return sendSuccess(req, res, { shipmentId: shipment.id, voyageId: null });
    } catch (err) { return next(err); }
};

/**
 * GET /sailing_schedules/shipments/:shipmentId — "where is my cargo": the shipment's
 * sailing, its two stops on that rotation, and where the vessel is right now.
 */
const getShipmentSchedule = async (req, res, next) => {
    try {
        const shipment = await db.TradeShipment.findByPk(req.params.shipmentId);
        if (!shipment) return next(new AppError('NOT_FOUND', 'Shipment not found', 404));

        return sendSuccess(req, res, await shipmentVoyage.scheduleForShipment(shipment));
    } catch (err) { return next(err); }
};

/** POST /sailing_schedules/shipments/:shipmentId/sync — pull a changed schedule through. */
const syncShipmentSchedule = async (req, res, next) => {
    try {
        const shipment = await db.TradeShipment.findByPk(req.params.shipmentId);
        if (!shipment) return next(new AppError('NOT_FOUND', 'Shipment not found', 404));
        const result = await shipmentVoyage.syncFromVoyage({ shipment, actor: actorOf(req) });
        if (result.changed) {
            await recordAudit({
                actorId: actorOf(req), action: 'shipment.schedule_synced', resourceType: 'shipment',
                resourceId: shipment.id, tenantId: shipment.tenant_id, metadata: result,
            });
        }
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

module.exports = {
    listDepartures, listArrivals, searchLane, findRoutes, getVoyage, getVesselPosition,
    listVessels, getTransit, createVessel, createVoyage, updatePortCall, importSchedule,
    assignShipmentVoyage, unassignShipmentVoyage, getShipmentSchedule, syncShipmentSchedule,
};
