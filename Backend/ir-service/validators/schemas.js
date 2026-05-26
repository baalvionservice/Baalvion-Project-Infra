const { z } = require('zod');

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createReportSchema = z.object({
    title: z.string().min(1).max(500),
    report_type: z.enum(['quarterly', 'annual', 'interim', 'special']),
    period_quarter: z.number().int().min(1).max(4).nullable().optional(),
    period_year: z.number().int().min(1900).max(2100),
    summary: z.string().optional(),
    highlights: z.array(z.any()).default([]),
    revenue: z.number().optional(),
    net_income: z.number().optional(),
    eps: z.number().optional(),
    revenue_growth_pct: z.number().optional(),
    file_url: z.string().url().optional(),
});

const updateReportSchema = createReportSchema.partial();

const createFilingSchema = z.object({
    title: z.string().min(1).max(500),
    filing_type: z.enum(['10-K', '10-Q', '8-K', 'proxy', 'prospectus', 'other']),
    regulator: z.string().max(100).optional(),
    filing_date: z.string(),
    period_of_report: z.string().optional(),
    status: z.enum(['draft', 'filed', 'amended', 'withdrawn']).default('filed'),
    file_url: z.string().url().optional(),
    external_url: z.string().url().optional(),
    description: z.string().optional(),
});

const updateFilingSchema = createFilingSchema.partial();

const createDocumentSchema = z.object({
    title: z.string().min(1).max(500),
    document_type: z.enum(['presentation', 'factsheet', 'prospectus', 'annual_report', 'other']),
    description: z.string().optional(),
    file_url: z.string().min(1),
    file_size_bytes: z.number().int().optional(),
    mime_type: z.string().max(100).optional(),
    language: z.string().max(10).default('en'),
    year: z.number().int().optional(),
    is_public: z.boolean().default(true),
    published_at: z.string().datetime().optional(),
});

const updateDocumentSchema = createDocumentSchema.partial();

const createEarningsSchema = z.object({
    title: z.string().min(1).max(500),
    quarter: z.number().int().min(1).max(4).optional(),
    year: z.number().int().min(1900).max(2100),
    scheduled_at: z.string().datetime().optional(),
    status: z.enum(['scheduled', 'live', 'completed', 'cancelled']).default('scheduled'),
    dial_in_info: z.string().optional(),
    webcast_url: z.string().url().optional(),
    replay_url: z.string().url().optional(),
    transcript: z.string().optional(),
    summary: z.string().optional(),
    highlights: z.array(z.any()).default([]),
    participants: z.array(z.any()).default([]),
});

const updateEarningsSchema = createEarningsSchema.partial();

const createShareholderSchema = z.object({
    name: z.string().min(1).max(500),
    type: z.enum(['institutional', 'retail', 'insider', 'mutual_fund']).default('institutional'),
    shares_held: z.number().int().positive(),
    ownership_pct: z.number().min(0).max(100),
    as_of_date: z.string(),
    country: z.string().max(100).optional(),
    change_from_prev: z.number().int().default(0),
    change_pct: z.number().default(0),
});

const updateShareholderSchema = createShareholderSchema.partial();

const createContactSchema = z.object({
    name: z.string().min(1).max(255),
    title: z.string().max(255).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(30).optional(),
    department: z.string().max(100).optional(),
    is_primary: z.boolean().default(false),
    is_active: z.boolean().default(true),
});

const updateContactSchema = createContactSchema.partial();

module.exports = {
    paginationSchema,
    createReportSchema,
    updateReportSchema,
    createFilingSchema,
    updateFilingSchema,
    createDocumentSchema,
    updateDocumentSchema,
    createEarningsSchema,
    updateEarningsSchema,
    createShareholderSchema,
    updateShareholderSchema,
    createContactSchema,
    updateContactSchema,
};
