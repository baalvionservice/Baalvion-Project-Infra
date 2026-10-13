'use strict';
const { z } = require('zod');

// Roles a person may ask for. cms_admin is deliberately absent: admin rights are granted by an
// administrator, never self-requested.
const REQUESTABLE_ROLES = ['cms_viewer', 'cms_contributor', 'cms_author', 'cms_editor', 'cms_publisher', 'cms_seo_manager'];
const roleEnum = z.enum(REQUESTABLE_ROLES);

const createAccessRequestSchema = z.object({
    websiteId: z.string().uuid(),
    role: roleEnum.default('cms_author'),
    note: z.string().trim().max(1000).optional(),
});

const approveAccessRequestSchema = z.object({
    role: roleEnum.optional(),
    decisionNote: z.string().trim().max(1000).optional(),
});

const denyAccessRequestSchema = z.object({
    decisionNote: z.string().trim().max(1000).optional(),
});

module.exports = { REQUESTABLE_ROLES, createAccessRequestSchema, approveAccessRequestSchema, denyAccessRequestSchema };
