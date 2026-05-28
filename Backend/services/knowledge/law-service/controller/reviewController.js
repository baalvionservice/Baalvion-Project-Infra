'use strict';
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listReviews = async (req, res, next) => {
    try {
        const { lawyer_id, page = 1, limit = 20 } = req.query;
        const where = {};
        if (lawyer_id) where.lawyer_id = Number(lawyer_id);
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Review.findAndCountAll({
            where,
            include: [
                { model: db.Client, as: 'client', attributes: ['id', 'name'] },
            ],
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

const createReview = async (req, res, next) => {
    try {
        const { booking_id, rating, comment } = req.body;
        if (!booking_id || !rating) return next(new AppError('BAD_REQUEST', 'booking_id and rating are required', 400));
        if (rating < 1 || rating > 5) return next(new AppError('BAD_REQUEST', 'Rating must be between 1 and 5', 400));

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
            rating: Number(rating),
            comment: comment || null,
        });

        // Recalculate lawyer's average rating
        const stats = await db.Review.findOne({
            where: { lawyer_id: booking.lawyer_id },
            attributes: [
                [db.sequelize.fn('AVG', db.sequelize.col('rating')), 'avg_rating'],
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total'],
            ],
            raw: true,
        });
        await db.Lawyer.update(
            {
                rating: parseFloat(Number(stats.avg_rating).toFixed(2)),
                total_reviews: Number(stats.total),
            },
            { where: { id: booking.lawyer_id } }
        );

        return sendSuccess(req, res, review, 201);
    } catch (err) { return next(err); }
};

module.exports = { listReviews, createReview };
