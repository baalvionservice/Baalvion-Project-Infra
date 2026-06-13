'use strict';
const { sendSuccess, sendPaginated } = require('../utils/response');
const customerService = require('../service/customerService');
const { actorOf } = require('../utils/actor');

const listCustomers = async (req, res, next) => {
    try { return sendPaginated(req, res, await customerService.listCustomers(req.params.storeId, req.query)); }
    catch (err) { return next(err); }
};

const getCustomer = async (req, res, next) => {
    try { return sendSuccess(req, res, await customerService.getCustomer(req.params.storeId, req.params.customerId, actorOf(req))); }
    catch (err) { return next(err); }
};

const upsertCustomer = async (req, res, next) => {
    try { return sendSuccess(req, res, await customerService.upsertCustomer(req.params.storeId, { ...req.validated, userId: req.auth.userId }, actorOf(req))); }
    catch (err) { return next(err); }
};

const updateCustomer = async (req, res, next) => {
    try { return sendSuccess(req, res, await customerService.updateCustomer(req.params.storeId, req.params.customerId, req.validated, actorOf(req))); }
    catch (err) { return next(err); }
};

const listAddresses = async (req, res, next) => {
    try { return sendSuccess(req, res, await customerService.listAddresses(req.params.storeId, req.params.customerId, actorOf(req))); }
    catch (err) { return next(err); }
};

const addAddress = async (req, res, next) => {
    try { return sendSuccess(req, res, await customerService.addAddress(req.params.storeId, req.params.customerId, req.validated, actorOf(req)), 201); }
    catch (err) { return next(err); }
};

const updateAddress = async (req, res, next) => {
    try { return sendSuccess(req, res, await customerService.updateAddress(req.params.storeId, req.params.customerId, req.params.addressId, req.validated, actorOf(req))); }
    catch (err) { return next(err); }
};

const deleteAddress = async (req, res, next) => {
    try { await customerService.deleteAddress(req.params.storeId, req.params.customerId, req.params.addressId, actorOf(req)); return sendSuccess(req, res, null, 204); }
    catch (err) { return next(err); }
};

// ── /me-scoped saved addresses — customer resolved server-side from req.auth.userId ───────────
// req.auth.email (verified JWT claim) is passed so resolveMyCustomer can email-claim a pre-existing
// unlinked (userId=null) customer row on first authed access.
const listMyAddresses = async (req, res, next) => {
    try { return sendSuccess(req, res, await customerService.listMyAddresses(req.params.storeId, req.auth.userId, req.auth.email)); }
    catch (err) { return next(err); }
};

const addMyAddress = async (req, res, next) => {
    try { return sendSuccess(req, res, await customerService.addMyAddress(req.params.storeId, req.auth.userId, req.validated, req.auth.email), 201); }
    catch (err) { return next(err); }
};

const updateMyAddress = async (req, res, next) => {
    try { return sendSuccess(req, res, await customerService.updateMyAddress(req.params.storeId, req.auth.userId, req.params.addressId, req.validated, req.auth.email)); }
    catch (err) { return next(err); }
};

const deleteMyAddress = async (req, res, next) => {
    try { await customerService.deleteMyAddress(req.params.storeId, req.auth.userId, req.params.addressId, req.auth.email); return sendSuccess(req, res, null, 204); }
    catch (err) { return next(err); }
};

module.exports = { listCustomers, getCustomer, upsertCustomer, updateCustomer, listAddresses, addAddress, updateAddress, deleteAddress, listMyAddresses, addMyAddress, updateMyAddress, deleteMyAddress };
