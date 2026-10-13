'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const notifyEvents = require('./notifyEvents');
const { Op } = require('sequelize');
const social = require('../utils/social');

const RESERVED = new Set(['admin', 'administrator', 'support', 'help', 'staff', 'team', 'official', 'hellroad', 'baalvion', 'moderator', 'system', 'root', 'null', 'undefined', 'me', 'new', 'edit']);

const present = (p) => ({
    photoPath: p && p.photo_asset_id ? `/media/${p.photo_asset_id}` : null,
    bio: (p && p.bio) || '',
    city: (p && p.city) || '',
    interests: (p && p.interests) || [],
    learnGoal: (p && p.learn_goal) || '',
    gender: (p && p.gender) || '',
    handle: (p && p.handle) || '',
    publicProfile: !!(p && p.public_profile),
    searchIndex: p ? p.search_index !== false : true,
    isFounder: !!(p && p.is_founder),
    companyName: (p && p.company_name) || '',
    roleTitle: (p && p.role_title) || '',
    publicName: (p && p.public_name) || '',
    headline: (p && p.headline) || '',
    knownFor: (p && p.known_for) || '',
    socialLinks: (p && p.social_links) || {},
});

// The paid access tiers a member holds (Marketplace, Global Elite, VIP, Exclusive), highest first.
async function tiersOf(userIds) {
    const ids = [].concat(userIds).map(String);
    if (!ids.length) return {};
    const rows = await db.CommunityMembership.findAll({
        where: { user_id: { [Op.in]: ids }, status: 'paid' },
        include: [{ model: db.Community, as: 'community', where: { is_platform_tier: true, is_active: true }, attributes: ['slug', 'name', 'price_usd_cents'] }],
    });
    const out = {};
    for (const r of rows) (out[String(r.user_id)] ||= []).push({ slug: r.community.slug, name: r.community.name, since: r.started_at || r.createdAt, price: Number(r.community.price_usd_cents) || 0 });
    for (const k of Object.keys(out)) out[k].sort((a, b) => b.price - a.price).forEach((t) => delete t.price);
    return out;
}

async function getMine(userId) {
    const [p, tiers] = await Promise.all([db.MemberProfile.findByPk(String(userId)), tiersOf(userId)]);
    return { ...present(p), tiers: tiers[String(userId)] || [] };
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
    if (d.handle !== undefined) {
        const handle = d.handle || null;
        if (handle) {
            if (RESERVED.has(handle)) throw new AppError('VALIDATION_ERROR', 'handle: that name is reserved', 422);
            const taken = await db.MemberProfile.findOne({ where: { user_id: { [Op.ne]: uid }, [Op.and]: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('handle')), handle) }, attributes: ['user_id'] });
            if (taken) throw new AppError('CONFLICT', 'That handle is taken. Try another.', 409);
        }
        patch.handle = handle;
    }
    if (d.searchIndex !== undefined) patch.search_index = d.searchIndex;
    if (d.isFounder !== undefined) patch.is_founder = d.isFounder;
    if (d.companyName !== undefined) patch.company_name = d.companyName || null;
    if (d.roleTitle !== undefined) patch.role_title = d.roleTitle || null;
    if (d.publicName !== undefined) patch.public_name = d.publicName || null;
    if (d.headline !== undefined) patch.headline = d.headline || null;
    if (d.knownFor !== undefined) patch.known_for = d.knownFor || null;
    if (d.socialLinks !== undefined) {
        try { patch.social_links = social.normalizeAll(d.socialLinks); } catch (e) { throw new AppError('VALIDATION_ERROR', `socialLinks: ${e.message}`, 422); }
    }
    if (d.publicProfile !== undefined) {
        const handle = patch.handle !== undefined ? patch.handle : row.handle;
        const name = patch.public_name !== undefined ? patch.public_name : row.public_name;
        if (d.publicProfile && (!handle || !name)) throw new AppError('VALIDATION_ERROR', 'publicProfile: add a handle and the name to show before turning your public page on', 422);
        patch.public_profile = d.publicProfile;
    }
    if (d.gender !== undefined) patch.gender = d.gender || null;
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
    // Approving a request to get back in starts a fresh verification window.
    if (approve && row.department === 'account_access') await require('./kycGraceService').reopen(row.user_id);
    notifyEvents.accessDecided(row);
    return presentRequest(row);
}

// What anyone with the link may see. Only for members who switched their public page on; never the user id, email, gender or contact details.
async function publicByHandle(handle) {
    const p = await db.MemberProfile.findOne({ where: { public_profile: true, [Op.and]: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('handle')), String(handle || '').toLowerCase()) } });
    if (!p) throw new AppError('NOT_FOUND', 'Profile not found', 404);
    const kyc = await db.KycVerification.findOne({ where: { user_id: p.user_id, status: 'approved' }, attributes: ['id'] });
    return {
        handle: p.handle, name: p.public_name, headline: p.headline || '', bio: p.bio || '', knownFor: p.known_for || '', city: p.city || '',
        isFounder: !!p.is_founder, company: p.company_name || '', role: p.role_title || '', searchIndex: p.search_index !== false,
        interests: p.interests || [], links: p.social_links || {}, photoPath: p.photo_asset_id ? `/media/${p.photo_asset_id}` : null,
        verified: !!kyc, since: p.createdAt, tiers: (await tiersOf(p.user_id))[String(p.user_id)] || [],
    };
}

// The directory of public pages: founders and everyone else who switched theirs on. Cards only; the full page has the rest.
async function publicDirectory({ founders, city, q, limit, offset } = {}) {
    const where = { public_profile: true };
    if (founders) where.is_founder = true;
    if (city) where.city = { [Op.iLike]: `%${String(city).replace(/[%_\\]/g, '\\$&')}%` };
    if (q) {
        const like = `%${String(q).replace(/[%_\\]/g, '\\$&')}%`;
        where[Op.or] = [{ public_name: { [Op.iLike]: like } }, { company_name: { [Op.iLike]: like } }, { headline: { [Op.iLike]: like } }];
    }
    const { rows, count } = await db.MemberProfile.findAndCountAll({
        where, order: [['updated_at', 'DESC']], limit: Math.min(Number(limit) || 48, 5000), offset: Number(offset) || 0,
    });
    return {
        total: count,
        items: rows.map((p) => ({
            handle: p.handle, name: p.public_name, headline: p.headline || '', city: p.city || '', isFounder: !!p.is_founder, company: p.company_name || '',
            role: p.role_title || '', photoPath: p.photo_asset_id ? `/media/${p.photo_asset_id}` : null, searchIndex: p.search_index !== false,
            updatedAt: p.get('updated_at'),
        })),
    };
}

module.exports = { publicDirectory, publicByHandle, getMine, saveMine, myRequests, createRequest, withdraw, adminList, decide };
