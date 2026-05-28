module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_categories', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        website_id: { type: DataTypes.UUID, allowNull: false },
        parent_id: { type: DataTypes.UUID, allowNull: true },
        name: { type: DataTypes.STRING(200), allowNull: false },
        slug: { type: DataTypes.STRING(200), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        seo_metadata: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
        sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        depth: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            allowNull: false,
            defaultValue: 'active',
        },
        content_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    }, {
        sequelize,
        tableName: 'cms_categories',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['website_id', 'slug'], name: 'cms_categories_website_slug_unique' },
            { fields: ['website_id'] },
            { fields: ['parent_id'] },
            { fields: ['sort_order'] },
        ],
    });
};
