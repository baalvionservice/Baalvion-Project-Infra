'use strict';
const { z } = require('zod');

// Customer-submitted review. rating is the only required field; verified_purchase, status and
// all aggregates are computed server-side (never trusted from the client).
exports.createReviewSchema = z.object({
    rating: z.number().int().min(1).max(5),
    title: z.string().max(200).optional(),
    body: z.string().max(5000).optional(),
});

// Store-team moderation action: change status and/or attach a public reply.
exports.moderateReviewSchema = z.object({
    status: z.enum(['approved', 'rejected']).optional(),
    reply: z.string().max(2000).optional(),
});
