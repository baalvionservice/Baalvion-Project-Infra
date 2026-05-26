const { z } = require('zod');

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createArticleSchema = z.object({
    title: z.string().min(1).max(500),
    slug: z.string().min(1).max(500).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
    summary: z.string().max(2000).optional(),
    content: z.string().optional(),
    category: z.string().max(100).optional(),
    tags: z.array(z.string()).default([]),
    cover_image_url: z.string().url().optional(),
    read_time_minutes: z.number().int().min(1).default(5),
    is_premium: z.boolean().default(false),
});

const updateArticleSchema = createArticleSchema.partial();

const createAssetSchema = z.object({
    symbol: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
    asset_type: z.enum(['stock', 'crypto', 'etf', 'commodity', 'forex', 'index']).default('stock'),
    exchange: z.string().max(100).optional(),
    sector: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    description: z.string().optional(),
    logo_url: z.string().url().optional(),
    website_url: z.string().url().optional(),
    metadata: z.record(z.any()).default({}),
});

const createSummarySchema = z.object({
    asset_id: z.coerce.number().int().positive(),
    summary_type: z.enum(['ai', 'analyst', 'community']).default('ai'),
    content: z.string().min(1),
    bull_points: z.array(z.string()).default([]),
    bear_points: z.array(z.string()).default([]),
    rating: z.enum(['buy', 'hold', 'sell', 'strong_buy', 'strong_sell']).optional(),
    target_price: z.number().positive().optional(),
    confidence_score: z.number().min(0).max(1).optional(),
    valid_until: z.string().date().optional(),
});

const updateSummarySchema = createSummarySchema.partial().omit({ asset_id: true });

const createPostSchema = z.object({
    title: z.string().max(500).optional(),
    content: z.string().min(1),
    asset_id: z.coerce.number().int().positive().optional(),
    post_type: z.enum(['discussion', 'analysis', 'news', 'question', 'debate']).default('discussion'),
    tags: z.array(z.string()).default([]),
    is_premium: z.boolean().default(false),
});

const updatePostSchema = createPostSchema.partial();

const createCommentSchema = z.object({
    content: z.string().min(1),
    parent_id: z.coerce.number().int().positive().optional(),
});

const voteSchema = z.object({
    vote_type: z.enum(['up', 'down']),
});

const creatorProfileSchema = z.object({
    display_name: z.string().min(1).max(255),
    bio: z.string().max(2000).optional(),
    avatar_url: z.string().url().optional(),
    expertise: z.array(z.string()).default([]),
});

const compoundInterestSchema = z.object({
    principal: z.number().positive(),
    rate: z.number().positive(),
    years: z.number().positive(),
    compounding_frequency: z.number().int().positive().default(12),
});

const retirementSchema = z.object({
    current_age: z.number().int().min(18).max(80),
    retirement_age: z.number().int().min(30).max(90),
    monthly_savings: z.number().positive(),
    current_savings: z.number().min(0).default(0),
    expected_return_rate: z.number().positive(),
    inflation_rate: z.number().min(0).default(6),
});

const loanSchema = z.object({
    principal: z.number().positive(),
    annual_rate: z.number().positive(),
    tenure_months: z.number().int().positive(),
});

module.exports = {
    paginationSchema,
    createArticleSchema,
    updateArticleSchema,
    createAssetSchema,
    createSummarySchema,
    updateSummarySchema,
    createPostSchema,
    updatePostSchema,
    createCommentSchema,
    voteSchema,
    creatorProfileSchema,
    compoundInterestSchema,
    retirementSchema,
    loanSchema,
};
