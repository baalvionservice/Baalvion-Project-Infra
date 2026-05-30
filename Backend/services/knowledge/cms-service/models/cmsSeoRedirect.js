module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_seo_redirects', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        sourceUrl: { type: DataTypes.STRING(1000), allowNull: false },
        targetUrl: { type: DataTypes.STRING(1000), allowNull: false },
        redirectType: {
            type: DataTypes.ENUM('301', '302'),
            allowNull: false,
            defaultValue: '301',
        },
        isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        hitCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    }, {
        sequelize,
        tableName: 'cms_seo_redirects',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['website_id', 'source_url'], name: 'cms_redirects_website_source_unique' },
            { fields: ['website_id'] },
            { fields: ['is_active'] },
        ],
    });
};
