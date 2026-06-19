'use strict';
const { sendSuccess, sendPaginated } = require('../utils/response');
const consignmentService = require('../service/consignmentService');
const { actorOf } = require('../utils/actor');

// Shopper/guest: submit a consignment request (+items). Ownership bound in-service (userId or
// signed guest session).
const submitConsignment = async (req, res, next) => {
    try { return sendSuccess(req, res, await consignmentService.submitConsignment(req.params.storeId, req.validated, actorOf(req)), 201); }
    catch (err) { return next(err); }
};

// Customer-facing: the authenticated seller's own consignments (IDOR-safe — scoped by userId).
const listMyConsignments = async (req, res, next) => {
    try { return sendPaginated(req, res, await consignmentService.listMyConsignments(req.params.storeId, req.auth && req.auth.userId, req.query)); }
    catch (err) { return next(err); }
};

// Admin: list all consignments in the store (filterable by status).
const listConsignments = async (req, res, next) => {
    try { return sendPaginated(req, res, await consignmentService.listConsignments(req.params.storeId, req.query)); }
    catch (err) { return next(err); }
};

// Owner/guest/staff: read a single consignment request (ownership enforced in-service).
const getConsignment = async (req, res, next) => {
    try { return sendSuccess(req, res, await consignmentService.getConsignment(req.params.storeId, req.params.id, actorOf(req))); }
    catch (err) { return next(err); }
};

// Admin/ops: advance a consignment along the forward-only status machine.
const updateConsignmentStatus = async (req, res, next) => {
    try { return sendSuccess(req, res, await consignmentService.updateConsignmentStatus(req.params.storeId, req.params.id, req.validated, req.auth.userId)); }
    catch (err) { return next(err); }
};

// Admin/authenticator: record an item's authentication outcome.
const recordAuthentication = async (req, res, next) => {
    try { return sendSuccess(req, res, await consignmentService.recordAuthentication(req.params.storeId, req.params.id, req.params.itemId, req.validated, req.auth.userId), 201); }
    catch (err) { return next(err); }
};

// Admin/authenticator: issue a certificate of authenticity for an authenticated item.
const issueCertificate = async (req, res, next) => {
    try { return sendSuccess(req, res, await consignmentService.issueCertificate(req.params.storeId, req.params.id, req.params.itemId, req.validated, req.auth.userId), 201); }
    catch (err) { return next(err); }
};

// PUBLIC: verify a certificate by its code. Returns only safe display fields.
const verifyCertificate = async (req, res, next) => {
    try { return sendSuccess(req, res, await consignmentService.verifyCertificate(req.params.storeId, req.params.code)); }
    catch (err) { return next(err); }
};

// Authenticated seller: read own profile.
const getSellerProfile = async (req, res, next) => {
    try { return sendSuccess(req, res, await consignmentService.getSellerProfile(req.params.storeId, req.auth && req.auth.userId)); }
    catch (err) { return next(err); }
};

// Authenticated seller: create/update own profile.
const upsertSellerProfile = async (req, res, next) => {
    try { return sendSuccess(req, res, await consignmentService.upsertSellerProfile(req.params.storeId, req.auth && req.auth.userId, req.validated)); }
    catch (err) { return next(err); }
};

module.exports = {
    submitConsignment,
    listMyConsignments,
    listConsignments,
    getConsignment,
    updateConsignmentStatus,
    recordAuthentication,
    issueCertificate,
    verifyCertificate,
    getSellerProfile,
    upsertSellerProfile,
};
