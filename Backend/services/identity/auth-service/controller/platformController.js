const platformService = require('../service/platformService');
const schemas = require('../validators/schemas');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

function parse(schema, body) {
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
    return parsed.data;
}

exports.createOrganization = async (req, res, next) => {
    try {
        const data = parse(schemas.platformCreateOrg, req.body);
        const result = await platformService.createOrganization({ requesterId: req.auth.userId, data, ipAddress: req.ip });
        sendSuccess(req, res, result, 201);
    } catch (err) { next(err); }
};

exports.listOrganizations = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Math.min(Number(req.query.limit) || 25, 200);
        const result = await platformService.listOrganizations({
            requesterId: req.auth.userId,
            search: req.query.search,
            type: req.query.type,
            status: req.query.status,
            page, limit,
        });
        sendPaginated(req, res, result);
    } catch (err) { next(err); }
};

exports.getOrganization = async (req, res, next) => {
    try {
        sendSuccess(req, res, await platformService.getOrganization({ requesterId: req.auth.userId, orgId: req.params.orgId }));
    } catch (err) { next(err); }
};

exports.updateOrganization = async (req, res, next) => {
    try {
        const fields = parse(schemas.updateOrg, req.body);
        sendSuccess(req, res, await platformService.updateOrganization({ requesterId: req.auth.userId, orgId: req.params.orgId, fields, ipAddress: req.ip }));
    } catch (err) { next(err); }
};

exports.setOrganizationStatus = async (req, res, next) => {
    try {
        const data = parse(schemas.setOrgStatus, req.body);
        sendSuccess(req, res, await platformService.setOrganizationStatus({ requesterId: req.auth.userId, orgId: req.params.orgId, status: data.status, ipAddress: req.ip }));
    } catch (err) { next(err); }
};

exports.listOrganizationUsers = async (req, res, next) => {
    try {
        sendSuccess(req, res, await platformService.listOrganizationUsers({ requesterId: req.auth.userId, orgId: req.params.orgId }));
    } catch (err) { next(err); }
};

exports.getOrganizationAudit = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Math.min(Number(req.query.limit) || 50, 200);
        const result = await platformService.getOrganizationAudit({ requesterId: req.auth.userId, orgId: req.params.orgId, page, limit });
        sendPaginated(req, res, result);
    } catch (err) { next(err); }
};

exports.getMetrics = async (req, res, next) => {
    try {
        sendSuccess(req, res, await platformService.getMetrics({ requesterId: req.auth.userId }));
    } catch (err) { next(err); }
};
