'use strict';
/**
 * Transhipment routing — connecting itineraries across MORE THAN ONE vessel.
 *
 * `scheduleService.searchLane()` only finds direct sailings: one voyage whose rotation
 * calls at both the origin and the destination. Most of the world's container traffic
 * doesn't move that way. Nhava Sheva → Santos has no direct service; the box is
 * discharged at a hub (Jebel Ali, Singapore, Algeciras, Colombo…) and re-loaded onto a
 * second vessel days later. Without this, the lane search answers "no sailings" for
 * lanes that are in fact served daily.
 *
 * This is a time-dependent earliest-arrival search over the schedule we actually hold:
 *
 *   a LEG  = ride one voyage from one of its calls to a later call on the same rotation
 *   a HOP  = discharge at a hub, wait, load onto a different voyage
 *
 * A hop is only legal if the outbound vessel sails at least `minConnectionHours` after
 * the inbound one berths — a box cannot be discharged, moved across a terminal and
 * re-loaded instantly — and not so much later that calling it a "connection" is a
 * fiction (`maxConnectionDays`). Both are inputs, not hidden constants, because the
 * realistic minimum differs by hub and by carrier.
 *
 * Nothing here invents a sailing. Every leg is a real pair of rows in
 * `tradeops.voyage_port_calls`; if the schedule on file can't connect the two ports,
 * the answer is "no routing found", not a plausible-looking itinerary.
 */
const { Op } = require('sequelize');
const db = require('../../models');
const { voyageToApi, portCallToApi } = require('./scheduleService');

/** A box needs to be discharged, yarded and re-loaded — that is not instant. */
const DEFAULT_MIN_CONNECTION_HOURS = 24;
/** Beyond this a "connection" is really just storage; don't sell it as an itinerary. */
const DEFAULT_MAX_CONNECTION_DAYS = 14;
/** 2 legs = one transhipment. 3 legs (two transhipments) is the practical ceiling. */
const DEFAULT_MAX_LEGS = 2;
const HARD_MAX_LEGS = 3;
/** Per hub, keep only the few earliest arrivals — later ones can't beat them onward. */
const FRONTIER_PER_PORT = 5;

const HOUR_MS = 3600000;
const DAY_MS = 24 * HOUR_MS;

const LOADABLE = ['load', 'both'];
const DISCHARGEABLE = ['discharge', 'both'];
/** A call that never happened can't carry cargo. */
const DEAD_STATUSES = ['skipped', 'cancelled'];

/** When the ship really left, falling back to the published plan. */
const departsAt = (call) => call.actual_departure || call.etd;
/** When the ship really berthed, falling back to the published plan. */
const arrivesAt = (call) => call.actual_arrival || call.eta;

const ms = (d) => (d ? new Date(d).getTime() : null);

const withVessel = () => ([{
    model: db.Voyage,
    as: 'voyage',
    include: [{ model: db.Vessel, as: 'vessel' }],
}]);

/**
 * Every call on the given voyages, grouped by voyage and ordered by rotation sequence,
 * so onward legs are a lookup rather than a query per candidate.
 */
async function rotationsFor(voyageIds) {
    if (!voyageIds.length) return new Map();
    const calls = await db.VoyagePortCall.findAll({
        where: {
            voyage_id: { [Op.in]: voyageIds },
            status: { [Op.notIn]: DEAD_STATUSES },
        },
        order: [['sequence', 'ASC']],
    });
    const byVoyage = new Map();
    for (const call of calls) {
        if (!byVoyage.has(call.voyage_id)) byVoyage.set(call.voyage_id, []);
        byVoyage.get(call.voyage_id).push(call);
    }
    return byVoyage;
}

/**
 * Sailings loadable at these ports inside each port's own time window.
 * One query per distinct port (windows differ per frontier node), then filtered in JS.
 */
async function loadCallsAt(portWindows) {
    const out = new Map();
    await Promise.all([...portWindows.entries()].map(async ([portCode, window]) => {
        const rows = await db.VoyagePortCall.findAll({
            where: {
                port_code: portCode,
                call_type: { [Op.in]: LOADABLE },
                status: { [Op.notIn]: DEAD_STATUSES },
                etd: { [Op.gte]: new Date(window.from), [Op.lte]: new Date(window.to) },
            },
            include: withVessel(),
            // Earliest-departing first, capped: a hub like Singapore can have hundreds of
            // loadable calls in a 14-day window, and a later departure can't beat an
            // earlier one to the same destination on an earliest-arrival search.
            order: [['etd', 'ASC']],
            limit: 100,
        });
        out.set(portCode, rows);
    }));
    return out;
}

/**
 * Turn a load call into every leg it can carry — each later call on the same rotation
 * where the box can come off.
 */
function legsFrom(loadCall, rotation) {
    if (!rotation) return [];
    const sails = ms(departsAt(loadCall));
    return rotation
        .filter((c) => c.sequence > loadCall.sequence
            && DISCHARGEABLE.includes(c.call_type)
            && arrivesAt(c)
            // A feed can publish a rotation whose dates run backwards. Riding it would
            // produce a negative transit, so drop the leg rather than show nonsense.
            && (sails == null || ms(arrivesAt(c)) > sails))
        .map((dischargeCall) => ({ loadCall, dischargeCall }));
}

function legToApi(leg) {
    const departure = departsAt(leg.loadCall);
    const arrival = arrivesAt(leg.dischargeCall);
    const hours = ms(arrival) != null && ms(departure) != null
        ? (ms(arrival) - ms(departure)) / HOUR_MS
        : null;
    return {
        voyage: voyageToApi(leg.loadCall.voyage),
        loadCall: portCallToApi(leg.loadCall),
        dischargeCall: portCallToApi(leg.dischargeCall),
        departure,
        arrival,
        transitDays: hours == null ? null : Math.round((hours / 24) * 10) / 10,
    };
}

function routeToApi(path) {
    const legs = path.map(legToApi);
    const departure = legs[0].departure;
    const arrival = legs[legs.length - 1].arrival;
    const totalHours = (ms(arrival) - ms(departure)) / HOUR_MS;

    // The wait at each hub — the part of a transhipment itinerary shippers actually
    // judge, since it is where a box sits still and where a missed connection bites.
    const connections = [];
    for (let i = 1; i < path.length; i += 1) {
        const inbound = path[i - 1].dischargeCall;
        const outbound = path[i].loadCall;
        const waitHours = (ms(departsAt(outbound)) - ms(arrivesAt(inbound))) / HOUR_MS;
        connections.push({
            portCode: inbound.port_code,
            portName: inbound.port_name,
            arrival: arrivesAt(inbound),
            departure: departsAt(outbound),
            waitHours: Math.round(waitHours),
            waitDays: Math.round((waitHours / 24) * 10) / 10,
            fromVoyage: path[i - 1].loadCall.voyage.voyage_number,
            toVoyage: path[i].loadCall.voyage.voyage_number,
        });
    }

    return {
        legs,
        transhipments: legs.length - 1,
        transhipmentPorts: connections.map((c) => c.portCode),
        connections,
        departure,
        arrival,
        totalTransitDays: Math.round((totalHours / 24) * 10) / 10,
        totalTransitHours: Math.round(totalHours),
        // Every figure above came from published/actual port-call dates, never an estimate.
        basis: 'schedule',
    };
}

/**
 * Find itineraries from one port to another, allowing transhipment.
 *
 * @param {object} input
 * @param {string} input.fromPort  origin UN/LOCODE
 * @param {string} input.toPort    destination UN/LOCODE
 * @param {string|Date} [input.departFrom] earliest departure (default: now)
 * @param {string|Date} [input.departTo]   latest departure (default: +30 days)
 * @param {number} [input.maxLegs]              vessels used (2 = one transhipment)
 * @param {number} [input.minConnectionHours]   minimum legal hub dwell
 * @param {number} [input.maxConnectionDays]    beyond this it isn't a connection
 * @param {number} [input.limit]
 */
async function findRoutes({
    fromPort,
    toPort,
    departFrom = null,
    departTo = null,
    maxLegs = DEFAULT_MAX_LEGS,
    minConnectionHours = DEFAULT_MIN_CONNECTION_HOURS,
    maxConnectionDays = DEFAULT_MAX_CONNECTION_DAYS,
    limit = 10,
} = {}) {
    const legCap = Math.min(Math.max(Number(maxLegs) || DEFAULT_MAX_LEGS, 1), HARD_MAX_LEGS);
    const minConn = Math.max(Number(minConnectionHours) ?? DEFAULT_MIN_CONNECTION_HOURS, 0);
    const maxConn = Math.max(Number(maxConnectionDays) || DEFAULT_MAX_CONNECTION_DAYS, 1);
    const want = Math.min(Number(limit) || 10, 50);

    const searchFrom = departFrom ? new Date(departFrom) : new Date();
    const searchTo = departTo ? new Date(departTo) : new Date(Date.now() + 30 * DAY_MS);

    const params = {
        maxLegs: legCap,
        minConnectionHours: minConn,
        maxConnectionDays: maxConn,
        departFrom: searchFrom,
        departTo: searchTo,
    };

    // Level 1: everything sailing out of the origin in the requested window.
    let frontier = [{ portCode: fromPort, path: [], arrival: null, usedVoyages: new Set() }];
    let windows = new Map([[fromPort, { from: searchFrom, to: searchTo }]]);
    const completed = [];

    for (let depth = 0; depth < legCap; depth += 1) {
        const candidatesByPort = await loadCallsAt(windows);
        const voyageIds = [...new Set(
            [...candidatesByPort.values()].flat().map((c) => c.voyage_id),
        )];
        const rotations = await rotationsFor(voyageIds);

        const nextFrontier = [];
        for (const node of frontier) {
            const candidates = candidatesByPort.get(node.portCode) || [];
            for (const loadCall of candidates) {
                // Riding the same vessel twice is the same leg, not a connection.
                if (node.usedVoyages.has(loadCall.voyage_id)) continue;

                const sailing = ms(departsAt(loadCall));
                if (sailing == null) continue;
                if (node.arrival != null) {
                    const wait = (sailing - node.arrival) / HOUR_MS;
                    if (wait < minConn) continue;               // can't make the connection
                    if (wait > maxConn * 24) continue;          // storage, not a connection
                }

                for (const leg of legsFrom(loadCall, rotations.get(loadCall.voyage_id))) {
                    const path = [...node.path, leg];
                    if (leg.dischargeCall.port_code === toPort) {
                        completed.push(path);
                        continue;                                // don't route past the destination
                    }
                    if (depth + 1 >= legCap) continue;
                    // A rotation that returns to a port already on the path is a loop.
                    if (path.some((l, i) => i < path.length - 1
                        && l.dischargeCall.port_code === leg.dischargeCall.port_code)) continue;
                    if (leg.dischargeCall.port_code === fromPort) continue;

                    nextFrontier.push({
                        portCode: leg.dischargeCall.port_code,
                        path,
                        arrival: ms(arrivesAt(leg.dischargeCall)),
                        usedVoyages: new Set([...node.usedVoyages, loadCall.voyage_id]),
                    });
                }
            }
        }

        if (!nextFrontier.length) break;

        // Keep only the earliest arrivals per hub: a later arrival at the same port with
        // the same legs behind it can never produce a better onward itinerary.
        const byPort = new Map();
        for (const node of nextFrontier.sort((a, b) => a.arrival - b.arrival)) {
            const bucket = byPort.get(node.portCode) || [];
            if (bucket.length >= FRONTIER_PER_PORT) continue;
            bucket.push(node);
            byPort.set(node.portCode, bucket);
        }
        frontier = [...byPort.values()].flat();

        windows = new Map();
        for (const node of frontier) {
            const from = new Date(node.arrival + minConn * HOUR_MS);
            const to = new Date(node.arrival + maxConn * DAY_MS);
            const existing = windows.get(node.portCode);
            windows.set(node.portCode, existing
                ? { from: new Date(Math.min(+existing.from, +from)), to: new Date(Math.max(+existing.to, +to)) }
                : { from, to });
        }
    }

    const routes = completed
        .map(routeToApi)
        .sort((a, b) => (ms(a.arrival) - ms(b.arrival)) || (a.transhipments - b.transhipments))
        .slice(0, want);

    const direct = routes.filter((r) => r.transhipments === 0).length;

    return {
        lane: { fromPort, toPort },
        params,
        routes,
        directCount: direct,
        transhipmentCount: routes.length - direct,
        note: routes.length ? null
            : `No routing found from ${fromPort} to ${toPort} within ${legCap} vessel${legCap > 1 ? 's' : ''} `
              + `departing ${searchFrom.toISOString().slice(0, 10)}–${searchTo.toISOString().slice(0, 10)}. `
              + 'This means no such connection exists in the schedules on file — not that the lane is unserved.',
    };
}

module.exports = {
    findRoutes,
    DEFAULT_MIN_CONNECTION_HOURS,
    DEFAULT_MAX_CONNECTION_DAYS,
    DEFAULT_MAX_LEGS,
    HARD_MAX_LEGS,
};
