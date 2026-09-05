'use strict';
/**
 * Turn a confirmed freight booking into a real tradeops shipment.
 *
 * `tradeops.freight_bookings` has carried `shipment_id` and `trade_operation_id`
 * columns since migration 016, and nothing ever filled them: a booking succeeded and
 * left no shipment behind. The frontend papered over it by POSTing to the LEGACY
 * `/v1/shipments` (trade.shipments, INTEGER pk, a table with zero rows that nothing
 * else reads), so a booked container was invisible to tracking, customs, incidents
 * and — since migration 068 made the reference a real FK — uninsurable.
 *
 * tradeops.shipments is the table the rest of the platform actually references, and
 * it requires a trade operation, so one is created alongside. Both are idempotent on
 * the booking: calling this twice returns the same shipment rather than a duplicate.
 *
 * Failure here does NOT fail the booking. The container is booked with the carrier
 * either way; losing the local projection is a degraded state to report, not a
 * reason to pretend the booking did not happen.
 */
const db = require('../../models');
const partyIdentity = require('../dashboard/partyIdentity');

/**
 * The two layers speak different mode vocabularies and always have: the freight
 * marketplace uses carrier product families (express/air/ocean/road), tradeops uses
 * physical carriage (sea/air/road/rail/multimodal). Unmapped, every ocean booking
 * failed the shipment's `isIn` check and left no record behind.
 *
 * `express` maps to air because its linehaul is air; the road legs either side are
 * the courier's own, not a separate carriage the platform tracks.
 */
const MODE_MAP = { ocean: 'sea', sea: 'sea', air: 'air', express: 'air', road: 'road', rail: 'rail' };
const shipmentModeFor = (mode) => MODE_MAP[String(mode || '').toLowerCase()] || 'multimodal';

/** UN/LOCODE or free text, whichever the request carried. */
const portOf = (place) => {
    if (!place) return null;
    if (typeof place === 'string') return place;
    return place.unlocode || place.code || place.port || place.name || null;
};
const countryOf = (place) => {
    if (!place || typeof place === 'string') return null;
    return place.countryCode || place.country_code || place.country || null;
};

async function materialiseShipment(record, { actor = 'system' } = {}) {
    if (record.shipment_id) {
        const existing = await db.TradeShipment.findByPk(record.shipment_id);
        if (existing) return { shipment: existing, created: false };
    }

    // tracking_number is unique per tenant, and one carrier tracking number IS one
    // shipment — so an existing row for it is the shipment this booking refers to,
    // not a collision to fail on. (The simulated connectors are deterministic for a
    // given lane, which makes this path routine in development.)
    if (record.tracking_number) {
        const byTracking = await db.TradeShipment.findOne({
            where: { tenant_id: record.tenant_id, tracking_number: record.tracking_number },
        });
        if (byTracking) {
            await record.update({ shipment_id: byTracking.id, trade_operation_id: byTracking.trade_operation_id });
            return { shipment: byTracking, created: false };
        }
    }

    const request = record.request || {};
    const meta = request.metadata || {};
    const tenantId = record.tenant_id;

    // Ports may arrive on the address (the correct place) or in request metadata,
    // which is where the booking wizard historically put them. Accept either.
    const originPort = portOf(request.origin) || meta.origin_port || null;
    const destinationPort = portOf(request.destination) || meta.destination_port || null;

    let operationId = record.trade_operation_id;
    if (!operationId) {
        // Stamp the booking org as a party. Without this the operation is created
        // with buyer_org_id / seller_org_id NULL, and every party-scoped surface
        // (the trade operations dashboard, the clearance ledger) correctly matches
        // nobody — the org that booked the freight can't see its own shipment.
        // Which SIDE it is comes from the org's own type; an org whose type doesn't
        // say leaves both sides null rather than being guessed onto one of them.
        const org = await partyIdentity.organizationForTenant(tenantId);
        const partySide = org && org.code
            ? (org.type === 'buyer' ? { buyer_org_id: org.code }
                : org.type === 'seller' ? { seller_org_id: org.code }
                    : {})
            : {};

        // Keyed on the booking id, not the tracking number: carriers reuse tracking
        // numbers across re-bookings of the same lane, and reference_no is unique
        // per tenant — so two bookings of one route collided on the second.
        const operation = await db.TradeOperation.create({
            tenant_id: tenantId,
            reference_no: `OP-${record.id}`,
            status: 'active',
            ...partySide,
            metadata: { source: 'freight_booking', bookingId: record.id, trackingNumber: record.tracking_number || null },
            created_by: actor,
        });
        operationId = operation.id;
    }

    const shipment = await db.TradeShipment.create({
        tenant_id: tenantId,
        trade_operation_id: operationId,
        shipment_no: `SHP-${record.id}`,   // unique per booking; the carrier's number lives in tracking_number
        carrier_id: record.carrier || null,
        carrier_name: record.carrier ? String(record.carrier).toUpperCase() : null,
        mode: shipmentModeFor(record.mode),
        tracking_number: record.tracking_number || null,
        origin_port: originPort,
        destination_port: destinationPort,
        origin_country: countryOf(request.origin),
        destination_country: countryOf(request.destination),
        status: 'booked',
        // The carrier's own ETA governs; a missing one leaves the field null rather
        // than inventing a date the insurance cover period would then be built on.
        estimated_arrival: record.estimated_delivery || null,
        estimated_departure: request.ready_date || request.readyDate || null,
        gross_weight_kg: request.gross_weight_kg ?? request.chargeable_weight_kg ?? null,
        package_count: request.package_count ?? (Array.isArray(request.pieces) ? request.pieces.length : null),
        declared_value: request.declared_value ?? request.declaredValue ?? null,
        currency: request.currency || record.currency || null,
        incoterm: request.incoterm || null,
        metadata: { source: 'freight_booking', bookingId: record.id, gatewayReference: record.gateway_reference || null },
        created_by: actor,
    });

    await record.update({ shipment_id: shipment.id, trade_operation_id: operationId });
    return { shipment, created: true };
}

module.exports = { materialiseShipment };
