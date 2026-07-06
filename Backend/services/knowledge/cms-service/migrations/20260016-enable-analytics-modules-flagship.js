'use strict';

/**
 * Enable analytics modules for the flagship sites automatically on deploy.
 *
 * "Add a site = config, not code": the tracker + backend gate collection by
 * cms_websites.config.analytics.modules. New sites fall back to the registry
 * default (traffic/content/seo). This migration opts the three flagship sites
 * into the full module set so every dashboard tab is populated the moment the
 * platform ships — no manual console step.
 *
 * Idempotent + non-destructive: only sets `modules` where it is not already
 * present, so an admin's explicit per-site choice is never overwritten.
 */
const FLAGSHIP = ['imperialpedia', 'law-elite-network', 'amarise-maison-avenue'];
const MODULES = ['traffic', 'content', 'seo', 'ecommerce', 'marketing', 'users', 'security', 'infra', 'ai', 'cms'];

module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            UPDATE cms.cms_websites
            SET config = coalesce(config, '{}'::jsonb) || jsonb_build_object('analytics',
                coalesce(config->'analytics', '{}'::jsonb) || jsonb_build_object('modules', :modules::jsonb))
            WHERE slug IN (:slugs) AND (config->'analytics'->'modules') IS NULL`,
            { replacements: { modules: JSON.stringify(MODULES), slugs: FLAGSHIP } });
    },

    async down(queryInterface) {
        // Best-effort reversal: drop just the modules key for the flagship sites.
        await queryInterface.sequelize.query(`
            UPDATE cms.cms_websites
            SET config = jsonb_set(config, '{analytics}', (config->'analytics') - 'modules')
            WHERE slug IN (:slugs) AND config->'analytics' ? 'modules'`,
            { replacements: { slugs: FLAGSHIP } });
    },
};
