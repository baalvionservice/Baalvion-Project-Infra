module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_website_integrations', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        provider: { type: DataTypes.STRING(64), allowNull: false },
        category: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'other' },
        label: { type: DataTypes.STRING(120), allowNull: true },
        // Non-secret configuration (base URL, publishable key, mode, region, …).
        config: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        // AES-256-GCM blob of the secret fields (API key, secret key, tokens).
        secretsEnc: { type: DataTypes.TEXT, allowNull: true },
        // Masked previews (••••1234) for safe display in the console.
        secretHints: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        status: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'unconfigured' },
        lastTestedAt: { type: DataTypes.DATE, allowNull: true },
        lastTestOk: { type: DataTypes.BOOLEAN, allowNull: true },
        lastTestMessage: { type: DataTypes.STRING(500), allowNull: true },
        createdBy: { type: DataTypes.BIGINT, allowNull: true },
        updatedBy: { type: DataTypes.BIGINT, allowNull: true },
    }, {
        sequelize,
        tableName: 'cms_website_integrations',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['website_id', 'provider'], name: 'cms_integrations_website_provider_unique' },
            { fields: ['website_id'] },
            { fields: ['category'] },
        ],
    });
};
