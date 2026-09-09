'use strict';

/**
 * cms_story_briefs — the corroborated account of one event, before any prose.
 *
 * A brief is deliberately not an article. It holds facts with the URLs that back
 * each one, the claims sources disagree on, verbatim quotes, and this site's
 * angle. `status = 'insufficient_sources'` is a normal outcome, not an error: a
 * story only one outlet carries never reaches the drafting stage.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_story_briefs', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        clusterKey: { type: DataTypes.TEXT, allowNull: false },
        workingTitle: { type: DataTypes.TEXT, allowNull: false },
        sources: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        facts: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        disputed: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        quotes: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        angle: { type: DataTypes.TEXT, allowNull: true },
        whyItMatters: { type: DataTypes.TEXT, allowNull: true },
        entities: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        // 'multi_outlet' | 'verified_primary' -- see 20260040.
        sourcingBasis: { type: DataTypes.STRING(24), allowNull: true },
        status: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'pending' },
        failureReason: { type: DataTypes.TEXT, allowNull: true },
    }, {
        sequelize,
        tableName: 'cms_story_briefs',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['website_id', 'cluster_key'], name: 'cms_story_briefs_website_cluster_unique' },
            { fields: ['website_id', 'status'] },
        ],
    });
};
