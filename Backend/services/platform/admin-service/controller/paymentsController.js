'use strict';
const pay = require('../service/paymentsService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const pageArgs = (q) => ({ page: Math.max(1, parseInt(q.page, 10) || 1), limit: Math.min(200, Math.max(1, parseInt(q.limit, 10) || 20)) });

// The payments frontend (payment.types PaginatedResponse) expects { data: [...],
// pagination: {...} } — the generic envelope, NOT admin-service's { data:{items} }.
function sendList(req, res, items, total, page, limit) {
    res.status(200).json({
        success: true,
        data: items,
        pagination: {
            total, page, limit,
            totalPages: Math.ceil(total / limit) || 0,
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
        requestId: req.requestId,
    });
}
const notFound = (res_obj, name) => { if (!res_obj) throw new AppError('NOT_FOUND', `${name} not found`, 404); return res_obj; };

exports.listTransactions = async (req, res, next) => { try { const { page, limit } = pageArgs(req.query); const { items, total } = await pay.listTransactions({ page, limit, provider: req.query.provider, status: req.query.status }); sendList(req, res, items, total, page, limit); } catch (e) { next(e); } };
exports.getTransaction   = async (req, res, next) => { try { sendSuccess(req, res, notFound(await pay.getTransaction(req.params.id), 'Transaction')); } catch (e) { next(e); } };

exports.listSubscriptions = async (req, res, next) => { try { const { page, limit } = pageArgs(req.query); const { items, total } = await pay.listSubscriptions({ page, limit, provider: req.query.provider, status: req.query.status }); sendList(req, res, items, total, page, limit); } catch (e) { next(e); } };
exports.getSubscription   = async (req, res, next) => { try { sendSuccess(req, res, notFound(await pay.getSubscription(req.params.id), 'Subscription')); } catch (e) { next(e); } };
exports.cancelSubscription = async (req, res, next) => { try { sendSuccess(req, res, notFound(await pay.cancelSubscription(req.params.id, req.body && req.body.cancelAtCycleEnd), 'Subscription')); } catch (e) { next(e); } };

exports.listInvoices = async (req, res, next) => { try { const { page, limit } = pageArgs(req.query); const { items, total } = await pay.listInvoices({ page, limit, status: req.query.status }); sendList(req, res, items, total, page, limit); } catch (e) { next(e); } };
exports.getInvoice   = async (req, res, next) => { try { sendSuccess(req, res, notFound(await pay.getInvoice(req.params.id), 'Invoice')); } catch (e) { next(e); } };

exports.listRefunds = async (req, res, next) => { try { const { page, limit } = pageArgs(req.query); const { items, total } = await pay.listRefunds({ page, limit }); sendList(req, res, items, total, page, limit); } catch (e) { next(e); } };
exports.createRefund = async (req, res, next) => { try { const { transactionId, amount, reason } = req.body || {}; if (!transactionId) throw new AppError('VALIDATION_ERROR', 'transactionId required', 400); sendSuccess(req, res, await pay.createRefund({ transactionId, amount, reason }), 201); } catch (e) { next(e); } };

exports.listWebhooks = async (req, res, next) => { try { const { page, limit } = pageArgs(req.query); const { items, total } = await pay.listWebhooks({ page, limit, provider: req.query.provider, status: req.query.status }); sendList(req, res, items, total, page, limit); } catch (e) { next(e); } };
exports.retryWebhook = async (req, res, next) => { try { sendSuccess(req, res, notFound(await pay.retryWebhook(req.params.id), 'Webhook')); } catch (e) { next(e); } };

exports.summary = async (req, res, next) => { try { sendSuccess(req, res, await pay.summary()); } catch (e) { next(e); } };
