module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_content_entity_mentions', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        contentId: { type: DataTypes.UUID, allowNull: false },
        entityType: { type: DataTypes.STRING(50), allowNull: false },
        entitySlug: { type: DataTypes.STRING(300), allowNull: false },
        entityName: { type: DataTypes.STRING(300), allowNull: false },
        entityUrl: { type: DataTypes.STRING(500), allowNull: false },
        matchedText: { type: DataTypes.STRING(300), allowNull: false },
        // 'accepted' (Phase 1 default, auto-linking) | 'suggested' | 'rejected'
        // (both reserved for the future editor review workflow).
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'accepted' },
        source: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'auto' },
        detectedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        reviewedBy: { type: DataTypes.BIGINT, allowNull: true },
        reviewedAt: { type: DataTypes.DATE, allowNull: true },
    }, {
        sequelize,
        tableName: 'cms_content_entity_mentions',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['content_id', 'entity_type', 'entity_slug'], name: 'cms_content_entity_mentions_content_entity_unique' },
            { fields: ['content_id'] },
            { fields: ['status'] },
        ],
    });
};
