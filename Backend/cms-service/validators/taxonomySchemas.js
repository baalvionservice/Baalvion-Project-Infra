'use strict';
const { z } = require('zod');

const categoryStatusEnum = z.enum(['active', 'inactive', 'archived']);

const createCategorySchema = z.object({
    parentId: z.string().uuid().optional().nullable(),
    name: z.string().min(1).max(200),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
    description: z.string().max(1000).optional().nullable(),
    seoMetadata: z.object({
        title: z.string().max(200).optional(),
        description: z.string().max(500).optional(),
    }).optional(),
    sortOrder: z.number().int().min(0).default(0),
});

const updateCategorySchema = z.object({
    parentId: z.string().uuid().optional().nullable(),
    name: z.string().min(1).max(200).optional(),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().max(1000).optional().nullable(),
    seoMetadata: z.object({
        title: z.string().max(200).optional(),
        description: z.string().max(500).optional(),
    }).optional(),
    status: categoryStatusEnum.optional(),
    sortOrder: z.number().int().min(0).optional(),
});

const reorderCategoriesSchema = z.object({
    order: z.array(z.object({
        id: z.string().uuid(),
        sortOrder: z.number().int().min(0),
    })).min(1),
});

const createTagSchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().max(500).optional().nullable(),
    color: z.string().max(20).optional().nullable(),
});

const updateTagSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    color: z.string().max(20).optional().nullable(),
});

module.exports = { createCategorySchema, updateCategorySchema, reorderCategoriesSchema, createTagSchema, updateTagSchema };
