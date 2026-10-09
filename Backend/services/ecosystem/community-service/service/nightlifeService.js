'use strict';
// Clubs + Locals hub: public directory reads, visitor bookings/applications, admin curation.
// Admin "delete" is deliberately archive-only (status flip) — the console is pre-launch and
// rows referenced by bookings/applications must stay resolvable.
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { slugify } = require('../utils/slug');
const events = require('./notifyEvents');

const MAX_PAGE_SIZE = 200;

async function uniqueSlug(Model, base) {
    let slug = base || 'item';
    for (let i = 2; await Model.count({ where: { slug } }); i += 1) slug = `${base}-${i}`;
    return slug;
}

const escapeLike = (s) => String(s).replace(/[\\%_]/g, (m) => `\\${m}`);

// ── Clubs ────────────────────────────────────────────────────────────────────
const toClub = (r, { admin = false } = {}) => ({
    ...(admin ? { contactEmail: r.contact_email } : {}),
    id: r.id, slug: r.slug, name: r.name, state: r.state, city: r.city, suburb: r.suburb,
    address: r.address, image: r.image, musicType: r.music_types, daysOpen: r.days_open,
    description: r.description, coverCharge: r.cover_charge, vibe: r.vibe,
    requiredRoles: r.required_roles, vipPackages: r.vip_packages || [], rating: r.rating === null ? null : Number(r.rating),
    status: r.status,
});

async function listClubs({ state, city, q, includeArchived = false, limit, offset } = {}) {
    const where = includeArchived ? {} : { status: 'active' };
    if (state) where.state = state;
    if (city) where.city = city;
    if (q) {
        const like = `%${escapeLike(q)}%`;
        where[Op.or] = [{ name: { [Op.iLike]: like } }, { suburb: { [Op.iLike]: like } }, { city: { [Op.iLike]: like } }];
    }
    const { rows, count } = await db.NightClub.findAndCountAll({
        where, order: [['rating', 'DESC NULLS LAST'], ['name', 'ASC']],
        limit: Math.min(Number(limit) || MAX_PAGE_SIZE, MAX_PAGE_SIZE), offset: Number(offset) || 0,
    });
    return { items: rows.map((r) => toClub(r, { admin: includeArchived })), total: count };
}

async function getClub(idOrSlug) {
    const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug);
    const row = await db.NightClub.findOne({ where: isUuid ? { id: idOrSlug } : { slug: idOrSlug } });
    if (!row || row.status !== 'active') throw new AppError('NOT_FOUND', 'Club not found', 404);
    return toClub(row);
}

const clubColumns = (d) => ({
    name: d.name, state: d.state, city: d.city, suburb: d.suburb, address: d.address, image: d.image,
    music_types: d.musicTypes, days_open: d.daysOpen, description: d.description,
    cover_charge: d.coverCharge, vibe: d.vibe, required_roles: d.requiredRoles, vip_packages: d.vipPackages, rating: d.rating, contact_email: d.contactEmail,
    status: d.status,
});
const defined = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

async function createClub(data) {
    const slug = await uniqueSlug(db.NightClub, slugify(`${data.name}-${data.city}`));
    return toClub(await db.NightClub.create({ ...defined(clubColumns(data)), slug }), { admin: true });
}

async function updateClub(id, data) {
    const row = await db.NightClub.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Club not found', 404);
    await row.update(defined(clubColumns(data)));
    return toClub(row, { admin: true });
}

// ── Club bookings ────────────────────────────────────────────────────────────
const toBooking = (r) => ({
    id: r.id, clubId: r.club_id, kind: r.kind, firstName: r.first_name, lastName: r.last_name,
    email: r.email, phone: r.phone, visitDate: r.visit_date, males: r.males, females: r.females,
    groupSize: r.group_size, tablePackage: r.table_package, notes: r.notes, status: r.status,
    createdAt: r.createdAt, club: r.club ? { id: r.club.id, slug: r.club.slug, name: r.club.name, city: r.club.city } : undefined,
});

async function createBooking(clubIdOrSlug, kind, data, userId) {
    const club = await getClub(clubIdOrSlug);
    const today = new Date().toISOString().slice(0, 10);
    if (data.visitDate < today) throw new AppError('VALIDATION_ERROR', 'Date must be today or later', 422);
    const row = await db.ClubBooking.create({
        club_id: club.id, user_id: userId || null, kind,
        first_name: data.firstName, last_name: data.lastName, email: data.email.toLowerCase(),
        phone: data.phone, visit_date: data.visitDate,
        males: data.males || 0, females: data.females || 0,
        group_size: kind === 'vip_table' ? data.groupSize : (data.males || 0) + (data.females || 0),
        table_package: data.tablePackage || null, notes: data.notes || null,
    });
    events.bookingReceived(row, await db.NightClub.findByPk(club.id));
    return toBooking(row);
}

async function listMyBookings(userId) {
    const rows = await db.ClubBooking.findAll({
        where: { user_id: userId }, include: [{ model: db.NightClub, as: 'club' }],
        order: [['created_at', 'DESC']], limit: 100,
    });
    return rows.map(toBooking);
}

async function listBookings({ status, clubId, limit, offset } = {}) {
    const where = {};
    if (status) where.status = status;
    if (clubId) where.club_id = clubId;
    const { rows, count } = await db.ClubBooking.findAndCountAll({
        where, include: [{ model: db.NightClub, as: 'club' }], order: [['created_at', 'DESC']],
        limit: Math.min(Number(limit) || 50, MAX_PAGE_SIZE), offset: Number(offset) || 0,
    });
    return { items: rows.map(toBooking), total: count };
}

async function setBookingStatus(id, status) {
    const row = await db.ClubBooking.findByPk(id, { include: [{ model: db.NightClub, as: 'club' }] });
    if (!row) throw new AppError('NOT_FOUND', 'Booking not found', 404);
    const changed = row.status !== status;
    await row.update({ status });
    if (changed) events.bookingDecided(row, row.club);
    return toBooking(row);
}

// ── Events ───────────────────────────────────────────────────────────────────
const toEvent = (r) => ({
    id: r.id, clubId: r.club_id, eventName: r.event_name, djName: r.dj_name, date: r.event_date,
    image: r.image, description: r.description, tag: r.tag, ticketUrl: r.ticket_url, status: r.status,
    club: r.club ? { id: r.club.id, slug: r.club.slug, name: r.club.name, city: r.club.city, state: r.club.state } : undefined,
});
const eventInclude = [{ model: db.NightClub, as: 'club' }];

async function listEvents({ city, from, to, clubId, includeAll = false, limit, offset } = {}) {
    const today = new Date().toISOString().slice(0, 10);
    const where = {};
    if (!includeAll) { where.status = 'active'; where.event_date = { [Op.gte]: from || today }; }
    else if (from) where.event_date = { [Op.gte]: from };
    if (to) where.event_date = { ...(where.event_date || {}), [Op.lte]: to };
    if (clubId) where.club_id = clubId;
    const clubWhere = city ? { city } : undefined;
    const { rows, count } = await db.ClubEvent.findAndCountAll({
        where, include: [{ model: db.NightClub, as: 'club', where: clubWhere }],
        order: [['event_date', 'ASC'], ['event_name', 'ASC']],
        limit: Math.min(Number(limit) || MAX_PAGE_SIZE, MAX_PAGE_SIZE), offset: Number(offset) || 0,
    });
    return { items: rows.map(toEvent), total: count };
}

async function getEvent(id) {
    const row = await db.ClubEvent.findByPk(id, { include: eventInclude });
    if (!row || row.status !== 'active') throw new AppError('NOT_FOUND', 'Event not found', 404);
    return toEvent(row);
}

const eventColumns = (d) => ({
    club_id: d.clubId, event_name: d.eventName, dj_name: d.djName, event_date: d.eventDate, image: d.image,
    description: d.description, tag: d.tag, ticket_url: d.ticketUrl, status: d.status,
});

async function createEvent(data) {
    const club = await db.NightClub.findByPk(data.clubId);
    if (!club) throw new AppError('VALIDATION_ERROR', 'clubId: club does not exist', 422);
    const row = await db.ClubEvent.create(defined(eventColumns(data)));
    return toEvent(await db.ClubEvent.findByPk(row.id, { include: eventInclude }));
}

async function updateEvent(id, data) {
    const row = await db.ClubEvent.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Event not found', 404);
    if (data.clubId && !(await db.NightClub.findByPk(data.clubId))) throw new AppError('VALIDATION_ERROR', 'clubId: club does not exist', 422);
    await row.update(defined(eventColumns(data)));
    return toEvent(await db.ClubEvent.findByPk(id, { include: eventInclude }));
}

// ── Public counters ──────────────────────────────────────────────────────────
// Real row counts only; the landing page shows these instead of marketing figures.
async function publicStats() {
    const today = new Date().toISOString().slice(0, 10);
    const [clubs, cities, listings, events] = await Promise.all([
        db.NightClub.count({ where: { status: 'active' } }),
        db.NightClub.count({ where: { status: 'active' }, distinct: true, col: 'city' }),
        db.LocalListing.count({ where: { status: 'active' } }),
        db.ClubEvent.count({ where: { status: 'active', event_date: { [Op.gte]: today } } }),
    ]);
    return { clubs, cities, openListings: listings, upcomingEvents: events };
}

// ── Locals listings ──────────────────────────────────────────────────────────
const toListing = (r) => ({
    id: r.id, slug: r.slug, title: r.title, type: r.type, location: r.location, city: r.city,
    description: r.description, requirements: r.requirements, contact: r.contact, date: r.event_date,
    salary: r.salary, postedBy: r.posted_by, verified: r.verified, postedAt: r.createdAt,
    minAge: r.min_age, maxAge: r.max_age, gender: r.gender, primaryCategory: r.primary_category,
    roleRequirements: r.role_requirements, seoKeywords: r.seo_keywords, status: r.status,
});

async function listListings({ type, city, q, includeInactive = false, limit, offset } = {}) {
    const where = includeInactive ? {} : { status: 'active' };
    if (type) where.type = type;
    if (city) where.city = city;
    if (q) {
        const like = `%${escapeLike(q)}%`;
        where[Op.or] = [{ title: { [Op.iLike]: like } }, { description: { [Op.iLike]: like } }, { city: { [Op.iLike]: like } }];
    }
    const { rows, count } = await db.LocalListing.findAndCountAll({
        where, order: [['created_at', 'DESC']],
        limit: Math.min(Number(limit) || MAX_PAGE_SIZE, MAX_PAGE_SIZE), offset: Number(offset) || 0,
    });
    const items = rows.map(toListing);
    if (includeInactive && rows.length) {
        // Admin view only: per-listing applicant counts, in one grouped query rather than N.
        const counts = await db.LocalApplication.findAll({
            attributes: ['listing_id', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'n']],
            where: { listing_id: rows.map((r) => r.id) },
            group: ['listing_id'],
            raw: true,
        });
        const byId = new Map(counts.map((c) => [c.listing_id, Number(c.n)]));
        items.forEach((it) => { it.applicationCount = byId.get(it.id) || 0; });
    }
    return { items, total: count };
}

async function getListing(slug) {
    const row = await db.LocalListing.findOne({ where: { slug } });
    if (!row || row.status === 'archived') throw new AppError('NOT_FOUND', 'Listing not found', 404);
    return toListing(row);
}

const listingColumns = (d) => ({
    title: d.title, type: d.type, location: d.location, city: d.city, description: d.description,
    requirements: d.requirements, contact: d.contact, event_date: d.date, salary: d.salary,
    posted_by: d.postedBy, verified: d.verified, min_age: d.minAge, max_age: d.maxAge,
    gender: d.gender, primary_category: d.primaryCategory, role_requirements: d.roleRequirements,
    seo_keywords: d.seoKeywords, status: d.status,
});

async function createListing(data) {
    const slug = await uniqueSlug(db.LocalListing, slugify(`${data.title}-${data.city}`));
    return toListing(await db.LocalListing.create({ ...defined(listingColumns(data)), slug }));
}

async function updateListing(id, data) {
    const row = await db.LocalListing.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Listing not found', 404);
    await row.update(defined(listingColumns(data)));
    return toListing(row);
}

// ── Locals applications ──────────────────────────────────────────────────────
const toApplication = (r) => ({
    id: r.id, listingId: r.listing_id, userId: r.user_id, fullName: r.full_name, phone: r.phone,
    email: r.email, message: r.message, details: r.details, status: r.status, createdAt: r.createdAt,
    listing: r.listing ? { id: r.listing.id, slug: r.listing.slug, title: r.listing.title, city: r.listing.city } : undefined,
});

async function applyToListing(slug, userId, data) {
    const listing = await db.LocalListing.findOne({ where: { slug } });
    if (!listing || listing.status !== 'active') throw new AppError('NOT_FOUND', 'Listing not found or closed', 404);
    const existing = await db.LocalApplication.findOne({ where: { listing_id: listing.id, user_id: userId } });
    if (existing) throw new AppError('ALREADY_APPLIED', 'You have already applied to this listing', 409);
    const row = await db.LocalApplication.create({
        listing_id: listing.id, user_id: userId, full_name: data.fullName, phone: data.phone,
        email: data.email ? data.email.toLowerCase() : null, message: data.message || null,
        details: data.details || {},
    });
    events.localApplied(row, listing);
    return toApplication(row);
}

async function listMyApplications(userId) {
    const rows = await db.LocalApplication.findAll({
        where: { user_id: userId }, include: [{ model: db.LocalListing, as: 'listing' }],
        order: [['created_at', 'DESC']], limit: 100,
    });
    return rows.map(toApplication);
}

async function listApplications({ status, listingId, limit, offset } = {}) {
    const where = {};
    if (status) where.status = status;
    if (listingId) where.listing_id = listingId;
    const { rows, count } = await db.LocalApplication.findAndCountAll({
        where, include: [{ model: db.LocalListing, as: 'listing' }], order: [['created_at', 'DESC']],
        limit: Math.min(Number(limit) || 50, MAX_PAGE_SIZE), offset: Number(offset) || 0,
    });
    return { items: rows.map(toApplication), total: count };
}

async function setApplicationStatus(id, status) {
    const row = await db.LocalApplication.findByPk(id, { include: [{ model: db.LocalListing, as: 'listing' }] });
    if (!row) throw new AppError('NOT_FOUND', 'Application not found', 404);
    const changed = row.status !== status;
    await row.update({ status });
    if (changed) events.localDecided(row, row.listing);
    return toApplication(row);
}

module.exports = {
    publicStats, listClubs, getClub, createClub, updateClub, listEvents, getEvent, createEvent, updateEvent,
    createBooking, listMyBookings, listBookings, setBookingStatus,
    listListings, getListing, createListing, updateListing,
    applyToListing, listMyApplications, listApplications, setApplicationStatus,
};
