module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_websites', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        organization_id: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(200), allowNull: false },
        slug: { type: DataTypes.STRING(100), allowNull: false, unique: 'unique_org_slug' },
        domain: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'maintenance', 'archived'),
            allowNull: false,
            defaultValue: 'active',
        },
        plan: {
            type: DataTypes.ENUM('basic', 'pro', 'enterprise'),
            allowNull: false,
            defaultValue: 'basic',
        },
        modules: { type: DataTypes.JSONB, allowNull: false, defaultValue: ['pages', 'blog'] },
        config: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        branding: { type: DataTypes.JSONB, allowNull: true },
        created_by: { type: DataTypes.BIGINT, allowNull: false },
    }, {
        sequelize,
        tableName: 'cms_websites',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['slug'], name: 'cms_websites_slug_unique' },
            { fields: ['organization_id'] },
            { fields: ['status'] },
            { fields: ['domain'] },
        ],
    });
};
