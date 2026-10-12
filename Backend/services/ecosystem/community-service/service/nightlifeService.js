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
    latitude: r.latitude, longitude: r.longitude, website: r.website, phone: r.phone, openingHours: r.opening_hours, venueType: r.venue_type,
    seoTitle: r.seo_title, seoDescription: r.seo_description, about: r.about, faqs: r.faqs || [], gallery: r.gallery || [], priceRange: r.price_range,
});

// How much a venue page can actually say: more verified facts ranks higher, so complete listings lead.
const COMPLETENESS = `(CASE WHEN "NightClub"."image" IS NOT NULL THEN 3 ELSE 0 END + CASE WHEN "NightClub"."description" IS NOT NULL THEN 2 ELSE 0 END
  + CASE WHEN "NightClub"."website" IS NOT NULL THEN 2 ELSE 0 END + CASE WHEN "NightClub"."opening_hours" IS NOT NULL THEN 1 ELSE 0 END
  + CASE WHEN "NightClub"."phone" IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN "NightClub"."address" IS NOT NULL THEN 1 ELSE 0 END)`;

async function listClubs({ state, city, suburb, q, includeArchived = false, limit, offset } = {}) {
    const where = includeArchived ? {} : { status: 'active' };
    if (state) where.state = state;
    if (city) where.city = city;
    if (suburb) where.suburb = suburb;
    if (q) {
        const like = `%${escapeLike(q)}%`;
        where[Op.or] = [{ name: { [Op.iLike]: like } }, { suburb: { [Op.iLike]: like } }, { city: { [Op.iLike]: like } }];
    }
    const { rows, count } = await db.NightClub.findAndCountAll({
        where, order: [['rating', 'DESC NULLS LAST'], [db.sequelize.literal(COMPLETENESS), 'DESC'], ['name', 'ASC']],
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
    latitude: d.latitude, longitude: d.longitude, website: d.website, phone: d.phone, opening_hours: d.openingHours, venue_type: d.venueType,
    seo_title: d.seoTitle, seo_description: d.seoDescription, about: d.about, faqs: d.faqs, gallery: d.gallery, price_range: d.priceRange,
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
    image: r.image, description: r.description, tag: r.tag, ticketUrl: r.ticket_url, ticketPriceText: r.ticket_price_text, submittedBy: r.submitted_by, status: r.status,
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

// A member's own event. It stays hidden until the events team approves it (status becomes 'active').
async function submitEvent(userId, data) {
    const uid = String(userId);
    if (!(await db.NightClub.findByPk(data.clubId))) throw new AppError('VALIDATION_ERROR', 'clubId: pick a club from the list', 422);
    const open = await db.ClubEvent.count({ where: { submitted_by: uid, status: 'pending_review' } });
    if (open >= 3) throw new AppError('TOO_MANY_PENDING', 'You already have three events waiting for review', 409);
    let image;
    if (data.image) {
        // Only a poster this member uploaded here; no links to other sites.
        const m = /\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.exec(data.image);
        const asset = m && await db.MediaAsset.findOne({ where: { id: m[1], owner_id: uid, purpose: 'event_poster' }, attributes: ['id'] });
        if (!asset) throw new AppError('VALIDATION_ERROR', 'image: upload the poster with the upload button', 422);
        image = data.image;
    }
    const tag = data.ticketUrl ? 'BUY TICKETS' : 'FREE ON GUEST LIST';
    const row = await db.ClubEvent.create(defined({
        club_id: data.clubId, event_name: data.eventName, dj_name: data.djName, event_date: data.eventDate, image,
        description: data.description, tag, ticket_url: data.ticketUrl, ticket_price_text: data.ticketPriceText,
        status: 'pending_review', submitted_by: uid,
    }));
    return toEvent(await db.ClubEvent.findByPk(row.id, { include: eventInclude }));
}

async function myEvents(userId) {
    const rows = await db.ClubEvent.findAll({ where: { submitted_by: String(userId) }, include: eventInclude, order: [['created_at', 'DESC']], limit: 30 });
    return { items: rows.map(toEvent) };
}

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

// ── Elite Host: a signed-in member applies to host a party; staff approve; approved ones show publicly ──
const toEliteApplication = (r) => ({
    id: r.id, hostAlias: r.host_alias, budget: Number(r.budget_inr), state: r.state, city: r.city, area: r.area,
    clubId: r.club_id, clubName: r.club_name, date: r.party_date, guests: r.guests, perks: r.perks || [], ladiesFree: !!r.ladies_free,
    status: r.status, createdAt: r.createdAt, reviewedAt: r.reviewed_at,
});

// Public view: no user id, no contact details.
const toPublicEliteParty = (r, approvedGuests = 0) => ({
    id: r.id, hostAlias: r.host_alias, budget: Number(r.budget_inr), city: r.city, area: r.area,
    clubName: r.club_name, date: r.party_date, guests: r.guests, perks: r.perks || [], ladiesFree: !!r.ladies_free,
    approvedGuests, slotsLeft: r.guests ? Math.max(0, r.guests - approvedGuests) : null,
});

async function applyEliteHost(userId, data) {
    const open = await db.EliteHostApplication.count({ where: { user_id: userId, status: 'pending' } });
    if (open >= 3) throw new AppError('TOO_MANY_PENDING', 'You already have three applications under review', 409);
    const row = await db.EliteHostApplication.create({
        user_id: userId, host_alias: data.hostAlias || null, budget_inr: data.budget, state: data.state, city: data.city,
        area: data.area || null, club_id: data.clubId || null, club_name: data.clubName || null,
        party_date: data.partyDate || null, guests: data.guests || null, perks: data.perks || [], ladies_free: !!data.ladiesFree,
    });
    return toEliteApplication(row);
}

async function listApprovedEliteParties() {
    const rows = await db.EliteHostApplication.findAll({
        where: { status: 'approved' }, order: [['party_date', 'ASC'], ['created_at', 'DESC']], limit: 50,
    });
    const guests = require('./eliteGuestService');
    const items = [];
    for (const r of rows) items.push(toPublicEliteParty(r, await guests.approvedCount(r.id)));
    return { items, total: items.length };
}

async function listEliteApplications({ status, limit, offset } = {}) {
    const where = status ? { status } : {};
    const { rows, count } = await db.EliteHostApplication.findAndCountAll({
        where, order: [['created_at', 'DESC']],
        limit: Math.min(Number(limit) || 50, MAX_PAGE_SIZE), offset: Number(offset) || 0,
    });
    return { items: rows.map(toEliteApplication), total: count };
}

async function setEliteApplicationStatus(id, status, reviewerId) {
    const row = await db.EliteHostApplication.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Application not found', 404);
    await row.update({ status, reviewed_by: reviewerId || null, reviewed_at: new Date() });
    return toEliteApplication(row);
}

module.exports = {
    publicStats, listClubs, getClub, createClub, updateClub, listEvents, getEvent, createEvent, updateEvent, submitEvent, myEvents,
    createBooking, listMyBookings, listBookings, setBookingStatus,
    listListings, getListing, createListing, updateListing,
    applyToListing, listMyApplications, listApplications, setApplicationStatus,
    applyEliteHost, listApprovedEliteParties, listEliteApplications, setEliteApplicationStatus,
};
