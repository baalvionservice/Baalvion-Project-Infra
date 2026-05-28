'use strict';
const { Op } = require('sequelize');
const { FulfillmentShipment, FulfillmentTrackingEvent, FulfillmentCourier } = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination, buildPaginated } = require('../utils/pagination');

async function listShipments(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = { storeId };
    if (query.status) where.status = query.status;
    if (query.orderId) where.orderId = query.orderId;
    if (query.trackingNumber) where.trackingNumber = { [Op.iLike]: `%${query.trackingNumber}%` };
    const { rows, count } = await FulfillmentShipment.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']], include: [{ model: FulfillmentCourier, as: 'courier', attributes: ['id', 'name', 'code', 'trackingUrl'] }] });
    return buildPaginated(rows, count, { page, limit });
}

async function getShipment(storeId, shipmentId) {
    const shipment = await FulfillmentShipment.findOne({
        where: { id: shipmentId, storeId },
        include: [
            { model: FulfillmentCourier, as: 'courier' },
            { model: FulfillmentTrackingEvent, as: 'events', order: [['occurredAt', 'DESC']] },
        ],
    });
    if (!shipment) throw new AppError('NOT_FOUND', 'Shipment not found', 404);
    return shipment.toJSON();
}

async function createShipment(storeId, body) {
    return (await FulfillmentShipment.create({ ...body, storeId, status: 'pending' })).toJSON();
}

async function updateShipment(storeId, shipmentId, body) {
    const shipment = await FulfillmentShipment.findOne({ where: { id: shipmentId, storeId } });
    if (!shipment) throw new AppError('NOT_FOUND', 'Shipment not found', 404);
    if (body.status === 'shipped' && !body.shippedAt) body.shippedAt = new Date();
    if (body.status === 'delivered' && !body.deliveredAt) body.deliveredAt = new Date();
    await shipment.update(body);
    return shipment.toJSON();
}

async function addTrackingEvent(storeId, shipmentId, { status, location, description, occurredAt }) {
    const shipment = await FulfillmentShipment.findOne({ where: { id: shipmentId, storeId } });
    if (!shipment) throw new AppError('NOT_FOUND', 'Shipment not found', 404);
    const event = await FulfillmentTrackingEvent.create({ shipmentId, status, location, description, occurredAt: occurredAt || new Date() });
    await shipment.update({ status });
    return event.toJSON();
}

module.exports = { listShipments, getShipment, createShipment, updateShipment, addTrackingEvent };
