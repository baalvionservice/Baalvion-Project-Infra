module.exports = function (sequelize, DataTypes) {
    return sequelize.define('sessions', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        user_id: { type: DataTypes.BIGINT, allowNull: false },
        org_id: { type: DataTypes.UUID, allowNull: true },
        ip_address: { type: DataTypes.STRING(45), allowNull: true },
        user_agent: { type: DataTypes.TEXT, allowNull: true },
        expires_at: { type: DataTypes.DATE, allowNull: false },
        last_seen_at: { type: DataTypes.DATE, allowNull: true },
        revoked_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        sequelize,
        tableName: 'sessions',
        schema: 'auth',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['user_id'] },
            { fields: ['expires_at'] },
        ],
    });
};
