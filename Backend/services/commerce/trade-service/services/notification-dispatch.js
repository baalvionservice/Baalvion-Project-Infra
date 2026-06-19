'use strict';
/**
 * Notification dispatch (queue-backed). The `notifications` worker calls
 * processNotification(): persists the in-app record, fans out to email/sms/ws
 * delivery queues, and maintains a cached unread counter. Email/SMS run in
 * 'simulated' mode (delivery recorded) until their provider key is supplied.
 */
const db = require('../models');
const cache = require('../cache');

const unreadKey = (tenantId, org) => cache.tkey(tenantId, 'notif', `unread:${org}`);

async function bumpUnread(tenantId, org) {
    const count = await db.Notification.count({ where: { tenant_id: tenantId, recipient_org_id: org, is_read: false } });
    await cache.set(unreadKey(tenantId, org), count, 300);
    return count;
}

async function unreadCount(tenantId, org) {
    const cached = await cache.get(unreadKey(tenantId, org));
    return cached != null ? cached : bumpUnread(tenantId, org);
}

// Worker processor for the `notifications` queue.
async function processNotification(payload) {
    const {
        tenantId = 'T-DEMO', recipientOrgId, type = 'info', title, message,
        entityType, entityId, channels = ['in_app'], email, phone, meta = {},
    } = payload || {};
    const { enqueue } = require('../queue');
    const out = { channels: [] };

    if (channels.includes('in_app')) {
        const n = await db.Notification.create({
            tenant_id: tenantId, recipient_org_id: recipientOrgId, type, title, message,
            entity_type: entityType, entity_id: entityId,
        });
        out.inAppId = n.id;
        out.channels.push('in_app');
        await bumpUnread(tenantId, recipientOrgId);
    }
    if (channels.includes('email') && email) {
        await enqueue('email', 'send', { to: email, subject: title, body: message, tenantId, meta }, { attempts: 5, backoff: { type: 'exponential', delay: 1000 } });
        out.channels.push('email');
    }
    if (channels.includes('sms') && phone) {
        await enqueue('sms', 'send', { to: phone, body: `${title}: ${message}`, tenantId });
        out.channels.push('sms');
    }
    if (channels.includes('ws')) {
        // Consumed by the ws_fanout worker once realtime lands; persisted meanwhile.
        await enqueue('ws_fanout', 'push', { room: `org:${recipientOrgId}`, event: 'notification', data: { type, title, message }, tenantId });
        out.channels.push('ws');
    }
    return out;
}

// Record a delivery attempt outcome (tracking / bounce visibility).
async function recordDelivery({ channel, to, status, simulated, tenantId = 'T-DEMO', error }) {
    await db.Collection.create({
        collection: 'notification_deliveries',
        tenantId,
        data: { channel, to, status, simulated: !!simulated, error: error || null, at: new Date().toISOString() },
    });
}

module.exports = { processNotification, recordDelivery, unreadCount, bumpUnread };
