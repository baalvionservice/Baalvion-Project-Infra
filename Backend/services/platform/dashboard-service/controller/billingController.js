'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

async function _audit(req, action, entity_type, entity_id) {
    try {
        await db.AuditLog.create({
            org_id: req.user.orgId, action, entity_type, entity_id,
            user_id: req.user.id, role: req.user.role, resource: req.originalUrl,
            ip_address: req.ip, status: 'Success', severity: 'Info',
        });
    } catch (_) { /* non-blocking */ }
}

const dateOnly = (v) => (v == null ? null : String(v).slice(0, 10));

exports.get = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const [sub, invoices, bizCount, userCount] = await Promise.all([
            db.BillingSubscription.findOne({ where: { org_id: orgId }, raw: true }),
            db.BillingInvoice.findAll({ where: { org_id: orgId }, order: [['payment_date', 'DESC']], raw: true }),
            db.Domain.count({ where: { org_id: orgId } }),
            db.Employee.count({ where: { org_id: orgId } }),
        ]);
        if (!sub) return next(new AppError('NOT_FOUND', 'No subscription on file', 404));

        const limits = sub.limits || {};
        const seededUsage = sub.usage || {};
        return sendSuccess(req, res, {
            subscription: {
                plan: sub.plan, price: Number(sub.price), annualPrice: Number(sub.annual_price),
                billingCycle: sub.billing_cycle, status: sub.status,
                nextBillingDate: dateOnly(sub.next_billing_date), paymentMethod: sub.payment_method || {},
            },
            usage: {
                businesses: { used: bizCount, limit: limits.businesses ?? bizCount },
                users: { used: userCount, limit: limits.users ?? userCount },
                apiCalls: { used: seededUsage.apiCalls ?? 0, limit: limits.apiCalls ?? 0 },
                storage: { used: seededUsage.storage ?? 0, limit: limits.storage ?? 0 },
            },
            billingContact: sub.contact || {},
            invoices: invoices.map((i) => ({
                id: i.invoice_key, period: i.period, amount: Number(i.amount),
                status: i.status, paymentDate: dateOnly(i.payment_date),
            })),
        });
    } catch (err) { return next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const sub = await db.BillingSubscription.findOne({ where: { org_id: req.user.orgId } });
        if (!sub) return next(new AppError('NOT_FOUND', 'No subscription on file', 404));
        const { plan, billingCycle, contact } = req.body;
        const patch = {};
        if (plan !== undefined) patch.plan = plan;
        if (billingCycle !== undefined) patch.billing_cycle = billingCycle;
        if (contact !== undefined) patch.contact = contact;
        await sub.update(patch);
        await _audit(req, 'UPDATE_BILLING', 'billing_subscription', String(sub.id));
        return sendSuccess(req, res, sub);
    } catch (err) { return next(err); }
};
