'use strict';
const { z } = require('zod');

const future = z.coerce.date().refine((d) => d.getTime() > Date.now(), 'Must be in the future');

exports.drawSchema = z.object({
    title: z.string().trim().min(3).max(160),
    prize: z.string().trim().min(3).max(300),
    entryPoints: z.number().int().min(0).max(100000),
    maxEntriesPerUser: z.number().int().min(1).max(100),
    winnersCount: z.number().int().min(1).max(50),
    closesAt: future,
});
exports.enterSchema = z.object({ count: z.number().int().min(1).max(20).default(1) });
exports.proposeSchema = z.object({
    djName: z.string().trim().min(2).max(120),
    genre: z.string().trim().max(60).optional(),
    clubName: z.string().trim().min(2).max(160),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().max(80).optional(),
    note: z.string().trim().max(600).optional(),
});
exports.pledgeSchema = z.object({ points: z.number().int().min(100).max(10000000) });
exports.approveSchema = z.object({
    targetPoints: z.number().int().min(100).max(100000000),
    closesAt: future.optional(),
});
exports.noteSchema = z.object({ note: z.string().trim().max(300).optional() });
