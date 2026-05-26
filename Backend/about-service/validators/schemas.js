const { z } = require('zod');

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createPageSchema = z.object({
    title: z.string().min(1).max(500),
    slug: z.string().min(1).max(500).regex(/^[a-z0-9-/]+$/, 'Slug must be lowercase alphanumeric with dashes'),
    content: z.string().optional(),
    meta_title: z.string().max(500).optional(),
    meta_description: z.string().optional(),
    page_type: z.enum(['general', 'landing', 'legal', 'blog']).default('general'),
    order_index: z.number().int().default(0),
    is_featured: z.boolean().default(false),
});

const updatePageSchema = createPageSchema.partial();

const createTeamMemberSchema = z.object({
    full_name: z.string().min(1).max(255),
    role_title: z.string().min(1).max(255),
    department: z.string().max(100).optional(),
    bio: z.string().optional(),
    avatar_url: z.string().url().optional(),
    email: z.string().email().optional(),
    linkedin_url: z.string().url().optional(),
    twitter_url: z.string().url().optional(),
    github_url: z.string().url().optional(),
    order_index: z.number().int().default(0),
    is_active: z.boolean().default(true),
    is_featured: z.boolean().default(false),
    joined_year: z.number().int().optional(),
});

const updateTeamMemberSchema = createTeamMemberSchema.partial();

const createNewsPostSchema = z.object({
    title: z.string().min(1).max(500),
    slug: z.string().min(1).max(500).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
    excerpt: z.string().optional(),
    content: z.string().optional(),
    cover_image_url: z.string().url().optional(),
    category: z.enum(['news', 'blog', 'press', 'announcement']).default('news'),
    tags: z.array(z.string()).default([]),
    is_featured: z.boolean().default(false),
    read_time_minutes: z.number().int().min(1).default(3),
});

const updateNewsPostSchema = createNewsPostSchema.partial();

const createFaqSchema = z.object({
    question: z.string().min(1),
    answer: z.string().min(1),
    category: z.string().max(100).default('general'),
    order_index: z.number().int().default(0),
    is_active: z.boolean().default(true),
    is_featured: z.boolean().default(false),
});

const updateFaqSchema = createFaqSchema.partial();

const createContactSchema = z.object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    phone: z.string().max(30).optional(),
    subject: z.string().max(500).optional(),
    message: z.string().min(1),
    inquiry_type: z.enum(['general', 'support', 'partnership', 'press', 'careers']).default('general'),
});

const updateContactSubmissionSchema = z.object({
    status: z.enum(['new', 'read', 'responded', 'closed']).optional(),
    response: z.string().optional(),
});

const newsListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    category: z.enum(['news', 'blog', 'press', 'announcement']).optional(),
    tag: z.string().optional(),
});

const faqQuerySchema = z.object({
    category: z.string().optional(),
});

module.exports = {
    paginationSchema,
    createPageSchema,
    updatePageSchema,
    createTeamMemberSchema,
    updateTeamMemberSchema,
    createNewsPostSchema,
    updateNewsPostSchema,
    createFaqSchema,
    updateFaqSchema,
    createContactSchema,
    updateContactSubmissionSchema,
    newsListQuerySchema,
    faqQuerySchema,
};
