'use strict';
const eventService = require('../service/eventService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createEventSchema, updateEventSchema, paginationSchema } = require('../validators/schemas');

const DEFAULT_ORG_ID = process.env.IR_DEFAULT_ORG_ID || '11111111-1111-1111-1111-111111111111';

const listEvents = async (req, res, next) => {
    try {
        const parsed = paginationSchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        return sendPaginated(req, res, await eventService.listEvents(orgId, parsed.data));
    } catch (err) { return next(err); }
};

const createEvent = async (req, res, next) => {
    try {
        const parsed = createEventSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        return sendSuccess(req, res, await eventService.createEvent(req.user.orgId, req.user.id, parsed.data), 201);
    } catch (err) { return next(err); }
};

const getEvent = async (req, res, next) => {
    try {
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        return sendSuccess(req, res, await eventService.getEvent(req.params.id, orgId));
    } catch (err) { return next(err); }
};

const updateEvent = async (req, res, next) => {
    try {
        const parsed = updateEventSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        return sendSuccess(req, res, await eventService.updateEvent(req.params.id, req.user.orgId, parsed.data));
    } catch (err) { return next(err); }
};

const deleteEvent = async (req, res, next) => {
    try {
        await eventService.deleteEvent(req.params.id, req.user.orgId);
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { listEvents, createEvent, getEvent, updateEvent, deleteEvent };
