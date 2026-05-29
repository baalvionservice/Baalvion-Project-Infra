'use strict';
const db = require('../models');

/**
 * Returns the client profile for the current authenticated user, creating a minimal
 * one (from the reconciled legal.users identity) if none exists. Lets any signed-in
 * user act as a client (book consultations, open cases) without a separate onboarding step.
 */
async function ensureClient(req) {
    if (!req.user || !req.user.id) return null;
    let client = await db.Client.findOne({ where: { user_id: String(req.user.id) } });
    if (client) return client;
    const user = await db.User.findByPk(req.user.id);
    client = await db.Client.create({
        user_id: String(req.user.id),
        name: (user && user.full_name) || req.user.email || 'Client',
        email: req.user.email || (user && user.email) || '',
        subscription_tier: 'BASIC',
    });
    return client;
}

module.exports = { ensureClient };
