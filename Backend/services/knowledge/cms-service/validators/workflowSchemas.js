'use strict';
const { z } = require('zod');

const workflowActionEnum = z.enum([
    'submit_for_review',
    'approve',
    'request_changes',
    'submit_for_compliance',
    'compliance_approve',
    'compliance_reject',
    'publish',
    'schedule',
    'unpublish',
    'archive',
    'restore_to_draft',
]);

const transitionSchema = z.object({
    action: workflowActionEnum,
    notes: z.string().max(2000).optional().nullable(),
    scheduledAt: z.string().datetime().optional().nullable(),
    // Optional override for action: "publish" — defaults to the server's
    // current time when omitted (normal single-article publishing). Exists
    // so a bulk-publish script can stagger a batch's dates across a natural
    // range at publish time instead of every item landing on the same
    // instant (see scripts/lib/staggerPublishDates.cjs) — that clustering is
    // what got Imperialpedia flagged as looking bot-maintained. Ignored for
    // every other action.
    publishedAt: z.string().datetime().optional().nullable(),
});

const createRedirectSchema = z.object({
    fromSlug: z.string().min(1).max(500),
    toSlug: z.string().min(1).max(500),
    redirectType: z.enum(['301', '302']).default('301'),
});

const updateRedirectSchema = z.object({
    toSlug: z.string().min(1).max(500).optional(),
    redirectType: z.enum(['301', '302']).optional(),
    isActive: z.boolean().optional(),
});

module.exports = { transitionSchema, createRedirectSchema, updateRedirectSchema };
