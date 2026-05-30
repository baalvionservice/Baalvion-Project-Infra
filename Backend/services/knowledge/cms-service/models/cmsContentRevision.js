module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_content_revisions', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        contentId: { type: DataTypes.UUID, allowNull: false },
        revisionNumber: { type: DataTypes.INTEGER, allowNull: false },
        title: { type: DataTypes.STRING(500), allowNull: false },
        // Full snapshot of content_blocks + seo_metadata at time of save
        snapshot: { type: DataTypes.JSONB, allowNull: false },
        createdBy: { type: DataTypes.BIGINT, allowNull: false },
        changeNote: { type: DataTypes.STRING(500), allowNull: true },
    }, {
        sequelize,
        tableName: 'cms_content_revisions',
        schema: 'cms',
        timestamps: true,
        updatedAt: false,  // Revisions are immutable
        underscored: true,
        indexes: [
            { unique: true, fields: ['content_id', 'revision_number'], name: 'cms_revisions_content_rev_unique' },
            { fields: ['content_id'] },
            { fields: ['created_by'] },
        ],
    });
};
