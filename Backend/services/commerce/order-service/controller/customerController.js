'use strict';
const { sendSuccess, sendPaginated } = require('../utils/response');
const customerService = require('../service/customerService');

const listCustomers = async (req, res, next) => {
    try { return sendPaginated(req, res, await customerService.listCustomers(req.params.storeId, req.query)); }
    catch (err) { return next(err); }
};

const getCustomer = async (req, res, next) => {
    try { return sendSuccess(req, res, await customerService.getCustomer(req.params.storeId, req.params.customerId)); }
    catch (err) { return next(err); }
};

const upsertCustomer = async (req, res, next) => {
    try { return sendSuccess(req, res, await customerService.upsertCustomer(req.params.storeId, { ...req.validated, userId: req.auth.userId })); }
    catch (err) { return next(err); }
};

const updateCustomer = async (req, res, next) => {
    try { return sendSuccess(req, res, await customerService.updateCustomer(req.params.storeId, req.params.customerId, req.validated)); }
    catch (err) { return next(err); }
};

const listAddresses = async (req, res, next) => {
    try { return sendSuccess(req, res, await customerService.listAddresses(req.params.storeId, req.params.customerId)); }
    catch (err) { return next(err); }
};

const addAddress = async (req, res, next) => {
    try { return sendSuccess(req, res, await customerService.addAddress(req.params.storeId, req.params.customerId, req.validated), 201); }
    catch (err) { return next(err); }
};

const updateAddress = async (req, res, next) => {
    try { return sendSuccess(req, res, await customerService.updateAddress(req.params.storeId, req.params.customerId, req.params.addressId, req.validated)); }
    catch (err) { return next(err); }
};

const deleteAddress = async (req, res, next) => {
    try { await customerService.deleteAddress(req.params.storeId, req.params.customerId, req.params.addressId); return sendSuccess(req, res, null, 204); }
    catch (err) { return next(err); }
};

module.exports = { listCustomers, getCustomer, upsertCustomer, updateCustomer, listAddresses, addAddress, updateAddress, deleteAddress };
