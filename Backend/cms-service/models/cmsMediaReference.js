module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_media_references', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        content_id: { type: DataTypes.UUID, allowNull: false },
        media_id: { type: DataTypes.UUID, allowNull: false },
        usage_type: {
            type: DataTypes.ENUM('featured_image', 'block_image', 'block_video', 'gallery', 'attachment'),
            allowNull: false,
            defaultValue: 'block_image',
        },
        metadata: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    }, {
        sequelize,
        tableName: 'cms_media_references',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['content_id'] },
            { fields: ['media_id'] },
        ],
    });
};
