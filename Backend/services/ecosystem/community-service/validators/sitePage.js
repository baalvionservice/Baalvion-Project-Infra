'use strict';
const { z } = require('zod');

const text = (n) => z.string().trim().max(n).optional();
exports.pageSchema = z.object({
    slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9][a-z0-9/_-]*$/i, 'Use letters, numbers and slashes, like clubs/lottery'),
    title: text(160),
    seoTitle: text(160),
    seoDescription: text(320),
    intro: text(2000),
    body: text(20000),
    benefits: z.array(z.object({ title: z.string().trim().min(1).max(120), text: z.string().trim().max(600) })).max(12).optional(),
    faqs: z.array(z.object({ q: z.string().trim().min(1).max(200), a: z.string().trim().min(1).max(2000) })).max(20).optional(),
    image: z.string().trim().max(600).optional(),
    noindex: z.boolean().optional(),
});
