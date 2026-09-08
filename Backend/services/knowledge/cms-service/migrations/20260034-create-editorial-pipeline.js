'use strict';

// Editorial pipeline: wire signal -> scored candidate -> multi-source brief ->
// drafted article -> machine gates -> human vetting -> cms_contents.
//
// Five additive tables. Nothing here writes to cms_contents; publishService only
// creates content once a human has approved a draft in the vetting desk, so the
// existing workflow/approval/revalidation path stays the single publish route.
//
// Status columns are STRING(24) rather than PG enums, matching the recent
// migrations in this service (20260031/32/33) -- a new pipeline state should not
// need an ALTER TYPE in production to ship.
module.exports = {
    async up(queryInterface, Sequelize) {
        // ── Charter: the per-site editorial identity every later stage reads ──
        // This is what makes output "ours" rather than a rewrite: niche, reader,
        // house angle, coverage boundaries, and the hard integrity thresholds the
        // gates enforce. One row per website.
        await queryInterface.createTable('cms_editorial_charters', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            website_id: {
                type: Sequelize.UUID, allowNull: false, unique: true,
                references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE',
            },
            niche: { type: Sequelize.TEXT, allowNull: false },
            audience: { type: Sequelize.TEXT, allowNull: false },
            // The house perspective -- the single most important field here.
            house_angle: { type: Sequelize.TEXT, allowNull: false },
            voice: { type: Sequelize.TEXT, allowNull: true },
            // ["Monetary policy", "Retail investing", ...]
            covers: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            // Hard exclusions. The intake scorer rejects on these before anything is drafted.
            excludes: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            // ["Never give individual investment advice", ...]
            stance_rules: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            // Phrases/claims that must never appear. Checked verbatim by the gate.
            banned_claims: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            // Section skeleton, e.g. ["What happened","Why it matters","Our read"].
            required_sections: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },

            // ── Integrity thresholds (enforced in service/editorial/gateService.js) ──
            // A story below min_sources never becomes a brief: a single-source
            // rewrite is the exact failure mode this pipeline exists to prevent.
            min_sources: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 2 },
            // Max longest-common-shingle overlap with ANY single source, percent.
            max_similarity_pct: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 18 },
            // Min share of factual sentences carrying a citation.
            min_citation_coverage_pct: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 70 },
            require_quote_verification: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            // Present and always false: there is no auto-publish path. Kept as a
            // column so "why did this not publish itself" is answerable from data.
            auto_publish: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },

            status: { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'active' },
            created_by: { type: Sequelize.BIGINT, allowNull: true },
            updated_by: { type: Sequelize.BIGINT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        // ── Signals: one wire item, scored against one site's charter ─────────
        // The same wire article can be a signal for both sites with different
        // scores, hence (website_id, url) rather than url alone.
        await queryInterface.createTable('cms_story_signals', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            website_id: {
                type: Sequelize.UUID, allowNull: false,
                references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE',
            },
            // news-service articles.id. No FK -- that table lives in another
            // service's schema (news_intelligence), same pattern cms_websites
            // uses for org_id.
            wire_article_id: { type: Sequelize.UUID, allowNull: true },
            // Normalized story fingerprint; signals sharing one are the same event.
            cluster_key: { type: Sequelize.TEXT, allowNull: true },
            title: { type: Sequelize.TEXT, allowNull: false },
            url: { type: Sequelize.TEXT, allowNull: false },
            source_name: { type: Sequelize.TEXT, allowNull: true },
            published_at: { type: Sequelize.DATE, allowNull: true },
            wire_category: { type: Sequelize.STRING(40), allowNull: true },
            country: { type: Sequelize.STRING(4), allowNull: true },
            summary: { type: Sequelize.TEXT, allowNull: true },
            // 0-100 fit against the charter. Deterministic, explained in score_reasons.
            relevance_score: { type: Sequelize.INTEGER, allowNull: true },
            score_reasons: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            // pending | accepted | rejected | clustered
            decision: { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'pending' },
            rejection_reason: { type: Sequelize.TEXT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addConstraint({ tableName: 'cms_story_signals', schema: 'cms' }, {
            fields: ['website_id', 'url'], type: 'unique', name: 'cms_story_signals_website_url_unique',
        });
        await queryInterface.addIndex('cms.cms_story_signals', ['website_id', 'decision']);
        await queryInterface.addIndex('cms.cms_story_signals', ['cluster_key']);
        await queryInterface.addIndex('cms.cms_story_signals', ['published_at']);

        // ── Briefs: the verified, multi-source account of one event ───────────
        // Facts carry their own source URLs so the vetting desk can show a
        // reviewer where each claim came from, claim by claim.
        await queryInterface.createTable('cms_story_briefs', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            website_id: {
                type: Sequelize.UUID, allowNull: false,
                references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE',
            },
            cluster_key: { type: Sequelize.TEXT, allowNull: false },
            working_title: { type: Sequelize.TEXT, allowNull: false },
            // [{ name, url, title, publishedAt }] -- every outlet backing this story.
            sources: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            // [{ claim, sourceUrls: [], corroborations }] -- corroborations is how
            // many distinct outlets carry the claim.
            facts: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            // Claims the sources disagree on. Surfaced rather than silently picked.
            disputed: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            // [{ text, speaker, sourceUrl }] -- verified verbatim against source text.
            quotes: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            // This site's specific take on THIS story, derived from the charter.
            angle: { type: Sequelize.TEXT, allowNull: true },
            why_it_matters: { type: Sequelize.TEXT, allowNull: true },
            entities: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            // pending | ready | insufficient_sources | failed
            status: { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'pending' },
            failure_reason: { type: Sequelize.TEXT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addConstraint({ tableName: 'cms_story_briefs', schema: 'cms' }, {
            fields: ['website_id', 'cluster_key'], type: 'unique', name: 'cms_story_briefs_website_cluster_unique',
        });
        await queryInterface.addIndex('cms.cms_story_briefs', ['website_id', 'status']);

        // ── Drafts: the written article, its citations, and its gate results ──
        await queryInterface.createTable('cms_article_drafts', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            website_id: {
                type: Sequelize.UUID, allowNull: false,
                references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE',
            },
            brief_id: {
                type: Sequelize.UUID, allowNull: false,
                references: { model: { tableName: 'cms_story_briefs', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE',
            },
            title: { type: Sequelize.TEXT, allowNull: false },
            dek: { type: Sequelize.TEXT, allowNull: true },
            slug: { type: Sequelize.STRING(500), allowNull: true },
            // Same block shape cms_contents.content_blocks uses, so approval is a copy.
            content_blocks: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            // [{ blockId, claim, sourceUrl }] -- drives the reviewer's claim checklist.
            citations: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            seo_metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
            // cms_authors.slug of the real contributor who carries the byline, and
            // of the person who reviews it. Never invented -- resolved from the
            // site's existing roster.
            author_slug: { type: Sequelize.STRING(200), allowNull: true },
            reviewer_slug: { type: Sequelize.STRING(200), allowNull: true },
            category_hint: { type: Sequelize.TEXT, allowNull: true },

            // pending | passed | failed
            gate_status: { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'pending' },
            // [{ gate, passed, detail }] for every check, pass or fail.
            gate_results: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            similarity_pct: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
            citation_coverage_pct: { type: Sequelize.DECIMAL(5, 2), allowNull: true },

            // generating | awaiting_review | changes_requested | approved | published | discarded | failed
            status: { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'generating' },
            review_notes: { type: Sequelize.TEXT, allowNull: true },
            // The staff user who actually clicked approve. Separate from author_slug
            // so "who signed it" and "who checked it" are both answerable.
            reviewed_by: { type: Sequelize.BIGINT, allowNull: true },
            reviewed_at: { type: Sequelize.DATE, allowNull: true },
            // Set once approval has created the real CMS row.
            cms_content_id: { type: Sequelize.UUID, allowNull: true },
            model_used: { type: Sequelize.TEXT, allowNull: true },
            failure_reason: { type: Sequelize.TEXT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addIndex('cms.cms_article_drafts', ['website_id', 'status']);
        await queryInterface.addIndex('cms.cms_article_drafts', ['brief_id']);
        await queryInterface.addIndex('cms.cms_article_drafts', ['cms_content_id']);

        // ── Art: where every image came from and what it is allowed to claim ──
        // depicts_named_subject can only be true for a licensed real photo. A
        // generated illustration may never assert it depicts a named real person
        // or a specific real event -- artService enforces that, this column makes
        // it auditable after the fact.
        await queryInterface.createTable('cms_article_art', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            draft_id: {
                type: Sequelize.UUID, allowNull: false,
                references: { model: { tableName: 'cms_article_drafts', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE',
            },
            // licensed_photo | contextual_photo | generated_illustration | data_chart
            kind: { type: Sequelize.STRING(32), allowNull: false },
            // wikimedia | openverse | gemini | internal
            provider: { type: Sequelize.STRING(40), allowNull: true },
            source_page_url: { type: Sequelize.TEXT, allowNull: true },
            source_file_url: { type: Sequelize.TEXT, allowNull: true },
            license_name: { type: Sequelize.TEXT, allowNull: true },
            license_url: { type: Sequelize.TEXT, allowNull: true },
            attribution: { type: Sequelize.TEXT, allowNull: true },
            // What the image actually shows, in plain words.
            subject: { type: Sequelize.TEXT, allowNull: true },
            depicts_named_subject: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            alt_text: { type: Sequelize.TEXT, allowNull: true },
            caption: { type: Sequelize.TEXT, allowNull: true },
            // cms_media_assets.id once the bytes are in the media library.
            media_asset_id: { type: Sequelize.UUID, allowNull: true },
            url: { type: Sequelize.TEXT, allowNull: true },
            // pending | ready | failed | rejected
            status: { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'pending' },
            failure_reason: { type: Sequelize.TEXT, allowNull: true },
            is_primary: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addIndex('cms.cms_article_art', ['draft_id']);
        await queryInterface.addIndex('cms.cms_article_art', ['draft_id', 'is_primary']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_article_art', schema: 'cms' });
        await queryInterface.dropTable({ tableName: 'cms_article_drafts', schema: 'cms' });
        await queryInterface.dropTable({ tableName: 'cms_story_briefs', schema: 'cms' });
        await queryInterface.dropTable({ tableName: 'cms_story_signals', schema: 'cms' });
        await queryInterface.dropTable({ tableName: 'cms_editorial_charters', schema: 'cms' });
    },
};
