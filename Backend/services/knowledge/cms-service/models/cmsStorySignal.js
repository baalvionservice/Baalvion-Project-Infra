'use strict';

/**
 * cms_story_signals — one wire item scored against one site's charter.
 *
 * The same article can be a signal for several sites with different scores and
 * different verdicts, so uniqueness is (websiteId, url), not url. `decision`
 * records why something did or did not become a story: a rejected signal keeps
 * its reason so the intake filter is reviewable instead of a black box.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_story_signals', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        wireArticleId: { type: DataTypes.UUID, allowNull: true },
        clusterKey: { type: DataTypes.TEXT, allowNull: true },
        title: { type: DataTypes.TEXT, allowNull: false },
        url: { type: DataTypes.TEXT, allowNull: false },
        sourceName: { type: DataTypes.TEXT, allowNull: true },
        // 'rss' | 'government' | 'press_release'. Denormalised from the wire
        // because the brief stage's primary-source rule turns on it.
        sourceType: { type: DataTypes.STRING(24), allowNull: true },
        publishedAt: { type: DataTypes.DATE, allowNull: true },
        wireCategory: { type: DataTypes.STRING(40), allowNull: true },
        country: { type: DataTypes.STRING(4), allowNull: true },
        summary: { type: DataTypes.TEXT, allowNull: true },
        relevanceScore: { type: DataTypes.INTEGER, allowNull: true },
        scoreReasons: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        decision: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'pending' },
        rejectionReason: { type: DataTypes.TEXT, allowNull: true },
    }, {
        sequelize,
        tableName: 'cms_story_signals',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['website_id', 'url'], name: 'cms_story_signals_website_url_unique' },
            { fields: ['website_id', 'decision'] },
            { fields: ['cluster_key'] },
            { fields: ['published_at'] },
        ],
    });
};
