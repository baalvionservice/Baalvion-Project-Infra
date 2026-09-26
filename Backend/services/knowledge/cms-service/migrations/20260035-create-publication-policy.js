'use strict';

// cms_publication_policies — the newsroom's operating rules, in data.
//
// The charter (20260034) says who a site is. This says how it runs: how much it
// publishes a day, how that output is distributed across beats and formats, when
// it goes out, how long pieces run, who may sign them, and how corrections and
// staleness are handled.
//
// These are the rules a desk at a real outlet enforces without thinking about
// them, and the ones an automated pipeline will otherwise break immediately --
// left unconstrained it will happily publish forty stories about one topic at
// 03:00. Every number here is enforced in service/editorial/policyService.js at
// the approval step, not merely displayed.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cms_publication_policies', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            website_id: {
                type: Sequelize.UUID, allowNull: false, unique: true,
                references: { model: { tableName: 'cms_websites', schema: 'cms' }, key: 'id' }, onDelete: 'CASCADE',
            },

            // ── Volume ────────────────────────────────────────────────────────
            // daily_target is what the desk plans for; daily_max is a hard stop --
            // approval is refused above it rather than warned about.
            daily_target: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 6 },
            daily_max: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
            // Burst ceiling. Without one, a backlog cleared in a single sitting
            // dumps the whole day's output into one hour, which reads as automated
            // to a reader and to a news crawler.
            hourly_max: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 3 },
            min_minutes_between_posts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 20 },
            // Weekend volume as a percentage of the weekday target. Real desks run
            // lighter on Saturday and Sunday; matching that is part of not looking
            // like a bot.
            weekend_target_pct: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 40 },

            // ── Distribution ──────────────────────────────────────────────────
            // [{ categorySlug, label, targetPct, minPerDay, maxPerDay }]
            // The planner fills under-served beats first, so the day's output
            // spreads across the site instead of piling onto whatever the wire
            // happened to be loud about.
            category_mix: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            // [{ format, targetPct }] over news / analysis / explainer.
            format_mix: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },

            // ── Cadence ───────────────────────────────────────────────────────
            // [{ label, startHourUtc, endHourUtc, days: [1..7] }] -- 1 = Monday.
            publish_windows: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },

            // ── Craft standards ───────────────────────────────────────────────
            // [{ format, min, max }] word counts. Both bounds matter: a maximum is
            // what stops length-padding, which is its own quality failure.
            word_count_rules: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            require_original_art: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            // A reviewer who is also the author is not a review.
            require_reviewer_distinct_from_author: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            // Stops one byline carrying implausible volume -- the clearest external
            // signal that a "writer" is not writing.
            max_articles_per_author_per_day: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 2 },

            // ── Corrections and freshness ─────────────────────────────────────
            corrections_policy_url: { type: Sequelize.TEXT, allowNull: true },
            correction_window_hours: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 24 },
            // Evergreen content past this age is flagged for re-review rather than
            // left to rot at the top of a category page.
            stale_after_days: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 180 },
            // A material edit after publication must carry a visible update note.
            require_update_note: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },

            status: { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'active' },
            created_by: { type: Sequelize.BIGINT, allowNull: true },
            updated_by: { type: Sequelize.BIGINT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'cms_publication_policies', schema: 'cms' });
    },
};
