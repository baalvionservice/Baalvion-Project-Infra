'use strict';
const { sendSuccess, sendPaginated } = require('../utils/response');
const warehouseService = require('../service/warehouseService');
const stockService = require('../service/stockService');

const listWarehouses = async (req, res, next) => { try { return sendPaginated(req, res, await warehouseService.listWarehouses(req.params.storeId, req.query)); } catch (err) { return next(err); } };
const getWarehouse = async (req, res, next) => { try { return sendSuccess(req, res, await warehouseService.getWarehouse(req.params.storeId, req.params.warehouseId)); } catch (err) { return next(err); } };
const createWarehouse = async (req, res, next) => { try { return sendSuccess(req, res, await warehouseService.createWarehouse(req.params.storeId, req.validated), 201); } catch (err) { return next(err); } };
const updateWarehouse = async (req, res, next) => { try { return sendSuccess(req, res, await warehouseService.updateWarehouse(req.params.storeId, req.params.warehouseId, req.validated)); } catch (err) { return next(err); } };
const deleteWarehouse = async (req, res, next) => { try { await warehouseService.deleteWarehouse(req.params.storeId, req.params.warehouseId); return sendSuccess(req, res, null, 204); } catch (err) { return next(err); } };

const listStock = async (req, res, next) => { try { return sendPaginated(req, res, await stockService.listStock(req.params.storeId, { ...req.query, warehouseId: req.params.warehouseId })); } catch (err) { return next(err); } };
const adjustStock = async (req, res, next) => { try { return sendSuccess(req, res, await stockService.adjustStock(req.params.storeId, req.params.warehouseId, { ...req.validated, userId: req.auth.userId })); } catch (err) { return next(err); } };

const listAllStock = async (req, res, next) => { try { return sendPaginated(req, res, await stockService.listStock(req.params.storeId, req.query)); } catch (err) { return next(err); } };
const listMovements = async (req, res, next) => { try { return sendPaginated(req, res, await stockService.listMovements(req.params.storeId, req.query)); } catch (err) { return next(err); } };
const lowStockAlerts = async (req, res, next) => { try { return sendPaginated(req, res, await stockService.lowStockAlerts(req.params.storeId, req.query)); } catch (err) { return next(err); } };

module.exports = { listWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse, listStock, adjustStock, listAllStock, listMovements, lowStockAlerts };
