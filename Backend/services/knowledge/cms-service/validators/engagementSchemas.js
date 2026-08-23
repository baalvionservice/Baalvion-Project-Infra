'use strict';
const { z } = require('zod');

const submitCommentSchema = z.object({
    authorName: z.string().trim().min(1).max(120),
    authorEmail: z.string().trim().email().max(255),
    body: z.string().trim().min(1).max(3000),
});

const submitFeedbackSchema = z.object({
    vote: z.enum(['helpful', 'not_helpful']),
    // Client-generated (localStorage), not a user id -- see cmsContentFeedback model.
    voterToken: z.string().trim().min(8).max(64),
});

const moderateCommentSchema = z.object({
    status: z.enum(['approved', 'rejected']),
});

module.exports = { submitCommentSchema, submitFeedbackSchema, moderateCommentSchema };
