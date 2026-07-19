'use strict';
const { z } = require('zod');
exports.createCategorySchema = z.object({ parentId: z.string().uuid().optional().nullable(), name: z.string().min(1).max(200), slug: z.string().max(200).regex(/^[a-z0-9-]+$/).optional(), description: z.string().max(2000).optional().nullable(), imageUrl: z.string().url().optional().nullable(), seoMetadata: z.record(z.unknown()).default({}), sortOrder: z.number().int().min(0).default(0) });
exports.updateCategorySchema = z.object({ parentId: z.string().uuid().optional().nullable(), name: z.string().min(1).max(200).optional(), slug: z.string().max(200).regex(/^[a-z0-9-]+$/).optional(), description: z.string().max(2000).optional().nullable(), imageUrl: z.string().url().optional().nullable(), seoMetadata: z.record(z.unknown()).optional(), isActive: z.boolean().optional(), sortOrder: z.number().int().min(0).optional() });
exports.reorderCategoriesSchema = z.object({ order: z.array(z.object({ id: z.string().uuid(), sortOrder: z.number().int().min(0) })).min(1) });

// Admin (cross-store) variants: the store-scoped routes take storeId from the URL (:storeId); the
// admin routes aren't nested under a store, so storeId travels in the body/query instead.
exports.adminCreateCategorySchema = exports.createCategorySchema.extend({ storeId: z.string().uuid() });
exports.adminUpdateCategorySchema = exports.updateCategorySchema.extend({ storeId: z.string().uuid() });
exports.adminReorderCategoriesSchema = exports.reorderCategoriesSchema.extend({ storeId: z.string().uuid() });
exports.adminListCategoriesQuerySchema = z.object({
    storeId: z.string().uuid().optional(),
    search: z.string().max(200).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});
exports.adminDeleteCategoryQuerySchema = z.object({ storeId: z.string().uuid() });
