'use strict';
/**
 * Schedule ingestion — the landing point for a carrier's published schedule.
 *
 * `POST /sailing_schedules/voyages` creates a voyage once. That is fine for entering a
 * sailing by hand, and useless for a feed: carriers RE-publish the same voyage every
 * week with revised dates, and there is a unique index on (vessel_id, voyage_number),
 * so the second publish of 542W either errors or — worse, without the index — silently
 * duplicates the rotation and the lane search starts showing the same ship twice.
 *
 * So ingestion is an upsert keyed on what the carrier itself considers stable:
 *   vessel        → IMO number (globally unique, never reassigned), else exact name
 *   voyage        → (vessel, voyage_number)
 *   port call     → (voyage, sequence) — position in the rotation
 *
 * Three rules that exist because this data is operational, not a cache:
 *
 *  1. A feed never overwrites `actual_arrival`/`actual_departure` with nothing. What
 *     really happened is observed, not published; a proforma schedule that omits it
 *     must not erase it.
 *  2. A call dropped from the rotation is CANCELLED, not deleted. Deleting would fire
 *     `ON DELETE SET NULL` and silently unbook every shipment riding that call. The
 *     row stays, the link stays, and the caller is told which shipments are affected.
 *  3. Nothing is auto-synced onto shipments unless the caller asks (`auto_sync`).
 *     Import reports the shift; adopting it stays an explicit, audited decision — the
 *     same rule `shipmentVoyage.js` follows.
 *
 * The result is a diff, not a count: an operator needs to see that a vessel slipped
 * three days at Jebel Ali, not that "14 rows were updated".
 */
const { Op } = require('sequelize');
const db = require('../../models');
const { syncFromVoyage } = require('./shipmentVoyage');

class ScheduleImportError extends Error {
    constructor(message, code = 'SCHEDULE_IMPORT_INVALID') {
        super(message);
        this.code = code;
    }
}

const asDate = (v) => (v ? new Date(v) : null);
const sameTime = (a, b) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return new Date(a).getTime() === new Date(b).getTime();
};
const hoursBetween = (from, to) => (from && to
    ? Math.round((new Date(to).getTime() - new Date(from).getTime()) / 3600000)
    : null);

/** Find the vessel this schedule is for, creating it only if the feed carries enough to. */
async function resolveVessel({ spec, tenantId, dataSource, actor, summary }) {
    if (!spec) throw new ScheduleImportError('Each voyage needs a `vessel`', 'VESSEL_MISSING');

    if (spec.id) {
        const byId = await db.Vessel.findByPk(spec.id);
        if (byId) return byId;
        throw new ScheduleImportError(`Vessel ${spec.id} not found`, 'VESSEL_NOT_FOUND');
    }

    // IMO is the only globally unique, non-reassigned vessel identifier — prefer it.
    if (spec.imo_number) {
        const byImo = await db.Vessel.findOne({ where: { imo_number: String(spec.imo_number) } });
        if (byImo) return byImo;
    }
    if (spec.name) {
        const byName = await db.Vessel.findOne({ where: { name: spec.name } });
        if (byName) return byName;
    }
    if (!spec.name) {
        throw new ScheduleImportError('Unknown vessel and no `name` to create one', 'VESSEL_UNRESOLVED');
    }

    const created = await db.Vessel.create({
        tenant_id: tenantId,
        name: spec.name,
        imo_number: spec.imo_number ? String(spec.imo_number) : null,
        mmsi: spec.mmsi || null,
        vessel_type: spec.vessel_type || 'container',
        flag_country: spec.flag_country || null,
        operator_name: spec.operator_name || null,
        carrier_code: spec.carrier_code || null,
        capacity_teu: spec.capacity_teu ?? null,
        service_speed_knots: spec.service_speed_knots ?? null,
        year_built: spec.year_built ?? null,
        data_source: dataSource,
        created_by: actor,
    });
    summary.vesselsCreated += 1;
    return created;
}

/**
 * Apply one published rotation. Returns the voyage plus every dated field that moved,
 * so the caller can show a diff rather than a row count.
 */
async function applyVoyage({ spec, tenantId, dataSource, actor, summary, changes }) {
    if (!spec.voyage_number) throw new ScheduleImportError('Each voyage needs a `voyage_number`', 'VOYAGE_NUMBER_MISSING');
    const calls = Array.isArray(spec.port_calls) ? spec.port_calls : [];
    if (calls.length < 2) {
        throw new ScheduleImportError(`Voyage ${spec.voyage_number} needs at least two port calls`, 'ROTATION_TOO_SHORT');
    }

    const vessel = await resolveVessel({ spec: spec.vessel, tenantId, dataSource, actor, summary });

    const sorted = [...calls]
        .map((c, i) => ({ ...c, sequence: c.sequence ?? i }))
        .sort((a, b) => a.sequence - b.sequence);
    for (const c of sorted) {
        if (!c.port_code) throw new ScheduleImportError(`Voyage ${spec.voyage_number} has a port call with no port_code`, 'PORT_CODE_MISSING');
    }

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const voyageFields = {
        service_name: spec.service_name ?? null,
        direction: spec.direction ?? null,
        status: spec.status || 'scheduled',
        origin_port_code: first.port_code,
        destination_port_code: last.port_code,
        departure_date: asDate(first.etd),
        arrival_date: asDate(last.eta),
        data_source: dataSource,
        updated_by: actor,
    };

    let voyage = await db.Voyage.findOne({
        where: { vessel_id: vessel.id, voyage_number: spec.voyage_number },
    });
    if (voyage) {
        await voyage.update(voyageFields);
        summary.voyagesUpdated += 1;
    } else {
        voyage = await db.Voyage.create({
            tenant_id: tenantId, vessel_id: vessel.id, voyage_number: spec.voyage_number,
            created_by: actor, ...voyageFields,
        });
        summary.voyagesCreated += 1;
    }

    const existing = await db.VoyagePortCall.findAll({
        where: { voyage_id: voyage.id }, order: [['sequence', 'ASC']],
    });
    const bySequence = new Map(existing.map((c) => [c.sequence, c]));
    const publishedSequences = new Set(sorted.map((c) => c.sequence));
    const touchedCallIds = [];

    for (const c of sorted) {
        const fields = {
            port_code: c.port_code,
            port_name: c.port_name ?? null,
            country_code: c.country_code ?? null,
            terminal: c.terminal ?? null,
            call_type: c.call_type || 'both',
            eta: asDate(c.eta),
            etd: asDate(c.etd),
            cutoff_at: asDate(c.cutoff_at),
            data_source: dataSource,
            updated_by: actor,
        };
        // Rule 1: only ever record an actual the feed actually carries.
        if (c.actual_arrival !== undefined) fields.actual_arrival = asDate(c.actual_arrival);
        if (c.actual_departure !== undefined) fields.actual_departure = asDate(c.actual_departure);
        if (c.status !== undefined) fields.status = c.status;

        const prior = bySequence.get(c.sequence);
        if (prior) {
            if (!sameTime(prior.eta, fields.eta)) {
                changes.push({
                    voyageNumber: voyage.voyage_number, portCode: c.port_code, field: 'eta',
                    from: prior.eta, to: fields.eta, shiftHours: hoursBetween(prior.eta, fields.eta),
                });
            }
            if (!sameTime(prior.etd, fields.etd)) {
                changes.push({
                    voyageNumber: voyage.voyage_number, portCode: c.port_code, field: 'etd',
                    from: prior.etd, to: fields.etd, shiftHours: hoursBetween(prior.etd, fields.etd),
                });
            }
            if (prior.port_code !== c.port_code) {
                changes.push({
                    voyageNumber: voyage.voyage_number, portCode: c.port_code, field: 'port_code',
                    from: prior.port_code, to: c.port_code, shiftHours: null,
                });
            }
            // A call the carrier previously dropped and has now re-published is live again.
            if (prior.status === 'cancelled' && c.status === undefined) fields.status = 'scheduled';
            await prior.update(fields);
            summary.portCallsUpdated += 1;
            touchedCallIds.push(prior.id);
        } else {
            const created = await db.VoyagePortCall.create({
                tenant_id: tenantId, voyage_id: voyage.id, sequence: c.sequence,
                created_by: actor, ...fields,
            });
            summary.portCallsCreated += 1;
            touchedCallIds.push(created.id);
            changes.push({
                voyageNumber: voyage.voyage_number, portCode: c.port_code, field: 'added',
                from: null, to: fields.etd || fields.eta, shiftHours: null,
            });
        }
    }

    // Rule 2: calls the carrier dropped are cancelled in place, never deleted.
    for (const stale of existing) {
        if (publishedSequences.has(stale.sequence) || stale.status === 'cancelled') continue;
        await stale.update({ status: 'cancelled', updated_by: actor });
        summary.portCallsCancelled += 1;
        touchedCallIds.push(stale.id);
        changes.push({
            voyageNumber: voyage.voyage_number, portCode: stale.port_code, field: 'cancelled',
            from: stale.eta, to: null, shiftHours: null,
        });
    }

    return { voyage, touchedCallIds };
}

/** Shipments riding any of these port calls, and how far their dates would move. */
async function affectedShipments({ callIds, autoSync, actor }) {
    if (!callIds.length) return [];
    const shipments = await db.TradeShipment.findAll({
        where: {
            [Op.or]: [
                { load_port_call_id: { [Op.in]: callIds } },
                { discharge_port_call_id: { [Op.in]: callIds } },
            ],
        },
    });

    const out = [];
    for (const shipment of shipments) {
        const [load, discharge] = await Promise.all([
            shipment.load_port_call_id ? db.VoyagePortCall.findByPk(shipment.load_port_call_id) : null,
            shipment.discharge_port_call_id ? db.VoyagePortCall.findByPk(shipment.discharge_port_call_id) : null,
        ]);
        const nextDeparture = load ? (load.actual_departure || load.etd) : null;
        const nextArrival = discharge ? (discharge.actual_arrival || discharge.eta) : null;

        const entry = {
            shipmentId: shipment.id,
            shipmentNo: shipment.shipment_no,
            departureShiftHours: hoursBetween(shipment.estimated_departure, nextDeparture),
            arrivalShiftHours: hoursBetween(shipment.estimated_arrival, nextArrival),
            // A shipment whose own load or discharge call was dropped can't just be
            // re-dated — someone has to rebook it.
            callCancelled: (load && load.status === 'cancelled') || (discharge && discharge.status === 'cancelled'),
            synced: false,
        };
        if (autoSync && !entry.callCancelled) {
            const result = await syncFromVoyage({ shipment, actor });
            entry.synced = result.changed;
        }
        out.push(entry);
    }
    return out;
}

/**
 * Ingest a published schedule.
 *
 * @param {object} input
 * @param {object} input.payload    { data_source, auto_sync, voyages: [...] }
 * @param {string} input.tenantId
 * @param {string} input.actor
 */
async function importSchedule({ payload, tenantId, actor }) {
    const voyages = Array.isArray(payload?.voyages) ? payload.voyages : null;
    if (!voyages || !voyages.length) {
        throw new ScheduleImportError('`voyages` must be a non-empty array', 'VOYAGES_MISSING');
    }
    if (voyages.length > 200) {
        throw new ScheduleImportError('Import at most 200 voyages per call', 'BATCH_TOO_LARGE');
    }
    // Provenance is mandatory here: a schedule row's whole value is knowing who published
    // it, and 'manual' is reserved for something a person actually typed.
    const dataSource = payload.data_source;
    if (!dataSource || dataSource === 'manual') {
        throw new ScheduleImportError(
            '`data_source` is required and must name the feed (e.g. the carrier or provider), not "manual"',
            'DATA_SOURCE_REQUIRED',
        );
    }

    const summary = {
        vesselsCreated: 0, voyagesCreated: 0, voyagesUpdated: 0,
        portCallsCreated: 0, portCallsUpdated: 0, portCallsCancelled: 0,
    };
    const changes = [];
    const results = [];
    const rejected = [];
    const allTouchedCalls = [];

    for (const spec of voyages) {
        try {
            const { voyage, touchedCallIds } = await applyVoyage({
                spec, tenantId, dataSource, actor, summary, changes,
            });
            allTouchedCalls.push(...touchedCallIds);
            results.push({ voyageId: voyage.id, voyageNumber: voyage.voyage_number });
        } catch (err) {
            // One malformed rotation in a carrier file shouldn't discard the other 199.
            if (!(err instanceof ScheduleImportError)) throw err;
            rejected.push({ voyageNumber: spec?.voyage_number || null, code: err.code, message: err.message });
        }
    }

    const shipments = await affectedShipments({
        callIds: allTouchedCalls, autoSync: payload.auto_sync === true, actor,
    });

    return {
        dataSource,
        summary,
        voyages: results,
        rejected,
        // Only the dates that actually moved — an unchanged re-publish reports nothing.
        changes,
        affectedShipments: shipments,
        autoSynced: payload.auto_sync === true,
    };
}

module.exports = { importSchedule, ScheduleImportError };
