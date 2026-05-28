module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_seo_redirects', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        website_id: { type: DataTypes.UUID, allowNull: false },
        source_url: { type: DataTypes.STRING(1000), allowNull: false },
        target_url: { type: DataTypes.STRING(1000), allowNull: false },
        redirect_type: {
            type: DataTypes.ENUM('301', '302'),
            allowNull: false,
            defaultValue: '301',
        },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        hit_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
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
