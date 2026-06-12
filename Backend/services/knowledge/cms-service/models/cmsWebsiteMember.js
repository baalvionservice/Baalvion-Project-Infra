module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_website_members', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        userId: { type: DataTypes.BIGINT, allowNull: false },
        role: {
            type: DataTypes.ENUM(
                'cms_admin', 'cms_editor', 'cms_publisher', 'cms_compliance', 'cms_reviewer',
                'cms_seo_manager', 'cms_author', 'cms_contributor', 'cms_viewer'
            ),
            allowNull: false,
            defaultValue: 'cms_author',
        },
        invitedBy: { type: DataTypes.BIGINT, allowNull: true },
        joinedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        sequelize,
        tableName: 'cms_website_members',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['website_id', 'user_id'], name: 'cms_members_website_user_unique' },
            { fields: ['website_id'] },
            { fields: ['user_id'] },
            { fields: ['role'] },
        ],
    });
};
