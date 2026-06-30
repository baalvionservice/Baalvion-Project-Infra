'use strict';
const { z } = require('zod');

// Per-author-profile SEO for the /author/{slug} page.
const authorSeoSchema = z.object({
    title: z.string().max(200).optional(),
    description: z.string().max(500).optional(),
    keywords: z.array(z.string().max(80)).max(30).optional(),
    ogImage: z.string().url().optional(),
    noIndex: z.boolean().optional(),
}).optional();

const socialSchema = z.object({
    x: z.string().url().optional(),
    linkedin: z.string().url().optional(),
}).optional();

const createAuthorSchema = z.object({
    name: z.string().min(1).max(200),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
    title: z.string().max(200).optional().nullable(),
    credentials: z.string().max(300).optional().nullable(),
    bio: z.string().max(5000).optional().nullable(),
    avatarUrl: z.string().url().max(2000).optional().nullable(),
    expertise: z.array(z.string().max(120)).max(20).optional(),
    social: socialSchema,
    seoMetadata: authorSeoSchema,
    sortOrder: z.number().int().min(0).default(0),
});

const updateAuthorSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
    title: z.string().max(200).optional().nullable(),
    credentials: z.string().max(300).optional().nullable(),
    bio: z.string().max(5000).optional().nullable(),
    avatarUrl: z.string().url().max(2000).optional().nullable(),
    expertise: z.array(z.string().max(120)).max(20).optional(),
    social: socialSchema,
    seoMetadata: authorSeoSchema,
    status: z.enum(['active', 'inactive']).optional(),
    sortOrder: z.number().int().min(0).optional(),
});

module.exports = { createAuthorSchema, updateAuthorSchema };
