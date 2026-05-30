'use strict';
/**
 * Billing/payments read+action service for the admin console. Reads the seeded
 * `billing` schema and shapes rows to the frontend payment.types contract.
 */
const crypto = require('crypto');
const { QueryTypes } = require('sequelize');

let _db = null;
function db() { if (!_db) _db = require('../models'); return _db; }
function sel(sql, replacements) { return db().sequelize.query(sql, { replacements, type: QueryTypes.SELECT }); }
const num = (v) => (v == null ? 0 : Number(v));

async function paginate(baseSelect, countFrom, where, repl, page, limit, mapFn) {
    const offset = (page - 1) * limit;
    const rows = await sel(`${baseSelect} ${where} ORDER BY created_at DESC LIMIT :limit OFFSET :offset`, { ...repl, limit, offset });
    const [{ total }] = await sel(`SELECT COUNT(*)::int AS total FROM ${countFrom} ${where}`, repl);
    return { items: rows.map(mapFn), total };
}

const TX_SELECT = `SELECT id, provider, order_id AS "orderId", payment_id AS "paymentId", amount, currency,
    status, user_id AS "userId", org_id AS "orgId", metadata, created_at AS "createdAt", updated_at AS "updatedAt"
    FROM billing.transactions`;
const txMap = (r) => ({ ...r, amount: num(r.amount) });

async function listTransactions({ page = 1, limit = 20, provider, status }) {
    const where = `WHERE (:provider::text IS NULL OR provider=:provider) AND (:status::text IS NULL OR status=:status)`;
    return paginate(TX_SELECT, 'billing.transactions', where, { provider: provider || null, status: status || null }, page, limit, txMap);
}
async function getTransaction(id) { const [r] = await sel(`${TX_SELECT} WHERE id=:id`, { id }); return r ? txMap(r) : null; }

const SUB_SELECT = `SELECT id, provider, external_id AS "externalId", plan_id AS "planId", status,
    user_id AS "userId", org_id AS "orgId", current_period_start AS "currentPeriodStart",
    current_period_end AS "currentPeriodEnd", cancel_at_cycle_end AS "cancelAtCycleEnd",
    trial_end AS "trialEnd", created_at AS "createdAt" FROM billing.subscriptions`;
async function listSubscriptions({ page = 1, limit = 20, provider, status }) {
    const where = `WHERE (:provider::text IS NULL OR provider=:provider) AND (:status::text IS NULL OR status=:status)`;
    return paginate(SUB_SELECT, 'billing.subscriptions', where, { provider: provider || null, status: status || null }, page, limit, (r) => r);
}
async function getSubscription(id) { const [r] = await sel(`${SUB_SELECT} WHERE id=:id`, { id }); return r || null; }
async function cancelSubscription(id, cancelAtCycleEnd) {
    const [r] = await sel(`UPDATE billing.subscriptions SET status=CASE WHEN :atEnd THEN status ELSE 'cancelled' END,
        cancel_at_cycle_end=:atEnd WHERE id=:id RETURNING id`, { id, atEnd: !!cancelAtCycleEnd });
    if (!r) return null; return getSubscription(id);
}

const INV_SELECT = `SELECT id, invoice_number AS "invoiceNumber", org_id AS "orgId", user_id AS "userId",
    status, subtotal, tax, total, currency, due_date AS "dueDate", paid_at AS "paidAt", created_at AS "createdAt"
    FROM billing.invoices`;
const invMap = (r) => ({ ...r, subtotal: num(r.subtotal), tax: num(r.tax), total: num(r.total) });
async function listInvoices({ page = 1, limit = 20, status }) {
    const where = `WHERE (:status::text IS NULL OR status=:status)`;
    return paginate(INV_SELECT, 'billing.invoices', where, { status: status || null }, page, limit, invMap);
}
async function getInvoice(id) { const [r] = await sel(`${INV_SELECT} WHERE id=:id`, { id }); return r ? invMap(r) : null; }

const REF_SELECT = `SELECT id, transaction_id AS "transactionId", provider, external_id AS "externalId",
    amount, currency, reason, status, created_at AS "createdAt" FROM billing.refunds`;
async function listRefunds({ page = 1, limit = 20 }) {
    return paginate(REF_SELECT, 'billing.refunds', '', {}, page, limit, (r) => ({ ...r, amount: num(r.amount) }));
}
async function createRefund({ transactionId, amount, reason }) {
    const [tx] = await sel(`SELECT provider FROM billing.transactions WHERE id=:id`, { id: transactionId });
    const [r] = await sel(`INSERT INTO billing.refunds (transaction_id, provider, external_id, amount, reason, status)
        VALUES (:tid,:provider,:ext,:amount,:reason,'processed') RETURNING id`,
        { tid: transactionId, provider: tx ? tx.provider : 'razorpay', ext: 'rfnd_' + crypto.randomBytes(6).toString('hex'), amount, reason });
    if (tx) await sel(`UPDATE billing.transactions SET status='refunded', updated_at=now() WHERE id=:id`, { id: transactionId });
    const [row] = await sel(`${REF_SELECT} WHERE id=:id`, { id: r.id });
    return { ...row, amount: num(row.amount) };
}

const WH_SELECT = `SELECT id, provider, event_type AS "eventType", payload, status,
    error_message AS "errorMessage", processed_at AS "processedAt", created_at AS "createdAt" FROM billing.webhook_logs`;
async function listWebhooks({ page = 1, limit = 20, provider, status }) {
    const where = `WHERE (:provider::text IS NULL OR provider=:provider) AND (:status::text IS NULL OR status=:status)`;
    return paginate(WH_SELECT, 'billing.webhook_logs', where, { provider: provider || null, status: status || null }, page, limit, (r) => r);
}
async function retryWebhook(id) {
    const [r] = await sel(`UPDATE billing.webhook_logs SET status='processed', error_message=NULL, processed_at=now()
        WHERE id=:id RETURNING id`, { id });
    if (!r) return null; const [row] = await sel(`${WH_SELECT} WHERE id=:id`, { id }); return row;
}

async function summary() {
    const [r] = await sel(`SELECT
        (SELECT COALESCE(SUM(amount),0) FROM billing.transactions WHERE status='captured') AS total_revenue,
        (SELECT COUNT(*) FROM billing.subscriptions WHERE status='active') AS active_subscriptions,
        (SELECT COUNT(*) FROM billing.invoices WHERE status IN ('sent','overdue','draft')) AS pending_invoices,
        (SELECT COUNT(*) FROM billing.transactions WHERE status='failed') AS failed_payments`);
    return {
        totalRevenue: num(r.total_revenue), activeSubscriptions: num(r.active_subscriptions),
        pendingInvoices: num(r.pending_invoices), failedPayments: num(r.failed_payments),
    };
}

module.exports = {
    listTransactions, getTransaction, listSubscriptions, getSubscription, cancelSubscription,
    listInvoices, getInvoice, listRefunds, createRefund, listWebhooks, retryWebhook, summary,
};
