module.exports = function (sequelize, DataTypes) {
    return sequelize.define('phone_otps', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        user_id: { type: DataTypes.BIGINT, allowNull: false },
        phone: { type: DataTypes.STRING(32), allowNull: false },
        // sha256(code) — the plaintext OTP is never stored.
        code_hash: { type: DataTypes.TEXT, allowNull: false },
        purpose: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'verify' },
        expires_at: { type: DataTypes.DATE, allowNull: false },
        consumed_at: { type: DataTypes.DATE, allowNull: true },
        attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    }, {
        sequelize,
        tableName: 'phone_otps',
        schema: 'auth',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['user_id'] },
            { fields: ['phone'] },
            { fields: ['user_id', 'consumed_at'] },
        ],
    });
};
