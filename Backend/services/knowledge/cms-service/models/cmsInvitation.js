module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_invitations', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        email: { type: DataTypes.STRING(255), allowNull: false },
        role: {
            type: DataTypes.ENUM(
                'cms_admin', 'cms_editor', 'cms_publisher', 'cms_compliance', 'cms_reviewer',
                'cms_seo_manager', 'cms_author', 'cms_contributor', 'cms_viewer'
            ),
            allowNull: false,
            defaultValue: 'cms_author',
        },
        inviterId: { type: DataTypes.INTEGER, allowNull: true },
        inviterName: { type: DataTypes.STRING(200), allowNull: true },
        personalNote: { type: DataTypes.TEXT, allowNull: true },
        tokenHash: { type: DataTypes.STRING(64), allowNull: false },
        status: {
            type: DataTypes.ENUM('pending', 'accepted', 'expired', 'revoked'),
            allowNull: false,
            defaultValue: 'pending',
        },
        acceptedBy: { type: DataTypes.INTEGER, allowNull: true },
        acceptedAt: { type: DataTypes.DATE, allowNull: true },
        expiresAt: { type: DataTypes.DATE, allowNull: false },
    }, {
        sequelize,
        tableName: 'cms_invitations',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['token_hash'], name: 'cms_invitations_token_hash_unique' },
            { fields: ['website_id'] },
            { fields: ['email'] },
        ],
    });
};
