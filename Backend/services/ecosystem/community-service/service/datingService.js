'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const dm = require('./directMessageService');
const { notify, fire } = require('./notify');

const ageOf = (d) => {
    const b = new Date(`${d}T00:00:00Z`), n = new Date();
    let a = n.getUTCFullYear() - b.getUTCFullYear();
    if (n.getUTCMonth() < b.getUTCMonth() || (n.getUTCMonth() === b.getUTCMonth() && n.getUTCDate() < b.getUTCDate())) a -= 1;
    return a;
};
// Never includes the user id, the birth date or the contact details.
const present = (p) => ({
    id: p.id, name: p.display_name, age: ageOf(p.birth_date), headline: p.headline || '', bio: p.bio || '', city: p.city || '',
    isFounder: p.is_founder, company: p.company_name || '', role: p.role_title || '', lookingFor: p.looking_for,
    interests: p.interests || [], photoPath: p.photo_asset_id ? `/media/${p.photo_asset_id}` : null,
});

async function kycBirthDate(uid) {
    const k = await db.KycVerification.findOne({ where: { user_id: uid, status: 'approved' }, order: [['created_at', 'DESC']], attributes: ['date_of_birth'] });
    return k ? k.date_of_birth : null;
}

async function mine(uid) {
    const p = await db.DatingProfile.findOne({ where: { user_id: uid } });
    return { verified: !!(await kycBirthDate(uid)), profile: p ? { ...present(p), active: p.status === 'active', hidden: p.status === 'hidden_by_admin' } : null };
}

async function saveMine(uid, d) {
    const dob = await kycBirthDate(uid);
    if (!dob) throw new AppError('KYC_REQUIRED', 'Verify your identity (KYC) first. Dating is for verified adults only.', 403);
    if (ageOf(dob) < 18) throw new AppError('UNDERAGE', 'Dating is for people aged 18 and over', 403);
    if (d.photoAssetId) {
        const a = await db.MediaAsset.findOne({ where: { id: d.photoAssetId, owner_id: uid, purpose: 'dating_photo' }, attributes: ['id'] });
        if (!a) throw new AppError('VALIDATION_ERROR', 'photoAssetId: that photo was not uploaded by you', 422);
    }
    let p = await db.DatingProfile.findOne({ where: { user_id: uid } });
    if (p && p.status === 'hidden_by_admin') throw new AppError('FORBIDDEN', 'Your dating profile was hidden by the team. Contact support.', 403);
    const patch = {
        display_name: d.displayName, headline: d.headline || null, bio: d.bio || null, city: d.city || null,
        is_founder: !!d.isFounder, company_name: d.isFounder ? d.companyName || null : null, role_title: d.isFounder ? d.roleTitle || null : null,
        looking_for: d.lookingFor || 'dating', interests: [...new Set(d.interests || [])],
    };
    if (d.photoAssetId !== undefined) patch.photo_asset_id = d.photoAssetId;
    if (d.active !== undefined) patch.status = d.active ? 'active' : 'paused';
    if (p) await p.update(patch);
    else p = await db.DatingProfile.create({ ...patch, user_id: uid, birth_date: dob, status: d.active === false ? 'paused' : 'active' });
    return mine(uid);
}

// Profiles I have not acted on, who have not passed me, from verified adults. Newest-random order.
async function discover(uid, { city, founders } = {}) {
    const mineRow = await db.DatingProfile.findOne({ where: { user_id: uid, status: 'active' }, attributes: ['id'] });
    if (!mineRow) throw new AppError('PROFILE_REQUIRED', 'Create your own dating profile first to see others', 403);
    const mineActs = await db.DatingAction.findAll({ where: { from_user: uid }, attributes: ['to_user'] });
    const passedMe = await db.DatingAction.findAll({ where: { to_user: uid, action: 'pass' }, attributes: ['from_user'] });
    const skip = [uid, ...mineActs.map((a) => a.to_user), ...passedMe.map((a) => a.from_user)];
    const where = { status: 'active', user_id: { [Op.notIn]: skip } };
    if (city) where.city = { [Op.iLike]: `%${String(city).replace(/[%_\\]/g, '\\$&')}%` };
    if (founders) where.is_founder = true;
    const rows = await db.DatingProfile.findAll({ where, order: db.sequelize.random(), limit: 20 });
    return { items: rows.map(present) };
}

async function act(uid, profileId, action) {
    const target = await db.DatingProfile.findOne({ where: { id: profileId, status: 'active' } });
    if (!target || target.user_id === uid) throw new AppError('NOT_FOUND', 'Profile not found', 404);
    const me = await db.DatingProfile.findOne({ where: { user_id: uid, status: 'active' } });
    if (!me) throw new AppError('PROFILE_REQUIRED', 'Create your own dating profile first', 403);
    const [row, created] = await db.DatingAction.findOrCreate({ where: { from_user: uid, to_user: target.user_id }, defaults: { from_user: uid, to_user: target.user_id, action } });
    if (!created) await row.update({ action });
    let matched = false, conversationId = null;
    if (action === 'like') {
        const back = await db.DatingAction.findOne({ where: { from_user: target.user_id, to_user: uid, action: 'like' } });
        if (back) {
            matched = true;
            const conv = await dm.getOrCreateConversation(uid, target.user_id, 'Dating match');
            conversationId = conv.id;
            fire(notify({ userId: target.user_id, type: 'dating_match', title: `It's a match with ${me.display_name}`, body: 'You both liked each other. You can message them now.', url: '/messages', key: `dating-match-${[uid, target.user_id].sort().join('-')}-${target.user_id}` }));
        }
    }
    return { matched, conversationId };
}

async function matches(uid) {
    const mine = await db.DatingAction.findAll({ where: { from_user: uid, action: 'like' }, attributes: ['to_user'] });
    const ids = mine.map((a) => a.to_user);
    if (!ids.length) return { items: [] };
    const back = await db.DatingAction.findAll({ where: { from_user: { [Op.in]: ids }, to_user: uid, action: 'like' }, attributes: ['from_user'] });
    const matched = back.map((a) => a.from_user);
    if (!matched.length) return { items: [] };
    const rows = await db.DatingProfile.findAll({ where: { user_id: { [Op.in]: matched }, status: 'active' } });
    const items = [];
    for (const p of rows) { const conv = await dm.getOrCreateConversation(uid, p.user_id, 'Dating match'); items.push({ ...present(p), conversationId: conv.id }); }
    return { items };
}

async function report(uid, label, profileId, reason) {
    const target = await db.DatingProfile.findByPk(profileId);
    if (!target) throw new AppError('NOT_FOUND', 'Profile not found', 404);
    const support = require('./supportService');
    await support.create(uid, label, { category: 'other', subject: `Dating profile report: ${target.display_name}`, message: `Profile ${target.id}\n${reason}` });
    await db.DatingAction.findOrCreate({ where: { from_user: uid, to_user: target.user_id }, defaults: { from_user: uid, to_user: target.user_id, action: 'pass' } });
    return { ok: true };
}

async function adminList({ status } = {}) {
    const rows = await db.DatingProfile.findAll({ where: status ? { status } : {}, order: [['created_at', 'DESC']], limit: 200 });
    return { items: rows.map((p) => ({ ...present(p), userId: p.user_id, status: p.status, hiddenReason: p.hidden_reason })) };
}

async function adminHide(profileId, hidden, reason) {
    const p = await db.DatingProfile.findByPk(profileId);
    if (!p) throw new AppError('NOT_FOUND', 'Profile not found', 404);
    await p.update({ status: hidden ? 'hidden_by_admin' : 'active', hidden_reason: hidden ? reason || null : null });
    return { ok: true };
}

module.exports = { mine, saveMine, discover, act, matches, report, adminList, adminHide };
