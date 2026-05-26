'use strict';
const clientService = require('../service/clientService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError }  = require('../utils/errors');

exports.listClients = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const result = await clientService.listClients(req.auth.userId, {
            page:  Math.max(1, parseInt(page, 10)),
            limit: Math.min(100, Math.max(1, parseInt(limit, 10))),
        });
        sendPaginated(req, res, result.items, result.total, result.page, result.limit);
    } catch (err) { next(err); }
};

exports.createClient = async (req, res, next) => {
    try {
        const { name, redirectUris, grantTypes, scopes, isConfidential } = req.body;
        if (!name) throw new AppError('VALIDATION_ERROR', 'name is required', 400);
        const client = await clientService.createClient({
            name, redirectUris, grantTypes, scopes, isConfidential,
            ownerId: req.auth.userId, orgId: req.auth.orgId,
        });
        sendSuccess(req, res, client, 201);
    } catch (err) { next(err); }
};

exports.rotateSecret = async (req, res, next) => {
    try {
        const result = await clientService.rotateClientSecret(req.params.clientId, req.auth.userId);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.deleteClient = async (req, res, next) => {
    try {
        await clientService.deleteClient(req.params.clientId, req.auth.userId);
        sendSuccess(req, res, { message: 'Client deleted' });
    } catch (err) { next(err); }
};
