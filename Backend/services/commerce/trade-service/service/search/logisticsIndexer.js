'use strict';
/**
 * Logistics Core Foundation (Phase 4) — OpenSearch indexing for shipments and
 * containers (search by shipment/tracking/container number, carrier, port,
 * country, status — per the spec's Search section) via @baalvion/search.
 *
 * DEGRADES GRACEFULLY: @baalvion/search is a new dependency added to
 * package.json in this same change but is NOT yet installed/built (same
 * caveat as service/events/logisticsEvents.js). Every export no-ops (logged
 * once) until `pnpm install` + the package's `tsup` build have run, and even
 * once installed, an unreachable OpenSearch cluster degrades the same way
 * (index calls are best-effort — never block or fail the caller's mutation).
 */
const logger = require('../logger');

let searchPkg = null;
let warnedMissing = false;
try {
    // eslint-disable-next-line global-require
    searchPkg = require('@baalvion/search');
} catch {
    searchPkg = null;
}

function warnOnceIfMissing() {
    if (searchPkg || warnedMissing) return;
    warnedMissing = true;
    logger.warn('@baalvion/search not installed — logistics search indexing is a no-op until `pnpm install` + package build run');
}

function shipmentToDocument(shipment) {
    return {
        shipmentNo: shipment.shipment_no,
        trackingNumber: shipment.tracking_number || null,
        status: shipment.status,
        mode: shipment.mode || null,
        carrierName: shipment.carrier_name || null,
        originCountry: shipment.origin_country || null,
        destinationCountry: shipment.destination_country || null,
        originPort: shipment.origin_port || null,
        destinationPort: shipment.destination_port || null,
        estimatedArrival: shipment.estimated_arrival ? new Date(shipment.estimated_arrival).toISOString() : null,
        tenantId: shipment.tenant_id,
        orgId: shipment.tenant_id,
    };
}

function containerToDocument(container) {
    return {
        containerNumber: container.container_number,
        isoCode: container.iso_code || null,
        containerType: container.container_type,
        status: container.status,
        currentLocation: container.current_location || null,
        shipmentId: container.shipment_id || null,
        tenantId: container.tenant_id,
        orgId: container.tenant_id,
    };
}

async function indexShipment(shipment) {
    warnOnceIfMissing();
    if (!searchPkg) return;
    try {
        await searchPkg.indexDocument(searchPkg.INDICES.SHIPMENTS, shipment.id, shipmentToDocument(shipment));
    } catch (err) {
        logger.error('Failed to index shipment', { shipmentId: shipment.id, error: err.message });
    }
}

async function indexContainer(container) {
    warnOnceIfMissing();
    if (!searchPkg) return;
    try {
        await searchPkg.indexDocument(searchPkg.INDICES.CONTAINERS, container.id, containerToDocument(container));
    } catch (err) {
        logger.error('Failed to index container', { containerId: container.id, error: err.message });
    }
}

async function deleteShipmentFromIndex(shipmentId) {
    if (!searchPkg) return;
    try { await searchPkg.deleteDocument(searchPkg.INDICES.SHIPMENTS, shipmentId); } catch (err) {
        logger.error('Failed to delete shipment from index', { shipmentId, error: err.message });
    }
}

async function deleteContainerFromIndex(containerId) {
    if (!searchPkg) return;
    try { await searchPkg.deleteDocument(searchPkg.INDICES.CONTAINERS, containerId); } catch (err) {
        logger.error('Failed to delete container from index', { containerId, error: err.message });
    }
}

module.exports = { indexShipment, indexContainer, deleteShipmentFromIndex, deleteContainerFromIndex };
