'use strict';
/**
 * Insurance notifications.
 *
 * Nothing told the assured anything: a claim could sit in `evidence_required`
 * indefinitely because the only place that fact appeared was a page nobody was
 * asked to open, and a payout landed in a ledger account silently. Every state
 * change that a human needs to act on now writes a db.Notification row and fires
 * the realtime event, reusing the exact pattern service/verification/notify.js
 * established — fire-and-forget, never throwing, because a notification failure
 * must not roll back a settlement.
 */
const db = require('../../models');

const TEMPLATES = {
    policy_bound: {
        title: 'Cover bound',
        message: (c) => `Policy ${c.ref} is active: ${c.money} of cover${c.until ? ` until ${c.until}` : ''}.`,
    },
    policy_expiring: {
        title: 'Cover expiring',
        message: (c) => `Policy ${c.ref} lapses on ${c.until}. Cargo still in transit after that date is uninsured.`,
    },
    policy_expired: {
        title: 'Cover expired',
        message: (c) => `Policy ${c.ref} has lapsed. No further claim can be filed against it.`,
    },
    claim_filed: {
        title: 'Claim filed',
        message: (c) => `Claim ${c.ref} for ${c.money} is open. ${c.detail}`,
    },
    claim_evidence_required: {
        title: 'Documents needed',
        message: (c) => `Claim ${c.ref} cannot be reviewed until these are attached: ${c.detail}.`,
    },
    claim_under_review: {
        title: 'Claim under review',
        message: (c) => `Claim ${c.ref} is with an adjuster${c.detail ? ` (${c.detail})` : ''}.`,
    },
    claim_approved: {
        title: 'Claim approved',
        message: (c) => `Claim ${c.ref} settled at ${c.money}${c.detail ? ` — ${c.detail}` : ''}.`,
    },
    claim_rejected: {
        title: 'Claim declined',
        message: (c) => `Claim ${c.ref} was declined${c.detail ? `: ${c.detail}` : ''}.`,
    },
    claim_paid: {
        title: 'Claim paid',
        message: (c) => `${c.money} has been paid on claim ${c.ref}.`,
    },
    general_average_declared: {
        title: 'General average declared',
        message: (c) => `${c.detail} — every cargo interest on the voyage must post security before its cargo is released.`,
    },
};

/** Resolve the organization a policy/claim belongs to from its tenant. */
async function orgForTenant(tenantId) {
    if (!tenantId) return null;
    try {
        return await db.Organization.findOne({ where: { tenant_id: String(tenantId) }, order: [['id', 'ASC']] });
    } catch {
        return null;
    }
}

async function notify(type, { tenantId, entityType, entityId, ref, money, until, detail }) {
    try {
        const template = TEMPLATES[type];
        if (!template) return null;
        const org = await orgForTenant(tenantId);
        if (!org) return null;

        const message = template.message({ ref, money, until, detail });
        const row = await db.Notification.create({
            tenant_id: org.tenant_id,
            recipient_org_id: org.code || String(org.id),
            type,
            title: template.title,
            message,
            entity_type: entityType,
            entity_id: entityId ? String(entityId) : null,
        });
        require('../../realtime')
            .publish(`org:${org.code || org.id}`, type, { entityType, entityId, message })
            .catch(() => {});
        return row;
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[insurance/notify] failed:', err.message);
        return null;
    }
}

const money = (amount, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount) || 0);

const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

module.exports = { notify, money, day, TEMPLATES };
