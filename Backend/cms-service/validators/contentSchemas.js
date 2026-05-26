'use strict';
const { z } = require('zod');

const contentTypeEnum = z.enum(['page', 'post', 'article', 'product', 'event', 'job_listing', 'portfolio_item', 'news', 'doc']);
const visibilityEnum = z.enum(['public', 'private', 'password']);

const contentBlockSchema = z.object({
    id: z.string(),
    type: z.enum(['paragraph', 'heading', 'image', 'video', 'gallery', 'code', 'quote', 'divider', 'html', 'callout', 'table', 'embed', 'button', 'columns']),
    order: z.number().int().min(0),
    content: z.record(z.unknown()),
});

const seoMetadataSchema = z.object({
    title: z.string().max(200).optional(),
    description: z.string().max(500).optional(),
    keywords: z.array(z.string()).optional(),
    ogTitle: z.string().max(200).optional(),
    ogDescription: z.string().max(500).optional(),
    ogImage: z.string().url().optional(),
    canonicalUrl: z.string().url().optional(),
    noIndex: z.boolean().optional(),
    noFollow: z.boolean().optional(),
}).default({});

const createContentSchema = z.object({
    categoryId: z.string().uuid().optional().nullable(),
    title: z.string().min(1).max(500),
    slug: z.string().min(1).max(500).regex(/^[a-z0-9-]+$/).optional(),
    excerpt: z.string().max(2000).optional().nullable(),
    featuredImage: z.string().url().optional().nullable(),
    contentType: contentTypeEnum.default('post'),
    contentBlocks: z.array(contentBlockSchema).default([]),
    tagIds: z.array(z.string().uuid()).default([]),
    seoMetadata: seoMetadataSchema,
    visibility: visibilityEnum.default('public'),
    scheduledAt: z.string().datetime().optional().nullable(),
    customFields: z.record(z.unknown()).default({}),
});

const updateContentSchema = z.object({
    categoryId: z.string().uuid().optional().nullable(),
    title: z.string().min(1).max(500).optional(),
    slug: z.string().min(1).max(500).regex(/^[a-z0-9-]+$/).optional(),
    excerpt: z.string().max(2000).optional().nullable(),
    featuredImage: z.string().url().optional().nullable(),
    contentBlocks: z.array(contentBlockSchema).optional(),
    tagIds: z.array(z.string().uuid()).optional(),
    seoMetadata: seoMetadataSchema.optional(),
    visibility: visibilityEnum.optional(),
    scheduledAt: z.string().datetime().optional().nullable(),
    customFields: z.record(z.unknown()).optional(),
});

const autosaveContentSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    contentBlocks: z.array(contentBlockSchema).optional(),
    excerpt: z.string().max(2000).optional().nullable(),
    seoMetadata: seoMetadataSchema.optional(),
});

const bulkUpdateSchema = z.object({
    ids: z.array(z.string().uuid()).min(1).max(100),
    action: z.enum(['publish', 'archive', 'delete', 'assign_category']),
    categoryId: z.string().uuid().optional(),
});

module.exports = { createContentSchema, updateContentSchema, autosaveContentSchema, bulkUpdateSchema };
