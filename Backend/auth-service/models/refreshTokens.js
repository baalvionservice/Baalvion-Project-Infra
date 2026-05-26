module.exports = function (sequelize, DataTypes) {
    return sequelize.define('refresh_tokens', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        user_id:    { type: DataTypes.BIGINT, allowNull: false },
        session_id: { type: DataTypes.UUID,   allowNull: false },
        family_id:  { type: DataTypes.UUID,   allowNull: false },   // reuse-detection chain
        token_hash: { type: DataTypes.TEXT,   allowNull: false, unique: true },
        expires_at: { type: DataTypes.DATE,   allowNull: false },
        revoked_at: { type: DataTypes.DATE,   allowNull: true  },
    }, {
        sequelize,
        tableName: 'refresh_tokens',
        schema: 'auth',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['token_hash'] },
            { fields: ['family_id'] },
            { fields: ['user_id'] },
            { fields: ['session_id'] },
        ],
    });
};
