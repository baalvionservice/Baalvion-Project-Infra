const { z } = require('zod');

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createBrandSchema = z.object({
    brand_name: z.string().min(1).max(255),
    tagline: z.string().optional(),
    description: z.string().optional(),
    logo_url: z.string().url().optional(),
    website_url: z.string().url().optional(),
    industry: z.string().max(100).optional(),
    categories: z.array(z.string()).default([]),
    target_audience: z.string().optional(),
    budget_range_min: z.number().int().positive().optional(),
    budget_range_max: z.number().int().positive().optional(),
    currency: z.string().length(3).default('INR'),
    social_links: z.record(z.string()).default({}),
});

const updateBrandSchema = createBrandSchema.partial();

const createInfluencerSchema = z.object({
    display_name: z.string().min(1).max(255),
    bio: z.string().optional(),
    avatar_url: z.string().url().optional(),
    niche: z.array(z.string()).default([]),
    platforms: z.array(z.string()).default([]),
    follower_count_instagram: z.number().int().min(0).default(0),
    follower_count_youtube: z.number().int().min(0).default(0),
    follower_count_twitter: z.number().int().min(0).default(0),
    follower_count_tiktok: z.number().int().min(0).default(0),
    engagement_rate: z.number().min(0).max(100).default(0),
    avg_views_per_post: z.number().int().min(0).default(0),
    rate_per_post: z.number().int().positive().optional(),
    rate_per_story: z.number().int().positive().optional(),
    rate_per_video: z.number().int().positive().optional(),
    currency: z.string().length(3).default('INR'),
    location: z.string().max(255).optional(),
    languages: z.array(z.string()).default([]),
});

const updateInfluencerSchema = createInfluencerSchema.partial();

const createCampaignSchema = z.object({
    brand_id: z.coerce.number().int().positive(),
    title: z.string().min(1).max(500),
    description: z.string().optional(),
    objectives: z.array(z.string()).default([]),
    platforms: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    budget: z.number().int().positive(),
    currency: z.string().length(3).default('INR'),
    deliverable_type: z.array(z.string()).default([]),
    start_date: z.string().date().optional(),
    end_date: z.string().date().optional(),
    min_followers: z.number().int().min(0).default(0),
    min_engagement_rate: z.number().min(0).max(100).default(0),
    max_influencers: z.number().int().positive().default(10),
    requirements: z.string().optional(),
    application_deadline: z.string().date().optional(),
});

const updateCampaignSchema = createCampaignSchema.partial().omit({ brand_id: true });

const applyToCampaignSchema = z.object({
    pitch: z.string().optional(),
    proposed_rate: z.number().int().positive().optional(),
    currency: z.string().length(3).default('INR'),
    portfolio_urls: z.array(z.string().url()).default([]),
});

const reviewApplicationSchema = z.object({
    status: z.enum(['shortlisted', 'approved', 'rejected']),
    rejection_reason: z.string().optional(),
});

const createPartnershipSchema = z.object({
    campaign_id: z.coerce.number().int().positive().optional(),
    brand_id: z.coerce.number().int().positive(),
    influencer_id: z.coerce.number().int().positive(),
    title: z.string().min(1).max(500),
    description: z.string().optional(),
    agreed_rate: z.number().int().positive(),
    currency: z.string().length(3).default('INR'),
    start_date: z.string().date().optional(),
    end_date: z.string().date().optional(),
    deliverables: z.array(z.string()).default([]),
});

const updatePartnershipSchema = z.object({
    status: z.enum(['active', 'completed', 'cancelled', 'disputed']).optional(),
    payment_status: z.enum(['paid', 'partial', 'refunded']).optional(),
    completion_notes: z.string().optional(),
    paid_at: z.string().datetime().optional(),
});

const createDeliverableSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    platform: z.string().max(100).optional(),
    deliverable_type: z.string().max(100).optional(),
    due_date: z.string().date().optional(),
    content_url: z.string().url().optional(),
});

const updateDeliverableSchema = z.object({
    status: z.enum(['submitted', 'approved', 'rejected', 'revision_needed']).optional(),
    content_url: z.string().url().optional(),
    revision_notes: z.string().optional(),
    performance_metrics: z.record(z.any()).optional(),
    submitted_at: z.string().datetime().optional(),
    approved_at: z.string().datetime().optional(),
});

module.exports = {
    paginationSchema,
    createBrandSchema,
    updateBrandSchema,
    createInfluencerSchema,
    updateInfluencerSchema,
    createCampaignSchema,
    updateCampaignSchema,
    applyToCampaignSchema,
    reviewApplicationSchema,
    createPartnershipSchema,
    updatePartnershipSchema,
    createDeliverableSchema,
    updateDeliverableSchema,
};
