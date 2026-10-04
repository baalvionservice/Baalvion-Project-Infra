'use strict';
const { z } = require('zod');

// Platform user ids are whatever the auth service puts in the token's `sub` (a number such as
// "134" today), so they are validated as opaque ids rather than UUIDs.
const userId = z.string().trim().regex(/^[A-Za-z0-9_-]{1,64}$/, 'Invalid user id');
// Relative site paths or https links only (these render as clickable links).
const safeLink = z.string().trim().max(300).refine((u) => /^\/(?!\/)/.test(u) || /^https:\/\//i.test(u), 'Use a site path like /kyc or an https link');

// Notification buttons stay on this site: relative paths only.
const sitePath = z.string().trim().max(200).refine((u) => /^\/(?!\/)/.test(u), 'Use a site path like /seller/listings');

const staffGrantSchema = z.object({
    tier: z.enum(['admin', 'moderator']),
    label: z.string().trim().min(2).max(160),
});

const ticketCreateSchema = z.object({
    category: z.enum(['order', 'account', 'booking', 'verification', 'payment', 'other']),
    subject: z.string().trim().min(5).max(200),
    message: z.string().trim().min(10).max(4000),
});
const messageSchema = z.object({ body: z.string().trim().min(1).max(4000) });
const ticketStaffUpdateSchema = z.object({
    status: z.enum(['open', 'pending', 'resolved', 'closed']).optional(),
    priority: z.enum(['low', 'normal', 'high']).optional(),
    assignedTo: z.union([z.literal('me'), z.null()]).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

const announcementFields = {
    title: z.string().trim().min(3).max(160),
    body: z.string().trim().min(3).max(1000),
    severity: z.enum(['info', 'warning', 'critical']),
    linkUrl: safeLink.optional().or(z.literal('').transform(() => undefined)),
    startsAt: z.string().datetime({ offset: true }).optional(),
    endsAt: z.string().datetime({ offset: true }).optional().nullable(),
};
const announcementCreateSchema = z.object(announcementFields);
const announcementUpdateSchema = z.object({ ...announcementFields, status: z.enum(['draft', 'published', 'archived']) }).partial()
    .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

const notifySchema = z.object({
    userId,
    type: z.enum(['seller', 'listing', 'order', 'support']),
    title: z.string().trim().min(3).max(120),
    body: z.string().trim().min(3).max(500),
    url: sitePath.optional(),
});

module.exports = {
    staffGrantSchema, ticketCreateSchema, messageSchema, ticketStaffUpdateSchema,
    announcementCreateSchema, announcementUpdateSchema, notifySchema,
};
