'use strict';
const { z } = require('zod');
const { httpUrl, optionalHttpUrl } = require('./httpUrl');

const taskFields = {
    title: z.string().trim().min(4).max(200),
    target: z.string().trim().min(2).max(300),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']),
    rewardLabel: z.string().trim().min(1).max(80),
    description: z.string().trim().min(10).max(6000),
    rules: z.string().trim().max(6000).optional(),
};
const createTaskSchema = z.object(taskFields);
const updateTaskSchema = z.object({ ...taskFields, status: z.enum(['draft', 'open', 'closed']) }).partial()
    .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

const reportSchema = z.object({
    taskId: z.string().uuid(),
    title: z.string().trim().min(5).max(200),
    description: z.string().trim().min(30, 'Describe the issue and how to reproduce it (30+ characters)').max(10000),
    evidenceLinks: z.array(httpUrl(600)).max(10).optional().default([]),
});

const payoutSchema = z.object({
    method: z.enum(['bank_transfer', 'upi', 'btc', 'usdt', 'other']),
    amount: z.coerce.number().positive().max(10_000_000),
    currency: z.string().trim().toUpperCase().regex(/^[A-Z]{2,8}$/, 'Use a currency or asset code such as USD, INR, BTC'),
    reference: z.string().trim().min(3, 'Add a transaction id or receipt reference').max(200),
});

const reviewReportSchema = z.object({
    status: z.enum(['triaged', 'accepted', 'rejected', 'duplicate', 'paid']),
    reviewerNote: z.string().trim().max(4000).optional(),
    rewardNote: z.string().trim().max(300).optional(),
    payout: payoutSchema.optional(),
}).refine((d) => !['rejected', 'duplicate'].includes(d.status) || !!d.reviewerNote, { message: 'Explain the decision to the reporter', path: ['reviewerNote'] })
    .refine((d) => d.status !== 'paid' || !!d.payout, { message: 'Record the payout: method, amount, currency and a transaction reference', path: ['payout'] })
    .refine((d) => d.status === 'paid' || !d.payout, { message: 'A payout can only be recorded when marking a report paid', path: ['payout'] });

const messageSchema = z.object({ content: z.string().trim().min(1).max(4000) });

module.exports = { createTaskSchema, updateTaskSchema, reportSchema, reviewReportSchema, messageSchema };
