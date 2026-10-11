'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const notifyEvents = require('./notifyEvents');

const present = (p) => ({
    photoPath: p && p.photo_asset_id ? `/media/${p.photo_asset_id}` : null,
    bio: (p && p.bio) || '',
    city: (p && p.city) || '',
    interests: (p && p.interests) || [],
    learnGoal: (p && p.learn_goal) || '',
});

async function getMine(userId) {
    return present(await db.MemberProfile.findByPk(String(userId)));
}

async function saveMine(userId, d) {
    const uid = String(userId);
    if (d.photoAssetId) {
        // The photo must be the member's own upload, of the profile photo kind.
        const asset = await db.MediaAsset.findOne({ where: { id: d.photoAssetId, owner_id: uid, purpose: 'profile_photo' }, attributes: ['id'] });
        if (!asset) throw new AppError('VALIDATION_ERROR', 'photoAssetId: that photo was not uploaded by you', 422);
    }
    const [row] = await db.MemberProfile.findOrCreate({ where: { user_id: uid }, defaults: { user_id: uid } });
    const patch = {};
    if (d.bio !== undefined) patch.bio = d.bio || null;
    if (d.city !== undefined) patch.city = d.city || null;
    if (d.interests !== undefined) patch.interests = [...new Set(d.interests)];
    if (d.learnGoal !== undefined) patch.learn_goal = d.learnGoal || null;
    if (d.photoAssetId !== undefined) patch.photo_asset_id = d.photoAssetId;
    await row.update(patch);
    return present(row);
}

const presentRequest = (r) => ({
    id: r.id, department: r.department, message: r.message, status: r.status, decisionNote: r.decision_note,
    createdAt: r.createdAt, decidedAt: r.decided_at,
});

async function myRequests(userId) {
    const rows = await db.AccessRequest.findAll({ where: { user_id: String(userId) }, order: [['created_at', 'DESC']], limit: 50 });
    return { items: rows.map(presentRequest) };
}

async function createRequest(userId, label, { department, message }) {
    const uid = String(userId);
    const open = await db.AccessRequest.count({ where: { user_id: uid, department, status: 'pending' } });
    if (open) throw new AppError('CONFLICT', 'You already have a request waiting for this department', 409);
    const total = await db.AccessRequest.count({ where: { user_id: uid, status: 'pending' } });
    if (total >= 5) throw new AppError('LIMIT', 'You have five requests waiting. Wait for a decision before sending more', 409);
    const row = await db.AccessRequest.create({ user_id: uid, department, message, requester_label: label || null });
    notifyEvents.accessRequested(row);
    return presentRequest(row);
}

async function withdraw(userId, id) {
    const row = await db.AccessRequest.findOne({ where: { id, user_id: String(userId) } });
    if (!row) throw new AppError('NOT_FOUND', 'Request not found', 404);
    if (row.status !== 'pending') throw new AppError('CONFLICT', `This request is ${row.status}`, 409);
    await row.update({ status: 'withdrawn' });
    return presentRequest(row);
}

async function adminList(status) {
    const where = status ? { status } : {};
    const rows = await db.AccessRequest.findAll({ where, order: [['created_at', 'DESC']], limit: 200 });
    const ids = [...new Set(rows.map((r) => r.user_id))];
    const profiles = ids.length ? await db.MemberProfile.findAll({ where: { user_id: ids } }) : [];
    const byId = new Map(profiles.map((p) => [p.user_id, p]));
    return {
        items: rows.map((r) => ({
            ...presentRequest(r), userId: r.user_id, requesterLabel: r.requester_label,
            requesterCity: (byId.get(r.user_id) || {}).city || null, requesterBio: (byId.get(r.user_id) || {}).bio || null,
            requesterInterests: (byId.get(r.user_id) || {}).interests || [],
        })),
    };
}

async function decide(adminId, id, { approve, note }) {
    const row = await db.AccessRequest.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Request not found', 404);
    if (row.status !== 'pending') throw new AppError('CONFLICT', `This request is already ${row.status}`, 409);
    if (String(adminId) === row.user_id) throw new AppError('FORBIDDEN', 'You cannot decide your own request', 403);
    await row.update({ status: approve ? 'approved' : 'declined', decided_by: String(adminId), decided_at: new Date(), decision_note: note || null });
    notifyEvents.accessDecided(row);
    return presentRequest(row);
}

module.exports = { getMine, saveMine, myRequests, createRequest, withdraw, adminList, decide };
