'use strict';

/**
 * Seed the webhook event-type registry with the platform's well-known events.
 * Custom event types can also be POSTed; this just guarantees the common ones
 * exist so endpoints can subscribe to them in the UI.
 */

const db = require('../models');

const SEED = [
    ['user.created',            'identity',     'A new user account was created'],
    ['user.updated',            'identity',     'A user profile changed'],
    ['org.created',             'identity',     'A new organization/tenant was created'],
    ['session.revoked',         'identity',     'A session was revoked'],
    ['payment.succeeded',       'commerce',     'A payment completed successfully'],
    ['payment.failed',          'commerce',     'A payment attempt failed'],
    ['order.created',           'commerce',     'An order was placed'],
    ['order.fulfilled',         'commerce',     'An order was fulfilled'],
    ['invoice.paid',            'commerce',     'An invoice was paid'],
    ['report.completed',        'platform',     'A report run finished and an artifact is available'],
    ['report.failed',           'platform',     'A report run failed'],
    ['commission.accrued',      'platform',     'A partner/agent commission was accrued'],
    ['tenant.provisioned',      'platform',     'A white-label tenant was provisioned'],
    ['api_key.created',         'developer',    'An API key was issued'],
    ['api_key.revoked',         'developer',    'An API key was revoked'],
    ['ping',                    'developer',    'Test event for verifying an endpoint'],
];

async function seedEventTypes() {
    for (const [name, category, description] of SEED) {
        await db.EventType.findOrCreate({ where: { name }, defaults: { name, category, description } }).catch(() => {});
    }
    return SEED.length;
}

async function listEventTypes() {
    const rows = await db.EventType.findAll({ order: [['category', 'ASC'], ['name', 'ASC']] });
    return rows.map((r) => r.toJSON());
}

async function registerEventType({ name, category, description, sample }) {
    const [row] = await db.EventType.findOrCreate({ where: { name }, defaults: { name, category: category ?? null, description: description ?? null, sample: sample ?? {} } });
    return row.toJSON();
}

module.exports = { seedEventTypes, listEventTypes, registerEventType };
