'use strict';
const faqService = require('../service/faqService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createFaqSchema, updateFaqSchema, faqQuerySchema } = require('../validators/schemas');

const listFaqs = async (req, res, next) => {
    try {
        const parsed = faqQuerySchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await faqService.listFaqs(parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const createFaq = async (req, res, next) => {
    try {
        const parsed = createFaqSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await faqService.createFaq(parsed.data);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

const getFaq = async (req, res, next) => {
    try {
        const data = await faqService.getFaq(req.params.id);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const updateFaq = async (req, res, next) => {
    try {
        const parsed = updateFaqSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await faqService.updateFaq(req.params.id, parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const deleteFaq = async (req, res, next) => {
    try {
        await faqService.deleteFaq(req.params.id);
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

const markHelpful = async (req, res, next) => {
    try {
        const data = await faqService.markHelpful(req.params.id);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

module.exports = { listFaqs, createFaq, getFaq, updateFaq, deleteFaq, markHelpful };
