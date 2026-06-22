'use strict';
const { z } = require('zod');

const categoryEnum = z.enum(['api', 'payment', 'sms', 'ai', 'webhook', 'oauth', 'other']);

// Upsert an integration for a website. `secrets` are plaintext on the way in
// (encrypted server-side); omit a secret field or send '' to keep the stored value.
const upsertIntegrationSchema = z.object({
    category: categoryEnum.default('other'),
    label: z.string().max(120).optional(),
    config: z.record(z.unknown()).default({}),
    secrets: z.record(z.string()).optional(),
    enabled: z.boolean().optional(),
});

module.exports = { upsertIntegrationSchema };
