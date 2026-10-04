'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { notify, alertAdmins, fire } = require('./notify');

const MAX_OPEN_PER_USER = 10;
const PAGE_MAX = 200;

const toTicket = (t, { staff = false } = {}) => ({
    id: t.id, category: t.category, subject: t.subject, status: t.status, priority: t.priority,
    createdAt: t.createdAt, lastMessageAt: t.last_message_at,
    ...(staff ? { userId: t.user_id, user: t.user_label, assignedTo: t.assigned_to, assignedLabel: t.assigned_label } : {}),
});
const toMessage = (m) => ({ id: m.id, fromStaff: m.from_staff, sender: m.from_staff ? 'Support team' : m.sender_label, body: m.body, createdAt: m.createdAt });

async function create(userId, label, d) {
    const open = await db.SupportTicket.count({ where: { user_id: userId, status: { [Op.in]: ['open', 'pending'] } } });
    if (open >= MAX_OPEN_PER_USER) throw new AppError('LIMIT', 'You have too many open tickets. Wait for a reply or close one first.', 429);
    return db.sequelize.transaction(async (t) => {
        const ticket = await db.SupportTicket.create({ user_id: userId, user_label: label, category: d.category, subject: d.subject }, { transaction: t });
        await db.SupportMessage.create({ ticket_id: ticket.id, sender_id: userId, from_staff: false, sender_label: label, body: d.message }, { transaction: t });
        fire(alertAdmins({ key: `ticket-new-${ticket.id}`, title: `New support ticket: ${d.subject}`, body: `${label || 'A member'} (${d.category}).`, url: '/admin/support/tickets' }));
        return toTicket(ticket);
    });
}

const listMine = async (userId) => (await db.SupportTicket.findAll({ where: { user_id: userId }, order: [['last_message_at', 'DESC']], limit: 50 })).map((t) => toTicket(t));

async function loadFor(ticketId, viewer) {
    const t = await db.SupportTicket.findByPk(ticketId);
    // Strangers get a 404, never a hint that the ticket exists.
    if (!t || (!viewer.staff && t.user_id !== viewer.userId)) throw new AppError('NOT_FOUND', 'Ticket not found', 404);
    return t;
}

async function detail(ticketId, viewer) {
    const t = await loadFor(ticketId, viewer);
    const messages = await db.SupportMessage.findAll({ where: { ticket_id: t.id }, order: [['created_at', 'ASC']], limit: 500 });
    return { ...toTicket(t, { staff: viewer.staff }), messages: messages.map(toMessage) };
}

async function addMessage(ticketId, viewer, body) {
    const t = await loadFor(ticketId, viewer);
    if (t.status === 'closed') throw new AppError('CONFLICT', 'This ticket is closed. Open a new one if you still need help.', 409);
    const msg = await db.SupportMessage.create({
        ticket_id: t.id, sender_id: viewer.userId, from_staff: viewer.staff, sender_label: viewer.staff ? 'Support team' : viewer.label, body,
    });
    // A staff reply waits on the member; a member reply puts it back in the team's queue.
    await t.update({ last_message_at: new Date(), status: viewer.staff ? 'pending' : 'open' });
    if (viewer.staff) {
        fire(notify({ userId: t.user_id, type: 'support', key: `ticket-reply-${msg.id}`, title: `Support replied: ${t.subject}`, body: body.slice(0, 300), url: '/support' }));
    } else {
        fire(alertAdmins({ key: `ticket-msg-${msg.id}`, title: `Reply on ticket: ${t.subject}`, body: `${viewer.label || 'A member'} wrote back.`, url: '/admin/support/tickets' }));
    }
    return toMessage(msg);
}

async function closeMine(ticketId, userId) {
    const t = await loadFor(ticketId, { userId, staff: false });
    await t.update({ status: 'closed' });
    return toTicket(t);
}

async function adminList({ status, assigned, q, limit, offset }, viewer) {
    const where = {};
    if (status) where.status = status;
    if (assigned === 'me') where.assigned_to = viewer.userId;
    if (assigned === 'none') where.assigned_to = null;
    if (q) where.subject = { [Op.iLike]: `%${String(q).replace(/[\\%_]/g, (m) => `\\${m}`)}%` };
    const [rows, counts] = await Promise.all([
        db.SupportTicket.findAndCountAll({ where, order: [['last_message_at', 'DESC']], limit: Math.min(Number(limit) || 50, PAGE_MAX), offset: Number(offset) || 0 }),
        db.SupportTicket.findAll({ attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'n']], group: ['status'], raw: true }),
    ]);
    const byStatus = Object.fromEntries(counts.map((c) => [c.status, Number(c.n)]));
    return { items: rows.rows.map((t) => toTicket(t, { staff: true })), total: rows.count, counts: byStatus };
}

async function adminUpdate(ticketId, viewer, d) {
    const t = await loadFor(ticketId, { ...viewer, staff: true });
    const patch = {};
    if (d.status) patch.status = d.status;
    if (d.priority) patch.priority = d.priority;
    if (d.assignedTo === 'me') { patch.assigned_to = viewer.userId; patch.assigned_label = viewer.label; }
    if (d.assignedTo === null) { patch.assigned_to = null; patch.assigned_label = null; }
    await t.update(patch);
    if (d.status === 'resolved') {
        fire(notify({ userId: t.user_id, type: 'support', key: `ticket-resolved-${t.id}-${+new Date()}`, title: `Your ticket was marked resolved`, body: t.subject, url: '/support' }));
    }
    return toTicket(t, { staff: true });
}

module.exports = { create, listMine, detail, addMessage, closeMine, adminList, adminUpdate };
