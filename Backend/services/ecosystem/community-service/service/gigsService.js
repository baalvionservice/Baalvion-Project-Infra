'use strict';
// Nightlife staffing marketplace: candidate profiles, employer accounts, gigs and applications.
// Trust model: nothing candidate- or employer-facing is public until an admin has verified the
// profile/employer, and a candidate's WhatsApp number is released only one profile at a time,
// to verified employers, with an audit row and a daily cap.
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const events = require('./notifyEvents');

const REVEALS_PER_DAY = 100;
const PAGE_MAX = 200;
const today = () => new Date().toISOString().slice(0, 10);

// ── Serialisers ──────────────────────────────────────────────────────────────
const toProfile = (r, { withContact = false } = {}) => ({
    id: r.id, fullName: r.full_name, gender: r.gender, age: r.age, height: r.height,
    instagram: r.instagram, zone: r.zone, roles: r.roles, services: r.services, perks: r.perks,
    portraitUrl: r.portrait_url, fullLookUrl: r.full_look_url, status: r.status,
    reviewNote: r.review_note, createdAt: r.createdAt,
    ...(withContact ? { whatsapp: r.whatsapp } : {}),
});
const toEmployer = (r) => ({
    id: r.id, businessName: r.business_name, contactName: r.contact_name, phone: r.phone,
    website: r.website, instagram: r.instagram, city: r.city, status: r.status,
    reviewNote: r.review_note, createdAt: r.createdAt,
});
const toGig = (r) => ({
    id: r.id, title: r.title, payAmount: r.pay_amount, payCycle: r.pay_cycle,
    venueAddress: r.venue_address, dressCode: r.dress_code, rolesNeeded: r.roles_needed,
    eventDate: r.event_date, status: r.status, postedAt: r.createdAt,
    postedBy: r.employer ? r.employer.business_name : undefined,
    employerId: r.employer_id,
});
const toApplication = (r) => ({
    id: r.id, gigId: r.gig_id, profileId: r.profile_id, note: r.note, status: r.status, createdAt: r.createdAt,
    gig: r.gig ? toGig(r.gig) : undefined,
    profile: r.profile ? toProfile(r.profile) : undefined,
});

// ── Actors ───────────────────────────────────────────────────────────────────
async function requireVerifiedEmployer(userId) {
    const employer = await db.NightEmployer.findOne({ where: { user_id: userId } });
    if (!employer) throw new AppError('EMPLOYER_REQUIRED', 'Register as an employer first', 403);
    if (employer.status !== 'verified') throw new AppError('EMPLOYER_NOT_VERIFIED', 'Your employer account is awaiting verification', 403);
    return employer;
}

async function requireVerifiedProfile(userId) {
    const profile = await db.NightProfile.findOne({ where: { user_id: userId } });
    if (!profile) throw new AppError('PROFILE_REQUIRED', 'Create your candidate profile first', 403);
    if (profile.status !== 'verified') throw new AppError('PROFILE_NOT_VERIFIED', 'Your profile is awaiting verification', 403);
    return profile;
}

// ── Candidate profile ────────────────────────────────────────────────────────
const profileColumns = (d) => ({
    full_name: d.fullName, gender: d.gender, age: d.age, height: d.height || null, instagram: d.instagram,
    zone: d.zone, roles: d.roles, services: d.services, perks: d.perks,
    portrait_url: d.portraitUrl || null, full_look_url: d.fullLookUrl || null, whatsapp: d.whatsapp,
});

async function getMyProfile(userId) {
    const row = await db.NightProfile.findOne({ where: { user_id: userId } });
    return row ? toProfile(row, { withContact: true }) : null;
}

// Any edit sends the profile back to review: verification vouches for what was reviewed.
async function upsertMyProfile(userId, data) {
    const existing = await db.NightProfile.findOne({ where: { user_id: userId } });
    const reset = { status: 'pending', review_note: null, reviewed_by: null, reviewed_at: null };
    const row = existing
        ? await existing.update({ ...profileColumns(data), ...reset })
        : await db.NightProfile.create({ ...profileColumns(data), user_id: userId });
    events.profileSubmitted(row);
    return toProfile(row, { withContact: true });
}

async function listCandidates(userId, { zone, q, limit, offset, isAdmin }) {
    if (!isAdmin) await requireVerifiedEmployer(userId);
    const where = { status: 'verified' };
    if (zone) where.zone = zone;
    if (q) {
        const like = `%${String(q).replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
        where[Op.or] = [{ full_name: { [Op.iLike]: like } }, { roles: { [Op.contains]: [q] } }];
    }
    const { rows, count } = await db.NightProfile.findAndCountAll({
        where, order: [['created_at', 'DESC']],
        limit: Math.min(Number(limit) || 60, PAGE_MAX), offset: Number(offset) || 0,
    });
    return { items: rows.map((r) => toProfile(r)), total: count };
}

async function revealContact(userId, profileId) {
    const employer = await requireVerifiedEmployer(userId);
    const profile = await db.NightProfile.findByPk(profileId);
    if (!profile || profile.status !== 'verified') throw new AppError('NOT_FOUND', 'Candidate not found', 404);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const used = await db.NightContactReveal.count({ where: { employer_id: employer.id, created_at: { [Op.gte]: since } } });
    if (used >= REVEALS_PER_DAY) throw new AppError('RATE_LIMITED', 'Daily contact limit reached', 429);
    await db.NightContactReveal.create({ employer_id: employer.id, profile_id: profile.id });
    return { id: profile.id, fullName: profile.full_name, whatsapp: profile.whatsapp };
}

// ── Employer account ─────────────────────────────────────────────────────────
const employerColumns = (d) => ({
    business_name: d.businessName, contact_name: d.contactName, phone: d.phone,
    website: d.website || null, instagram: d.instagram || null, city: d.city,
});

async function getMyEmployer(userId) {
    const row = await db.NightEmployer.findOne({ where: { user_id: userId } });
    return row ? toEmployer(row) : null;
}

async function upsertMyEmployer(userId, data) {
    const existing = await db.NightEmployer.findOne({ where: { user_id: userId } });
    const reset = { status: 'pending', review_note: null, reviewed_by: null, reviewed_at: null };
    const row = existing
        ? await existing.update({ ...employerColumns(data), ...reset })
        : await db.NightEmployer.create({ ...employerColumns(data), user_id: userId });
    events.employerSubmitted(row);
    return toEmployer(row);
}

// ── Gigs ─────────────────────────────────────────────────────────────────────
async function listGigs({ q, limit, offset } = {}) {
    const where = { status: 'active', event_date: { [Op.gte]: today() } };
    if (q) where.title = { [Op.iLike]: `%${String(q).replace(/[\\%_]/g, (m) => `\\${m}`)}%` };
    const { rows, count } = await db.NightGig.findAndCountAll({
        where, include: [{ model: db.NightEmployer, as: 'employer', attributes: ['business_name'] }],
        order: [['event_date', 'ASC']],
        limit: Math.min(Number(limit) || 60, PAGE_MAX), offset: Number(offset) || 0,
    });
    return { items: rows.map(toGig), total: count };
}

async function getGig(id) {
    const row = await db.NightGig.findByPk(id, { include: [{ model: db.NightEmployer, as: 'employer', attributes: ['business_name'] }] });
    if (!row || row.status === 'removed') throw new AppError('NOT_FOUND', 'Gig not found', 404);
    return toGig(row);
}

async function createGig(userId, data) {
    const employer = await requireVerifiedEmployer(userId);
    if (data.eventDate < today()) throw new AppError('VALIDATION_ERROR', 'Event date must be today or later', 422);
    const row = await db.NightGig.create({
        employer_id: employer.id, title: data.title, pay_amount: data.payAmount, pay_cycle: data.payCycle,
        venue_address: data.venueAddress, dress_code: data.dressCode || null, roles_needed: data.rolesNeeded,
        event_date: data.eventDate,
    });
    row.employer = employer;
    return toGig(row);
}

async function listMyGigs(userId) {
    const employer = await requireVerifiedEmployer(userId);
    const rows = await db.NightGig.findAll({
        where: { employer_id: employer.id, status: { [Op.ne]: 'removed' } },
        include: [{ model: db.NightEmployer, as: 'employer', attributes: ['business_name'] }],
        order: [['event_date', 'DESC']], limit: 100,
    });
    const counts = rows.length ? await db.NightGigApplication.findAll({
        attributes: ['gig_id', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'n']],
        where: { gig_id: rows.map((r) => r.id) }, group: ['gig_id'], raw: true,
    }) : [];
    const byId = new Map(counts.map((c) => [c.gig_id, Number(c.n)]));
    return rows.map((r) => ({ ...toGig(r), applicationCount: byId.get(r.id) || 0 }));
}

async function loadOwnedGig(userId, gigId) {
    const employer = await requireVerifiedEmployer(userId);
    const gig = await db.NightGig.findByPk(gigId);
    if (!gig || gig.employer_id !== employer.id || gig.status === 'removed') throw new AppError('NOT_FOUND', 'Gig not found', 404);
    return gig;
}

async function setMyGigStatus(userId, gigId, status) {
    const gig = await loadOwnedGig(userId, gigId);
    await gig.update({ status });
    return toGig(gig);
}

// ── Applications ─────────────────────────────────────────────────────────────
async function applyToGig(userId, gigId, data) {
    const profile = await requireVerifiedProfile(userId);
    const gig = await db.NightGig.findByPk(gigId);
    if (!gig || gig.status !== 'active' || gig.event_date < today()) throw new AppError('NOT_FOUND', 'Gig not found or no longer open', 404);
    const dup = await db.NightGigApplication.findOne({ where: { gig_id: gig.id, profile_id: profile.id } });
    if (dup) throw new AppError('ALREADY_APPLIED', 'You have already applied to this gig', 409);
    const row = await db.NightGigApplication.create({ gig_id: gig.id, profile_id: profile.id, note: data.note || null });
    const owner = await db.NightEmployer.findByPk(gig.employer_id);
    if (owner) events.gigApplied(row, gig, owner.user_id, profile.full_name);
    return toApplication(row);
}

async function listMyApplications(userId) {
    const profile = await db.NightProfile.findOne({ where: { user_id: userId } });
    if (!profile) return [];
    const rows = await db.NightGigApplication.findAll({
        where: { profile_id: profile.id },
        include: [{ model: db.NightGig, as: 'gig', include: [{ model: db.NightEmployer, as: 'employer', attributes: ['business_name'] }] }],
        order: [['created_at', 'DESC']], limit: 100,
    });
    return rows.map(toApplication);
}

async function withdrawApplication(userId, applicationId) {
    const profile = await db.NightProfile.findOne({ where: { user_id: userId } });
    const row = profile && await db.NightGigApplication.findByPk(applicationId);
    if (!row || row.profile_id !== profile.id) throw new AppError('NOT_FOUND', 'Application not found', 404);
    await row.update({ status: 'withdrawn' });
    return toApplication(row);
}

async function listGigApplications(userId, gigId) {
    const gig = await loadOwnedGig(userId, gigId);
    const rows = await db.NightGigApplication.findAll({
        where: { gig_id: gig.id }, include: [{ model: db.NightProfile, as: 'profile' }], order: [['created_at', 'ASC']],
    });
    return rows.map(toApplication);
}

async function setGigApplicationStatus(userId, applicationId, status) {
    const row = await db.NightGigApplication.findByPk(applicationId, { include: [{ model: db.NightGig, as: 'gig' }] });
    if (!row) throw new AppError('NOT_FOUND', 'Application not found', 404);
    await loadOwnedGig(userId, row.gig_id);
    if (row.status === 'withdrawn') throw new AppError('CONFLICT', 'Candidate withdrew this application', 409);
    const changed = row.status !== status;
    await row.update({ status });
    if (changed) {
        const candidate = await db.NightProfile.findByPk(row.profile_id);
        if (candidate) events.gigApplicationDecided(row, row.gig, candidate.user_id);
    }
    return toApplication(row);
}

// ── Admin ────────────────────────────────────────────────────────────────────
async function adminList(Model, serialise, { status, limit, offset }) {
    const { rows, count } = await Model.findAndCountAll({
        where: status ? { status } : {}, order: [['created_at', 'ASC']],
        limit: Math.min(Number(limit) || 50, PAGE_MAX), offset: Number(offset) || 0,
    });
    return { items: rows.map(serialise), total: count };
}

const adminListProfiles = (q) => adminList(db.NightProfile, (r) => toProfile(r, { withContact: true }), q);
const adminListEmployers = (q) => adminList(db.NightEmployer, toEmployer, q);

async function review(Model, serialise, id, adminId, { status, note }, after) {
    const row = await Model.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Record not found', 404);
    await row.update({ status, review_note: note || null, reviewed_by: adminId, reviewed_at: new Date() });
    if (after) after(row);
    return serialise(row);
}

const reviewProfile = (id, adminId, d) => review(db.NightProfile, (r) => toProfile(r, { withContact: true }), id, adminId, d, events.profileReviewed);
const reviewEmployer = (id, adminId, d) => review(db.NightEmployer, toEmployer, id, adminId, d, events.employerReviewed);

async function adminListGigs({ status, limit, offset }) {
    const { rows, count } = await db.NightGig.findAndCountAll({
        where: status ? { status } : {}, include: [{ model: db.NightEmployer, as: 'employer', attributes: ['business_name'] }],
        order: [['created_at', 'DESC']], limit: Math.min(Number(limit) || 50, PAGE_MAX), offset: Number(offset) || 0,
    });
    return { items: rows.map(toGig), total: count };
}

async function adminSetGigStatus(id, status) {
    const row = await db.NightGig.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Gig not found', 404);
    await row.update({ status });
    return toGig(row);
}

module.exports = {
    getMyProfile, upsertMyProfile, listCandidates, revealContact,
    getMyEmployer, upsertMyEmployer,
    listGigs, getGig, createGig, listMyGigs, setMyGigStatus,
    applyToGig, listMyApplications, withdrawApplication, listGigApplications, setGigApplicationStatus,
    adminListProfiles, adminListEmployers, reviewProfile, reviewEmployer, adminListGigs, adminSetGigStatus,
};
