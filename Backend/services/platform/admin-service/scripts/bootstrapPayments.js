'use strict';
/**
 * Idempotent bootstrap for the billing/payments module.
 *   - Creates the `billing` schema (transactions, subscriptions, invoices,
 *     refunds, webhook_logs).
 *   - Seeds realistic revenue data spread over the last 60 days (only the first
 *     time — skips if transactions already exist).
 *
 * Usage:  node -r dotenv/config scripts/bootstrapPayments.js
 */
const { Client } = require('pg');

const PROVIDERS = ['razorpay', 'stripe', 'payu'];
const PLANS = ['starter', 'growth', 'scale', 'enterprise'];
const PLAN_PRICE = { starter: 2900, growth: 9900, scale: 24900, enterprise: 99900 }; // minor units
const rand = (a) => a[Math.floor(Math.random() * a.length)];
const ri = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
    // Secret guard: the local-dev fallback password must never silently apply in
    // production. Fail-closed if DB_PASSWORD is missing under NODE_ENV=production,
    // while preserving the convenient dev default everywhere else.
    if (process.env.NODE_ENV === 'production' && !process.env.DB_PASSWORD) {
        throw new Error('DB_PASSWORD is required in production (refusing the dev-default fallback)');
    }
    const client = new Client({
        host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME || 'baalvion_db', user: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || 'baalvion_dev_pass',
    });
    await client.connect();
    try {
        await client.query('BEGIN');
        await client.query(`CREATE SCHEMA IF NOT EXISTS billing;`);
        await client.query(`
            CREATE TABLE IF NOT EXISTS billing.transactions (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                provider text NOT NULL, order_id text NOT NULL, payment_id text,
                amount numeric(14,2) NOT NULL, currency text NOT NULL DEFAULT 'INR',
                status text NOT NULL DEFAULT 'captured', user_id bigint, org_id uuid,
                metadata jsonb NOT NULL DEFAULT '{}',
                created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());`);
        await client.query(`
            CREATE TABLE IF NOT EXISTS billing.subscriptions (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                provider text NOT NULL, external_id text NOT NULL, plan_id text NOT NULL,
                status text NOT NULL DEFAULT 'active', user_id bigint, org_id uuid,
                current_period_start timestamptz NOT NULL DEFAULT now(),
                current_period_end timestamptz NOT NULL DEFAULT now() + interval '30 days',
                cancel_at_cycle_end boolean NOT NULL DEFAULT false, trial_end timestamptz,
                created_at timestamptz NOT NULL DEFAULT now());`);
        await client.query(`
            CREATE TABLE IF NOT EXISTS billing.invoices (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                invoice_number text NOT NULL, org_id uuid, user_id bigint,
                status text NOT NULL DEFAULT 'paid', subtotal numeric(14,2) NOT NULL DEFAULT 0,
                tax numeric(14,2) NOT NULL DEFAULT 0, total numeric(14,2) NOT NULL DEFAULT 0,
                currency text NOT NULL DEFAULT 'INR', due_date timestamptz, paid_at timestamptz,
                created_at timestamptz NOT NULL DEFAULT now());`);
        await client.query(`
            CREATE TABLE IF NOT EXISTS billing.refunds (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                transaction_id uuid, provider text NOT NULL, external_id text NOT NULL,
                amount numeric(14,2) NOT NULL, currency text NOT NULL DEFAULT 'INR',
                reason text, status text NOT NULL DEFAULT 'processed',
                created_at timestamptz NOT NULL DEFAULT now());`);
        await client.query(`
            CREATE TABLE IF NOT EXISTS billing.webhook_logs (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                provider text NOT NULL, event_type text NOT NULL, payload jsonb NOT NULL DEFAULT '{}',
                status text NOT NULL DEFAULT 'processed', error_message text,
                processed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_billing_tx_created ON billing.transactions(created_at DESC);`);

        const existing = await client.query(`SELECT COUNT(*)::int AS n FROM billing.transactions`);
        if (existing.rows[0].n > 0) {
            await client.query('COMMIT');
            console.log(JSON.stringify({ ok: true, note: 'Already seeded — schema ensured.' }));
            return;
        }

        const users = (await client.query(`SELECT id FROM auth.users WHERE status='active' ORDER BY created_at LIMIT 30`)).rows;
        const orgs = (await client.query(`SELECT id FROM auth.organizations LIMIT 20`)).rows;
        const uid = () => (users.length ? rand(users).id : null);
        const oid = () => (orgs.length ? rand(orgs).id : null);

        // Transactions — 120 over 60 days, mostly captured.
        const txIds = [];
        for (let i = 0; i < 120; i++) {
            const status = Math.random() < 0.82 ? 'captured' : (Math.random() < 0.6 ? 'failed' : 'refunded');
            const provider = rand(PROVIDERS);
            const amount = (PLAN_PRICE[rand(PLANS)] / 100).toFixed(2);
            const daysAgo = ri(0, 60);
            const r = await client.query(
                `INSERT INTO billing.transactions (provider, order_id, payment_id, amount, currency, status, user_id, org_id, created_at, updated_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now()-($9||' days')::interval, now()-($9||' days')::interval) RETURNING id`,
                [provider, 'order_' + Math.random().toString(36).slice(2, 11), 'pay_' + Math.random().toString(36).slice(2, 11),
                 amount, Math.random() < 0.5 ? 'INR' : 'USD', status, uid(), oid(), daysAgo]);
            txIds.push({ id: r.rows[0].id, provider, amount, status });
        }
        // Subscriptions — 35, mostly active.
        for (let i = 0; i < 35; i++) {
            const status = Math.random() < 0.7 ? 'active' : rand(['cancelled', 'paused', 'expired', 'created']);
            await client.query(
                `INSERT INTO billing.subscriptions (provider, external_id, plan_id, status, user_id, org_id, cancel_at_cycle_end)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [rand(PROVIDERS), 'sub_' + Math.random().toString(36).slice(2, 11), rand(PLANS), status, uid(), oid(), Math.random() < 0.2]);
        }
        // Invoices — 60.
        for (let i = 0; i < 60; i++) {
            const status = rand(['paid', 'paid', 'paid', 'sent', 'overdue', 'draft', 'void']);
            const subtotal = PLAN_PRICE[rand(PLANS)] / 100;
            const tax = +(subtotal * 0.18).toFixed(2);
            await client.query(
                `INSERT INTO billing.invoices (invoice_number, org_id, user_id, status, subtotal, tax, total, currency, due_date, paid_at, created_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,'INR', now()+interval '7 days', $8, now()-($9||' days')::interval)`,
                ['INV-' + (1000 + i), oid(), uid(), status, subtotal, tax, +(subtotal + tax).toFixed(2),
                 status === 'paid' ? new Date() : null, ri(0, 50)]);
        }
        // Refunds — from refunded transactions.
        for (const tx of txIds.filter((t) => t.status === 'refunded').slice(0, 20)) {
            await client.query(
                `INSERT INTO billing.refunds (transaction_id, provider, external_id, amount, currency, reason, status)
                 VALUES ($1,$2,$3,$4,'INR',$5,'processed')`,
                [tx.id, tx.provider, 'rfnd_' + Math.random().toString(36).slice(2, 11), tx.amount, rand(['duplicate', 'requested_by_customer', 'fraud'])]);
        }
        // Webhook logs — 40.
        for (let i = 0; i < 40; i++) {
            const status = Math.random() < 0.85 ? 'processed' : (Math.random() < 0.5 ? 'received' : 'failed');
            await client.query(
                `INSERT INTO billing.webhook_logs (provider, event_type, status, error_message, processed_at, created_at)
                 VALUES ($1,$2,$3,$4,$5, now()-($6||' days')::interval)`,
                [rand(PROVIDERS), rand(['payment.captured', 'payment.failed', 'subscription.charged', 'refund.processed', 'invoice.paid']),
                 status, status === 'failed' ? 'Signature verification failed' : null, status === 'processed' ? new Date() : null, ri(0, 30)]);
        }

        await client.query('COMMIT');
        console.log(JSON.stringify({ ok: true, seeded: { transactions: 120, subscriptions: 35, invoices: 60, refunds: '~20', webhooks: 40 } }));
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('bootstrapPayments failed:', e.message);
        process.exitCode = 1;
    } finally {
        await client.end();
    }
}
main();
