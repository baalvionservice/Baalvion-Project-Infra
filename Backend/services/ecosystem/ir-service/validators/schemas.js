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

// Public inbound contact form. `website` is a honeypot — humans never see/fill it; if present
// the controller silently drops the submission. Inquiry types mirror the IR contact UI.
const createContactMessageSchema = z.object({
    name: z.string().min(2).max(255),
    email: z.string().email().max(255),
    company: z.string().max(300).optional(),
    inquiry_type: z.enum([
        'investor', 'partnership', 'diligence', 'financial', 'governance', 'media', 'career', 'other',
    ]).optional(),
    subject: z.string().max(300).optional(),
    message: z.string().min(10).max(5000),
    website: z.string().max(0).optional(), // honeypot: must be empty
});

const contactMessageQuerySchema = paginationSchema.extend({
    status: z.enum(['new', 'read', 'archived']).optional(),
});

const updateContactMessageSchema = z.object({
    status: z.enum(['new', 'read', 'archived']),
});

const createEventSchema = z.object({
    title: z.string().min(1).max(500),
    event_type: z.enum(['earnings_call', 'agm', 'investor_day', 'roadshow', 'conference', 'webinar']).default('investor_day'),
    scheduled_at: z.string(),
    end_at: z.string().optional(),
    location: z.string().max(300).optional(),
    webcast_url: z.string().url().optional(),
    description: z.string().optional(),
    registration_url: z.string().url().optional(),
    status: z.enum(['upcoming', 'live', 'completed', 'cancelled']).default('upcoming'),
});

const updateEventSchema = createEventSchema.partial();

const marketSnapshotSchema = z.object({
    symbol: z.string().max(20).optional(),
    exchange: z.string().max(50).optional(),
    price: z.number().optional(),
    currency: z.string().max(10).optional(),
    change_pct: z.number().optional(),
    market_cap: z.number().optional(),
    volume: z.number().int().optional(),
    week52_high: z.number().optional(),
    week52_low: z.number().optional(),
    pe_ratio: z.number().optional(),
    dividend_yield: z.number().optional(),
    dividend_per_share: z.number().optional(),
    as_of: z.string().optional(),
}).partial();

const createApplicationSchema = z.object({
    full_name: z.string().min(2).max(200),
    email: z.string().email().max(255),
    entity: z.string().max(300).optional(),
    investor_type: z.string().max(60).optional(),
    accredited: z.boolean().default(false),
    commitment: z.coerce.number().min(0).max(1e15).optional(),
    message: z.string().max(5000).optional(),
});

const reviewApplicationSchema = z.object({
    action: z.enum(['approve', 'reject']),
    review_note: z.string().max(5000).optional(),
});

const applicationQuerySchema = paginationSchema.extend({
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

// ---------------------------------------------------------------------------
// Business onboarding (company creation, KYC, IEC/GST/VAT, documents, approval)
// ---------------------------------------------------------------------------

const ENTITY_TYPES = [
    'private_limited', 'public_limited', 'llp', 'partnership',
    'sole_proprietorship', 'trust', 'society', 'branch_office', 'other',
];
const ID_TYPES = ['passport', 'national_id', 'driver_license', 'aadhaar', 'pan', 'other'];
const DOC_TYPES = [
    'certificate_of_incorporation', 'gst_certificate', 'iec_certificate', 'vat_certificate',
    'pan_card', 'address_proof', 'board_resolution', 'authorized_signatory_id',
    'bank_statement', 'other',
];
const APPLICATION_STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'rejected'];
const KYC_STATUSES = ['not_started', 'pending', 'verified', 'rejected'];

// Treat blank strings from form inputs as "absent" so .optional() applies cleanly.
const emptyToUndef = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const optStr = (max) => z.preprocess(emptyToUndef, z.string().trim().max(max).optional());
const optEnum = (values) => z.preprocess(emptyToUndef, z.enum(values).optional());
// Optional government identifier: trims, upper-cases, drops blanks, then format-checks.
const optCode = (re, msg) => z.preprocess(
    (v) => {
        if (typeof v !== 'string') return v;
        const t = v.trim().toUpperCase();
        return t === '' ? undefined : t;
    },
    z.string().regex(re, msg).optional(),
);
const optEmail = z.preprocess(emptyToUndef, z.string().trim().email().max(255).optional());

const beneficialOwnerSchema = z.object({
    name: z.string().trim().min(2).max(200),
    ownership_pct: z.coerce.number().min(0).max(100).optional(),
    nationality: optStr(100),
    id_type: optEnum(ID_TYPES),
    id_number: optStr(120),
});

const businessDocumentInputSchema = z.object({
    document_type: z.enum(DOC_TYPES),
    title: z.string().trim().min(1).max(300),
    // Either an https URL or an inline data: URI captured client-side (size-capped there).
    file_url: z.string().trim().min(1).max(5_000_000),
    file_name: optStr(300),
    file_size_bytes: z.coerce.number().int().nonnegative().optional(),
    mime_type: optStr(120),
});

const createBusinessApplicationSchema = z.object({
    // Company identity
    legal_name: z.string().trim().min(2).max(300),
    trade_name: optStr(300),
    entity_type: z.enum(ENTITY_TYPES),
    incorporation_country: z.string().trim().min(2).max(100),
    incorporation_date: optStr(10), // YYYY-MM-DD
    registration_number: optStr(120),
    // Primary contact
    contact_name: z.string().trim().min(2).max(200),
    contact_email: z.string().trim().email().max(255),
    contact_phone: optStr(40),
    website: z.preprocess(emptyToUndef, z.string().trim().url().max(255).optional()),
    // Registered address
    address_line1: optStr(255),
    address_line2: optStr(255),
    city: optStr(120),
    state_region: optStr(120),
    postal_code: optStr(40),
    country: optStr(100),
    // Trade & tax registrations
    iec_code: optCode(/^[0-9A-Z]{10}$/, 'IEC must be 10 characters'),
    gstin: optCode(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, 'Invalid GSTIN format'),
    vat_number: optStr(40),
    pan: optCode(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format'),
    // KYC
    authorized_signatory_name: optStr(200),
    authorized_signatory_email: optEmail,
    authorized_signatory_id_type: optEnum(ID_TYPES),
    authorized_signatory_id_number: optStr(120),
    beneficial_owners: z.array(beneficialOwnerSchema).max(20).default([]),
    // Documents (submitted together with the application)
    documents: z.array(businessDocumentInputSchema).max(15).default([]),
}).refine((d) => Boolean(d.iec_code || d.gstin || d.vat_number), {
    message: 'At least one trade/tax registration (IEC, GSTIN or VAT) is required',
    path: ['iec_code'],
});

const reviewBusinessApplicationSchema = z.object({
    action: z.enum(['approve', 'reject', 'start_review']),
    review_note: optStr(5000),
    kyc_status: z.enum(KYC_STATUSES).optional(),
});

const businessApplicationQuerySchema = paginationSchema.extend({
    status: z.enum(APPLICATION_STATUSES).optional(),
    kyc_status: z.enum(KYC_STATUSES).optional(),
});

const reviewBusinessDocumentSchema = z.object({
    action: z.enum(['verify', 'reject']),
    review_note: optStr(5000),
});

module.exports = {
    paginationSchema,
    createApplicationSchema,
    reviewApplicationSchema,
    applicationQuerySchema,
    // Business onboarding
    createBusinessApplicationSchema,
    reviewBusinessApplicationSchema,
    businessApplicationQuerySchema,
    businessDocumentInputSchema,
    reviewBusinessDocumentSchema,
    BUSINESS_ENUMS: { ENTITY_TYPES, ID_TYPES, DOC_TYPES, APPLICATION_STATUSES, KYC_STATUSES },
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
    createContactMessageSchema,
    contactMessageQuerySchema,
    updateContactMessageSchema,
    createEventSchema,
    updateEventSchema,
    marketSnapshotSchema,
};
