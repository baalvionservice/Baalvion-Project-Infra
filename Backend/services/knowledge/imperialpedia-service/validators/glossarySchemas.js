const { z } = require('zod');

const difficultyEnum = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);
const statusEnum = z.enum(['draft', 'review', 'published', 'archived']);
const relationEnum = z.enum(['related', 'prerequisite', 'contrast', 'broader', 'narrower']);

const referenceSchema = z.object({
    title: z.string().min(1).max(300),
    // Only http/https — reject javascript:/data: and other schemes that would become stored XSS / SSRF.
    url: z.string().url().refine((u) => /^https?:\/\//i.test(u), 'Only http/https URLs are allowed').optional(),
    kind: z.enum(['web', 'book', 'journal', 'filing', 'dataset']).default('web'),
});

const exampleSchema = z.object({
    title: z.string().max(200).optional().nullable(),
    body: z.string().min(1),
    sort_order: z.coerce.number().int().min(0).default(0),
});

const relationInputSchema = z.object({
    related_id: z.string().uuid(),
    relation: relationEnum.default('related'),
});

const createTermSchema = z.object({
    term: z.string().min(1).max(200),
    slug: z.string().min(1).max(220).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
    short_def: z.string().min(1).max(320),
    full_def: z.string().min(1).max(50000),
    formula_latex: z.string().max(2000).optional().nullable(),
    pronunciation: z.string().max(120).optional().nullable(),
    aliases: z.array(z.string().max(200)).max(50).default([]),
    references: z.array(referenceSchema).default([]),
    difficulty: difficultyEnum.default('beginner'),
    category: z.string().max(120).optional().nullable(),
    cms_content_id: z.string().uuid().optional().nullable(),
    status: statusEnum.default('draft'),
    examples: z.array(exampleSchema).default([]),
    relations: z.array(relationInputSchema).default([]),
});

const updateTermSchema = createTermSchema.partial();

const listQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    difficulty: difficultyEnum.optional(),
    category: z.string().max(120).optional(),
    status: z.union([statusEnum, z.literal('all')]).optional(),
    search: z.string().max(200).optional(),
});

module.exports = {
    createTermSchema,
    updateTermSchema,
    listQuerySchema,
    exampleSchema,
    relationInputSchema,
};
