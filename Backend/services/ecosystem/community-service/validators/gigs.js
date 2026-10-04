'use strict';
const { z } = require('zod');
const { httpUrl, optionalHttpUrl } = require('./httpUrl');

const phone = z.string().trim().regex(/^[+0-9 ()-]{7,20}$/, 'Invalid phone number');
const handle = z.string().trim().transform((v) => v.replace(/^@/, ''))
    .pipe(z.string().regex(/^[A-Za-z0-9._]{1,30}$/, 'Invalid Instagram handle'));
const tags = (max) => z.array(z.string().trim().min(1).max(80)).max(max);
const optionalUrl = optionalHttpUrl(600);

const profileSchema = z.object({
    fullName: z.string().trim().min(2).max(120),
    gender: z.enum(['Female', 'Male', 'Non-binary']),
    age: z.coerce.number().int().min(21, 'Candidates must be 21 or older').max(70),
    height: z.string().trim().max(20).optional(),
    instagram: handle,
    zone: z.string().trim().min(2).max(80),
    roles: tags(20).min(1, 'Pick at least one role'),
    services: tags(20).optional().default([]),
    perks: tags(20).optional().default([]),
    portraitUrl: optionalUrl,
    fullLookUrl: optionalUrl,
    whatsapp: phone,
});

const employerSchema = z.object({
    businessName: z.string().trim().min(2).max(160),
    contactName: z.string().trim().min(2).max(120),
    phone,
    website: optionalUrl,
    instagram: handle.optional().or(z.literal('').transform(() => undefined)),
    city: z.string().trim().min(2).max(80),
});

const reviewSchema = z.object({
    status: z.enum(['verified', 'rejected']),
    note: z.string().trim().max(500).optional(),
}).refine((d) => d.status !== 'rejected' || !!d.note, { message: 'A reason is required when rejecting', path: ['note'] });

const gigSchema = z.object({
    title: z.string().trim().min(5).max(240),
    payAmount: z.coerce.number().int().min(0).max(1000000),
    payCycle: z.string().trim().min(2).max(40),
    venueAddress: z.string().trim().min(5).max(300),
    dressCode: z.string().trim().max(80).optional(),
    rolesNeeded: tags(15).min(1, 'Pick at least one role'),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

const gigStatusSchema = z.object({ status: z.enum(['active', 'filled', 'closed']) });
const adminGigStatusSchema = z.object({ status: z.enum(['active', 'filled', 'closed', 'removed']) });
const applySchema = z.object({ note: z.string().trim().max(1000).optional() });
const gigApplicationStatusSchema = z.object({ status: z.enum(['pending', 'shortlisted', 'hired', 'rejected']) });

module.exports = {
    profileSchema, employerSchema, reviewSchema, gigSchema, gigStatusSchema, adminGigStatusSchema,
    applySchema, gigApplicationStatusSchema,
};
