'use strict';
// Shared activation-gate rule for the registration wizard: a lawyer only goes
// public (`status: 'active'`) once BOTH admin verification and an active
// subscription exist. Called from both sides of that AND — the verification
// review endpoint and the lawyer-subscription create endpoint — so neither
// path can flip a lawyer active on its own.
const db = require('../models');

async function maybeActivateLawyer(lawyerId) {
    const lawyer = await db.Lawyer.findByPk(lawyerId);
    if (!lawyer) return null;
    if (lawyer.status === 'suspended') return lawyer; // moderation wins over activation

    const hasActiveSubscription = await db.Subscription.count({
        where: { lawyer_id: lawyerId, subscriber_type: 'lawyer', status: 'active' },
    });

    const shouldBeActive = !!lawyer.verified && hasActiveSubscription > 0;
    const nextStatus = shouldBeActive ? 'active' : 'pending';
    if (lawyer.status !== nextStatus) await lawyer.update({ status: nextStatus });
    return lawyer;
}

module.exports = { maybeActivateLawyer };
