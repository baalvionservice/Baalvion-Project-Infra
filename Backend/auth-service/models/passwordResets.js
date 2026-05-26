module.exports = function (sequelize, DataTypes) {
    return sequelize.define('password_resets', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        user_id: { type: DataTypes.BIGINT, allowNull: false },
        token_hash: { type: DataTypes.TEXT, allowNull: false },
        expires_at: { type: DataTypes.DATE, allowNull: false },
        used_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        sequelize,
        tableName: 'password_resets',
        schema: 'auth',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['token_hash'] },
            { fields: ['user_id'] },
        ],
    });
};
