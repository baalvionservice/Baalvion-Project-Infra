'use strict';
const contactService = require('../service/contactService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createContactSchema, updateContactSubmissionSchema, paginationSchema } = require('../validators/schemas');

const createSubmission = async (req, res, next) => {
    try {
        const parsed = createContactSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const ip = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const data = await contactService.createSubmission(parsed.data, ip, userAgent);
        return sendSuccess(req, res, { id: data.id, message: 'Your message has been received.' }, 201);
    } catch (err) { return next(err); }
};

const listSubmissions = async (req, res, next) => {
    try {
        const parsed = paginationSchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await contactService.listSubmissions(parsed.data);
        return sendPaginated(req, res, data);
    } catch (err) { return next(err); }
};

const getSubmission = async (req, res, next) => {
    try {
        const data = await contactService.getSubmission(req.params.id);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const updateSubmission = async (req, res, next) => {
    try {
        const parsed = updateContactSubmissionSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await contactService.updateSubmission(req.params.id, parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

module.exports = { createSubmission, listSubmissions, getSubmission, updateSubmission };
