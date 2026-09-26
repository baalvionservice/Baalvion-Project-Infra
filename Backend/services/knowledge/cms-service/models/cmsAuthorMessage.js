module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_author_messages', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        authorSlug: { type: DataTypes.STRING(200), allowNull: false },
        authorName: { type: DataTypes.STRING(200), allowNull: false },
        senderName: { type: DataTypes.STRING(200), allowNull: false },
        senderEmail: { type: DataTypes.STRING(255), allowNull: false },
        message: { type: DataTypes.TEXT, allowNull: false },
        // 'unread' | 'read'
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'unread' },
        emailDelivered: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    }, {
        sequelize,
        tableName: 'cms_author_messages',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['website_id', 'status'] },
            { fields: ['website_id', 'author_slug'] },
        ],
    });
};
