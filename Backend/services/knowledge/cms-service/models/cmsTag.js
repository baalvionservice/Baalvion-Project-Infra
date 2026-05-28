module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_tags', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        website_id: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(100), allowNull: false },
        slug: { type: DataTypes.STRING(100), allowNull: false },
        content_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    }, {
        sequelize,
        tableName: 'cms_tags',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['website_id', 'slug'], name: 'cms_tags_website_slug_unique' },
            { fields: ['website_id'] },
        ],
    });
};
