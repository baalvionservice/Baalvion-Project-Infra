'use strict';
/**
 * Sailing schedule queries — the read side of the vessel schedule layer.
 *
 * Answers the questions a shipper actually asks:
 *   "which ships leave this port, and when?"        → departuresFromPort()
 *   "what's arriving at this port?"                 → arrivalsAtPort()
 *   "how do I get from port A to port B, how long?" → searchLane()
 *   "where is this ship right now?"                 → vesselPosition()
 *
 * Everything returned is read from real rows. When a lane has no published sailing on
 * file, searchLane() says so explicitly rather than inventing one.
 */
const { Op } = require('sequelize');
const db = require('../../models');
const { estimateTransit } = require('./distance');

function portCallToApi(call) {
    const c = call.toJSON ? call.toJSON() : call;
    const delayHours = c.actual_arrival && c.eta
        ? Math.round((new Date(c.actual_arrival) - new Date(c.eta)) / 3600000)
        : null;
    return {
        id: c.id,
        voyageId: c.voyage_id,
        sequence: c.sequence,
        portCode: c.port_code,
        portName: c.port_name,
        countryCode: c.country_code,
        terminal: c.terminal,
        callType: c.call_type,
        eta: c.eta,
        etd: c.etd,
        actualArrival: c.actual_arrival,
        actualDeparture: c.actual_departure,
        status: c.status,
        cutoffAt: c.cutoff_at,
        // Measured against the published ETA — null until the ship actually arrives.
        delayHours,
        dataSource: c.data_source,
        voyage: c.voyage ? voyageToApi(c.voyage) : undefined,
    };
}

function voyageToApi(voyage) {
    const v = voyage.toJSON ? voyage.toJSON() : voyage;
    return {
        id: v.id,
        voyageNumber: v.voyage_number,
        serviceName: v.service_name,
        direction: v.direction,
        status: v.status,
        originPortCode: v.origin_port_code,
        destinationPortCode: v.destination_port_code,
        departureDate: v.departure_date,
        arrivalDate: v.arrival_date,
        dataSource: v.data_source,
        vessel: v.vessel ? vesselToApi(v.vessel) : undefined,
        portCalls: Array.isArray(v.portCalls) ? v.portCalls.map(portCallToApi) : undefined,
    };
}

function vesselToApi(vessel) {
    const s = vessel.toJSON ? vessel.toJSON() : vessel;
    return {
        id: s.id,
        name: s.name,
        imoNumber: s.imo_number,
        mmsi: s.mmsi,
        vesselType: s.vessel_type,
        flagCountry: s.flag_country,
        operatorName: s.operator_name,
        carrierCode: s.carrier_code,
        capacityTeu: s.capacity_teu,
        serviceSpeedKnots: s.service_speed_knots != null ? Number(s.service_speed_knots) : null,
        yearBuilt: s.year_built,
        dataSource: s.data_source,
    };
}

const withVoyageAndVessel = () => ([{
    model: db.Voyage,
    as: 'voyage',
    include: [{ model: db.Vessel, as: 'vessel' }],
}]);

/** Sailings departing a port within a date window (the "what can I book" view). */
async function departuresFromPort({ portCode, from = null, to = null, limit = 50 }) {
    const where = { port_code: portCode, call_type: { [Op.in]: ['load', 'both'] } };
    if (from || to) {
        where.etd = {};
        if (from) where.etd[Op.gte] = new Date(from);
        if (to) where.etd[Op.lte] = new Date(to);
    }
    const rows = await db.VoyagePortCall.findAll({
        where, include: withVoyageAndVessel(), order: [['etd', 'ASC']], limit: Math.min(Number(limit) || 50, 200),
    });
    return rows.map(portCallToApi);
}

/** Sailings arriving at a port within a date window. */
async function arrivalsAtPort({ portCode, from = null, to = null, limit = 50 }) {
    const where = { port_code: portCode, call_type: { [Op.in]: ['discharge', 'both'] } };
    if (from || to) {
        where.eta = {};
        if (from) where.eta[Op.gte] = new Date(from);
        if (to) where.eta[Op.lte] = new Date(to);
    }
    const rows = await db.VoyagePortCall.findAll({
        where, include: withVoyageAndVessel(), order: [['eta', 'ASC']], limit: Math.min(Number(limit) || 50, 200),
    });
    return rows.map(portCallToApi);
}

/**
 * Sailings connecting two ports on the SAME voyage (direct services), with the real
 * transit time read from the two port calls' own dates.
 *
 * Direct only, by design — routing across a hub lives in ./routing.js, which also
 * returns these as its zero-transhipment case.
 *
 * @returns {{ sailings: Array, lane: { fromPort, toPort }, note: string|null }}
 */
async function searchLane({ fromPort, toPort, from = null, to = null, limit = 25 }) {
    const loadWhere = { port_code: fromPort, call_type: { [Op.in]: ['load', 'both'] } };
    if (from || to) {
        loadWhere.etd = {};
        if (from) loadWhere.etd[Op.gte] = new Date(from);
        if (to) loadWhere.etd[Op.lte] = new Date(to);
    }

    const loadCalls = await db.VoyagePortCall.findAll({
        where: loadWhere, include: withVoyageAndVessel(), order: [['etd', 'ASC']], limit: 200,
    });
    if (!loadCalls.length) {
        return { sailings: [], lane: { fromPort, toPort }, note: `No sailings on file departing ${fromPort}.` };
    }

    const voyageIds = [...new Set(loadCalls.map((c) => c.voyage_id))];
    const dischargeCalls = await db.VoyagePortCall.findAll({
        where: { voyage_id: { [Op.in]: voyageIds }, port_code: toPort, call_type: { [Op.in]: ['discharge', 'both'] } },
    });
    const dischargeByVoyage = new Map(dischargeCalls.map((c) => [c.voyage_id, c]));

    const sailings = [];
    for (const load of loadCalls) {
        const discharge = dischargeByVoyage.get(load.voyage_id);
        if (!discharge) continue;                       // voyage doesn't call at the destination
        if (discharge.sequence <= load.sequence) continue; // wrong direction on this rotation

        const departure = load.actual_departure || load.etd;
        const arrival = discharge.actual_arrival || discharge.eta;
        const transit = estimateTransit({ departure, arrival });

        sailings.push({
            voyage: voyageToApi(load.voyage),
            loadCall: portCallToApi(load),
            dischargeCall: portCallToApi(discharge),
            transit,
        });
        if (sailings.length >= Math.min(Number(limit) || 25, 100)) break;
    }

    return {
        sailings,
        lane: { fromPort, toPort },
        note: sailings.length ? null
            : `No direct sailing on file from ${fromPort} to ${toPort} in this window. \`/sailing_schedules/routes\` also searches transhipment itineraries.`,
    };
}

/**
 * Where a vessel is now, INFERRED FROM ITS OWN SCHEDULE: the call it is currently
 * working, or the last one it departed plus the next one due.
 *
 * This is not an observed fix. There is no AIS or GPS feed behind it, and it
 * deliberately returns no coordinates, because none were measured — every field
 * here is read off port-call rows. `basis` and `observedAt` are returned so a UI
 * can say "last confirmed at Jebel Ali, 2 days ago" instead of drawing a ship at
 * a position nobody reported. Observed pings, when a device or carrier posts
 * them, live on tracking_events and are surfaced separately.
 */
async function vesselPosition(vesselId) {
    const vessel = await db.Vessel.findByPk(vesselId);
    if (!vessel) return null;

    const voyages = await db.Voyage.findAll({
        where: { vessel_id: vesselId, status: { [Op.in]: ['scheduled', 'in_transit', 'delayed'] } },
        order: [['departure_date', 'DESC']], limit: 5,
    });
    const voyageIds = voyages.map((v) => v.id);

    let current = null;
    let lastDeparted = null;
    let nextDue = null;

    if (voyageIds.length) {
        const calls = await db.VoyagePortCall.findAll({
            where: { voyage_id: { [Op.in]: voyageIds } },
            include: withVoyageAndVessel(),
            order: [['eta', 'ASC']],
        });
        current = calls.find((c) => ['arrived', 'working'].includes(c.status)) || null;
        const departed = calls.filter((c) => c.status === 'departed');
        lastDeparted = departed.length ? departed[departed.length - 1] : null;
        nextDue = calls.find((c) => c.status === 'scheduled') || null;
    }

    // The most recent thing anyone actually recorded about this ship — the berth
    // it is working, or the last departure stamped on a call. Null when the
    // vessel's calls are all still projections.
    const observedAt = (current && (current.actual_arrival || null))
        || (lastDeparted && (lastDeparted.actual_departure || null))
        || null;

    return {
        vessel: vesselToApi(vessel),
        // 'in_port' when working a berth; 'at_sea' between two known calls; 'unknown'
        // when the vessel has no active voyage on file.
        state: current ? 'in_port' : (lastDeparted && nextDue ? 'at_sea' : 'unknown'),
        currentCall: current ? portCallToApi(current) : null,
        lastDeparted: lastDeparted ? portCallToApi(lastDeparted) : null,
        nextCall: nextDue ? portCallToApi(nextDue) : null,
        // How this position was arrived at. Kept in the payload so the client
        // cannot present a derived position as a live one by accident.
        basis: 'port_call_schedule',
        observed: false,
        observedAt,
    };
}

/** Full rotation for one voyage — every stop, in order. */
async function getVoyage(voyageId) {
    const voyage = await db.Voyage.findByPk(voyageId, {
        include: [
            { model: db.Vessel, as: 'vessel' },
            { model: db.VoyagePortCall, as: 'portCalls' },
        ],
        order: [[{ model: db.VoyagePortCall, as: 'portCalls' }, 'sequence', 'ASC']],
    });
    return voyage ? voyageToApi(voyage) : null;
}

module.exports = {
    departuresFromPort,
    arrivalsAtPort,
    searchLane,
    vesselPosition,
    getVoyage,
    vesselToApi,
    voyageToApi,
    portCallToApi,
};
