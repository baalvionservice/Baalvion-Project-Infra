'use strict';
const { FulfillmentShippingZone, FulfillmentShippingRate, FulfillmentCourier } = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination, buildPaginated } = require('../utils/pagination');

async function listZones(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const { rows, count } = await FulfillmentShippingZone.findAndCountAll({ where: { storeId }, limit, offset, order: [['name', 'ASC']], include: [{ model: FulfillmentShippingRate, as: 'rates', where: { isActive: true }, required: false }] });
    return buildPaginated(rows, count, { page, limit });
}

async function createZone(storeId, body) {
    return (await FulfillmentShippingZone.create({ ...body, storeId })).toJSON();
}

async function updateZone(storeId, zoneId, body) {
    const zone = await FulfillmentShippingZone.findOne({ where: { id: zoneId, storeId } });
    if (!zone) throw new AppError('NOT_FOUND', 'Shipping zone not found', 404);
    await zone.update(body);
    return zone.toJSON();
}

async function deleteZone(storeId, zoneId) {
    const zone = await FulfillmentShippingZone.findOne({ where: { id: zoneId, storeId } });
    if (!zone) throw new AppError('NOT_FOUND', 'Shipping zone not found', 404);
    await zone.destroy();
}

async function addRate(storeId, zoneId, body) {
    const zone = await FulfillmentShippingZone.findOne({ where: { id: zoneId, storeId } });
    if (!zone) throw new AppError('NOT_FOUND', 'Shipping zone not found', 404);
    return (await FulfillmentShippingRate.create({ ...body, zoneId, storeId })).toJSON();
}

async function updateRate(storeId, rateId, body) {
    const rate = await FulfillmentShippingRate.findOne({ where: { id: rateId, storeId } });
    if (!rate) throw new AppError('NOT_FOUND', 'Shipping rate not found', 404);
    await rate.update(body);
    return rate.toJSON();
}

async function deleteRate(storeId, rateId) {
    const rate = await FulfillmentShippingRate.findOne({ where: { id: rateId, storeId } });
    if (!rate) throw new AppError('NOT_FOUND', 'Shipping rate not found', 404);
    await rate.destroy();
}

async function listCouriers(storeId) {
    return FulfillmentCourier.findAll({ where: { storeId }, order: [['name', 'ASC']] });
}

async function createCourier(storeId, body) {
    return (await FulfillmentCourier.create({ ...body, storeId })).toJSON();
}

async function updateCourier(storeId, courierId, body) {
    const courier = await FulfillmentCourier.findOne({ where: { id: courierId, storeId } });
    if (!courier) throw new AppError('NOT_FOUND', 'Courier not found', 404);
    await courier.update(body);
    return courier.toJSON();
}

module.exports = { listZones, createZone, updateZone, deleteZone, addRate, updateRate, deleteRate, listCouriers, createCourier, updateCourier };
