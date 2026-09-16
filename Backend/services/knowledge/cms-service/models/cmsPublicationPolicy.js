'use strict';

/**
 * cms_publication_policies — how a site runs, as opposed to who it is.
 *
 * Volume, beat distribution, publishing windows, length bounds, byline limits,
 * corrections and staleness. Enforced at approval time by
 * service/editorial/policyService.js, so these are operating limits rather than
 * documentation.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_publication_policies', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false, unique: true },

        dailyTarget: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 6 },
        dailyMax: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
        hourlyMax: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
        minMinutesBetweenPosts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 20 },
        weekendTargetPct: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 40 },

        categoryMix: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        formatMix: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        publishWindows: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },

        wordCountRules: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        requireOriginalArt: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        requireReviewerDistinctFromAuthor: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        maxArticlesPerAuthorPerDay: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },

        correctionsPolicyUrl: { type: DataTypes.TEXT, allowNull: true },
        correctionWindowHours: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 24 },
        staleAfterDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 180 },
        requireUpdateNote: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

        // Auto-publish: gates decide eligibility, this decides timing, a human can
        // veto until it fires. Off by default -- see 20260038.
        autoPublishEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        autoPublishDelayMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
        // No recipients means no notification, and therefore no armed timer: a
        // silent auto-publish is not a veto window, it is just publishing.
        notifyEmails: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        onTimerConflict: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'requeue' },

        // Categories whose public route no longer resolves. Refreshed by
        // scripts/verify-publish-routes.cjs; blocks publishing, not editing.
        deadCategorySlugs: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        routesVerifiedAt: { type: DataTypes.DATE, allowNull: true },

        status: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'active' },
        createdBy: { type: DataTypes.BIGINT, allowNull: true },
        updatedBy: { type: DataTypes.BIGINT, allowNull: true },
    }, {
        sequelize,
        tableName: 'cms_publication_policies',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [{ unique: true, fields: ['website_id'], name: 'cms_publication_policies_website_unique' }],
    });
};
