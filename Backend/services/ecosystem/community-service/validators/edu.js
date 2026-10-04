'use strict';
const { z } = require('zod');
const { httpUrl, optionalHttpUrl } = require('./httpUrl');

const httpsUrl = z.string().trim().url().max(600).refine((u) => /^https:\/\//i.test(u), 'Must be an https link');
const optionalUrl = optionalHttpUrl(600);

const teacherSchema = z.object({
    displayName: z.string().trim().min(2).max(120),
    subject: z.string().trim().min(2).max(120),
    bio: z.string().trim().min(20, 'Write at least a couple of sentences about yourself').max(400),
    longBio: z.string().trim().max(5000).optional(),
    regionId: z.string().trim().min(2).max(20),
    country: z.string().trim().min(2).max(80),
    priceNote: z.string().trim().max(120).optional(),
    avatarUrl: optionalUrl,
    tags: z.array(z.string().trim().min(1).max(40)).max(10).optional().default([]),
    skills: z.array(z.object({ name: z.string().trim().min(1).max(60), level: z.number().int().min(1).max(100) })).max(12).optional().default([]),
    education: z.array(z.object({ year: z.string().trim().max(20), degree: z.string().trim().max(120), institution: z.string().trim().max(160) })).max(10).optional().default([]),
});

const reviewTeacherSchema = z.object({
    status: z.enum(['active', 'rejected', 'suspended']),
    note: z.string().trim().max(500).optional(),
}).refine((d) => d.status === 'active' || !!d.note, { message: 'A reason is required', path: ['note'] });

const sessionSchema = z.object({
    title: z.string().trim().min(4).max(200),
    description: z.string().trim().max(4000).optional(),
    startAt: z.string().datetime({ offset: true }),
    durationMin: z.coerce.number().int().min(15).max(480),
    capacity: z.coerce.number().int().min(1).max(500).default(20),
    meetingUrl: httpsUrl,
});
const sessionUpdateSchema = z.object({ ...sessionSchema.shape, status: z.enum(['scheduled', 'cancelled']) }).partial()
    .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

const enrollSchema = z.object({ note: z.string().trim().max(1000).optional() });
const enrollmentDecisionSchema = z.object({ status: z.enum(['approved', 'declined']) });
const reviewSchema = z.object({ rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().max(1500).optional() });

module.exports = { teacherSchema, reviewTeacherSchema, sessionSchema, sessionUpdateSchema, enrollSchema, enrollmentDecisionSchema, reviewSchema };
