'use strict';
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const DIMENSIONS = ['professionalism', 'communication', 'expertise', 'timeliness'];

// If a 4-dimension breakdown is supplied, the overall `rating` is the average
// of the four — this is the backward-compatible seam: every existing reader
// of `rating` (lawyer rollup, profile display, admin resource) keeps working
// unchanged whether a review has a breakdown or not.
function resolveRatingFields(body) {
    const dims = {};
    let anyDim = false;
    for (const d of DIMENSIONS) {
        const v = body[d];
        if (v === undefined || v === null) continue;
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1 || n > 5) {
            throw new AppError('VALIDATION_ERROR', `${d} must be an integer between 1 and 5`, 422);
        }
        dims[d] = n;
        anyDim = true;
    }
    if (anyDim) {
        const missing = DIMENSIONS.filter((d) => dims[d] === undefined);
        if (missing.length) {
            throw new AppError('VALIDATION_ERROR', `All four dimensions are required together (missing: ${missing.join(', ')})`, 422);
        }
        const avg = DIMENSIONS.reduce((s, d) => s + dims[d], 0) / DIMENSIONS.length;
        return { dims, rating: Math.round(avg * 100) / 100 };
    }
    // No breakdown — legacy single-score path. `rating` is required directly.
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new AppError('VALIDATION_ERROR', 'rating must be an integer between 1 and 5 (or supply all four dimensions)', 422);
    }
    return { dims: {}, rating };
}

async function recalcLawyerRating(lawyerId) {
    const stats = await db.Review.findOne({
        where: { lawyer_id: lawyerId },
        attributes: [
            [db.sequelize.fn('AVG', db.sequelize.col('rating')), 'avg_rating'],
            [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total'],
        ],
        raw: true,
    });
    await db.Lawyer.update(
        { rating: parseFloat(Number(stats.avg_rating).toFixed(2)), total_reviews: Number(stats.total) },
        { where: { id: lawyerId } },
    );
}

const REVIEW_INCLUDE = [
    { model: db.Client, as: 'client', attributes: ['id', 'name'] },
    { model: db.Lawyer, as: 'reviewerLawyer', attributes: ['id', 'name'] },
];

const listReviews = async (req, res, next) => {
    try {
        const { lawyer_id, page = 1, limit = 20 } = req.query;
        const where = {};
        if (lawyer_id) where.lawyer_id = Number(lawyer_id);
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Review.findAndCountAll({
            where,
            include: REVIEW_INCLUDE,
            order: [['created_at', 'DESC']],
            limit: Number(limit),
            offset,
        });
        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit: Number(limit), totalPages: Math.ceil(count / Number(limit)) },
        });
    } catch (err) { return next(err); }
};

// Client -> lawyer review after a completed booking (existing path, now with
// an optional 4-dimension breakdown).
const createReview = async (req, res, next) => {
    try {
        const { booking_id, comment } = req.body;
        if (!booking_id) return next(new AppError('BAD_REQUEST', 'booking_id is required', 400));
        let ratingFields;
        try { ratingFields = resolveRatingFields(req.body); } catch (e) { return next(e); }

        const client = await db.Client.findOne({ where: { user_id: String(req.user.id) } });
        if (!client) return next(new AppError('NOT_FOUND', 'Client profile not found', 404));

        const booking = await db.Booking.findOne({
            where: { id: Number(booking_id), client_id: client.id, status: 'completed' },
        });
        if (!booking) return next(new AppError('NOT_FOUND', 'Completed booking not found', 404));

        const existingReview = await db.Review.findOne({ where: { booking_id: booking.id } });
        if (existingReview) return next(new AppError('CONFLICT', 'Review already exists for this booking', 409));

        const review = await db.Review.create({
            booking_id: booking.id,
            client_id: client.id,
            lawyer_id: booking.lawyer_id,
            rating: ratingFields.rating,
            ...ratingFields.dims,
            comment: comment || null,
        });

        await recalcLawyerRating(booking.lawyer_id);
        return sendSuccess(req, res, review, 201);
    } catch (err) { return next(err); }
};

// Lawyer -> lawyer review after a completed case_referral (spec area 8's
// "after collaboration" path — distinct from the client booking path above).
const createCaseReferralReview = async (req, res, next) => {
    try {
        const { case_referral_id, comment } = req.body;
        if (!case_referral_id) return next(new AppError('BAD_REQUEST', 'case_referral_id is required', 400));
        let ratingFields;
        try { ratingFields = resolveRatingFields(req.body); } catch (e) { return next(e); }

        const reviewer = await db.Lawyer.findOne({ where: { user_id: String(req.user.id) } });
        if (!reviewer) return next(new AppError('NOT_FOUND', 'Lawyer profile not found', 404));

        const referral = await db.CaseReferral.findByPk(Number(case_referral_id));
        if (!referral || referral.status !== 'completed') {
            return next(new AppError('NOT_FOUND', 'Completed case referral not found', 404));
        }
        const isFrom = referral.from_lawyer_id === reviewer.id;
        const isTo = referral.to_lawyer_id === reviewer.id;
        if (!isFrom && !isTo) return next(new AppError('FORBIDDEN', 'Not a party to this referral', 403));
        const reviewedLawyerId = isFrom ? referral.to_lawyer_id : referral.from_lawyer_id;

        const existing = await db.Review.findOne({ where: { case_referral_id: referral.id, reviewer_lawyer_id: reviewer.id } });
        if (existing) return next(new AppError('CONFLICT', 'You have already reviewed this collaboration', 409));

        const review = await db.Review.create({
            case_referral_id: referral.id,
            reviewer_lawyer_id: reviewer.id,
            lawyer_id: reviewedLawyerId,
            rating: ratingFields.rating,
            ...ratingFields.dims,
            comment: comment || null,
        });

        await recalcLawyerRating(reviewedLawyerId);
        return sendSuccess(req, res, review, 201);
    } catch (err) { return next(err); }
};

module.exports = { listReviews, createReview, createCaseReferralReview };
