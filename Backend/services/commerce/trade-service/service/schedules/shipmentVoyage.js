'use strict';
/**
 * Booking a shipment onto a sailing (migration 068).
 *
 * Assigning a voyage does two things:
 *   1. binds the shipment to the real schedule rows, and
 *   2. COPIES the load/discharge dates onto the shipment's own estimated_departure /
 *      estimated_arrival, so every existing consumer (readiness scoring, delay sweeps,
 *      the ETA engine, the ops dashboard) keeps working unchanged.
 *
 * The copy is deliberate rather than a live join: those columns are read all over the
 * codebase and a schedule change should be an explicit, audited event, not something
 * that silently mutates a shipment's dates underneath a user. `syncFromVoyage()` is
 * how a schedule update is pulled through, and it reports exactly what moved.
 */
const db = require('../../models');
const scheduleSvc = require('./scheduleService');

class VoyageAssignmentError extends Error {
    constructor(message, code = 'VOYAGE_ASSIGNMENT_INVALID') {
        super(message);
        this.code = code;
    }
}

/**
 * Resolve the load + discharge calls for a shipment on a given voyage, validating that
 * the rotation actually serves the shipment's lane in the right direction.
 */
async function resolveCalls({ voyageId, originPort, destinationPort }) {
    const calls = await db.VoyagePortCall.findAll({
        where: { voyage_id: voyageId }, order: [['sequence', 'ASC']],
    });
    if (!calls.length) throw new VoyageAssignmentError('That voyage has no port calls on file', 'VOYAGE_EMPTY');

    const load = calls.find((c) => c.port_code === originPort && ['load', 'both'].includes(c.call_type));
    if (!load) {
        throw new VoyageAssignmentError(`This voyage does not load at ${originPort}`, 'LOAD_PORT_NOT_ON_ROTATION');
    }
    const discharge = calls.find(
        (c) => c.port_code === destinationPort
            && ['discharge', 'both'].includes(c.call_type)
            && c.sequence > load.sequence,
    );
    if (!discharge) {
        throw new VoyageAssignmentError(
            `This voyage does not discharge at ${destinationPort} after loading at ${originPort}`,
            'DISCHARGE_PORT_NOT_ON_ROTATION',
        );
    }
    return { load, discharge };
}

/** Bind a shipment to a sailing and adopt that sailing's dates. */
async function assignVoyage({ shipment, voyageId, actor }) {
    const voyage = await db.Voyage.findByPk(voyageId, { include: [{ model: db.Vessel, as: 'vessel' }] });
    if (!voyage) throw new VoyageAssignmentError('Voyage not found', 'VOYAGE_NOT_FOUND');

    if (!shipment.origin_port || !shipment.destination_port) {
        throw new VoyageAssignmentError(
            'Shipment needs an origin_port and destination_port before it can be booked onto a sailing',
            'SHIPMENT_LANE_MISSING',
        );
    }

    const { load, discharge } = await resolveCalls({
        voyageId, originPort: shipment.origin_port, destinationPort: shipment.destination_port,
    });

    await shipment.update({
        voyage_id: voyage.id,
        load_port_call_id: load.id,
        discharge_port_call_id: discharge.id,
        // Keep the human-readable fields in step so nothing that reads them goes stale.
        vessel_name: voyage.vessel ? voyage.vessel.name : shipment.vessel_name,
        voyage_no: voyage.voyage_number,
        carrier_name: (voyage.vessel && voyage.vessel.operator_name) || shipment.carrier_name,
        estimated_departure: load.actual_departure || load.etd || shipment.estimated_departure,
        estimated_arrival: discharge.actual_arrival || discharge.eta || shipment.estimated_arrival,
        updated_by: actor,
    });

    return { shipment, voyage, loadCall: load, dischargeCall: discharge };
}

/** Remove the sailing link. Dates already copied onto the shipment are left as they are. */
async function unassignVoyage({ shipment, actor }) {
    await shipment.update({
        voyage_id: null, load_port_call_id: null, discharge_port_call_id: null, updated_by: actor,
    });
    return shipment;
}

/**
 * Pull a changed schedule through to the shipment. Returns what moved so the caller can
 * decide whether it's worth telling anyone (a two-hour berth shuffle usually isn't; a
 * three-day slip is).
 */
async function syncFromVoyage({ shipment, actor }) {
    if (!shipment.voyage_id || !shipment.load_port_call_id || !shipment.discharge_port_call_id) {
        return { changed: false, reason: 'Shipment is not booked on a sailing' };
    }
    const [load, discharge] = await Promise.all([
        db.VoyagePortCall.findByPk(shipment.load_port_call_id),
        db.VoyagePortCall.findByPk(shipment.discharge_port_call_id),
    ]);
    if (!load || !discharge) return { changed: false, reason: 'Linked port calls no longer exist' };

    const nextDeparture = load.actual_departure || load.etd;
    const nextArrival = discharge.actual_arrival || discharge.eta;
    const prevDeparture = shipment.estimated_departure;
    const prevArrival = shipment.estimated_arrival;

    const same = (a, b) => (a && b ? new Date(a).getTime() === new Date(b).getTime() : a === b);
    if (same(prevDeparture, nextDeparture) && same(prevArrival, nextArrival)) {
        return { changed: false, reason: 'Schedule unchanged' };
    }

    await shipment.update({
        estimated_departure: nextDeparture || prevDeparture,
        estimated_arrival: nextArrival || prevArrival,
        updated_by: actor,
    });

    const shiftHours = (from, to) => (from && to
        ? Math.round((new Date(to).getTime() - new Date(from).getTime()) / 3600000)
        : null);

    return {
        changed: true,
        departureShiftHours: shiftHours(prevDeparture, nextDeparture),
        arrivalShiftHours: shiftHours(prevArrival, nextArrival),
        estimatedDeparture: nextDeparture,
        estimatedArrival: nextArrival,
    };
}

/**
 * "Where is my cargo": the shipment's sailing, its own two stops on that
 * rotation, and where the vessel is now. Shared by the operator schedule route
 * and the party-scoped trade operations dashboard so both parties to a trade
 * read the same rows — the caller is responsible for having authorised the
 * shipment before calling.
 */
async function scheduleForShipment(shipment) {
    if (!shipment.voyage_id) {
        return {
            shipmentId: shipment.id,
            shipmentNo: shipment.shipment_no,
            booked: false,
            note: 'This shipment is not booked on a scheduled sailing.',
            vesselName: shipment.vessel_name,
            voyageNo: shipment.voyage_no,
            estimatedDeparture: shipment.estimated_departure,
            estimatedArrival: shipment.estimated_arrival,
        };
    }

    const voyage = await scheduleSvc.getVoyage(shipment.voyage_id);
    const [loadCall, dischargeCall] = await Promise.all([
        shipment.load_port_call_id ? db.VoyagePortCall.findByPk(shipment.load_port_call_id) : null,
        shipment.discharge_port_call_id ? db.VoyagePortCall.findByPk(shipment.discharge_port_call_id) : null,
    ]);
    const position = voyage && voyage.vessel ? await scheduleSvc.vesselPosition(voyage.vessel.id) : null;

    return {
        shipmentId: shipment.id,
        shipmentNo: shipment.shipment_no,
        booked: true,
        voyage,
        loadCall: loadCall ? scheduleSvc.portCallToApi(loadCall) : null,
        dischargeCall: dischargeCall ? scheduleSvc.portCallToApi(dischargeCall) : null,
        vesselPosition: position,
        estimatedDeparture: shipment.estimated_departure,
        estimatedArrival: shipment.estimated_arrival,
    };
}

module.exports = {
    assignVoyage, unassignVoyage, syncFromVoyage, resolveCalls, scheduleForShipment, VoyageAssignmentError,
};
