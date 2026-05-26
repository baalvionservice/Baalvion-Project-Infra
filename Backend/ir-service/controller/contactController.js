'use strict';
const contactService = require('../service/contactService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createContactSchema, updateContactSchema } = require('../validators/schemas');

const listContacts = async (req, res, next) => {
    try {
        const orgId = req.user?.orgId || req.query.org_id;
        if (!orgId) return next(new AppError('BAD_REQUEST', 'org_id required', 400));
        const data = await contactService.listContacts(orgId);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const createContact = async (req, res, next) => {
    try {
        const parsed = createContactSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await contactService.createContact(req.user.orgId, parsed.data);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

const updateContact = async (req, res, next) => {
    try {
        const parsed = updateContactSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await contactService.updateContact(req.params.id, req.user.orgId, parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const deleteContact = async (req, res, next) => {
    try {
        await contactService.deleteContact(req.params.id, req.user.orgId);
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { listContacts, createContact, updateContact, deleteContact };
