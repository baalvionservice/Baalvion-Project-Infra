module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_content_comments', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        contentId: { type: DataTypes.UUID, allowNull: false },
        authorName: { type: DataTypes.STRING(120), allowNull: false },
        authorEmail: { type: DataTypes.STRING(255), allowNull: false },
        body: { type: DataTypes.TEXT, allowNull: false },
        // 'pending' (default, awaiting moderation) | 'approved' | 'rejected'. Only
        // 'approved' rows are ever returned by the public list endpoint.
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
        reviewedBy: { type: DataTypes.BIGINT, allowNull: true },
        reviewedAt: { type: DataTypes.DATE, allowNull: true },
    }, {
        sequelize,
        tableName: 'cms_content_comments',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['website_id', 'status'] },
            { fields: ['content_id', 'status'] },
        ],
    });
};
