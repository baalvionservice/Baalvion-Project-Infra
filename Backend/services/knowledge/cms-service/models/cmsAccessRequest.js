module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_access_requests', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        userId: { type: DataTypes.BIGINT, allowNull: false },
        requesterEmail: { type: DataTypes.STRING(255), allowNull: true },
        requesterName: { type: DataTypes.STRING(255), allowNull: true },
        requestedRole: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'cms_author' },
        note: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'pending' },
        decidedBy: { type: DataTypes.BIGINT, allowNull: true },
        decidedAt: { type: DataTypes.DATE, allowNull: true },
        decisionNote: { type: DataTypes.TEXT, allowNull: true },
    }, {
        sequelize,
        tableName: 'cms_access_requests',
        schema: 'cms',
        timestamps: true,
        underscored: true,
    });
};
