'use strict';
const { sendSuccess, sendPaginated } = require('../utils/response');
const storeService = require('../service/storeService');

const listStores = async (req, res, next) => {
    try {
        const result = await storeService.listStores(req.auth.orgId, req.query);
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const getStore = async (req, res, next) => {
    try {
        const store = await storeService.getStore(req.params.storeId, req.auth.orgId);
        return sendSuccess(req, res, store);
    } catch (err) { return next(err); }
};

const createStore = async (req, res, next) => {
    try {
        const store = await storeService.createStore(req.auth.orgId, req.auth.userId, req.validated);
        return sendSuccess(req, res, store, 201);
    } catch (err) { return next(err); }
};

const updateStore = async (req, res, next) => {
    try {
        const store = await storeService.updateStore(req.params.storeId, req.auth.orgId, req.validated);
        return sendSuccess(req, res, store);
    } catch (err) { return next(err); }
};

const deleteStore = async (req, res, next) => {
    try {
        await storeService.deleteStore(req.params.storeId, req.auth.orgId);
        return sendSuccess(req, res, null, 204);
    } catch (err) { return next(err); }
};

const listMembers = async (req, res, next) => {
    try {
        const members = await storeService.listMembers(req.params.storeId, req.auth.orgId);
        return sendSuccess(req, res, members);
    } catch (err) { return next(err); }
};

const addMember = async (req, res, next) => {
    try {
        const member = await storeService.addMember(req.params.storeId, req.auth.orgId, req.validated);
        return sendSuccess(req, res, member, 201);
    } catch (err) { return next(err); }
};

const updateMemberRole = async (req, res, next) => {
    try {
        const member = await storeService.updateMemberRole(req.params.storeId, req.auth.orgId, req.params.userId, req.validated.role);
        return sendSuccess(req, res, member);
    } catch (err) { return next(err); }
};

const removeMember = async (req, res, next) => {
    try {
        await storeService.removeMember(req.params.storeId, req.auth.orgId, req.params.userId);
        return sendSuccess(req, res, null, 204);
    } catch (err) { return next(err); }
};

module.exports = { listStores, getStore, createStore, updateStore, deleteStore, listMembers, addMember, updateMemberRole, removeMember };
