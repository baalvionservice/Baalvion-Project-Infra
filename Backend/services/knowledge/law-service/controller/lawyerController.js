'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { toPrefixTsQuery } = require('../utils/search');
const mailer = require('../service/mailer');

const listLawyers = async (req, res, next) => {
    try {
        const {
            page = 1, limit = 20,
            specialization, jurisdiction, minRate, maxRate,
            minRating, verified, language, country, countryCode, city,
            stateId, cityId, practiceAreaId, minExperience, online,
        } = req.query;
        // Accept both ?search= and ?q= (Express 5's req.query is a getter — never mutate it).
        const search = req.query.search || req.query.q;
        const where = { status: 'active' };
        if (specialization) where.specializations = { [Op.contains]: [specialization] };
        if (jurisdiction) where.jurisdictions = { [Op.contains]: [jurisdiction] };
        if (language) where.languages = { [Op.contains]: [language] };
        if (countryCode) where.country_code = String(countryCode).toUpperCase();
        if (country) where.country = { [Op.iLike]: `%${country}%` };
        if (city) where.city = { [Op.iLike]: `%${city}%` };
        if (stateId) where.state_id = Number(stateId);
        if (cityId) where.city_id = Number(cityId);
        if (verified !== undefined) where.verified = verified === 'true';
        if (minRate) where.hourly_rate = { ...where.hourly_rate, [Op.gte]: Number(minRate) };
        if (maxRate) where.hourly_rate = { ...where.hourly_rate, [Op.lte]: Number(maxRate) };
        if (minRating) where.rating = { [Op.gte]: Number(minRating) };
        if (minExperience) where.experience = { [Op.gte]: Number(minExperience) };
        if (practiceAreaId) {
            where[Op.and] = [
                ...(where[Op.and] || []),
                db.sequelize.literal(
                    `EXISTS (SELECT 1 FROM legal.lawyer_practice_areas lpa WHERE lpa.lawyer_id = "Lawyer"."id" AND lpa.practice_area_id = ${Number(practiceAreaId)})`,
                ),
            ];
        }
        // Real presence (service/realtime.js live-socket set) — never a fabricated flag.
        if (online === 'true') {
            const onlineIds = require('../service/realtime').getOnlineUserIds();
            where.user_id = { [Op.in]: onlineIds.length ? onlineIds : ['__none__'] };
        }

        // ── Full-text relevance search ───────────────────────────────────────
        // Weighted tsvector (name>specializations>location>bio), prefix-aware so
        // "ame" matches "Amelia". Falls back to rating order when no query.
        const tsq = toPrefixTsQuery(search);
        let order = [['rating', 'DESC'], ['total_reviews', 'DESC']];
        if (tsq) {
            const safe = db.sequelize.escape(tsq);
            where[Op.and] = [
                ...(where[Op.and] || []),
                db.sequelize.literal(`"Lawyer"."search_vector" @@ to_tsquery('simple', unaccent(${safe}))`),
            ];
            // Rank by text relevance first, then quality signals.
            order = [
                [db.sequelize.literal(`ts_rank("Lawyer"."search_vector", to_tsquery('simple', unaccent(${safe})))`), 'DESC'],
                ['rating', 'DESC'], ['total_reviews', 'DESC'],
            ];
        }

        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Lawyer.findAndCountAll({
            where,
            order,
            limit: Number(limit),
            offset,
        });
        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit: Number(limit), totalPages: Math.ceil(count / Number(limit)) },
        });
    } catch (err) { return next(err); }
};

// Typeahead suggestions — trigram-based, typo-tolerant, fast (uses gin_trgm idx).
// Returns lightweight {id,name,specializations,city,country,profile_photo} only.
const autocomplete = async (req, res, next) => {
    try {
        const q = String(req.query.q || '').trim();
        if (q.length < 2) return sendSuccess(req, res, []);
        const safe = db.sequelize.escape(`%${q}%`);
        const tsq = toPrefixTsQuery(q);
        const conds = [`"name" ILIKE ${safe}`, `"city" ILIKE ${safe}`];
        if (tsq) conds.push(`"search_vector" @@ to_tsquery('simple', unaccent(${db.sequelize.escape(tsq)}))`);
        const rows = await db.Lawyer.findAll({
            attributes: ['id', 'name', 'specializations', 'city', 'country', 'country_code', 'profile_photo', 'rating'],
            where: {
                status: 'active',
                [Op.and]: [db.sequelize.literal(`(${conds.join(' OR ')})`)],
            },
            order: [
                [db.sequelize.literal(`similarity("name", ${db.sequelize.escape(q)})`), 'DESC'],
                ['rating', 'DESC'],
            ],
            limit: 8,
        });
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

// Global directory: active-lawyer counts grouped by country (for "browse by country").
const countriesSummary = async (req, res, next) => {
    try {
        const rows = await db.Lawyer.findAll({
            attributes: ['country', 'country_code', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
            where: { status: 'active', country: { [Op.ne]: null } },
            group: ['country', 'country_code'],
            order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']],
            raw: true,
        });
        return sendSuccess(req, res, rows.map((r) => ({ country: r.country, countryCode: r.country_code, count: Number(r.count) })));
    } catch (err) { return next(err); }
};

// Public search — the frontend calls /lawyers/search?q=... ; listLawyers reads
// both ?q= and ?search= directly (req.query is immutable in Express 5).
const searchLawyers = (req, res, next) => listLawyers(req, res, next);

const PROFILE_INCLUDE = [
    { model: db.State, as: 'state', attributes: ['id', 'name', 'code'] },
    { model: db.City, as: 'cityRef', attributes: ['id', 'name'] },
    { model: db.PracticeArea, as: 'practiceAreas', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
];

const getLawyer = async (req, res, next) => {
    try {
        const lawyer = await db.Lawyer.findByPk(req.params.id, { include: PROFILE_INCLUDE });
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found', 404));
        return sendSuccess(req, res, lawyer);
    } catch (err) { return next(err); }
};

// Resolve practice-area ids/slugs/names to valid PracticeArea rows, and
// mirror their names into the legacy `specializations` text array so the
// existing full-text search + Op.contains filtering keeps working unchanged
// while the join table becomes the source of truth for new features.
async function resolvePracticeAreas(input) {
    const raw = Array.isArray(input) ? input : [];
    if (!raw.length) return [];
    const { Op } = require('sequelize');
    return db.PracticeArea.findAll({
        where: {
            is_active: true,
            [Op.or]: [{ id: raw.filter((v) => Number.isInteger(Number(v))).map(Number) }, { slug: raw.map(String) }],
        },
    });
}

const createLawyer = async (req, res, next) => {
    try {
        const existing = await db.Lawyer.findOne({ where: { user_id: String(req.user.id) } });
        if (existing) return next(new AppError('CONFLICT', 'Lawyer profile already exists for this user', 409));
        // Force server-controlled fields; applicants always start pending + unverified.
        const { rating, total_reviews, verified, status, user_id, practice_area_ids, ...safe } = req.body || {};
        const practiceAreas = await resolvePracticeAreas(practice_area_ids);
        const lawyer = await db.Lawyer.create({
            ...safe,
            user_id: String(req.user.id),
            status: 'pending',
            verified: false,
            specializations: practiceAreas.length ? practiceAreas.map((p) => p.name) : (safe.specializations || []),
        });
        if (practiceAreas.length) await lawyer.setPracticeAreas(practiceAreas);
        // Promote the local identity to a lawyer-role user (still pending verification for the directory).
        if (req.user.id) await db.User.update({ role: 'lawyer' }, { where: { id: req.user.id } });
        if (lawyer.email) mailer.sendTemplate('welcome', lawyer.email, { name: lawyer.name }).catch(() => {});
        return sendSuccess(req, res, lawyer, 201);
    } catch (err) { return next(err); }
};

const updateLawyer = async (req, res, next) => {
    try {
        const lawyer = await db.Lawyer.findByPk(req.params.id);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found', 404));
        if (lawyer.user_id !== String(req.user.id) && !req.user.isAdmin) {
            return next(new AppError('FORBIDDEN', 'Not authorised to update this profile', 403));
        }
        const forbidden = ['rating', 'total_reviews', 'verified', 'status'];
        forbidden.forEach(f => delete req.body[f]);
        const { practice_area_ids, ...rest } = req.body;
        if (practice_area_ids !== undefined) {
            const practiceAreas = await resolvePracticeAreas(practice_area_ids);
            await lawyer.setPracticeAreas(practiceAreas);
            rest.specializations = practiceAreas.map((p) => p.name);
        }
        await lawyer.update(rest);
        return sendSuccess(req, res, lawyer);
    } catch (err) { return next(err); }
};

const deleteLawyer = async (req, res, next) => {
    try {
        const lawyer = await db.Lawyer.findByPk(req.params.id);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found', 404));
        if (!req.user.isAdmin) {
            return next(new AppError('FORBIDDEN', 'Admin only', 403));
        }
        await lawyer.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

const getAvailability = async (req, res, next) => {
    try {
        const lawyer = await db.Lawyer.findByPk(req.params.id, { attributes: ['id', 'availability', 'name'] });
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found', 404));
        return sendSuccess(req, res, { availability: lawyer.availability, lawyerId: lawyer.id });
    } catch (err) { return next(err); }
};

const updateAvailability = async (req, res, next) => {
    try {
        const lawyer = await db.Lawyer.findByPk(req.params.id);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found', 404));
        if (lawyer.user_id !== String(req.user.id) && !req.user.isAdmin) {
            return next(new AppError('FORBIDDEN', 'Not authorised', 403));
        }
        await lawyer.update({ availability: req.body.availability });
        return sendSuccess(req, res, { availability: lawyer.availability });
    } catch (err) { return next(err); }
};

const verifyLawyer = async (req, res, next) => {
    try {
        if (!req.user.isAdmin) return next(new AppError('FORBIDDEN', 'Admin only', 403));
        const lawyer = await db.Lawyer.findByPk(req.params.id);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found', 404));
        await lawyer.update({ verified: true });
        // Activation also requires an active subscription (registration wizard's
        // Subscription step) — see service/lawyerActivation.
        const { maybeActivateLawyer } = require('../service/lawyerActivation');
        const updated = await maybeActivateLawyer(lawyer.id);
        if (lawyer.email) mailer.sendTemplate('lawyerVerified', lawyer.email, { name: lawyer.name }).catch(() => {});
        return sendSuccess(req, res, updated);
    } catch (err) { return next(err); }
};

const getMyProfile = async (req, res, next) => {
    try {
        const lawyer = await db.Lawyer.findOne({ where: { user_id: String(req.user.id) }, include: PROFILE_INCLUDE });
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer profile not found', 404));
        return sendSuccess(req, res, lawyer);
    } catch (err) { return next(err); }
};

module.exports = { listLawyers, countriesSummary, searchLawyers, autocomplete, getLawyer, createLawyer, updateLawyer, deleteLawyer, getAvailability, updateAvailability, verifyLawyer, getMyProfile };
