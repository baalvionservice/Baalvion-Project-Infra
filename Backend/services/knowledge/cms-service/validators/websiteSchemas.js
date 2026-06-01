'use strict';
const { z } = require('zod');

const moduleEnum = z.enum(['blog', 'pages', 'products', 'jobs', 'events', 'portfolio', 'news', 'docs']);
const planEnum = z.enum(['basic', 'pro', 'enterprise']);
const statusEnum = z.enum(['active', 'inactive', 'maintenance', 'archived']);

const websiteConfigSchema = z.object({
    defaultLanguage: z.string().max(10).default('en'),
    timezone: z.string().max(50).default('UTC'),
    dateFormat: z.string().max(50).default('MMM d, yyyy'),
    postsPerPage: z.number().int().min(1).max(100).default(10),
    enableComments: z.boolean().default(false),
    enableAnalytics: z.boolean().default(true),
    seoDefaults: z.object({ titleSuffix: z.string().max(100).optional() }).optional(),
}).default({});

const brandingSchema = z.object({
    primaryColor: z.string().max(20).optional(),
    logoUrl: z.string().url().optional(),
    faviconUrl: z.string().url().optional(),
}).default({});

const createWebsiteSchema = z.object({
    name: z.string().min(1).max(200),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    domain: z.string().max(255).optional(),
    description: z.string().max(1000).optional(),
    plan: planEnum.default('basic'),
    modules: z.array(moduleEnum).min(1).default(['pages']),
    config: websiteConfigSchema,
    branding: brandingSchema,
});

const updateWebsiteSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    domain: z.string().max(255).optional().nullable(),
    description: z.string().max(1000).optional().nullable(),
    status: statusEnum.optional(),
    plan: planEnum.optional(),
    modules: z.array(moduleEnum).min(1).optional(),
    config: websiteConfigSchema.optional(),
    branding: brandingSchema.optional(),
});

const cmsRoleEnum = z.enum(['cms_admin', 'cms_editor', 'cms_author', 'cms_contributor', 'cms_reviewer', 'cms_publisher', 'cms_seo_manager', 'cms_viewer']);

const addMemberSchema = z
    .object({
        userId: z.number().int().positive().optional(),
        email: z.string().email().optional(),
        role: cmsRoleEnum.default('cms_author'),
    })
    .refine((d) => d.userId != null || (d.email != null && d.email !== ''), {
        message: 'Provide an email (or userId) of the person to invite',
        path: ['email'],
    });

const updateMemberRoleSchema = z.object({
    role: cmsRoleEnum,
});

module.exports = { createWebsiteSchema, updateWebsiteSchema, addMemberSchema, updateMemberRoleSchema };
