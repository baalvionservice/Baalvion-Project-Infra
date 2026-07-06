'use strict';
/**
 * Zod schemas for the analytics collect + reporting APIs. Validation runs at the
 * boundary (validate / validateQuery middleware); everything downstream trusts
 * the parsed shape.
 */
const { z } = require('zod');

// One beacon event — deliberately permissive on optional fields; the ingest
// service clamps lengths and enriches. `event` is the only required field.
const eventSchema = z.object({
    event: z.string().min(1).max(64),
    module: z.string().max(32).optional(),
    page: z.string().max(1024).optional(),
    url: z.string().max(2048).optional(),
    referrer: z.string().max(2048).optional(),
    sessionId: z.string().max(128).optional(),
    visitorId: z.string().max(128).optional(),
    userId: z.union([z.string(), z.number()]).optional(),
    occurredAt: z.string().datetime().optional(),
    lang: z.string().max(16).optional(),
    value: z.number().finite().optional(),
    currency: z.string().max(8).optional(),
    campaign: z.record(z.string(), z.any()).optional(),
    geo: z.record(z.string(), z.any()).optional(),
    device: z.record(z.string(), z.any()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    // v2 trust layers (client-supplied).
    consent: z.record(z.string(), z.any()).optional(),
    dedupeKey: z.string().max(200).optional(),
}).strip();

// Collect payload: one site key + a batch of events.
const collectSchema = z.object({
    site: z.string().min(1).max(200),          // website slug or UUID
    events: z.array(eventSchema).min(1).max(100),
}).strip();

// Reporting query params (coerced from strings).
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

const reportQuerySchema = z.object({
    from: dateStr.optional(),
    to: dateStr.optional(),
    module: z.string().max(32).optional(),
    metric: z.string().max(64).optional(),
    dimension: z.string().max(64).optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
    windowMin: z.coerce.number().int().min(1).max(60).optional(),
}).strip();

module.exports = { eventSchema, collectSchema, reportQuerySchema };
