'use strict';
const { z } = require('zod');

const authorSocialSchema = z.object({
    x: z.string().trim().max(200).optional(),
    linkedin: z.string().trim().max(200).optional(),
}).optional();

// The recipient's E-E-A-T author profile, captured on accept. The account itself
// (email/password/session) is handled entirely by auth-service before this call —
// this endpoint only needs the byline material for the CMS author record.
const acceptInvitationSchema = z.object({
    authorProfile: z.object({
        name: z.string().trim().min(2).max(200),
        title: z.string().trim().max(200).optional(),
        credentials: z.string().trim().max(300).optional(),
        bio: z.string().trim().max(2000).optional(),
        avatarUrl: z.string().trim().url().max(2000).optional(),
        expertise: z.array(z.string().trim().max(60)).max(8).default([]),
        social: authorSocialSchema,
    }),
});

module.exports = { acceptInvitationSchema };
