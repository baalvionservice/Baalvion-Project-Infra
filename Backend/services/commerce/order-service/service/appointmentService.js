'use strict';
// Showroom / virtual / in-home / phone appointment booking. Guest-capable (ownership via the signed
// X-Cart-Session, same mechanism as guest orders); authenticated shoppers are bound by userId.
// Admin/ops confirm or close bookings via a small forward-only status machine.
const { Appointment } = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination, buildPaginated } = require('../utils/pagination');

async function book(storeId, body, actor) {
    const userId = actor && actor.userId != null ? actor.userId : null;
    const ownerSessionId = actor && actor.sessionId != null ? actor.sessionId : null;
    const appt = await Appointment.create({
        storeId,
        userId,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone || null,
        type: body.type || 'showroom',
        status: 'requested',
        preferredAt: body.preferredAt,
        location: body.location || null,
        notes: body.notes || null,
        ownerSessionId,
    });
    return appt.toJSON();
}

// Customer-facing "my appointments": scoped by the authenticated userId. Guests get an empty page.
async function listMine(storeId, userId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    if (userId == null) return buildPaginated([], 0, { page, limit });
    const where = { storeId, userId };
    if (query.status) where.status = query.status;
    const { rows, count } = await Appointment.findAndCountAll({ where, limit, offset, order: [['preferredAt', 'DESC']] });
    return buildPaginated(rows.map((a) => a.toJSON()), count, { page, limit });
}

// Admin list (cross-customer, store-scoped). Filterable by status.
async function list(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = { storeId };
    if (query.status) where.status = query.status;
    const { rows, count } = await Appointment.findAndCountAll({ where, limit, offset, order: [['preferredAt', 'DESC']] });
    return buildPaginated(rows.map((a) => a.toJSON()), count, { page, limit });
}

// Forward-only status machine. cancelled/completed/no_show are terminal.
const APPOINTMENT_TRANSITIONS = {
    requested: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled', 'no_show'],
    cancelled: [],
    completed: [],
    no_show: [],
};

async function updateStatus(storeId, id, status, userId) {
    const appt = await Appointment.findOne({ where: { id, storeId } });
    if (!appt) throw new AppError('NOT_FOUND', 'Appointment not found', 404);
    const allowed = APPOINTMENT_TRANSITIONS[appt.status] || [];
    if (!allowed.includes(status)) {
        throw new AppError('CONFLICT', `Cannot transition appointment from ${appt.status} to ${status}`, 409);
    }
    const updates = { status, processedBy: userId };
    if (status === 'confirmed') updates.confirmedAt = new Date();
    await appt.update(updates);
    return appt.toJSON();
}

module.exports = { book, listMine, list, updateStatus, APPOINTMENT_TRANSITIONS };
