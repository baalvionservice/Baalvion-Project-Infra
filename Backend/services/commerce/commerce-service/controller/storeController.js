'use strict';
const { sendSuccess, sendPaginated } = require('../utils/response');
const storeService = require('../service/storeService');

const authCtxOf = (req) => ({
    userId: req.auth.userId,
    orgId: req.auth.orgId,
    token: (req.get && req.get('authorization')) || undefined,
    jwtRoles: Array.isArray(req.auth.roles) ? req.auth.roles : (req.auth.role != null ? [req.auth.role] : []),
});

const listStores = async (req, res, next) => {
    try {
        // req.accessScope is injected by loadAccessScope (RBAC-derived). Never fall back to
        // unscoped results — if it is somehow missing, deny by passing an empty scope.
        const scope = req.accessScope || { unrestricted: false, allowedCountries: [], allowedStoreIds: [] };
        const result = await storeService.listStores(scope, req.query);
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const getStore = async (req, res, next) => {
    try {
        const store = await storeService.getStore(req.params.storeId);
        return sendSuccess(req, res, store);
    } catch (err) { return next(err); }
};

const createStore = async (req, res, next) => {
    try {
        const store = await storeService.createStore(authCtxOf(req), req.validated);
        return sendSuccess(req, res, store, 201);
    } catch (err) { return next(err); }
};

const updateStore = async (req, res, next) => {
    try {
        const store = await storeService.updateStore(req.params.storeId, req.validated);
        return sendSuccess(req, res, store);
    } catch (err) { return next(err); }
};

const deleteStore = async (req, res, next) => {
    try {
        await storeService.deleteStore(req.params.storeId);
        return sendSuccess(req, res, null, 204);
    } catch (err) { return next(err); }
};

const listMembers = async (req, res, next) => {
    try {
        const members = await storeService.listMembers(req.params.storeId, req.get('authorization'));
        return sendSuccess(req, res, members);
    } catch (err) { return next(err); }
};

const addMember = async (req, res, next) => {
    try {
        const member = await storeService.addMember(req.params.storeId, req.validated, req.get('authorization'));
        return sendSuccess(req, res, member, 201);
    } catch (err) { return next(err); }
};

const updateMemberRole = async (req, res, next) => {
    try {
        const member = await storeService.updateMemberRole(req.params.storeId, req.params.userId, req.validated.role, req.get('authorization'));
        return sendSuccess(req, res, member);
    } catch (err) { return next(err); }
};

const removeMember = async (req, res, next) => {
    try {
        await storeService.removeMember(req.params.storeId, req.params.userId, req.get('authorization'));
        return sendSuccess(req, res, null, 204);
    } catch (err) { return next(err); }
};

module.exports = { listStores, getStore, createStore, updateStore, deleteStore, listMembers, addMember, updateMemberRole, removeMember };
