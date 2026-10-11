'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { Op } = require('sequelize');

const today = () => new Date().toISOString().slice(0, 10);
const present = (g) => ({ id: g.id, partyId: g.party_id, males: g.males, females: g.females, note: g.note, status: g.status, createdAt: g.createdAt });

// Approved guests already counted against a party's capacity.
async function approvedCount(partyId) {
    const rows = await db.EliteHostGuest.findAll({ where: { party_id: partyId, status: 'approved' }, attributes: ['males', 'females'] });
    return rows.reduce((n, r) => n + r.males + r.females, 0);
}

async function join(userId, label, partyId, d) {
    const uid = String(userId);
    const party = await db.EliteHostApplication.findOne({ where: { id: partyId, status: 'approved' } });
    if (!party) throw new AppError('NOT_FOUND', 'That party is not open', 404);
    if (party.user_id === uid) throw new AppError('FORBIDDEN', 'You are the host of this party', 403);
    if (party.party_date && String(party.party_date) < today()) throw new AppError('CLOSED', 'This party has already taken place', 409);
    const kyc = await db.KycVerification.findOne({ where: { user_id: uid, status: 'approved' }, attributes: ['id'] });
    if (!kyc) throw new AppError('KYC_REQUIRED', 'Verify your identity (KYC) before you can ask to join a party', 403);
    const total = d.males + d.females;
    if (party.guests) {
        const left = party.guests - (await approvedCount(partyId));
        if (total > left) throw new AppError('FULL', left <= 0 ? 'This party is full' : `Only ${left} place${left === 1 ? '' : 's'} left`, 409);
    }
    const existing = await db.EliteHostGuest.findOne({ where: { party_id: partyId, user_id: uid, status: { [Op.in]: ['pending', 'approved'] } } });
    if (existing) throw new AppError('CONFLICT', 'You already asked to join this party', 409);
    const row = await db.EliteHostGuest.create({ party_id: partyId, user_id: uid, requester_label: label || null, males: d.males, females: d.females, note: d.note || null });
    return present(row);
}

async function mine(userId) {
    const rows = await db.EliteHostGuest.findAll({ where: { user_id: String(userId) }, order: [['created_at', 'DESC']], limit: 50 });
    return { items: rows.map(present) };
}

async function withdraw(userId, id) {
    const row = await db.EliteHostGuest.findOne({ where: { id, user_id: String(userId) } });
    if (!row) throw new AppError('NOT_FOUND', 'Not found', 404);
    if (!['pending', 'approved'].includes(row.status)) throw new AppError('CONFLICT', `This request is ${row.status}`, 409);
    await row.update({ status: 'withdrawn' });
    return present(row);
}

// The host sees their own parties' requests; staff see all.
async function listForParty(viewerId, isStaff, partyId) {
    const party = await db.EliteHostApplication.findByPk(partyId);
    if (!party) throw new AppError('NOT_FOUND', 'Party not found', 404);
    if (!isStaff && party.user_id !== String(viewerId)) throw new AppError('NOT_FOUND', 'Party not found', 404);
    const rows = await db.EliteHostGuest.findAll({ where: { party_id: partyId }, order: [['created_at', 'ASC']] });
    return {
        capacity: party.guests, approvedGuests: await approvedCount(partyId),
        items: rows.map((g) => ({ ...present(g), requesterLabel: g.requester_label })),
    };
}

async function decide(viewerId, isStaff, id, approve) {
    const g = await db.EliteHostGuest.findByPk(id);
    if (!g) throw new AppError('NOT_FOUND', 'Not found', 404);
    const party = await db.EliteHostApplication.findByPk(g.party_id);
    if (!party || (!isStaff && party.user_id !== String(viewerId))) throw new AppError('NOT_FOUND', 'Not found', 404);
    if (g.status !== 'pending') throw new AppError('CONFLICT', `This request is already ${g.status}`, 409);
    if (approve && party.guests) {
        const left = party.guests - (await approvedCount(party.id));
        if (g.males + g.females > left) throw new AppError('FULL', `Only ${left} place${left === 1 ? '' : 's'} left`, 409);
    }
    await g.update({ status: approve ? 'approved' : 'declined', decided_by: String(viewerId), decided_at: new Date() });
    return present(g);
}

async function myParties(userId) {
    const rows = await db.EliteHostApplication.findAll({ where: { user_id: String(userId) }, order: [['created_at', 'DESC']], limit: 20 });
    const out = [];
    for (const r of rows) {
        const pending = await db.EliteHostGuest.count({ where: { party_id: r.id, status: 'pending' } });
        out.push({ id: r.id, clubName: r.club_name, city: r.city, date: r.party_date, guests: r.guests, status: r.status, approvedGuests: await approvedCount(r.id), pendingRequests: pending });
    }
    return { items: out };
}

module.exports = { join, mine, withdraw, listForParty, decide, myParties, approvedCount };
