'use strict';

/**
 * cms_article_art — provenance for every image an article carries.
 *
 * The columns exist so a picture's origin is answerable months later: which
 * provider, which source page, which licence, what it actually depicts.
 *
 * `depictsNamedSubject` is the integrity flag. It may be true only for a real
 * licensed photograph. A generated illustration must never assert that it shows
 * a named real person or a specific real event — artService refuses to write
 * that combination, and this column makes the rule auditable in the data.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_article_art', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        draftId: { type: DataTypes.UUID, allowNull: false },
        kind: { type: DataTypes.STRING(32), allowNull: false },
        provider: { type: DataTypes.STRING(40), allowNull: true },
        sourcePageUrl: { type: DataTypes.TEXT, allowNull: true },
        sourceFileUrl: { type: DataTypes.TEXT, allowNull: true },
        licenseName: { type: DataTypes.TEXT, allowNull: true },
        licenseUrl: { type: DataTypes.TEXT, allowNull: true },
        attribution: { type: DataTypes.TEXT, allowNull: true },
        subject: { type: DataTypes.TEXT, allowNull: true },
        depictsNamedSubject: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        altText: { type: DataTypes.TEXT, allowNull: true },
        caption: { type: DataTypes.TEXT, allowNull: true },
        mediaAssetId: { type: DataTypes.UUID, allowNull: true },
        url: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'pending' },
        failureReason: { type: DataTypes.TEXT, allowNull: true },
        isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    }, {
        sequelize,
        tableName: 'cms_article_art',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['draft_id'] },
            { fields: ['draft_id', 'is_primary'] },
        ],
    });
};
