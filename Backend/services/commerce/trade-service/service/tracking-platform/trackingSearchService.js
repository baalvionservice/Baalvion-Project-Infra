'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — one search box across
 * every entity a dispatcher/CS agent might be handed (tracking number,
 * shipment/order/booking id, container, vehicle, carrier, PO number).
 */
const { Op } = require('sequelize');
const db = require('../../models');

/**
 * @param {string} query free-text query (tracking number, id, plate, PO number, ...)
 * @param {string} [tenantId] scope non-admin callers to their tenant
 * @returns {Promise<{shipments, containers, vehicles, freightBookings, purchaseOrders}>}
 */
async function search(query, tenantId) {
    const q = String(query || '').trim();
    if (!q) return { shipments: [], containers: [], vehicles: [], freightBookings: [], purchaseOrders: [] };

    const tenantWhere = tenantId ? { tenant_id: tenantId } : {};
    const like = { [Op.iLike]: `%${q}%` };

    const [shipments, containers, vehicles, freightBookings, purchaseOrders] = await Promise.all([
        db.TradeShipment.findAll({
            where: { ...tenantWhere, [Op.or]: [{ shipment_no: like }, { tracking_number: like }, { bill_of_lading_no: like }, { container_no: like }] },
            limit: 20,
        }),
        db.Container.findAll({ where: { ...tenantWhere, [Op.or]: [{ container_number: like }, { seal_number: like }] }, limit: 20 }),
        db.Vehicle.findAll({ where: { ...tenantWhere, vehicle_number: like }, limit: 20 }),
        db.FreightBooking.findAll({ where: { ...tenantWhere, [Op.or]: [{ tracking_number: like }, { order_id: like }] }, limit: 20 }),
        db.PurchaseOrder ? db.PurchaseOrder.findAll({ where: { ...tenantWhere, po_number: like }, limit: 20 }).catch(() => []) : Promise.resolve([]),
    ]);

    return { shipments, containers, vehicles, freightBookings, purchaseOrders };
}

module.exports = { search };
