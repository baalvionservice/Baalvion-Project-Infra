'use strict';
const { sendSuccess } = require('../utils/response');
const reviewService = require('../service/reviewService');

// Authenticated: submit (or update) the caller's review for a product.
const createReview = async (req, res, next) => {
    try {
        const review = await reviewService.createReview(req.params.storeId, req.params.productId, req.auth.userId, req.validated);
        return sendSuccess(req, res, review, 201);
    } catch (err) { return next(err); }
};

// Authenticated: the caller's own review for a product (any status), or null.
const getMyReview = async (req, res, next) => {
    try {
        const review = await reviewService.getMyReview(req.params.storeId, req.params.productId, req.auth.userId);
        return sendSuccess(req, res, review);
    } catch (err) { return next(err); }
};

// Moderation: list all reviews for a product (any status), paginated.
const listAllReviews = async (req, res, next) => {
    try {
        const result = await reviewService.listAllReviews(req.params.storeId, req.params.productId, req.query);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

// Moderation: set status and/or attach a reply.
const moderateReview = async (req, res, next) => {
    try {
        const review = await reviewService.moderateReview(req.params.storeId, req.params.productId, req.params.reviewId, req.validated);
        return sendSuccess(req, res, review);
    } catch (err) { return next(err); }
};

module.exports = { createReview, getMyReview, listAllReviews, moderateReview };
