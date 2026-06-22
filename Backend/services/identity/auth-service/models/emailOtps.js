module.exports = function (sequelize, DataTypes) {
    return sequelize.define('email_otps', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        // The login identity. Pre-auth (the user may not exist yet) so we key by email, not user_id.
        email: { type: DataTypes.STRING(255), allowNull: false },
        // sha256(code) — the plaintext OTP is never stored.
        code_hash: { type: DataTypes.TEXT, allowNull: false },
        purpose: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'login' },
        expires_at: { type: DataTypes.DATE, allowNull: false },
        consumed_at: { type: DataTypes.DATE, allowNull: true },
        attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    }, {
        sequelize,
        tableName: 'email_otps',
        schema: 'auth',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['email'] },
            { fields: ['email', 'consumed_at'] },
        ],
    });
};
