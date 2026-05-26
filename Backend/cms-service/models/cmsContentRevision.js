module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_content_revisions', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        content_id: { type: DataTypes.UUID, allowNull: false },
        revision_number: { type: DataTypes.INTEGER, allowNull: false },
        title: { type: DataTypes.STRING(500), allowNull: false },
        // Full snapshot of content_blocks + seo_metadata at time of save
        snapshot: { type: DataTypes.JSONB, allowNull: false },
        created_by: { type: DataTypes.BIGINT, allowNull: false },
        change_note: { type: DataTypes.STRING(500), allowNull: true },
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
